import asyncio
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.event_poster import EventPoster

logger = logging.getLogger(__name__)

async def activate_scheduled_events():
    """Activate events that are inactive and whose start time has passed (and not trashed)."""
    db: Session = SessionLocal()
    try:
        # Use naive datetime.now() to match likely naive storage in DB (if stored as UTC by default)
        # This aligns strict comparison if DB assumed input was UTC.
        now = datetime.now()

        # Check if deleted_at exists to avoid crash if migration not applied
        has_deleted_at = False
        try:
            from sqlalchemy import text
            db.execute(text("SELECT deleted_at FROM event_posters LIMIT 1"))
            has_deleted_at = True
        except Exception:
            db.rollback()
            pass

        query = db.query(EventPoster)
        
        if has_deleted_at:
            query = query.filter(EventPoster.deleted_at.is_(None))

        events = query.filter(
            EventPoster.is_active == False,
            EventPoster.starts_at.is_not(None),
            EventPoster.starts_at <= now
        ).all()

        if events:
            logger.info(f"Activating {len(events)} scheduled event(s)")
            for evt in events:
                evt.is_active = True
                logger.info(f"Activated event {evt.id}: {evt.title}")
            db.commit()

    except Exception as e:
        logger.error(f"Error in scheduler: {e}")
    finally:
        db.close()

async def scheduler_loop():
    logger.info("Starting background scheduler...")
    while True:
        try:
            await activate_scheduled_events()
        except Exception as e:
            logger.error(f"Scheduler loop error: {e}")
        
        # Run every 10 seconds for faster updates
        await asyncio.sleep(10)

def start_scheduler():
    asyncio.create_task(scheduler_loop())