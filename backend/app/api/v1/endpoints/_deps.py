from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.core.security import decode_token
from app.models.admin_user import AdminUser

security = HTTPBearer()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def require_admin(
    creds: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> AdminUser:
    token = creds.credentials
    try:
        payload = decode_token(token)
        username = payload.get("sub")
        if not username:
            raise ValueError("missing sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    admin = db.query(AdminUser).filter(AdminUser.username == username, AdminUser.is_active == True).first()
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found or disabled")
    return admin
