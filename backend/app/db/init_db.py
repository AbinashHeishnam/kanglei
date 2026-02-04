from sqlalchemy import text
from app.db.session import engine
from app.db.base import Base  # or wherever Base is imported from

SCHEMA_NAME = "kanglei"

def init_db():
    # Ensure schema exists (Render Postgres won't have it by default)
    with engine.begin() as conn:
        conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{SCHEMA_NAME}"'))

    # Then create tables
    Base.metadata.create_all(bind=engine)
