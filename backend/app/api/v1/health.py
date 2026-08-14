import logging

from fastapi import APIRouter

from app.core.config import settings
from app.models.health import HealthResponse

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/health",
    tags=["Health"],
)


@router.get(
    "",
    response_model=HealthResponse,
)
async def health_check() -> HealthResponse:
    logger.debug("Health check requested")

    return HealthResponse(
        status="healthy",
        service=settings.app_name,
        version=settings.app_version,
    )