import time
import uuid
from typing import Optional
from fastapi import APIRouter, Request, HTTPException, UploadFile, File
from pydantic import BaseModel
from backend.database import get_connection, dict_from_row
from backend.auth_utils import get_current_user_from_request, require_current_user

router = APIRouter(prefix="/api", tags=["platform"])

class MarkNotificationRequest(BaseModel):
    notificationId: str

class CreateReportRequest(BaseModel):
    target_type: str
    target_id: str
    reason: str
    description: Optional[str] = ""

@router.get("/notifications")
def get_notifications(request: Request):
    user = require_current_user(request)
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, user_id, actor_id, type, entity_id, message, is_read, created_at
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        """, (user["id"],))
        rows = cursor.fetchall()
        notifications = []
        for r in rows:
            d = dict_from_row(r)
            d["is_read"] = bool(d["is_read"])
            notifications.append(d)
        return {"notifications": notifications}
    finally:
        conn.close()

@router.post("/notifications")
def mark_notifications(body: MarkNotificationRequest, request: Request):
    user = require_current_user(request)
    conn = get_connection()
    try:
        cursor = conn.cursor()
        if body.notificationId == "all":
            cursor.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ?", (user["id"],))
        else:
            cursor.execute("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", (body.notificationId, user["id"]))
        conn.commit()
        return {"message": "Notifications updated"}
    finally:
        conn.close()

@router.post("/reports")
def create_report(body: CreateReportRequest, request: Request):
    user = require_current_user(request)
    conn = get_connection()
    try:
        cursor = conn.cursor()
        rid = f"rep_{int(time.time())}_{uuid.uuid4().hex[:4]}"
        cursor.execute("""
            INSERT INTO reports (id, reporter_id, target_type, target_id, reason, description, status)
            VALUES (?, ?, ?, ?, ?, ?, 'pending')
        """, (rid, user["id"], body.target_type, body.target_id, body.reason, body.description or ""))
        conn.commit()
        return {"id": rid, "message": "Report submitted for trust & safety review"}
    finally:
        conn.close()

import os

@router.post("/upload")
async def upload_file(file: Optional[UploadFile] = File(None)):
    if file and file.filename:
        safe_ext = os.path.splitext(file.filename)[1].lower() or ".jpg"
        unique_name = f"avatar_{int(time.time())}_{uuid.uuid4().hex[:6]}{safe_ext}"
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "public", "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, unique_name)

        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        return {
            "url": f"/uploads/{unique_name}",
            "filename": unique_name,
            "message": "File uploaded successfully"
        }
    return {
        "url": "",
        "message": "No file uploaded"
    }
