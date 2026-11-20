import sqlite3
import os
import json
from typing import Generator

DB_PATH = os.environ.get(
    "SQLITE_DB_PATH",
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "realbuy.db")
)

# Ensure parent directory exists
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()

def dict_from_row(row) -> dict:
    if row is None:
        return None
    return dict(row)

def dicts_from_rows(rows) -> list:
    return [dict(r) for r in rows]
