from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth import router as auth_router
from app.routes.documents import router as documents_router
from app.routes.chat import router as chat_router

from app.services.database import (
    create_indexes
)


app = FastAPI(
    title="Multimodal RAG API",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


create_indexes()


app.include_router(
    auth_router
)

app.include_router(
    documents_router
)

app.include_router(
    chat_router
)


@app.get("/")
def root():
    return {
        "message":
            "Multimodal RAG API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }