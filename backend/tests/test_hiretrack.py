"""HireTrack backend API tests"""
import os
import io
import time
import uuid
import pytest # type: ignore
import requests

BASE_URL = "http://127.0.0.1:8000".rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@gmail.com"
ADMIN_PASSWORD = "Admin123"

RUN_ID = uuid.uuid4().hex[:8]
TEST_EMAIL = f"test_{RUN_ID}@example.com"
TEST_PASSWORD = "TestPass@123"


@pytest.fixture(scope="module")
def user_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json={"email": TEST_EMAIL, "password": TEST_PASSWORD, "name": "Test User"})
    assert r.status_code == 200, f"Register failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return s


# ===== Health =====
def test_health():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("ok") is True


# ===== Auth =====
def test_admin_login(admin_session):
    r = admin_session.get(f"{API}/auth/me")
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == ADMIN_EMAIL
    assert data["role"] == "admin"


def test_register_and_me(user_session):
    r = user_session.get(f"{API}/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == TEST_EMAIL


def test_register_duplicate(user_session):
    r = requests.post(f"{API}/auth/register", json={"email": TEST_EMAIL, "password": "x" * 8, "name": "x"})
    assert r.status_code == 400


def test_login_invalid():
    r = requests.post(f"{API}/auth/login", json={"email": "nobody@test.com", "password": "wrong"})
    assert r.status_code == 401


def test_unauth_me():
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401


# ===== Applications CRUD =====
@pytest.fixture(scope="module")
def created_app(user_session):
    payload = {
        "company": "TEST_Acme Corp",
        "role": "Senior Engineer",
        "location": "Remote",
        "status": "applied",
        "job_description": "We are looking for a senior engineer with strong Python and FastAPI skills. Responsibilities include designing APIs, mentoring juniors, and improving infra. Perks: remote, equity, healthcare.",
    }
    r = user_session.post(f"{API}/applications", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["company"] == payload["company"]
    assert "id" in data
    return data


def test_get_application(user_session, created_app):
    r = user_session.get(f"{API}/applications/{created_app['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == created_app["id"]


def test_list_applications(user_session, created_app):
    r = user_session.get(f"{API}/applications")
    assert r.status_code == 200
    items = r.json()
    assert any(a["id"] == created_app["id"] for a in items)


def test_list_with_search(user_session, created_app):
    r = user_session.get(f"{API}/applications", params={"q": "TEST_Acme"})
    assert r.status_code == 200
    items = r.json()
    assert len(items) >= 1


def test_list_with_status(user_session, created_app):
    r = user_session.get(f"{API}/applications", params={"status": "applied"})
    assert r.status_code == 200


def test_update_application(user_session, created_app):
    upd = {"company": "TEST_Acme Corp", "role": "Staff Engineer", "status": "interviewing",
           "job_description": created_app["job_description"]}
    r = user_session.put(f"{API}/applications/{created_app['id']}", json=upd)
    assert r.status_code == 200
    assert r.json()["role"] == "Staff Engineer"


def test_patch_status(user_session, created_app):
    r = user_session.patch(f"{API}/applications/{created_app['id']}/status", json={"status": "offer"})
    assert r.status_code == 200
    # verify
    r2 = user_session.get(f"{API}/applications/{created_app['id']}")
    assert r2.json()["status"] == "offer"


# ===== Notes =====
def test_add_and_delete_note(user_session, created_app):
    r = user_session.post(f"{API}/applications/{created_app['id']}/notes",
                          json={"text": "Phone screen passed", "type": "interview"})
    assert r.status_code == 200
    note_id = r.json()["id"]
    r2 = user_session.delete(f"{API}/applications/{created_app['id']}/notes/{note_id}")
    assert r2.status_code == 200


# ===== Stats =====
def test_stats(user_session, created_app):
    r = user_session.get(f"{API}/stats")
    assert r.status_code == 200
    s = r.json()
    assert "total" in s and "by_status" in s and "weekly" in s and "offer_count" in s
    assert len(s["weekly"]) == 8
    assert s["total"] >= 1


# ===== AI =====
def test_ai_summarize_jd(user_session):
    text = ("We're hiring a Senior Backend Engineer to build a high-performance API platform. "
            "You'll work with Python, FastAPI, MongoDB, and Kubernetes. Strong async experience required. "
            "Perks include remote work, equity, and learning budget.") * 2
    r = user_session.post(f"{API}/ai/summarize", json={"text": text, "mode": "jd"})
    assert r.status_code == 200, r.text
    assert "summary" in r.json() and len(r.json()["summary"]) > 10


def test_ai_summarize_app(user_session, created_app):
    r = user_session.post(f"{API}/applications/{created_app['id']}/summarize")
    assert r.status_code == 200, r.text
    assert "summary" in r.json()
    # verify saved
    r2 = user_session.get(f"{API}/applications/{created_app['id']}")
    assert r2.json().get("summary")


# ===== Resumes =====
@pytest.fixture(scope="module")
def uploaded_resume(user_session):
    files = {"file": ("test_resume.txt", io.BytesIO(b"John Doe\nSoftware Engineer\nPython, FastAPI"), "text/plain")}
    r = user_session.post(f"{API}/resumes", files=files)
    assert r.status_code == 200, r.text
    return r.json()


def test_list_resumes(user_session, uploaded_resume):
    r = user_session.get(f"{API}/resumes")
    assert r.status_code == 200
    items = r.json()
    assert any(x["id"] == uploaded_resume["id"] for x in items)


def test_set_default_resume(user_session, uploaded_resume):
    r = user_session.post(f"{API}/resumes/{uploaded_resume['id']}/default")
    assert r.status_code == 200


def test_download_resume(user_session, uploaded_resume):
    r = user_session.get(f"{API}/resumes/{uploaded_resume['id']}/download")
    assert r.status_code == 200
    assert len(r.content) > 0


def test_delete_resume(user_session, uploaded_resume):
    r = user_session.delete(f"{API}/resumes/{uploaded_resume['id']}")
    assert r.status_code == 200


# ===== Cleanup =====
def test_zzz_delete_application(user_session, created_app):
    r = user_session.delete(f"{API}/applications/{created_app['id']}")
    assert r.status_code == 200
    r2 = user_session.get(f"{API}/applications/{created_app['id']}")
    assert r2.status_code == 404


def test_zzz_logout(user_session):
    r = user_session.post(f"{API}/auth/logout")
    assert r.status_code == 200