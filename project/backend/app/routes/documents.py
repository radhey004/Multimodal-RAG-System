import os
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path

import cloudinary
import cloudinary.uploader

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Depends,
    HTTPException
)

from pydantic import BaseModel

from app.config import settings

from app.utils.auth import (
    get_current_user
)

from app.utils.file_hash import (
    calculate_file_hash
)

from app.services.database import (
    get_document_by_hash,
    get_documents_by_user,
    create_document,
    get_document,
    rename_document,
    delete_document
)

from app.services.document_service import (
    SUPPORTED_EXTENSIONS,
    process_document
)

from app.services.rag_service import (
    embed_items,
    upload_vectors,
    delete_document_vectors
)


router = APIRouter(
    prefix="/api/documents",
    tags=["Documents"]
)


cloudinary.config(
    cloud_name=
        settings.CLOUDINARY_CLOUD_NAME,
    api_key=
        settings.CLOUDINARY_API_KEY,
    api_secret=
        settings.CLOUDINARY_API_SECRET,
    secure=True
)


class RenameRequest(BaseModel):
    file_name: str


def upload_to_cloudinary(
    file_path: str,
    original_name: str
):

    result = cloudinary.uploader.upload(
        file_path,
        resource_type="auto",
        folder="multimodal-rag",
        public_id=(
            Path(original_name).stem
            + "_"
            + uuid.uuid4().hex
        )
    )

    return result["secure_url"]


@router.post("/upload")
async def upload_documents(
    files: list[UploadFile] = File(...),
    user_id: str = Depends(get_current_user)
):

    print("\n")
    print("=" * 70)
    print("🔥🔥🔥 DOCUMENT UPLOAD STARTED 🔥🔥🔥")
    print("=" * 70)
    print(f"Authenticated user_id: {user_id}")
    print(f"Number of files: {len(files)}")

    results = []

    user_upload_dir = (
        Path("data")
        / "uploads"
        / user_id
    )

    user_upload_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    for file in files:

        print("\n" + "-" * 70)
        print(f"Processing file: {file.filename}")
        print("-" * 70)

        extension = Path(
            file.filename
        ).suffix.lower()

        print(f"Extension: {extension}")

        # ==================================================
        # Extension validation
        # ==================================================

        if extension not in SUPPORTED_EXTENSIONS:

            print(
                f"❌ Unsupported extension: {extension}"
            )

            results.append({
                "file_name":
                    file.filename,
                "status":
                    "rejected",
                "message":
                    "Unsupported file type"
            })

            continue

        print("✅ Extension supported")

        temp_path = (
            user_upload_dir
            / (
                uuid.uuid4().hex
                + extension
            )
        )

        try:

            # ==================================================
            # Save temporary file
            # ==================================================

            print(
                f"Saving file to: {temp_path}"
            )

            with open(
                temp_path,
                "wb"
            ) as buffer:

                shutil.copyfileobj(
                    file.file,
                    buffer
                )

            print("✅ File saved")

            # ==================================================
            # SHA-256
            # ==================================================

            print("Calculating SHA-256...")

            file_hash = calculate_file_hash(
                str(temp_path)
            )

            print(
                f"File hash: {file_hash}"
            )

            # ==================================================
            # Duplicate check
            # ==================================================

            print(
                "Checking for duplicate..."
            )

            duplicate = get_document_by_hash(
                file_hash,
                user_id
            )

            if duplicate:

                print(
                    "❌ DUPLICATE FILE DETECTED"
                )

                temp_path.unlink(
                    missing_ok=True
                )

                results.append({
                    "file_name":
                        file.filename,
                    "status":
                        "duplicate",
                    "message":
                        "This file has already been uploaded"
                })

                continue

            print("✅ File is not a duplicate")

            # ==================================================
            # Document metadata
            # ==================================================

            document_id = str(
                uuid.uuid4()
            )

            print(
                f"Document ID: {document_id}"
            )

            document = {
                "document_id":
                    document_id,

                "user_id":
                    user_id,

                "file_name":
                    file.filename,

                "file_hash":
                    file_hash,

                "extension":
                    extension,

                "created_at":
                    datetime.now(
                        timezone.utc
                    )
            }

            # ==================================================
            # Cloudinary
            # ==================================================

            print(
                "Uploading to Cloudinary..."
            )

            cloudinary_url = (
                upload_to_cloudinary(
                    str(temp_path),
                    file.filename
                )
            )

            print(
                f"✅ Cloudinary upload complete"
            )

            document[
                "cloudinary_url"
            ] = cloudinary_url

            # ==================================================
            # Document processing
            # ==================================================

            processing_document = {
                **document,
                "filepath":
                    str(temp_path)
            }

            print(
                "Processing document..."
            )

            items = process_document(
                processing_document
            )

            print(
                f"✅ Document processing complete"
            )

            print(
                f"Extracted items: {len(items)}"
            )

            # ==================================================
            # Embeddings
            # ==================================================

            print(
                "Generating embeddings..."
            )

            items = embed_items(
                items
            )

            print(
                f"✅ Embeddings generated: "
                f"{len(items)}"
            )

            # ==================================================
            # Pinecone
            # ==================================================

            print("")
            print("🚀 ABOUT TO CALL upload_vectors()")
            print(
                f"User ID being passed: {user_id}"
            )

            upload_vectors(
                items,
                user_id
            )

            print(
                "✅ upload_vectors() COMPLETED"
            )

            # ==================================================
            # MongoDB
            # ==================================================

            print(
                "Saving document metadata to MongoDB..."
            )

            create_document(
                document
            )

            print(
                "✅ MongoDB document created"
            )

            # ==================================================
            # Success
            # ==================================================

            results.append({
                "document_id":
                    document_id,

                "file_name":
                    file.filename,

                "status":
                    "success",

                "message":
                    "File uploaded and indexed successfully"
            })

            print(
                f"🎉 SUCCESS: {file.filename}"
            )

        except Exception as error:

            print("")
            print(
                "❌❌❌ UPLOAD ERROR ❌❌❌"
            )

            print(
                f"File: {file.filename}"
            )

            print(
                f"Error type: "
                f"{type(error).__name__}"
            )

            print(
                f"Error: {error}"
            )

            import traceback

            traceback.print_exc()

            print(
                "❌❌❌ END ERROR ❌❌❌"
            )

            temp_path.unlink(
                missing_ok=True
            )

            results.append({
                "file_name":
                    file.filename,

                "status":
                    "error",

                "message":
                    str(error)
            })

    print("")
    print("=" * 70)
    print("🔥 DOCUMENT UPLOAD FINISHED 🔥")
    print("=" * 70)
    print(f"Results: {results}")
    print("=" * 70)
    print("")

    return {
        "results":
            results
    }

@router.get("/")
def list_documents(
    user_id: str = Depends(
        get_current_user
    )
):

    documents = get_documents_by_user(
        user_id
    )

    result = []

    for document in documents:

        result.append({
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
        })

    return {
        "documents":
            result
    }


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
                document["cloudinary_url"],
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


@router.patch("/{document_id}")
def rename(
    document_id: str,
    data: RenameRequest,
    user_id: str = Depends(
        get_current_user
    )
):

    if not data.file_name.strip():

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
        data.file_name.strip()
    )

    return {
        "message":
            "Document renamed successfully"
    }


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

    # Delete Pinecone vectors
    delete_document_vectors(
        document_id,
        user_id
    )

    # Delete MongoDB metadata
    delete_document(
        document_id,
        user_id
    )

    return {
        "message":
            "Document deleted successfully"
    }