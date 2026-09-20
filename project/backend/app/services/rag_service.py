import os
from pathlib import Path

import torch
import ollama

from PIL import Image
from pinecone import Pinecone, ServerlessSpec
from transformers import CLIPModel, CLIPProcessor
from sentence_transformers import CrossEncoder

from app.config import settings


# ============================================================
# CLIP
# ============================================================

device = (
    "cuda"
    if torch.cuda.is_available()
    else "cpu"
)

print(f"Using device: {device}")


clip_model = CLIPModel.from_pretrained(
    settings.CLIP_MODEL_NAME
).to(device).eval()


clip_processor = CLIPProcessor.from_pretrained(
    settings.CLIP_MODEL_NAME
)


# ============================================================
# TEXT EMBEDDING
# ============================================================

@torch.no_grad()
def embed_text(text: str) -> list[float]:
    """
    Generate a normalized CLIP text embedding.

    Returns:
        list[float]: 512-dimensional CLIP embedding
    """

    if not text:
        text = ""

    inputs = clip_processor(
        text=[text],
        return_tensors="pt",
        padding=True,
        truncation=True
    ).to(device)

    # Run CLIP text encoder directly.
    outputs = clip_model.text_model(
        **inputs
    )

    pooled_output = outputs.pooler_output

    embedding = clip_model.text_projection(
        pooled_output
    )

    # Normalize embedding
    embedding = embedding / embedding.norm(
        dim=-1,
        keepdim=True
    )

    return embedding.cpu().numpy()[0].tolist()


# ============================================================
# IMAGE EMBEDDING
# ============================================================

@torch.no_grad()
def embed_image(image_path: str) -> list[float]:
    """
    Generate a normalized CLIP image embedding.

    Args:
        image_path: Local image path.

    Returns:
        list[float]: 512-dimensional CLIP embedding
    """

    image = Image.open(
        image_path
    ).convert("RGB")

    inputs = clip_processor(
        images=image,
        return_tensors="pt"
    ).to(device)

    outputs = clip_model.vision_model(
        **inputs
    )

    pooled_output = outputs.pooler_output

    embedding = clip_model.visual_projection(
        pooled_output
    )

    # Normalize embedding
    embedding = embedding / embedding.norm(
        dim=-1,
        keepdim=True
    )

    return embedding.cpu().numpy()[0].tolist()


# ============================================================
# PINECONE
# ============================================================

pc = Pinecone(
    api_key=settings.PINECONE_API_KEY
)


def get_index():

    existing_indexes = [
        item["name"]
        if isinstance(item, dict)
        else item.name
        for item in pc.list_indexes()
    ]

    if settings.PINECONE_INDEX_NAME not in existing_indexes:

        print(
            f"Creating Pinecone index: "
            f"{settings.PINECONE_INDEX_NAME}"
        )

        pc.create_index(
            name=settings.PINECONE_INDEX_NAME,
            vector_type="dense",
            dimension=settings.EMBEDDING_DIMENSION,
            metric="cosine",
            spec=ServerlessSpec(
                cloud=settings.PINECONE_CLOUD,
                region=settings.PINECONE_REGION
            ),
            deletion_protection="disabled"
        )

    return pc.Index(
        settings.PINECONE_INDEX_NAME
    )


index = get_index()


# ============================================================
# USER NAMESPACE
# ============================================================

def user_namespace(user_id: str) -> str:
    """
    Generate a dedicated Pinecone namespace for each user.
    """

    return (
        f"{settings.PINECONE_NAMESPACE_PREFIX}"
        f"_{user_id}"
    )


# ============================================================
# EMBED DOCUMENT ITEMS
# ============================================================

