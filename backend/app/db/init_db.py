from sqlalchemy.orm import Session
from app.db.session import engine
from app.db.base import Base
from app.models.admin_user import AdminUser
from app.core.security import hash_password
from app.core.config import BOOTSTRAP_ADMIN_USERNAME, BOOTSTRAP_ADMIN_PASSWORD

def init_db():
    # create tables
    Base.metadata.create_all(bind=engine)

def ensure_bootstrap_admin(db: Session):
    existing = db.query(AdminUser).filter(AdminUser.username == BOOTSTRAP_ADMIN_USERNAME).first()
    if existing:
        return
    admin = AdminUser(
        username=BOOTSTRAP_ADMIN_USERNAME,
        password_hash=hash_password(BOOTSTRAP_ADMIN_PASSWORD),
        role="superadmin",
        is_active=True,
    )
    db.add(admin)
    db.commit()
