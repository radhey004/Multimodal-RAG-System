import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path

import cloudinary
import cloudinary.uploader

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile
)

from fastapi.responses import RedirectResponse

from pydantic import BaseModel

from app.config import settings

from app.services.database import (
    create_document,
    delete_document,
    get_document,
    get_document_by_hash,
    get_documents_by_user,
    rename_document
)

from app.services.document_service import (
    SUPPORTED_EXTENSIONS,
    process_document
)

from app.services.rag_service import (
    delete_document_vectors,
    embed_items,
    upload_vectors
)

from app.utils.auth import get_current_user

from app.utils.file_hash import calculate_file_hash


# =========================================================
# Router
# =========================================================

router = APIRouter(
    prefix="/api/documents",
    tags=["Documents"]
)


# =========================================================
# Cloudinary Configuration
# =========================================================

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)


# =========================================================
# Request Models
# =========================================================

class RenameRequest(BaseModel):
    file_name: str


# =========================================================
# Cloudinary Upload
# =========================================================

def upload_cloudinary(
    path: str,
    name: str
):
    """
    Upload documents to Cloudinary.

    PDFs are uploaded as RAW resources because they
    should not be delivered as image resources.

    Other supported files continue using auto detection.
    """

    extension = Path(name).suffix.lower()

    public_id = (
        f"{Path(name).stem}_{uuid.uuid4().hex}"
    )

    # -----------------------------------------------------
    # PDF
    # -----------------------------------------------------

    if extension == ".pdf":

        result = cloudinary.uploader.upload(
            path,
            resource_type="raw",
            type="upload",
            folder="multimodal-rag",
            public_id=public_id
        )

    # -----------------------------------------------------
    # Other files
    # -----------------------------------------------------

    else:

        result = cloudinary.uploader.upload(
            path,
            resource_type="auto",
            type="upload",
            folder="multimodal-rag",
            public_id=public_id
        )

    print(
        "Cloudinary upload successful:"
    )

    print(
        f"  Resource type: "
        f"{result.get('resource_type')}"
    )

    print(
        f"  Delivery type: "
        f"{result.get('type')}"
    )

    print(
        f"  URL: "
        f"{result.get('secure_url')}"
    )

    return result["secure_url"]


# =========================================================
# Upload Documents
# =========================================================

@router.post("/upload")
async def upload_documents(
    files: list[UploadFile] = File(...),
    user_id: str = Depends(get_current_user)
):

    # -----------------------------------------------------
    # User upload directory
    # -----------------------------------------------------

    directory = (
        Path("data/uploads")
        / user_id
    )

    directory.mkdir(
        parents=True,
        exist_ok=True
    )

    results = []

    # =====================================================
    # Process each file
    # =====================================================

    for file in files:

        extension = Path(
            file.filename
        ).suffix.lower()

        # -------------------------------------------------
        # Validate extension
        # -------------------------------------------------

        if extension not in SUPPORTED_EXTENSIONS:

            results.append({
                "file_name": file.filename,
                "status": "rejected",
                "message": "Unsupported file type"
            })

            continue

        # -------------------------------------------------
        # Temporary file path
        # -------------------------------------------------

        path = (
            directory
            / f"{uuid.uuid4().hex}{extension}"
        )

        try:

            # =============================================
            # Save temporary file
            # =============================================

            with path.open("wb") as output:

                shutil.copyfileobj(
                    file.file,
                    output
                )

            # =============================================
            # File size validation
            # =============================================

            max_size = (
                settings.MAX_FILE_SIZE_MB
                * 1024
                * 1024
            )

            if path.stat().st_size > max_size:

                raise ValueError(
                    f"File exceeds "
                    f"{settings.MAX_FILE_SIZE_MB} MB"
                )

            # =============================================
            # Calculate file hash
            # =============================================

            file_hash = calculate_file_hash(
                str(path)
            )

            # =============================================
            # Duplicate check
            # =============================================

            if get_document_by_hash(
                file_hash,
                user_id
            ):

                results.append({
                    "file_name": file.filename,
                    "status": "duplicate",
                    "message": "File already uploaded"
                })

                continue

            # =============================================
            # Create document metadata
            # =============================================

            document = {

                "document_id": str(
                    uuid.uuid4()
                ),

                "user_id": user_id,

                "file_name": file.filename,

                "file_hash": file_hash,

                "extension": extension,

                "created_at": datetime.now(
                    timezone.utc
                )
            }

            # =============================================
            # Upload to Cloudinary
            # =============================================

            document["cloudinary_url"] = (
                upload_cloudinary(
                    str(path),
                    file.filename
                )
            )

            # =============================================
            # Process document
            # =============================================

            items = process_document({
                **document,
                "filepath": str(path)
            })

            if not items:

                raise ValueError(
                    "No readable content found"
                )

            # =============================================
            # Generate embeddings
            # =============================================

            items = embed_items(
                items
            )

            # =============================================
            # Upload vectors
            # =============================================

            upload_vectors(
                items,
                user_id
            )

            # =============================================
            # Save MongoDB metadata
            # =============================================

            create_document(
                document
            )

            # =============================================
            # Success
            # =============================================

            results.append({

                "document_id":
                    document["document_id"],

                "file_name":
                    file.filename,

                "status":
                    "success",

                "message":
                    "File uploaded and indexed"
            })

        except Exception as exc:

            print(
                f"Document upload error: {exc}"
            )

            results.append({

                "file_name":
                    file.filename,

                "status":
                    "error",

                "message":
                    str(exc)
            })

        finally:

            # ---------------------------------------------
            # Remove temporary file
            # ---------------------------------------------

            path.unlink(
                missing_ok=True
            )

    return {
        "results": results
    }


