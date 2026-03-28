from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import auth, enrich, apikeys
from core.config import settings

app = FastAPI(title=settings.APP_NAME, version=settings.VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://app.datapulse.io"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(enrich.router)
app.include_router(apikeys.router)

@app.on_event("startup")
async def startup():
    init_db()
    print(f"✅ {settings.APP_NAME} v{settings.VERSION} démarré")

@app.get("/health")
async def health():
    return {"status": "ok", "version": settings.VERSION}
