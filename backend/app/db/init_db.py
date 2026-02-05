from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import engine
from app.db.base import Base

from app.core.config import BOOTSTRAP_ADMIN_USERNAME, BOOTSTRAP_ADMIN_PASSWORD
from app.core.security import hash_password

# IMPORTANT: adjust this import path to match your project structure
# (search where AdminUser model is defined)
from app.models.admin_user import AdminUser  # <-- change if needed

SCHEMA_NAME = "kanglei"


def init_db():
    # Ensure schema exists (Render Postgres won't have it by default)
    # Create schema if not exists (Postgres only)
    # Check dialect
    if "sqlite" not in str(engine.url):
        with engine.connect() as conn:
            conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{SCHEMA_NAME}"'))
            conn.commit()

    # Create tables
    Base.metadata.create_all(bind=engine)


def ensure_bootstrap_admin(db: Session):
    """
    Ensure a default admin exists at startup.
    Uses BOOTSTRAP_ADMIN_USERNAME / BOOTSTRAP_ADMIN_PASSWORD from env/config.
    """
    # Optional: set search_path so queries hit your schema first
    db.execute(text(f'SET search_path TO "{SCHEMA_NAME}", public'))

    existing = db.query(AdminUser).filter(AdminUser.username == BOOTSTRAP_ADMIN_USERNAME).first()
    if existing:
        return existing

    admin = AdminUser(
        username=BOOTSTRAP_ADMIN_USERNAME,
        password_hash=hash_password(BOOTSTRAP_ADMIN_PASSWORD),
        role="superadmin",
        is_active=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin
