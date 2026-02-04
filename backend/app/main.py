import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.db.init_db import init_db, ensure_bootstrap_admin
from app.db.session import SessionLocal
from app.core.config import DEBUG

app = FastAPI(title="Kanglei Career Solution API")

# CORS for frontend dev + production
from fastapi.middleware.cors import CORSMiddleware
import os

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "").strip()

origins = []
if FRONTEND_ORIGIN:
    origins = [FRONTEND_ORIGIN]
else:
    # fallback for local dev
    origins = ["http://localhost:5173", "http://127.0.0.1:5500", "http://localhost:5500"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],



# tighten in production later
)

# Create tables + bootstrap admin user
@app.on_event("startup")
def on_startup():
    init_db()
    db = SessionLocal()
    try:
        ensure_bootstrap_admin(db)
    finally:
        db.close()

# Serve uploads from /uploads
# backend/app/static_uploads/gallery -> /uploads/gallery/...
uploads_dir = os.path.join(os.path.dirname(__file__), "static_uploads")
os.makedirs(os.path.join(uploads_dir, "gallery"), exist_ok=True)
os.makedirs(os.path.join(uploads_dir, "events"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

app.include_router(api_router)

@app.get("/")
def root():
    return {"ok": True, "debug": DEBUG}
