import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.routers import auth, products, reviews, users, admin, platform

app = FastAPI(
    title="RealBuy API Engine",
    description="Full-stack AI-powered social shopping and product intelligence backend powered by FastAPI",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware supporting Vercel and local development
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
custom_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=default_origins + custom_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded media statically
upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "uploads")
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

# Include Routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(reviews.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(platform.router)

@app.on_event("startup")
def on_startup():
    from backend.init_db import ensure_database_initialized
    try:
        ensure_database_initialized()
    except Exception as e:
        print(f"[Startup Warning] Could not run DB auto-init: {e}")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "RealBuy FastAPI Backend",
        "version": "2.0.0",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)
