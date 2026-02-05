import sys
import os
sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from app.models.gallery_post import GalleryPost
from app.models.event_poster import EventPoster

db = SessionLocal()
images = db.query(GalleryPost).all()
events = db.query(EventPoster).all()

print("--- Gallery ---")
for img in images:
    print(f"ID: {img.id}, Path: {img.image_path}")

print("\n--- Events ---")
for evt in events:
    print(f"ID: {evt.id}, Path: {evt.image_path} (Active: {evt.is_active})")

db.close()
