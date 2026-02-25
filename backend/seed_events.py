import sys
import os
from datetime import datetime, timedelta
sys.path.append(os.getcwd())

from app.db.session import SessionLocal, engine
from app.models.event_poster import EventPoster
from app.db.base import Base  # Import Base to access metadata

# Create tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# clear existing
try:
    db.query(EventPoster).delete()
except Exception:
    pass # Table might be empty or just created


events = [
    EventPoster(
        title="Kanglei Career Fair 2026",
        image_path="/local/path/poster1.jpg", 
        is_active=True,
        starts_at=datetime.now() + timedelta(days=10),
        created_at=datetime.now()
    ),
    EventPoster(
        title="Tech Workshop: AI & Future",
        image_path="/local/path/poster2.jpg",
        is_active=True,
        starts_at=datetime.now() + timedelta(days=15),
        created_at=datetime.now()
    ),
    EventPoster(
        title="Study Abroad Seminar",
        image_path="/local/path/poster3.jpg",
        is_active=True,
        starts_at=datetime.now() + timedelta(days=20),
        created_at=datetime.now()
    )
]

for e in events:
    db.add(e)

db.commit()
print("Seeded 3 events successfully.")
db.close()
