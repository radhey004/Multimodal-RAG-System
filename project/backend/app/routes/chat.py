from fastapi import (
    APIRouter,
    Depends
)

from pydantic import BaseModel

from app.utils.auth import (
    get_current_user
)

from app.services.database import (
    get_documents_by_user
)

from app.services.rag_service import (
    ask_question
)


router = APIRouter(
    prefix="/api/chat",
    tags=["Chat"]
)


class ChatRequest(BaseModel):
    query: str


@router.post("/")
def chat(
    data: ChatRequest,
    user_id: str = Depends(
        get_current_user
    )
):

    documents = get_documents_by_user(
        user_id
    )

    document_names = {
        document["document_id"]:
            document["file_name"]
        for document in documents
    }

    result = ask_question(
        data.query,
        user_id,
        document_names
    )

    return result