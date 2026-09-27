from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.services.database import get_documents_by_user
from app.services.rag_service import ask_question
from app.utils.auth import get_current_user

router = APIRouter(
    prefix="/api/chat",
    tags=["Chat"]
)


class ChatRequest(BaseModel):
    query: str


@router.post("/")
def chat(
    data: ChatRequest,
    user_id: str = Depends(get_current_user)
):
    if not data.query.strip():
        return {
            "answer": "Please enter a question.",
            "sources": []
        }

    documents = get_documents_by_user(user_id)

    names = {
        d["document_id"]: d["file_name"]
        for d in documents
    }

    return ask_question(
        data.query.strip(),
        user_id,
        names
    )