def embed_items(items):

    embedded_items = []

    print(
        f"Starting embedding for "
        f"{len(items)} items..."
    )

    for item_number, item in enumerate(
        items,
        start=1
    ):

        try:

            item_type = item.get(
                "type",
                "text"
            )

            if item_type == "image":

                vector = embed_image(
                    item["path"]
                )

            else:

                vector = embed_text(
                    item.get(
                        "text",
                        ""
                    )
                )

            item["embedding"] = vector

            embedded_items.append(
                item
            )

            print(
                f"Embedded item "
                f"{item_number}/{len(items)}"
            )

        except Exception as error:

            print(
                f"Embedding failed for item "
                f"{item_number}: "
                f"{type(error).__name__}: "
                f"{error}"
            )

            raise

    print(
        f"Successfully embedded "
        f"{len(embedded_items)} items."
    )

    return embedded_items


# ============================================================
# UPLOAD VECTORS TO PINECONE
# ============================================================
def upload_vectors(items, user_id):

    print(
        "🔥🔥🔥 NEW upload_vectors() CALLED 🔥🔥🔥",
        user_id
    )

    namespace = user_namespace(user_id)

    print("")
    print("=" * 60)
    print("PINECONE VECTOR UPLOAD")
    print("=" * 60)

    print(
        f"User ID: {user_id}"
    )

    print(
        f"Namespace: {namespace}"
    )

    print(
        f"Items to upload: {len(items)}"
    )

    vectors = []

    for number, item in enumerate(
        items
    ):

        vector_id = (
            f"{item['document_id']}_"
            f"{number}"
        )

        metadata = {
            "document_id":
                item["document_id"],

            "file_name":
                item["file_name"],

            "page":
                item.get(
                    "page",
                    ""
                ),

            "location":
                item.get(
                    "location",
                    ""
                ),

            "type":
                item.get(
                    "type",
                    ""
                ),

            "path":
                item.get(
                    "path",
                    ""
                ),

            "text":
                item.get(
                    "text",
                    ""
                )
        }

        vectors.append({
            "id": vector_id,

            # IMPORTANT:
            # embedding is already a Python list.
            "values":
                item["embedding"],

            "metadata":
                metadata
        })

    print(
        f"Prepared {len(vectors)} vectors."
    )

    # --------------------------------------------------------
    # Upload in batches of 100
    # --------------------------------------------------------

    for start in range(
        0,
        len(vectors),
        100
    ):

        batch = vectors[
            start:start + 100
        ]

        print(
            f"Uploading batch "
            f"{start + 1}-"
            f"{start + len(batch)}..."
        )

        index.upsert(
            vectors=batch,
            namespace=namespace
        )

        print(
            f"Uploaded batch successfully."
        )

    # --------------------------------------------------------
    # Verify Pinecone namespace
    # --------------------------------------------------------

    stats = index.describe_index_stats()

    print("")
    print("===== AFTER VECTOR UPLOAD =====")

    print(
        f"Total vectors: "
        f"{stats.total_vector_count}"
    )

    print(
        f"Namespaces: "
        f"{stats.namespaces}"
    )

    if namespace in stats.namespaces:

        namespace_count = (
            stats.namespaces[
                namespace
            ].vector_count
        )

        print(
            f"Namespace '{namespace}' "
            f"contains {namespace_count} vectors."
        )

    else:

        print(
            f"WARNING: Namespace '{namespace}' "
            f"was NOT found after upload!"
        )

    print(
        "================================"
    )
    print("")

    return True


# ============================================================
# DELETE DOCUMENT VECTORS
# ============================================================

def delete_document_vectors(
    document_id: str,
    user_id: str
):

    namespace = user_namespace(
        user_id
    )

    print(
        f"Deleting vectors for document "
        f"{document_id}"
    )

    print(
        f"Namespace: {namespace}"
    )

    index.delete(
        filter={
            "document_id": {
                "$eq": document_id
            }
        },
        namespace=namespace
    )


# ============================================================
# RERANKER
# ============================================================

reranker = CrossEncoder(
    settings.RERANKER_MODEL,
    max_length=512
)


# ============================================================
# PINECONE METADATA HELPERS
# ============================================================

