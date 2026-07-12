#!/usr/bin/env python3
import asyncio
import csv
import io
import os
import sqlite3
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

# Supabase free-tier auto-pause prevention keepalive script
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
        subprocess.run(
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
    if not DB_URL:
        print("WARNING: DATABASE_URL not set. Skipping keepalive ping.")
        return

    print("Pinging database (keepalive write) to prevent Supabase auto-pause...")
    pingCommand = ["psql", DB_URL, "-v", "ON_ERROR_STOP=1", "-c", KEEPALIVE_SQL]
    try:
        subprocess.run(pingCommand, capture_output=True, text=True, check=True)
        print("Keepalive ping successful.")
    except subprocess.CalledProcessError as pingError:
        print("WARNING: Keepalive ping failed.")
        print(pingError.stderr)
    except FileNotFoundError:
        print("WARNING: psql not found. Install postgresql-client to enable keepalive.")


def create_sqlite_backup(db_url, sqlite_path):
    """
    Connects to Postgres, gets all public tables, dumps their data as CSV, 
    and writes them into a native SQLite database on the fly.
    """
    print(f"Starting native SQLite generation -> {sqlite_path}")
    try:
        # 1. Get a list of all tables in the public schema
        table_cmd = [
            "psql", db_url, "-A", "-t",
            "-c", "SELECT tablename FROM pg_tables WHERE schemaname='public';"
        ]
        table_res = subprocess.run(table_cmd, capture_output=True, text=True, check=True)
        tables = [t.strip() for t in table_res.stdout.splitlines() if t.strip()]

        if not tables:
            print("No public tables found to convert to SQLite.")
            return False

        # 2. Connect to the local SQLite database
        conn = sqlite3.connect(sqlite_path)
        cursor = conn.cursor()

        for table in tables:
            # Tell Postgres to output the table data directly as CSV
            csv_cmd = [
                "psql", db_url,
                "-c", f'COPY "{table}" TO STDOUT WITH CSV HEADER'
            ]
            csv_res = subprocess.run(csv_cmd, capture_output=True, text=True, check=True)
            
            csv_data = csv_res.stdout
            if not csv_data.strip(): continue # Skip completely empty tables
                
            reader = csv.reader(io.StringIO(csv_data))
            try:
                headers = next(reader)
            except StopIteration:
                continue
            
            if not headers: continue

            # Create SQLite table schema dynamically (using TEXT for all cols for ease of browsing)
            cols_def = ", ".join([f'"{h}" TEXT' for h in headers]) 
            cursor.execute(f'DROP TABLE IF EXISTS "{table}"')
            cursor.execute(f'CREATE TABLE "{table}" ({cols_def})')

            # Insert all CSV data into SQLite
            placeholders = ", ".join(["?"] * len(headers))
            insert_sql = f'INSERT INTO "{table}" VALUES ({placeholders})'
            
            rows = [row for row in reader]
            if rows:
                cursor.executemany(insert_sql, rows)
            
        conn.commit()
        conn.close()
        print(f"Successfully generated native SQLite DB: {os.path.basename(sqlite_path)}")
        return True
    except Exception as e:
        print(f"ERROR: Failed to generate SQLite db: {e}")
        if isinstance(e, subprocess.CalledProcessError):
            print("psql error:", getattr(e, 'stderr', ''))
        return False


def runBackup():
    if not DB_URL:
        print("ERROR: DATABASE_URL environment variable is not set.")
        sys.exit(1)

    os.makedirs(BACKUP_DIR, exist_ok=True)
    keepDatabaseAlive()

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    
    # Define file paths for ALL THREE formats
    dumpFilePath = os.path.join(BACKUP_DIR, f"supabase_backup_{timestamp}.dump")
    sqlFilePath = os.path.join(BACKUP_DIR, f"supabase_backup_{timestamp}.sql")
    sqliteFilePath = os.path.join(BACKUP_DIR, f"supabase_backup_{timestamp}.sqlite")

    # Command 1: Custom binary format (.dump) - Best for database restorations
    dumpCommand = [
        "pg_dump", DB_URL, "-Fc", "-f", dumpFilePath,
        "--no-owner", "--no-privileges", "-v"
    ]
    
    # Command 2: Plain text format (.sql) WITH INSERTS for easier parsing
    sqlCommand = [
        "pg_dump", DB_URL, "-f", sqlFilePath,
        "--no-owner", "--no-privileges", "--inserts", "-v"
    ]

    # Generate Postgres formats
    run_pg_dump(dumpCommand, dumpFilePath)
    run_pg_dump(sqlCommand, sqlFilePath)

    # Generate SQLite format dynamically using Python
    sqlite_success = create_sqlite_backup(DB_URL, sqliteFilePath)

    # Collect successful files
    files_to_send = [dumpFilePath, sqlFilePath]
    if sqlite_success:
        files_to_send.append(sqliteFilePath)

    # Send all files together to Telegram
    asyncio.run(sendToTelegram(files_to_send))
    cleanOldBackups()


async def sendToTelegram(filePaths):
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

    captions = []
    for filePath in filePaths:
        fileName = os.path.basename(filePath)
        fileSizeMb = os.path.getsize(filePath) / (1024 * 1024)
        
        # Label the specific file types nicely in Telegram
        if fileName.endswith(".sql"):
            fileType = "📄 Plain Text (SQL Inserts)"
        elif fileName.endswith(".sqlite"):
            fileType = "🗄️ Native SQLite (Open in DB Browser)"
        else:
            fileType = "📦 Binary (Best for Postgres Restore)"

        captions.append(
            f"<b>Supabase Backup</b>\n"
            f"<b>Type:</b> {fileType}\n"
            f"<b>File:</b> {fileName}\n"
            f"<b>Size:</b> {fileSizeMb:.2f} MB\n"
            f"<b>Date:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        )

    lastError = None
    uploadSucceeded = False

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
    if len(sys.argv) > 1 and sys.argv[1] == "--ping-only":
        keepDatabaseAlive()
    else:
        runBackup()