# =========================================================
# List Documents
# =========================================================

@router.get("/")
def list_documents(
    user_id: str = Depends(
        get_current_user
    )
):

    documents = get_documents_by_user(
        user_id
    )

    return {

        "documents": [

            {
                "document_id":
                    document["document_id"],

                "file_name":
                    document["file_name"],

                "extension":
                    document.get(
                        "extension",
                        ""
                    ),

                "cloudinary_url":
                    document.get(
                        "cloudinary_url"
                    ),

                "created_at":
                    document.get(
                        "created_at"
                    )
            }

            for document in documents
        ]
    }


# =========================================================
# PDF Preview
# =========================================================
#
# IMPORTANT:
# This endpoint checks the authenticated user first.
# After that, it redirects the browser to the Cloudinary
# PDF URL.
#
# New PDFs uploaded using the code above will have:
#
#     /raw/upload/
#
# instead of:
#
#     /image/upload/
#
# =========================================================

# =========================================================
# PDF Preview Endpoint
# =========================================================

@router.get("/{document_id}/pdf")
def preview_pdf(
    document_id: str,
    user_id: str = Depends(
        get_current_user
    )
):
    """
    Return the Cloudinary PDF URL after
    authenticating the user.
    """

    document = get_document(
        document_id,
        user_id
    )

    if not document:

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    extension = (
        document.get("extension", "")
        .lower()
    )

    if extension != ".pdf":

        raise HTTPException(
            status_code=400,
            detail="This document is not a PDF"
        )

    cloudinary_url = document.get(
        "cloudinary_url"
    )

    if not cloudinary_url:

        raise HTTPException(
            status_code=404,
            detail="PDF URL not found"
        )

    return {
        "url": cloudinary_url
    }


# =========================================================
# Get Single Document
# =========================================================

@router.get("/{document_id}")
def get_single_document(
    document_id: str,
    user_id: str = Depends(
        get_current_user
    )
):

    document = get_document(
        document_id,
        user_id
    )

    if not document:

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    return {

        "document": {

            "document_id":
                document["document_id"],

            "file_name":
                document["file_name"],

            "cloudinary_url":
                document.get(
                    "cloudinary_url"
                ),

            "extension":
                document.get(
                    "extension"
                ),

            "created_at":
                document.get(
                    "created_at"
                )
        }
    }


# =========================================================
# Rename Document
# =========================================================

@router.patch("/{document_id}")
def rename(
    document_id: str,
    data: RenameRequest,
    user_id: str = Depends(
        get_current_user
    )
):

    name = data.file_name.strip()

    if not name:

        raise HTTPException(
            status_code=400,
            detail="File name cannot be empty"
        )

    document = get_document(
        document_id,
        user_id
    )

    if not document:

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    rename_document(
        document_id,
        user_id,
        name
    )

    return {
        "message":
            "Document renamed successfully"
    }


# =========================================================
# Delete Document
# =========================================================

@router.delete("/{document_id}")
def delete(
    document_id: str,
    user_id: str = Depends(
        get_current_user
    )
):

    document = get_document(
        document_id,
        user_id
    )

    if not document:

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    # -----------------------------------------------------
    # Delete vectors
    # -----------------------------------------------------

    delete_document_vectors(
        document_id,
        user_id
    )

    # -----------------------------------------------------
    # Delete MongoDB metadata
    # -----------------------------------------------------

    delete_document(
        document_id,
        user_id
    )

    return {
        "message":
            "Document deleted successfully"
    }