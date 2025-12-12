# RAG Chatbot Implementation Guide
## Using ChatKit, FastAPI, Neon Postgres, and Qdrant Cloud

---

## Architecture Overview

```mermaid
graph TB
    A[User Interface - Docusaurus] --> B[FastAPI Backend]
    B --> C[ChatKit/OpenAI Agents SDK]
    B --> D[Qdrant Cloud - Vector DB]
    B --> E[Neon Serverless Postgres]
    C --> F[OpenAI API]
    D --> G[Book Content Embeddings]
    E --> H[Chat History & Sessions]
```

---

## Tech Stack

- **Frontend:** React + TypeScript (embedded in Docusaurus)
- **Backend:** FastAPI (Python)
- **AI Framework:** ChatKit (OpenAI Agents SDK)
- **Vector Database:** Qdrant Cloud (Free Tier)
- **Relational Database:** Neon Serverless Postgres
- **Embeddings:** OpenAI text-embedding-3-small
- **LLM:** OpenAI GPT-4 Turbo

---

## Features

### Core Capabilities
1. ✅ **General Q&A:** Answer questions about book content using RAG
2. ✅ **Text Selection Queries:** Answer questions based ONLY on user-selected text
3. ✅ **Quick Summary:** Generate chapter summaries
4. ✅ **Key Points Extraction:** Extract key points from selected text
5. ✅ **Chat History:** Persistent conversation history
6. ✅ **Context-Aware:** Maintains conversation context

---

## Backend Implementation

### Project Structure

```
backend/
├── main.py                 # FastAPI app
├── chatkit_agent.py        # ChatKit agent implementation
├── rag_service.py          # RAG pipeline
├── database.py             # Database connection
├── models.py               # Pydantic models
├── embeddings_upload.py    # Script to upload book content
├── requirements.txt        # Dependencies
└── .env                    # Environment variables
```

### Step 1: Install Dependencies

**requirements.txt:**
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
openai==1.3.0
qdrant-client==1.7.0
psycopg2-binary==2.9.9
sqlalchemy==2.0.23
python-dotenv==1.0.0
pydantic==2.5.0
python-multipart==0.0.6
```

**Install:**
```bash
cd backend
pip install -r requirements.txt
```

---

### Step 2: Set Up Environment Variables

**.env:**
```env
# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Qdrant Cloud
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key

# Neon Postgres
NEON_DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# API Settings
CORS_ORIGINS=http://localhost:3000,https://yourdomain.github.io
```

---

### Step 3: Database Setup

**database.py:**
```python
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("NEON_DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True)
    session_id = Column(String(255), unique=True, index=True)
    user_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True)
    session_id = Column(String(255), index=True)
    role = Column(String(50))  # 'user' or 'assistant'
    content = Column(Text)
    selected_text = Column(Text, nullable=True)
    chapter_context = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

