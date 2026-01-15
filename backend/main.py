from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Bastouille Intelligence Service",
    description="Microservice Python pour les tâches à forte valeur cognitive",
    version="0.1.0"
)

from routers import agents, plantes, admin, referentiel, operations

# Configuration CORS pour autoriser l'accès depuis le réseau local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Pour le dev local, on autorise tout. À restreindre en prod.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents.router)
app.include_router(plantes.router)
app.include_router(admin.router)
app.include_router(referentiel.router)
app.include_router(operations.router)

@app.get("/")
async def root():
    return {
        "service": "Baštouille Intelligence",
        "status": "operational",
        "version": "0.1.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "ok"}
