#!/usr/bin/env python3
import asyncio
import os
import subprocess
import sys
from datetime import datetime

from dotenv import load_dotenv
from telethon import TelegramClient
from telethon.sessions import StringSession

load_dotenv()

# ---- Config (constants) ----
BACKUP_DIR = os.environ.get("BACKUP_DIR", "./backups")
RETENTION_DAYS = int(os.environ.get("RETENTION_DAYS", "30"))

DB_URL = os.environ.get("DATABASE_URL")
BOT_TOKEN = os.environ.get("BOT_TOKEN")
CHAT_ID = os.environ.get("CHAT_ID")
API_ID = os.environ.get("API_ID")
API_HASH = os.environ.get("API_HASH")

MAX_RETRIES = 5
RETRY_DELAY_SECONDS = 10

# Supabase free-tier projects auto-pause after 7 days without database
# activity, and a read-only pg_dump connection alone does not reset that
# timer - only an actual write (INSERT/UPDATE/DELETE) does. This SQL creates
# a small dedicated table (capped at exactly one row) and upserts a
# timestamp into it, purely to register real write activity.
KEEPALIVE_SQL = """
CREATE TABLE IF NOT EXISTS _backup_keepalive (
    id integer PRIMARY KEY DEFAULT 1,
    last_ping timestamptz NOT NULL DEFAULT now(),
    ping_count integer NOT NULL DEFAULT 0,
    CHECK (id = 1)
);
INSERT INTO _backup_keepalive (id, last_ping, ping_count)
VALUES (1, now(), 1)
ON CONFLICT (id) DO UPDATE
SET last_ping = now(), ping_count = _backup_keepalive.ping_count + 1;
"""


def run_pg_dump(command, file_path):
    print(f"Starting backup -> {file_path}")
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=True,
        )
        print(f"Successfully generated: {os.path.basename(file_path)}")
    except subprocess.CalledProcessError as backupError:
        print(f"ERROR: pg_dump failed for {file_path}")
        print(backupError.stderr)
        sys.exit(1)
    except FileNotFoundError:
        print("ERROR: pg_dump not found. Install postgresql-client first.")
        sys.exit(1)


def keepDatabaseAlive():
    """
    Run a lightweight write against the database so Supabase registers real
    activity and doesn't auto-pause the project after 7 days of inactivity.
    Uses psql, which ships alongside pg_dump in the postgresql-client
    package, so no extra dependency is needed. Failure here is non-fatal -
    it should never block an otherwise-successful backup.
    """
    if not DB_URL:
        print("WARNING: DATABASE_URL not set. Skipping keepalive ping.")
        return

    print("Pinging database (keepalive write) to prevent Supabase auto-pause...")
    pingCommand = ["psql", DB_URL, "-v", "ON_ERROR_STOP=1", "-c", KEEPALIVE_SQL]
    try:
        subprocess.run(
            pingCommand,
            capture_output=True,
            text=True,
            check=True,
        )
        print("Keepalive ping successful.")
    except subprocess.CalledProcessError as pingError:
        print("WARNING: Keepalive ping failed.")
        print(pingError.stderr)
    except FileNotFoundError:
        print("WARNING: psql not found. Install postgresql-client to enable the keepalive ping.")


def runBackup():
    if not DB_URL:
        print("ERROR: DATABASE_URL environment variable is not set.")
        sys.exit(1)

    os.makedirs(BACKUP_DIR, exist_ok=True)

    # Keepalive write runs first and on its own, so activity is registered
    # with Supabase even if pg_dump or the Telegram upload fails afterward
    keepDatabaseAlive()

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    
    # Define file paths
    dumpFilePath = os.path.join(BACKUP_DIR, f"supabase_backup_{timestamp}.dump")
    sqlFilePath = os.path.join(BACKUP_DIR, f"supabase_backup_{timestamp}.sql")

    # Command 1: Custom binary format (.dump) - Best for database restorations
    dumpCommand = [
        "pg_dump", DB_URL, "-Fc", "-f", dumpFilePath,
        "--no-owner", "--no-privileges", "-v"
    ]
    
    # Command 2: Plain text format (.sql) - Human readable, editable in VS Code
    sqlCommand = [
        "pg_dump", DB_URL, "-f", sqlFilePath,
        "--no-owner", "--no-privileges", "-v"
    ]

    # Run both backups
    run_pg_dump(dumpCommand, dumpFilePath)
    run_pg_dump(sqlCommand, sqlFilePath)

    # Send both to Telegram
    asyncio.run(sendToTelegram([dumpFilePath, sqlFilePath]))
    cleanOldBackups()


