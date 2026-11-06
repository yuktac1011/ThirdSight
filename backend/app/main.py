from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.init_db import seed_roles_and_permissions
from app.features.auth.router import router as auth_router
from app.features.organizations.router import router as organizations_router
from app.features.users.router import router as users_router
from app.features.vendors.router import router as vendors_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed baseline permissions
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_roles_and_permissions(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise Third-Party Risk Management & Security Intelligence API",
    version="0.2.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(organizations_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(vendors_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": "0.2.0"
    }

