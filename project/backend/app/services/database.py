from pymongo import MongoClient
from app.config import settings


client = MongoClient(settings.MONGO_URI)

db = client[settings.MONGO_DB_NAME]

users_collection = db["users"]
documents_collection = db["documents"]


def create_indexes():
    users_collection.create_index(
        "email",
        unique=True
    )

    documents_collection.create_index(
        [
            ("user_id", 1),
            ("file_hash", 1)
        ],
        unique=True
    )

    documents_collection.create_index(
        "user_id"
    )


def get_user_by_email(email: str):
    return users_collection.find_one({
        "email": email.lower()
    })


def create_user(user):
    return users_collection.insert_one(user)


def create_document(document):
    return documents_collection.insert_one(document)


def get_documents_by_user(user_id: str):
    return list(
        documents_collection.find(
            {"user_id": user_id}
        ).sort("created_at", -1)
    )


def get_document(document_id: str, user_id: str):
    return documents_collection.find_one({
        "document_id": document_id,
        "user_id": user_id
    })


def get_document_by_hash(file_hash: str, user_id: str):
    return documents_collection.find_one({
        "file_hash": file_hash,
        "user_id": user_id
    })


def rename_document(
    document_id: str,
    user_id: str,
    new_name: str
):
    return documents_collection.update_one(
        {
            "document_id": document_id,
            "user_id": user_id
        },
        {
            "$set": {
                "file_name": new_name
            }
        }
    )


def delete_document(
    document_id: str,
    user_id: str
):
    return documents_collection.delete_one({
        "document_id": document_id,
        "user_id": user_id
    })