def get_metadata(match):

    if hasattr(
        match,
        "metadata"
    ):

        return match.metadata or {}

    if isinstance(
        match,
        dict
    ):

        return match.get(
            "metadata",
            {}
        )

    return {}


def get_score(match):

    if hasattr(
        match,
        "score"
    ):

        return float(
            match.score or 0
        )

    if isinstance(
        match,
        dict
    ):

        return float(
            match.get(
                "score",
                0
            )
        )

    return 0.0


# ============================================================
# RERANK
# ============================================================

def rerank(
    query,
    matches,
    top_k=5
):

    rows = []

    text_pairs = []
    text_row_ids = []

    for row_id, match in enumerate(
        matches
    ):

        metadata = get_metadata(
            match
        )

        text = metadata.get(
            "text",
            ""
        )

        item_type = metadata.get(
            "type"
        )

        rows.append({
            "match": match,

            "metadata":
                metadata,

            "pinecone_score":
                get_score(match),

            "rerank_score":
                None
        })

        if (
            item_type
            in [
                "text",
                "table",
                "ocr"
            ]
            and text.strip()
        ):

            text_pairs.append(
                (
                    query,
                    text
                )
            )

            text_row_ids.append(
                row_id
            )

    # --------------------------------------------------------
    # CrossEncoder reranking
    # --------------------------------------------------------

    if text_pairs:

        scores = reranker.predict(
            text_pairs,
            show_progress_bar=False
        )

        for row_id, score in zip(
            text_row_ids,
            scores
        ):

            rows[row_id][
                "rerank_score"
            ] = float(score)

    # --------------------------------------------------------
    # Final scores
    # --------------------------------------------------------

    for row in rows:

        if row[
            "rerank_score"
        ] is not None:

            row[
                "final_score"
            ] = row[
                "rerank_score"
            ]

        else:

            row[
                "final_score"
            ] = row[
                "pinecone_score"
            ]

    return sorted(
        rows,
        key=lambda row:
            row["final_score"],
        reverse=True
    )[:top_k]


# ============================================================
# BUILD CONTEXT
# ============================================================

def build_context(
    results,
    document_names=None
):

    document_names = (
        document_names or {}
    )

    context_parts = []
    image_paths = []
    source_lines = []

    for source_number, result in enumerate(
        results,
        start=1
    ):

        metadata = result[
            "metadata"
        ]

        document_id = metadata.get(
            "document_id"
        )

        file_name = (
            document_names.get(
                document_id,
                metadata.get(
                    "file_name",
                    "Unknown"
                )
            )
        )

        location = metadata.get(
            "location",
            metadata.get(
                "page",
                "Unknown"
            )
        )

        item_type = metadata.get(
            "type",
            "document"
        )

        text = metadata.get(
            "text",
            ""
        )

        source_lines.append(
            f"[{source_number}] "
            f"{file_name} - "
            f"{location} - "
            f"{item_type}"
        )

        # ----------------------------------------------------
        # Text / table / OCR context
        # ----------------------------------------------------

        if text.strip():

            context_parts.append(
                f"[Retrieved Source "
                f"{source_number}]\n"
                f"File: {file_name}\n"
                f"Location: {location}\n"
                f"Type: {item_type}\n\n"
                f"{text}"
            )

        # ----------------------------------------------------
        # Image context
        # ----------------------------------------------------

        if (
            item_type == "image"
            and metadata.get("path")
        ):

            image_path = (
                metadata["path"]
            )

            if Path(
                image_path
            ).exists():

                image_paths.append(
                    image_path
                )

                context_parts.append(
                    f"[Retrieved Image "
                    f"{source_number}]\n"
                    f"File: {file_name}\n"
                    f"Location: {location}\n"
                    f"Type: image"
                )

    return (
        "\n\n".join(
            context_parts
        ),
        image_paths,
        "\n".join(
            source_lines
        )
    )


# ============================================================
# COMPLETE RAG PIPELINE
# ============================================================

