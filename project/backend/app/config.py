import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # MongoDB
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "multimodal_rag")

    # JWT
    JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret")
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))

    # Cloudinary
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

    # Pinecone
    PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
    PINECONE_INDEX_NAME = os.getenv(
        "PINECONE_INDEX_NAME",
        "multimodal-rag"
    )
    PINECONE_NAMESPACE_PREFIX = os.getenv(
        "PINECONE_NAMESPACE_PREFIX",
        "user"
    )

    PINECONE_CLOUD = os.getenv(
        "PINECONE_CLOUD",
        "aws"
    )

    PINECONE_REGION = os.getenv(
        "PINECONE_REGION",
        "us-east-1"
    )

    # CLIP
    CLIP_MODEL_NAME = os.getenv(
        "CLIP_MODEL_NAME",
        "openai/clip-vit-base-patch32"
    )

    # Reranker
    RERANKER_MODEL = os.getenv(
        "RERANKER_MODEL",
        "cross-encoder/ms-marco-MiniLM-L-6-v2"
    )

    # Ollama
    OLLAMA_MODEL = os.getenv(
        "OLLAMA_MODEL",
        "qwen2.5:3b"
    )

    OLLAMA_HOST = os.getenv(
        "OLLAMA_HOST",
        "http://localhost:11434"
    )

    # Upload
    MAX_FILE_SIZE_MB = int(
        os.getenv("MAX_FILE_SIZE_MB", "50")
    )

    CHUNK_SIZE = 700
    CHUNK_OVERLAP = 200

    EMBEDDING_DIMENSION = 512


settings = Settings()