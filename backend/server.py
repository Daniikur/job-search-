from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
import secrets
import requests
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt # type: ignore
import jwt # type: ignore
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File, Query, Header
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from groq import Groq # type: ignore
import os

# ============ Config ============
JWT_ALGORITHM = "HS256"
ACCESS_TTL_MIN = 60 * 24  
REFRESH_TTL_DAYS = 7
APP_NAME = os.environ.get("APP_NAME", "hiretrack")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("hiretrack")

# ============ DB ============
import certifi
from motor.motor_asyncio import AsyncIOMotorClient  # type: ignore

MONGO_URL = os.environ["MONGO_URL"]

client = AsyncIOMotorClient(
    MONGO_URL,
    tls=True,
    tlsCAFile=certifi.where()
)

db = client[os.environ["DB_NAME"]]

# ============ FastAPI ============
app = FastAPI(title="HireTrack API")
api = APIRouter(prefix="/api")

cors_origins = os.environ.get("CORS_ORIGINS", "").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in cors_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ Local Storage ============
UPLOAD_DIR = ROOT_DIR / "uploads"

if not UPLOAD_DIR.exists():
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def put_object(path: str, data: bytes, content_type: str) -> dict:
    file_path = UPLOAD_DIR / path

    file_path.parent.mkdir(parents=True, exist_ok=True)

    with open(file_path, "wb") as f:
        f.write(data)

    return {
        "path": str(file_path),
        "size": len(data),
    }


def get_object(path: str):
    file_path = Path(path)

    if not file_path.exists():
        raise FileNotFoundError("File not found")

    with open(file_path, "rb") as f:
        data = f.read()

    return data, "application/octet-stream"