# Create tables
Base.metadata.create_all(engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

### Step 4: Pydantic Models

**models.py:**
```python
from pydantic import BaseModel
from typing import Optional, List

class ChatRequest(BaseModel):
    session_id: str
    message: str
    selected_text: Optional[str] = None
    chapter_context: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    sources: List[dict]
    session_id: str

class QuickSummaryRequest(BaseModel):
    chapter_content: str

class KeyPointsRequest(BaseModel):
    selected_text: str
```

---

### Step 5: RAG Service

**rag_service.py:**
```python
from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
import os
from dotenv import load_dotenv

load_dotenv()

class RAGService:
    def __init__(self):
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.qdrant_client = QdrantClient(
            url=os.getenv("QDRANT_URL"),
            api_key=os.getenv("QDRANT_API_KEY")
        )
        self.collection_name = "book_content"

    def generate_embedding(self, text: str) -> list:
        """Generate embedding for query text."""
        response = self.openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding

    def search_similar_content(self, query: str, limit: int = 5,
                              chapter_filter: str = None) -> list:
        """Search for similar content in Qdrant."""
        query_embedding = self.generate_embedding(query)

        # Build filter if chapter context provided
        search_filter = None
        if chapter_filter:
            search_filter = Filter(
                must=[
                    FieldCondition(
                        key="chapter",
                        match=MatchValue(value=chapter_filter)
                    )
                ]
            )

        results = self.qdrant_client.search(
            collection_name=self.collection_name,
            query_vector=query_embedding,
            limit=limit,
            query_filter=search_filter
        )

        return results
```

---

### Step 6: ChatKit Agent

**chatkit_agent.py:**
```python
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

class ChatKitAgent:
    """ChatKit-based AI agent using OpenAI Agents SDK pattern."""

    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = "gpt-4-turbo-preview"

    def generate_response(self, query: str, context: str,
                         chat_history: list = None) -> str:
        """Generate response using ChatKit pattern."""

        system_prompt = """You are an AI assistant for the 'Physical AI & Humanoid Robotics' textbook.
Your role is to help students understand the content by:
1. Answering questions based on the provided context
2. Providing clear, concise explanations
3. Using examples from the book when relevant
4. Formatting responses with proper markdown

When answering:
- Use double line breaks for readability
- Format code with proper syntax highlighting
- Use bullet points for lists
- Be concise but comprehensive
"""

        messages = [{"role": "system", "content": system_prompt}]

        # Add chat history (last 5 messages)
        if chat_history:
            messages.extend(chat_history[-5:])

        # Add current query with context
        user_message = f"""Context from the book:
{context}

Question: {query}

Please answer based on the context provided above."""

        messages.append({"role": "user", "content": user_message})

        # Generate response
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.7,
            max_tokens=1000
        )

        return response.choices[0].message.content

    def generate_quick_summary(self, chapter_content: str) -> str:
        """Generate a quick summary of chapter content."""
        messages = [
            {
                "role": "system",
                "content": "You create concise summaries of textbook chapters."
            },
            {
                "role": "user",
                "content": f"""Provide a concise summary (3-5 sentences) of this chapter:

{chapter_content[:3000]}

Summary:"""
            }
        ]

        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.5,
            max_tokens=300
        )

        return response.choices[0].message.content

    def extract_key_points(self, selected_text: str) -> str:
        """Extract key points from selected text."""
        messages = [
            {
                "role": "system",
                "content": "You extract key points from text in a clear, bulleted format."
            },
            {
                "role": "user",
                "content": f"""Extract the key points from this text:

{selected_text}

Provide 3-5 key points in bullet format."""
            }
        ]

        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.5,
            max_tokens=400
        )

        return response.choices[0].message.content

    def answer_from_selection(self, selected_text: str, question: str) -> str:
        """Answer question based ONLY on selected text."""
        messages = [
            {
                "role": "system",
                "content": """You answer questions based ONLY on the provided text selection.
If the answer is not in the selected text, say so clearly."""
            },
            {
                "role": "user",
                "content": f"""Selected Text:
{selected_text}

Question: {question}

Answer based ONLY on the selected text above:"""
            }
        ]

        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )

        return response.choices[0].message.content
```

---

### Step 7: FastAPI Main Application

**main.py:**
```python
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime

from models import ChatRequest, ChatResponse, QuickSummaryRequest, KeyPointsRequest
from database import get_db, ChatSession, ChatMessage
from rag_service import RAGService
from chatkit_agent import ChatKitAgent

app = FastAPI(
    title="Physical AI & Humanoid Robotics - RAG Chatbot API",
    description="ChatKit-powered RAG chatbot for the textbook",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
rag_service = RAGService()
chatkit_agent = ChatKitAgent()

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Main chat endpoint.
    Supports:
    1. General questions (uses RAG)
    2. Questions about selected text (uses only selected text)
    3. Chapter-specific questions (filters by chapter)
    """
    try:
        # Get or create session
        session = db.query(ChatSession).filter(
            ChatSession.session_id == request.session_id
        ).first()

        if not session:
            session = ChatSession(session_id=request.session_id)
            db.add(session)
            db.commit()

        # Get chat history
        history = db.query(ChatMessage).filter(
            ChatMessage.session_id == request.session_id
        ).order_by(ChatMessage.timestamp.desc()).limit(10).all()

        chat_history = [
            {"role": msg.role, "content": msg.content}
            for msg in reversed(history)
        ]

        # Handle selected text queries
        if request.selected_text:
            response_text = chatkit_agent.answer_from_selection(
                selected_text=request.selected_text,
                question=request.message
            )
            sources = [{
                "type": "selected_text",
                "content": request.selected_text[:200]
            }]
        else:
            # Use RAG for general queries
            search_results = rag_service.search_similar_content(
                query=request.message,
                limit=5,
                chapter_filter=request.chapter_context
            )

            # Build context from search results
            context = "\n\n".join([
                f"[Source {i+1}] {result.payload['text']}"
                for i, result in enumerate(search_results)
            ])

            # Generate response
            response_text = chatkit_agent.generate_response(
                query=request.message,
                context=context,
                chat_history=chat_history
            )

            sources = [
                {
                    "module": result.payload.get('module'),
                    "chapter": result.payload.get('chapter'),
                    "text": result.payload['text'][:200],
                    "score": result.score
                }
                for result in search_results
            ]

        # Save messages to database
        user_msg = ChatMessage(
            session_id=request.session_id,
            role="user",
            content=request.message,
            selected_text=request.selected_text,
            chapter_context=request.chapter_context
        )
        assistant_msg = ChatMessage(
            session_id=request.session_id,
            role="assistant",
            content=response_text
        )

        db.add(user_msg)
        db.add(assistant_msg)
        db.commit()

        return ChatResponse(
            response=response_text,
            sources=sources,
            session_id=request.session_id
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/quick-summary")
async def quick_summary(request: QuickSummaryRequest):
    """Generate quick summary of chapter content."""
    try:
        summary = chatkit_agent.generate_quick_summary(request.chapter_content)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/key-points")
async def key_points(request: KeyPointsRequest):
    """Extract key points from selected text."""
    try:
        points = chatkit_agent.extract_key_points(request.selected_text)
        return {"key_points": points}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "RAG Chatbot API",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

### Step 8: Upload Book Content to Qdrant

**embeddings_upload.py:**
```python
import os
import glob
from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import uuid
from dotenv import load_dotenv

load_dotenv()

# Initialize clients
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
qdrant_client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

COLLECTION_NAME = "book_content"

def create_collection():
    """Create Qdrant collection if it doesn't exist."""
    try:
        qdrant_client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=1536,  # OpenAI embedding dimension
                distance=Distance.COSINE
            )
        )
        print(f"✅ Created collection: {COLLECTION_NAME}")
    except Exception as e:
        print(f"Collection may already exist: {e}")

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list:
    """Split text into overlapping chunks."""
    words = text.split()
    chunks = []

    for i in range(0, len(words), chunk_size - overlap):
        chunk = ' '.join(words[i:i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)

    return chunks

def generate_embeddings(texts: list) -> list:
    """Generate embeddings using OpenAI."""
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=texts
    )
    return [item.embedding for item in response.data]

