from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.init_db import seed_roles_and_permissions
from app.core.init_controls import seed_security_controls_and_frameworks
from app.features.auth.router import router as auth_router
from app.features.organizations.router import router as organizations_router
from app.features.users.router import router as users_router
from app.features.vendors.router import router as vendors_router
from app.features.questionnaires.router import router as questionnaires_router
from app.features.assessments.router import router as assessments_router
from app.features.evidence.router import router as evidence_router
from app.features.controls.router import router as controls_router
from app.features.risk.router import router as risk_router
from app.features.ai.router import router as ai_router
from app.features.reports.router import router as reports_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed baseline permissions & security controls
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_roles_and_permissions(db)
        seed_security_controls_and_frameworks(db)
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
app.include_router(questionnaires_router, prefix=settings.API_V1_STR)
app.include_router(assessments_router, prefix=settings.API_V1_STR)
app.include_router(evidence_router, prefix=settings.API_V1_STR)
app.include_router(controls_router, prefix=settings.API_V1_STR)
app.include_router(risk_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)



@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": "0.2.0"
    }