async def sendToTelegram(filePaths):
    """Send backup files to a Telegram chat using Telethon, with retry logic."""
    if (not API_ID or not API_HASH or not BOT_TOKEN or not CHAT_ID or 
        API_ID == "..." or API_HASH == "..."):
        print("WARNING: Telegram credentials missing. Skipping upload.")
        return

    try:
        api_id_int = int(API_ID)
        chat_id_int = int(CHAT_ID)
    except ValueError:
        print("ERROR: API_ID and CHAT_ID must be valid numbers. Skipping upload.")
        return

    client = TelegramClient(StringSession(), api_id_int, API_HASH)
    await client.start(bot_token=BOT_TOKEN) # type: ignore

    # Build one caption per file - Telethon shows each caption on its
    # matching item once the group is sent as a single album/message.
    captions = []
    for filePath in filePaths:
        fileName = os.path.basename(filePath)
        fileSizeMb = os.path.getsize(filePath) / (1024 * 1024)
        fileType = "📄 Plain Text (Human Readable)" if fileName.endswith(".sql") else "📦 Binary (Best for DB Restore)"
        captions.append(
            f"<b>Supabase Backup</b>\n"
            f"<b>Type:</b> {fileType}\n"
            f"<b>File:</b> {fileName}\n"
            f"<b>Size:</b> {fileSizeMb:.2f} MB\n"
            f"<b>Date:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        )

    lastError = None
    uploadSucceeded = False

    # Send all files together in one call so Telegram groups them into a
    # single message (album) instead of one message per file.
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            fileNames = ", ".join(os.path.basename(f) for f in filePaths)
            print(f"Uploading {fileNames} as one grouped message (attempt {attempt}/{MAX_RETRIES})...")
            await client.send_file(
                chat_id_int,
                filePaths,
                caption=captions,
                parse_mode="html",
                force_document=True,
            )
            print("Files sent successfully as a single grouped message.")
            uploadSucceeded = True
            break
        except Exception as uploadError:
            lastError = uploadError
            print(f"Upload attempt {attempt} failed: {uploadError}")
            if attempt < MAX_RETRIES:
                await asyncio.sleep(RETRY_DELAY_SECONDS * attempt)

    if not uploadSucceeded:
        fileNames = ", ".join(os.path.basename(f) for f in filePaths)
        failureMessage = (
            f"<b>⚠️ Backup Upload Failed</b>\n"
            f"<b>Files:</b> {fileNames}\n"
            f"<b>Reason:</b> {str(lastError)}"
        )
        try:
            await client.send_message(chat_id_int, failureMessage, parse_mode="html")
        except Exception:
            pass

    await client.disconnect()


def cleanOldBackups():
    now = datetime.now()
    deletedCount = 0
    for fileName in os.listdir(BACKUP_DIR):
        filePath = os.path.join(BACKUP_DIR, fileName)
        if not os.path.isfile(filePath): continue
        if (now.timestamp() - os.path.getmtime(filePath)) / 86400 > RETENTION_DAYS:
            os.remove(filePath)
            deletedCount += 1
    if deletedCount:
        print(f"Removed {deletedCount} old backup files.")

if __name__ == "__main__":
    # Run with `--ping-only` to do just the keepalive write without a full
    # backup - useful for a more frequent cron entry (e.g. daily) alongside
    # a heavier backup schedule (e.g. weekly), since only writes reset
    # Supabase's pause timer
    if len(sys.argv) > 1 and sys.argv[1] == "--ping-only":
        keepDatabaseAlive()
    else:
        runBackup()