def upload_book_content():
    """Process all book chapters and upload to Qdrant."""

    # Path to your docs folder
    docs_path = "../docs/**/*.md"
    markdown_files = glob.glob(docs_path, recursive=True)

    print(f"Found {len(markdown_files)} markdown files")

    all_points = []

    for file_path in markdown_files:
        print(f"Processing: {file_path}")

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract metadata from file path
        parts = file_path.split(os.sep)
        module = parts[-2] if len(parts) > 1 else "unknown"
        chapter = parts[-1].replace('.md', '')

        # Chunk the content
        chunks = chunk_text(content)
        print(f"  Created {len(chunks)} chunks")

        # Generate embeddings in batches
        batch_size = 100
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            embeddings = generate_embeddings(batch)

            # Create points for Qdrant
            for j, (chunk, embedding) in enumerate(zip(batch, embeddings)):
                point = PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        "text": chunk,
                        "module": module,
                        "chapter": chapter,
                        "file_path": file_path,
                        "chunk_index": i + j
                    }
                )
                all_points.append(point)

    # Upload to Qdrant in batches
    print(f"\nUploading {len(all_points)} points to Qdrant...")
    batch_size = 100
    for i in range(0, len(all_points), batch_size):
        batch = all_points[i:i + batch_size]
        qdrant_client.upsert(
            collection_name=COLLECTION_NAME,
            points=batch
        )
        print(f"  Uploaded batch {i//batch_size + 1}/{(len(all_points)-1)//batch_size + 1}")

    print(f"\n✅ Successfully uploaded {len(all_points)} chunks to Qdrant!")

if __name__ == "__main__":
    create_collection()
    upload_book_content()
```

---

## Running the Backend

```bash
# 1. Set up environment
cd backend
pip install -r requirements.txt

# 2. Configure .env file with your API keys

# 3. Upload book content to Qdrant
python embeddings_upload.py

# 4. Run the FastAPI server
uvicorn main:app --reload --port 8000
```

**API Documentation:** http://localhost:8000/docs

---

## Frontend Integration

### React Component (ChatBot.tsx)

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatBotProps {
  selectedText?: string;
  currentChapter?: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ selectedText, currentChapter }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem('chatSessionId');
    if (stored) return stored;
    const newId = uuidv4();
    localStorage.setItem('chatSessionId', newId);
    return newId;
  });

  const sendMessage = async (message: string, useSelectedText: boolean = false) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: message,
          selected_text: useSelectedText ? selectedText : null,
          chapter_context: currentChapter
        })
      });

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      {/* Messages */}
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage(input)}
          placeholder="Ask a question..."
        />
        <button onClick={() => sendMessage(input)}>Send</button>
      </div>
    </div>
  );
};

export default ChatBot;
```

---

## Deployment

### Backend Deployment Options

1. **Vercel** (Recommended for FastAPI)
2. **Railway**
3. **Render**
4. **AWS Lambda + API Gateway**

### Frontend (Already on GitHub Pages)

Update API endpoint in production:
```typescript
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-backend.vercel.app'
  : 'http://localhost:8000';
```

---

## Testing

```bash
# Test health endpoint
curl http://localhost:8000/api/health

# Test chat endpoint
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-123",
    "message": "What is Physical AI?",
    "selected_text": null,
    "chapter_context": null
  }'
```

---

## Summary

✅ **ChatKit (OpenAI Agents SDK)** - AI agent framework
✅ **FastAPI** - High-performance backend
✅ **Qdrant Cloud** - Vector database for RAG
✅ **Neon Postgres** - Chat history storage
✅ **Text Selection Support** - Answer questions from selected text
✅ **Quick Summary & Key Points** - Additional features

**You now have a complete RAG chatbot implementation ready to integrate with your Docusaurus book!** 🚀
