import os
from dotenv import load_dotenv # Import load_dotenv

load_dotenv() # Load environment variables from .env file

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import httpx
from openai import OpenAI
from qdrant_client import QdrantClient

# Environment variables - Read them directly from os.getenv()
# These will be initialized once per worker process when the app starts
# and read from the environment or .env file by the uvicorn worker.
# Do not define them globally and then override with os.getenv() later.

# Initialize clients lazily to prevent startup errors
openai_client = None
qdrant_client = None

def get_openai_client():
    global openai_client
    if openai_client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        print(f"DEBUG: OPENAI_API_KEY loaded: {api_key[:5]}...{api_key[-5:]}" if api_key else "DEBUG: OPENAI_API_KEY is None or empty.")
        if not api_key:
            print("ERROR: OPENAI_API_KEY environment variable is not set.")
            raise ValueError("OPENAI_API_KEY environment variable is not set.")

        # Check for the default placeholder that might still be in the code or environment
        if api_key == "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":
             print("WARNING: OPENAI_API_KEY is still using the default placeholder. Please set your actual OpenAI API key as an environment variable.")

        # Initialize OpenAI client
        # Note: Proxies should be set via HTTP_PROXY and HTTPS_PROXY environment variables
        # which will be automatically picked up by httpx
        openai_client = OpenAI(api_key=api_key)
    return openai_client

def get_qdrant_client():
    global qdrant_client
    if qdrant_client is None:
        qdrant_url = os.getenv("QDRANT_URL", "https://95f917bd-5eae-4a33-bb5b-01706d914e55.europe-west3-0.gcp.cloud.qdrant.io")
        qdrant_api_key = os.getenv("QDRANT_API_KEY", "your_qdrant_api_key_here") # Replaced the hardcoded key with a placeholder for best practice

        if not qdrant_url:
            print("ERROR: QDRANT_URL environment variable is not set.")
            raise ValueError("QDRANT_URL environment variable is not set.")
        if not qdrant_api_key:
            print("ERROR: QDRANT_API_KEY environment variable is not set.")
            raise ValueError("QDRANT_API_KEY environment variable is not set.")

        qdrant_client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
    return qdrant_client

COLLECTION_NAME = "book_chunks"
EMBEDDING_MODEL = "text-embedding-ada-002"
CHAT_MODEL = "gpt-4o-mini"

from routers import auth
import models
from database import engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="RAG Chatbot API")

# CORS configuration - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=False,  # Must be False when allow_origins is ["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)

# Request models
class ChatRequest(BaseModel):
    question: str
    selected_text: Optional[str] = None
    user_id: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]

# Helper functions
def get_embedding(text: str) -> List[float]:
    """Generate embedding for a text using OpenAI"""
    print(f"--- Chatbot: Generating embedding for text (length: {len(text)}) ---")
    client = get_openai_client()
    response = client.embeddings.create(
        input=text,
        model=EMBEDDING_MODEL
    )
    print("--- Chatbot: Embedding generated successfully ---")
    return response.data[0].embedding

def search_similar_chunks(query: str, top_k: int = 5) -> List[dict]:
    """Search for similar chunks in Qdrant"""
    query_embedding = get_embedding(query)

    client = get_qdrant_client()
    search_result = client.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_embedding,
        limit=top_k
    )

    return [
        {
            "content": hit.payload.get("content", ""),
            "source": hit.payload.get("source", "Unknown"),
            "score": hit.score
        }
        for hit in search_result
    ]

def generate_answer(question: str, context: str, selected_text: Optional[str] = None) -> str:
    """Generate answer using OpenAI chat completion"""
    print(f"--- Chatbot: Calling OpenAI chat completion for question: {question[:50]}... ---")

    if selected_text:
        system_prompt = f"""You are a helpful assistant answering questions about a book on Physical AI & Humanoid Robotics.
The user has selected the following text from the book:
---
{selected_text}
---

Answer the question based ONLY on this selected text. If the answer cannot be found in the selected text, say so."""
    else:
        system_prompt = """You are a helpful assistant answering questions about a book on Physical AI & Humanoid Robotics.
Use the provided context from the book to answer questions accurately and concisely."""

    user_prompt = f"""Context from the book:
{context}

Question: {question}

Please provide a clear, concise answer based on the context above."""

    response = get_openai_client().chat.completions.create(
        model=CHAT_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.7,
        max_tokens=500
    )
    print("--- Chatbot: Received response from OpenAI chat completion ---")
    return response.choices[0].message.content

# API Endpoints
@app.get("/")
async def read_root():
    return {"message": "RAG Chatbot API is running", "status": "healthy"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main RAG endpoint for answering questions
    - If selected_text is provided, answer based only on that text
    - Otherwise, search the vector database for relevant context
    """
    try:
        if request.selected_text:
            print("--- Chatbot: Using selected text for answer generation ---")
            # Answer based on selected text only
            answer = generate_answer(
                question=request.question,
                context=request.selected_text,
                selected_text=request.selected_text
            )
            sources = ["Selected Text"]
        else:
            print(f"--- Chatbot: Searching Qdrant for question: {request.question} ---")
            # Search vector database for relevant chunks
            similar_chunks = search_similar_chunks(request.question, top_k=5)

            if not similar_chunks:
                print("--- Chatbot: No relevant content found in Qdrant ---")
                # This could mean Qdrant is empty or no relevant embeddings
                # Consider raising HTTPException here if a response is always expected
                raise HTTPException(status_code=404, detail="No relevant content found in Qdrant. Please ensure data is ingested.")


            # Combine chunks for context
            context = "\n\n".join([chunk["content"] for chunk in similar_chunks])
            sources = list(set([chunk["source"] for chunk in similar_chunks]))
            print(f"--- Chatbot: Found {len(similar_chunks)} chunks from Qdrant. Context length: {len(context)} ---")

            # Generate answer
            answer = generate_answer(
                question=request.question,
                context=context
            )
            print(f"--- Chatbot: Generated answer. Length: {len(answer)} ---")

        return ChatResponse(answer=answer, sources=sources)

    except HTTPException:
        # Re-raise HTTPExceptions to be handled by FastAPI
        raise
    except Exception as e:
        print(f"Chat error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.get("/health")
async def health_check():
    """Check if all services are connected"""
    qdrant_status = "disconnected"
    try:
        client = get_qdrant_client()
        collections = client.get_collections()
        qdrant_status = "connected"
    except Exception as e:
        qdrant_status = f"error: {str(e)}"

    openai_status = "disconnected"
    try:
        client = get_openai_client()
        # Attempt a small API call to check connectivity
        # This can be changed to a simpler health check if available
        client.models.list()
        openai_status = "connected"
    except Exception as e:
        openai_status = f"error: {str(e)}"


    return {
        "status": "healthy",
        "qdrant": qdrant_status,
        "openai": openai_status
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)