def ask_question(
    query: str,
    user_id: str,
    document_names=None
):

    # ========================================================
    # 1. Embed query
    # ========================================================

    print("")
    print("=" * 60)
    print("RAG QUERY")
    print("=" * 60)

    print(
        f"Embedding query: {query}"
    )

    query_embedding = embed_text(
        query
    )

    print(
        f"Query embedding dimension: "
        f"{len(query_embedding)}"
    )

    # ========================================================
    # 2. Determine user namespace
    # ========================================================

    namespace = user_namespace(
        user_id
    )

    print(
        f"User ID: {user_id}"
    )

    print(
        f"Searching Pinecone namespace: "
        f"{namespace}"
    )

    # ========================================================
    # 3. Inspect Pinecone namespaces
    # ========================================================

    stats = index.describe_index_stats()

    print("")
    print("===== PINECONE STATUS =====")

    print(
        f"Total vectors: "
        f"{stats.total_vector_count}"
    )

    print(
        f"Namespaces: "
        f"{stats.namespaces}"
    )

    if namespace in stats.namespaces:

        namespace_count = (
            stats.namespaces[
                namespace
            ].vector_count
        )

        print(
            f"User namespace contains "
            f"{namespace_count} vectors."
        )

    else:

        print(
            f"WARNING: User namespace "
            f"'{namespace}' does not exist!"
        )

    print(
        "==========================="
    )

    # ========================================================
    # 4. Pinecone retrieval
    # ========================================================

    retrieved = index.query(
        vector=query_embedding,
        top_k=15,
        namespace=namespace,
        include_metadata=True
    ).matches

    print(
        f"Retrieved {len(retrieved)} matches"
    )

    # ========================================================
    # No results
    # ========================================================

    if not retrieved:

        print(
            "No Pinecone matches found."
        )

        return {
            "answer":
                "I could not find relevant "
                "information in your documents.",

            "sources": []
        }

    # ========================================================
    # 5. Reranking
    # ========================================================

    print(
        "Running CrossEncoder reranking..."
    )

    reranked_results = rerank(
        query,
        retrieved,
        top_k=5
    )

    print(
        f"Reranked to "
        f"{len(reranked_results)} results."
    )

    # ========================================================
    # 6. Build context
    # ========================================================

    context, image_paths, sources = (
        build_context(
            reranked_results,
            document_names
        )
    )

    # Limit context length
    context = context[
        :8000
    ]

    print(
        f"Context length: "
        f"{len(context)} characters"
    )

    # ========================================================
    # 7. Prompt
    # ========================================================

    prompt = f"""
You are a document question-answering assistant.

Answer the user's question using ONLY
the retrieved document context.

Rules:

1. Do not use outside knowledge.

2. If the answer is not present in the
   retrieved context, say:
   "The answer was not found in the uploaded documents."

3. Be concise but informative.

4. Mention the relevant document/location
   when useful.

5. Always include a Sources section.

User question:
{query}

Retrieved context:
{context}

Sources:
{sources}
"""

    message = {
        "role": "user",
        "content": prompt
    }

    # ========================================================
    # 8. Ollama
    # ========================================================

    print(
        f"Sending request to Ollama model: "
        f"{settings.OLLAMA_MODEL}"
    )

    client = ollama.Client(
        host=settings.OLLAMA_HOST,
        timeout=120
    )

    response = client.chat(
        model=settings.OLLAMA_MODEL,
        messages=[
            message
        ],
        options={
            "num_predict": 512,
            "temperature": 0.1
        },
        keep_alive="5m"
    )

    answer = response[
        "message"
    ][
        "content"
    ]

    # ========================================================
    # 9. Return result
    # ========================================================

    print(
        "RAG response generated successfully."
    )

    return {
        "answer": answer,

        "sources": [
            {
                "number": index + 1,
                "text": line
            }

            for index, line in enumerate(
                sources.splitlines()
            )
        ]
    }