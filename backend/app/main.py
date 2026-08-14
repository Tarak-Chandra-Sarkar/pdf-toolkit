import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging

from fastapi.openapi.utils import get_openapi

configure_logging()

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "Starting %s v%s",
        settings.app_name,
        settings.app_version,
    )

    yield

    logger.info("Shutting down %s", settings.app_name)


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Local-first PDF utility application.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---- ADD THIS OPENAPI PATCH WORKAROUND ----
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    # Locate the schema block that generates array elements for merging
    try:
        schemas = openapi_schema.get("components", {}).get("schemas", {})
        target_schema = schemas.get("Body_merge_pdf_files_api_v1_pdf_merge_post")
        
        if target_schema and "files" in target_schema["properties"]:
            files_items = target_schema["properties"]["files"]["items"]
            
            # Revert from OpenAPI 3.1 style back to traditional Swagger layout
            files_items["type"] = "string"
            files_items["format"] = "binary"
            
            # Clean up contentMediaType so Swagger doesn't get confused
            if "contentMediaType" in files_items:
                del files_items["contentMediaType"]
    except Exception:
        pass # Fallback safe if structure changes

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi



app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.middleware("http")
async def request_logging_middleware(
    request: Request,
    call_next,
):
    start_time = time.perf_counter()

    response = await call_next(request)

    duration_ms = (
        time.perf_counter() - start_time
    ) * 1000

    logger.info(
        "%s %s -> %s (%.2f ms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )

    return response


app.include_router(
    api_router,
    prefix=settings.api_prefix,
)


@app.get("/")
async def root():
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": f"{settings.api_prefix}/health",
    }