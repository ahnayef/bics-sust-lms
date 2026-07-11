#!/usr/bin/env python3
"""
Daily Supabase database backup script.
Uses pg_dump to create a full backup (schema + data + functions + indexes + everything),
then sends the backup file to a Telegram chat via Telethon.

Requires:
    - postgresql-client installed (provides pg_dump)
    - python-dotenv and telethon installed (see requirements.txt)
    - Environment variables:
        SUPABASE_URL             -> Your Supabase Project URL
        SUPABASE_PUBLISHABLE_KEY -> Supabase Anon/Public Key
        SUPABASE_SERVICE_KEY     -> Supabase Service Role Key
        DATABASE_URL             -> Direct Connection string from Supabase
        BOT_TOKEN                -> Telegram bot token
        CHAT_ID                  -> Telegram chat ID
        API_ID                   -> Telegram API ID
        API_HASH                 -> Telegram API hash

Usage:
    python dbBackup.py
"""

import asyncio
import os
import subprocess
import sys
from datetime import datetime

from dotenv import load_dotenv
from telethon import TelegramClient
from telethon.sessions import StringSession

# Load variables from a .env file if present
load_dotenv()

# ---- Config (constants) ----
BACKUP_DIR = os.environ.get("BACKUP_DIR", "./backups")
RETENTION_DAYS = int(os.environ.get("RETENTION_DAYS", "30"))

# Supabase API Keys (Loaded for completeness, though pg_dump only strictly needs DATABASE_URL)
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_PUBLISHABLE_KEY = os.environ.get("SUPABASE_PUBLISHABLE_KEY")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

# Required for Postgres Backup
DB_URL = os.environ.get("DATABASE_URL")

# Required for Telegram Upload
BOT_TOKEN = os.environ.get("BOT_TOKEN")
CHAT_ID = os.environ.get("CHAT_ID")
API_ID = os.environ.get("API_ID")
API_HASH = os.environ.get("API_HASH")

MAX_RETRIES = 5
RETRY_DELAY_SECONDS = 10


def runBackup():
    if not DB_URL:
        print("ERROR: DATABASE_URL environment variable is not set.")
        sys.exit(1)

    os.makedirs(BACKUP_DIR, exist_ok=True)

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    backupFileName = f"supabase_backup_{timestamp}.dump"
    backupFilePath = os.path.join(BACKUP_DIR, backupFileName)

    # -Fc = custom format (compressed, supports pg_restore for selective restores)
    pgDumpCommand = [
        "pg_dump",
        DB_URL,
        "-Fc",
        "-f", backupFilePath,
        "--no-owner",
        "--no-privileges",
        "-v",
    ]

    print(f"Starting backup -> {backupFilePath}")

    try:
        result = subprocess.run(
            pgDumpCommand,
            capture_output=True,
            text=True,
            check=True,
        )
        print("Backup completed successfully.")
        if result.stderr:
            # pg_dump writes verbose progress info to stderr even on success
            print(result.stderr)
    except subprocess.CalledProcessError as backupError:
        print("ERROR: pg_dump failed.")
        print(backupError.stderr)
        sys.exit(1)
    except FileNotFoundError:
        print("ERROR: pg_dump not found. Install postgresql-client first.")
        sys.exit(1)

    asyncio.run(sendToTelegram(backupFilePath))
    cleanOldBackups()


async def sendToTelegram(filePath):
    """Send the backup file to a Telegram chat using Telethon, with retry logic."""
    
    # Check if variables exist AND ensure they aren't placeholder strings like "..."
    if (not API_ID or not API_HASH or not BOT_TOKEN or not CHAT_ID or 
        API_ID == "..." or API_HASH == "..."):
        print("WARNING: Telegram credentials (API_ID, API_HASH, etc.) are missing or incomplete.")
        print("Skipping Telegram upload. Backup is saved locally.")
        return

    fileName = os.path.basename(filePath)
    fileSizeMb = os.path.getsize(filePath) / (1024 * 1024)

    # Convert API_ID and CHAT_ID to integers as required by Telethon
    try:
        api_id_int = int(API_ID)
        chat_id_int = int(CHAT_ID)
    except ValueError:
        print("ERROR: API_ID and CHAT_ID must be valid numbers. Skipping Telegram upload.")
        return

    client = TelegramClient(StringSession(), api_id_int, API_HASH)
    await client.start(bot_token=BOT_TOKEN)  # type: ignore

    lastError = None
    uploadSucceeded = False

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            print(f"Uploading backup to Telegram (attempt {attempt}/{MAX_RETRIES})...")
            caption = (
                f"<b>Supabase Backup</b>\n"
                f"<b>File:</b> {fileName}\n"
                f"<b>Size:</b> {fileSizeMb:.2f} MB\n"
                f"<b>Date:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            )
            await client.send_file(
                chat_id_int,
                filePath,
                caption=caption,
                parse_mode="html",
            )
            print("Backup sent to Telegram successfully.")
            uploadSucceeded = True
            break
        except Exception as uploadError:
            lastError = uploadError
            print(f"Upload attempt {attempt} failed: {uploadError}")
            if attempt < MAX_RETRIES:
                await asyncio.sleep(RETRY_DELAY_SECONDS * attempt)

    if not uploadSucceeded:
        failureMessage = (
            f"<b>⚠️ Backup Upload Failed</b>\n"
            f"<b>File:</b> {fileName}\n"
            f"<b>Size:</b> {fileSizeMb:.2f} MB\n"
            f"<b>Attempts:</b> {MAX_RETRIES}\n"
            f"<b>Reason:</b> {str(lastError)}"
        )
        try:
            await client.send_message(chat_id_int, failureMessage, parse_mode="html")
        except Exception as notifyError:
            print(f"ERROR: Also failed to send failure notification: {notifyError}")

    await client.disconnect()


def cleanOldBackups():
    """Delete backup files older than RETENTION_DAYS."""
    now = datetime.now()
    deletedCount = 0

    for fileName in os.listdir(BACKUP_DIR):
        filePath = os.path.join(BACKUP_DIR, fileName)
        if not os.path.isfile(filePath):
            continue

        fileAgeDays = (now.timestamp() - os.path.getmtime(filePath)) / 86400
        if fileAgeDays > RETENTION_DAYS:
            os.remove(filePath)
            deletedCount += 1

    if deletedCount:
        print(f"Removed {deletedCount} backup(s) older than {RETENTION_DAYS} days.")


if __name__ == "__main__":
    runBackup()