# ============ Auth helpers ============
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access(user_id: str, email: str) -> str:
    return jwt.encode(
        {"sub": user_id, "email": email, "type": "access",
         "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TTL_MIN)},
        jwt_secret(), algorithm=JWT_ALGORITHM,
    )


def create_refresh(user_id: str) -> str:
    return jwt.encode(
        {"sub": user_id, "type": "refresh",
         "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TTL_DAYS)},
        jwt_secret(), algorithm=JWT_ALGORITHM,
    )


def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none",
                        max_age=ACCESS_TTL_MIN * 60, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none",
                        max_age=REFRESH_TTL_DAYS * 86400, path="/")


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        ah = request.headers.get("Authorization", "")
        if ah.startswith("Bearer "):
            token = ah[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ============ Models ============
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class NoteIn(BaseModel):
    text: str
    type: str = "note"  # note | interview | followup


class ApplicationIn(BaseModel):
    company: str
    role: str
    location: Optional[str] = None
    salary: Optional[str] = None
    job_url: Optional[str] = None
    job_description: Optional[str] = None
    source: Optional[str] = None
    status: str = "saved"
    applied_date: Optional[str] = None


class StatusUpdate(BaseModel):
    status: str


class SummarizeIn(BaseModel):
    text: str
    mode: str = "jd"  # jd | resume


# ============ Auth Routes ============
@api.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": email,
        "name": payload.name,
        "password_hash": hash_password(payload.password),
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    access = create_access(user_id, email)
    refresh = create_refresh(user_id)
    set_auth_cookies(response, access, refresh)
    return {"id": user_id, "email": email, "name": payload.name, "role": "user"}


@api.post("/auth/login")
async def login(payload: LoginIn, request: Request, response: Response):
    email = payload.email.lower()
    ip = request.client.host if request.client else "unknown"
    ident = f"{ip}:{email}"
    rec = await db.login_attempts.find_one({"identifier": ident})
    if rec and rec.get("locked_until"):
        try:
            lu = datetime.fromisoformat(rec["locked_until"])
            if lu > datetime.now(timezone.utc):
                raise HTTPException(status_code=429, detail="Too many attempts. Try later.")
        except (ValueError, TypeError):
            pass
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        count = (rec.get("count", 0) if rec else 0) + 1
        update = {"identifier": ident, "count": count}
        if count >= 5:
            update["locked_until"] = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
        await db.login_attempts.update_one({"identifier": ident}, {"$set": update}, upsert=True)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_one({"identifier": ident})
    access = create_access(user["id"], email)
    refresh = create_refresh(user["id"])
    set_auth_cookies(response, access, refresh)
    return {"id": user["id"], "email": user["email"], "name": user["name"], "role": user.get("role", "user")}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


@api.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access = create_access(user["id"], user["email"])
        response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none",
                            max_age=ACCESS_TTL_MIN * 60, path="/")
        return {"ok": True}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


# ============ Applications ============
def _serialize_app(a: dict) -> dict:
    a.pop("_id", None)
    return a


@api.get("/applications")
async def list_applications(user=Depends(get_current_user), status: Optional[str] = None,
                            q: Optional[str] = None):
    query = {"user_id": user["id"]}
    if status and status != "all":
        query["status"] = status
    if q:
        query["$or"] = [
            {"company": {"$regex": q, "$options": "i"}},
            {"role": {"$regex": q, "$options": "i"}},
        ]
    items = await db.applications.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items


@api.post("/applications")
async def create_application(payload: ApplicationIn, user=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    doc = payload.model_dump()
    doc.update({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "notes": [],
        "summary": None,
        "created_at": now,
        "updated_at": now,
    })
    await db.applications.insert_one(doc)
    return _serialize_app(doc)


@api.get("/applications/{app_id}")
async def get_application(app_id: str, user=Depends(get_current_user)):
    a = await db.applications.find_one({"id": app_id, "user_id": user["id"]}, {"_id": 0})
    if not a:
        raise HTTPException(status_code=404, detail="Not found")
    return a


@api.put("/applications/{app_id}")
async def update_application(app_id: str, payload: ApplicationIn, user=Depends(get_current_user)):
    upd = payload.model_dump()
    upd["updated_at"] = datetime.now(timezone.utc).isoformat()
    r = await db.applications.update_one({"id": app_id, "user_id": user["id"]}, {"$set": upd})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    a = await db.applications.find_one({"id": app_id}, {"_id": 0})
    return a


@api.patch("/applications/{app_id}/status")
async def update_status(app_id: str, payload: StatusUpdate, user=Depends(get_current_user)):
    r = await db.applications.update_one(
        {"id": app_id, "user_id": user["id"]},
        {"$set": {"status": payload.status, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


@api.delete("/applications/{app_id}")
async def delete_application(app_id: str, user=Depends(get_current_user)):
    r = await db.applications.delete_one({"id": app_id, "user_id": user["id"]})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


@api.post("/applications/{app_id}/notes")
async def add_note(app_id: str, payload: NoteIn, user=Depends(get_current_user)):
    note = {
        "id": str(uuid.uuid4()),
        "text": payload.text,
        "type": payload.type,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    r = await db.applications.update_one(
        {"id": app_id, "user_id": user["id"]},
        {"$push": {"notes": note}, "$set": {"updated_at": note["created_at"]}},
    )
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return note


@api.delete("/applications/{app_id}/notes/{note_id}")
async def delete_note(app_id: str, note_id: str, user=Depends(get_current_user)):
    await db.applications.update_one(
        {"id": app_id, "user_id": user["id"]},
        {"$pull": {"notes": {"id": note_id}}},
    )
    return {"ok": True}


# ============ Stats ============
@api.get("/stats")
async def stats(user=Depends(get_current_user)):
    pipeline = [
        {"$match": {"user_id": user["id"]}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]
    by_status_raw = await db.applications.aggregate(pipeline).to_list(100)
    by_status = {x["_id"]: x["count"] for x in by_status_raw}
    statuses = ["saved", "applied", "interviewing", "offer", "rejected"]
    for s in statuses:
        by_status.setdefault(s, 0)
    total = sum(by_status.values())
    responses = by_status["interviewing"] + by_status["offer"] + by_status["rejected"]
    applied_total = by_status["applied"] + responses
    response_rate = round((responses / applied_total) * 100, 1) if applied_total else 0.0

    # Weekly (last 8 weeks)
    weekly: List[dict] = []
    now = datetime.now(timezone.utc)
    apps = await db.applications.find({"user_id": user["id"]}, {"_id": 0, "created_at": 1}).to_list(5000)
    for i in range(7, -1, -1):
        wk_end = now - timedelta(days=i * 7)
        wk_start = wk_end - timedelta(days=7)
        count = 0
        for a in apps:
            try:
                dt = datetime.fromisoformat(a["created_at"].replace("Z", "+00:00"))
                if wk_start <= dt < wk_end:
                    count += 1
            except (ValueError, KeyError):
                continue
        weekly.append({"week": wk_end.strftime("%b %d"), "count": count})

    return {
        "total": total,
        "by_status": by_status,
        "response_rate": response_rate,
        "weekly": weekly,
        "offer_count": by_status["offer"],
    }


# ============ AI ============
client_ai = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


@api.post("/ai/summarize")
async def ai_summarize(payload: SummarizeIn, user=Depends(get_current_user)):
    if not payload.text or len(payload.text.strip()) < 20:
        raise HTTPException(status_code=400, detail="Text too short")

    try:
        if payload.mode == "resume":
            prompt = f"""
Analyze this resume and return:
- Top 5 skills
- Experience summary
- 3 key achievements

Resume:
{payload.text[:8000]}
"""
        else:
            prompt = f"""
Summarize this job description in 3-5 bullet points.

Job Description:
{payload.text[:8000]}
"""

        response = client_ai.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": os.system},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
        )


        summary = response.choices[0].message.content

        return {"summary": summary}

    except Exception as e:
        logger.error(f"AI summarize failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api.post("/applications/{app_id}/summarize")
async def summarize_jd(app_id: str, user=Depends(get_current_user)):
    a = await db.applications.find_one(
        {"id": app_id, "user_id": user["id"]},
        {"_id": 0}
    )

    if not a:
        raise HTTPException(status_code=404, detail="Not found")

    jd = a.get("job_description") or ""

    if len(jd.strip()) < 20:
        raise HTTPException(
            status_code=400,
            detail="Job description too short"
        )

    try:
        response = client_ai.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "Summarize job descriptions into concise bullet points."
                },
                {
                    "role": "user",
                    "content": f"""
Summarize this JD in 3-5 bullet points.
Focus on:
- required skills
- responsibilities
- perks

JD:
{jd[:8000]}
"""
                }
            ],
            temperature=0.5,
            max_tokens=500
        )

        summary = response.choices[0].message.content

        await db.applications.update_one(
            {"id": app_id},
            {"$set": {"summary": summary}}
        )

        return {"summary": summary}

    except Exception as e:
        logger.error(f"summarize_jd failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ Resumes ============
@api.get("/resumes")
async def list_resumes(user=Depends(get_current_user)):
    items = await db.resumes.find({"user_id": user["id"], "is_deleted": False}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items


@api.post("/resumes")
async def upload_resume(file: UploadFile = File(...), user=Depends(get_current_user)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file")
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "bin"
    if ext not in ("pdf", "docx", "doc", "txt"):
        raise HTTPException(status_code=400, detail="Unsupported file type")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    path = f"{APP_NAME}/resumes/{user['id']}/{uuid.uuid4()}.{ext}"
    try:
        result = put_object(path, data, file.content_type or "application/octet-stream")
    except Exception as e:
        logger.error(f"Storage upload failed: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")
    rid = str(uuid.uuid4())
    doc = {
        "id": rid,
        "user_id": user["id"],
        "storage_path": result["path"],
        "filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "is_default": False,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    # If first resume, mark default
    count = await db.resumes.count_documents({"user_id": user["id"], "is_deleted": False})
    if count == 0:
        doc["is_default"] = True
    await db.resumes.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.post("/resumes/{rid}/default")
async def set_default_resume(rid: str, user=Depends(get_current_user)):
    r = await db.resumes.find_one({"id": rid, "user_id": user["id"]})
    if not r:
        raise HTTPException(status_code=404, detail="Not found")
    await db.resumes.update_many({"user_id": user["id"]}, {"$set": {"is_default": False}})
    await db.resumes.update_one({"id": rid}, {"$set": {"is_default": True}})
    return {"ok": True}


@api.delete("/resumes/{rid}")
async def delete_resume(rid: str, user=Depends(get_current_user)):
    r = await db.resumes.update_one({"id": rid, "user_id": user["id"]},
                                    {"$set": {"is_deleted": True}})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


@api.get("/resumes/{rid}/download")
async def download_resume(rid: str, request: Request, auth: Optional[str] = Query(None)):
    # support query param auth for direct browser download
    if auth and not request.cookies.get("access_token"):
        try:
            payload = jwt.decode(auth, jwt_secret(), algorithms=[JWT_ALGORITHM])
            user_id = payload["sub"]
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid")
    else:
        user = await get_current_user(request)
        user_id = user["id"]
    r = await db.resumes.find_one({"id": rid, "user_id": user_id, "is_deleted": False}, {"_id": 0})
    if not r:
        raise HTTPException(status_code=404, detail="Not found")
    try:
        data, ct = get_object(r["storage_path"])
    except Exception as e:
        logger.error(f"Download failed: {e}")
        raise HTTPException(status_code=500, detail="Download failed")
    return Response(content=data, media_type=r.get("content_type") or ct,
                    headers={"Content-Disposition": f'inline; filename="{r["filename"]}"'})


# ============ Health ============
@api.get("/")
async def health():
    return {"service": "HireTrack", "ok": True}


# ============ Startup ============
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.applications.create_index([("user_id", 1), ("created_at", -1)])
    await db.applications.create_index("id", unique=True)
    await db.resumes.create_index([("user_id", 1), ("created_at", -1)])
    # seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@hiretrack.app")
    admin_pw = os.environ.get("ADMIN_PASSWORD", "Admin@123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "name": "Admin",
            "password_hash": hash_password(admin_pw),
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Seeded admin: {admin_email}")
    elif not verify_password(admin_pw, existing["password_hash"]):
                await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_pw)}}
        )


@app.on_event("shutdown")
async def shutdown():
    client.close()


app.include_router(api)
