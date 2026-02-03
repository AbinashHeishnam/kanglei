from fastapi import APIRouter
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.appointments import router as appointments_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.gallery import router as gallery_router
from app.api.v1.endpoints.exports import router as exports_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health_router, tags=["health"])
api_router.include_router(appointments_router, tags=["appointments"])
api_router.include_router(auth_router, tags=["auth"])
api_router.include_router(gallery_router, tags=["gallery"])
api_router.include_router(exports_router, tags=["exports"])
