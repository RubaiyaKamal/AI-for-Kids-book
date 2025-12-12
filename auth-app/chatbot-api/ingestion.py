import os
import re
from openai import OpenAI
from qdrant_client import QdrantClient, models
import httpx

# Environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "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")
QDRANT_URL = "https://95f917bd-5eae-4a33-bb5b-01706d914e55.europe-west3-0.gcp.cloud.qdrant.io"
QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.vGM2WFJKbHspSDW2Lw_zGMKEAE2aV_8JMOZQU6Y_Blo"

# Initialize OpenAI client
openai_client = OpenAI(api_key=OPENAI_API_KEY)

if OPENAI_API_KEY == "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":
    print("WARNING: OPENAI_API_KEY in ingestion.py is still using the default placeholder. Please set your actual OpenAI API key as an environment variable or replace it in ingestion.py.")
EMBEDDING_MODEL = "text-embedding-ada-002"
EMBEDDING_DIMENSION = 1536 # Dimension for text-embedding-ada-002

# Initialize Qdrant client
qdrant_client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY,
)
COLLECTION_NAME = "book_chunks"

def get_markdown_files(directory):
    markdown_files = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".md"):
                markdown_files.append(os.path.join(root, file))
    return markdown_files

def chunk_markdown_content(filepath, chunk_size=500, chunk_overlap=50):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    paragraphs = content.split("\n\n")
    chunks = []
    current_chunk = ""

    for paragraph in paragraphs:
        cleaned_paragraph = paragraph.strip()
        if not cleaned_paragraph:
            continue

        if len(current_chunk) + len(cleaned_paragraph) + 2 > chunk_size and current_chunk:
            chunks.append(current_chunk)
            current_chunk = " ".join(current_chunk.split()[-int(chunk_overlap/5):]) + " " + cleaned_paragraph
        else:
            if current_chunk:
                current_chunk += "\n\n" + cleaned_paragraph
            else:
                current_chunk = cleaned_paragraph

    if current_chunk:
        chunks.append(current_chunk)

    if not chunks and content.strip():
        chunks.append(content.strip())

    return [{"content": chunk, "metadata": {"source": filepath}} for chunk in chunks]

def get_embeddings(texts):
    response = openai_client.embeddings.create(
        input=texts,
        model=EMBEDDING_MODEL
    )
    return [embedding.embedding for embedding in response.data]

def upload_chunks_to_qdrant(chunks_data):
    # Ensure collection exists
    if qdrant_client.collection_exists(COLLECTION_NAME):
        qdrant_client.delete_collection(collection_name=COLLECTION_NAME)
    qdrant_client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=models.VectorParams(size=EMBEDDING_DIMENSION, distance=models.Distance.COSINE),
    )

    points = []
    for i, chunk in enumerate(chunks_data):
        # Generate embedding for the chunk content
        embedding = get_embeddings([chunk["content"]])[0]
        points.append(
            models.PointStruct(
                id=i, # Simple incremental ID
                vector=embedding,
                payload=chunk["metadata"], # Store source filepath in metadata
            )
        )

    qdrant_client.upsert(
        collection_name=COLLECTION_NAME,
        wait=True,
        points=points
    )
    print(f"Uploaded {len(points)} chunks to Qdrant collection '{COLLECTION_NAME}'.")

def process_book_content_and_upload(docs_directory):
    all_chunks = []
    markdown_files = get_markdown_files(docs_directory)
    for md_file in markdown_files:
        print(f"Processing {md_file}...")
        chunks = chunk_markdown_content(md_file)
        all_chunks.extend(chunks)

    print(f"Total chunks generated: {len(all_chunks)}")
    if all_chunks:
        upload_chunks_to_qdrant(all_chunks)
    else:
        print("No chunks to upload.")

if __name__ == "__main__":
    docs_path = os.path.abspath(os.path.join(os.getcwd(), "..", "docs"))
    if not os.path.exists(docs_path):
        print(f"Error: The directory '{docs_path}' does not exist.")
    else:
        process_book_content_and_upload(docs_path)

