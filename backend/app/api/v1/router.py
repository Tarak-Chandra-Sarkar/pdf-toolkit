from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.pdf import router as pdf_router

api_router = APIRouter()

api_router.include_router(health_router)

api_router.include_router(pdf_router)