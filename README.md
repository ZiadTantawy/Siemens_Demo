# Siemens Demo - Internal RAG Chatbot

A production-ready Retrieval-Augmented Generation (RAG) chatbot system with intelligent agent orchestration, web search fallback, and comprehensive testing suite. Built with FastAPI, React, LangChain, and LangGraph.

## Features

### Core Capabilities
- **Intelligent Agent Orchestration**: Multi-agent system with LangGraph for complex query routing
- **Document-Based RAG**: Efficient vector-based retrieval from PDF documents using Qdrant
- **Web Search Fallback**: Automatic web search when knowledge base lacks information
- **Interactive Chat Interface**: Modern React-based UI with real-time streaming responses
- **Comprehensive Testing**: Automated test suite with accuracy, performance, and coverage metrics
- **Persistent Chat History**: MongoDB-based conversation storage and retrieval

### Technical Highlights
- **Vector Database**: Qdrant for high-performance semantic search
- **LLM Integration**: Groq API with GPT-OSS-120B model
- **Embeddings**: HuggingFace BGE-base-en-v1.5 for semantic understanding
- **Agent Framework**: LangGraph for stateful agent workflows
- **REST API**: FastAPI with async support and OpenAPI documentation
- **Containerization**: Docker Compose for easy deployment

---

## Architecture

```
┌─────────────┐
│   Frontend  │  React + TypeScript
│  (Port 3000)│  Tailwind CSS
└──────┬──────┘
       │
       │ HTTP/REST
       ▼
┌─────────────┐
│   Backend   │  FastAPI + Python
│  (Port 8000)│  LangChain + LangGraph
└──────┬──────┘
       │
       ├──────────────┬──────────────┬─────────────┐
       ▼              ▼              ▼             ▼
┌──────────┐   ┌──────────┐   ┌──────────┐  ┌──────────┐
│  Qdrant  │   │ MongoDB  │   │ Groq API │  │ Web Search│
│ (Port    │   │ (Port    │   │  (LLM)   │  │  (SERPER) │
│  6333)   │   │  27020)  │   └──────────┘  └──────────┘
└──────────┘   └──────────┘
Vector Store    Chat History
```

### Agent Workflow
1. **Query Reception**: User submits a question via frontend
2. **Agent Orchestration**: LangGraph routes to appropriate agent
3. **RAG Retrieval**: Semantic search in Qdrant vector database
4. **LLM Generation**: Groq API generates contextual response
5. **Web Fallback**: If confidence is low, web search agent activates
6. **Response Delivery**: Streamed back to frontend with citations

---

## Prerequisites

### Required Software
- **Python**: 3.10 or higher
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Docker & Docker Compose**: Latest version
- **Git**: For cloning the repository

### API Keys Required
1. **Groq API Key**: Get from [Groq Console](https://console.groq.com/)
2. **Serper**: For web search - [SERPER](https://SERPER.com/)

---

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/ZiadTantawy/Siemens_Demo.git
cd Siemens_Demo
```

### 2. Start Infrastructure Services
Start MongoDB and Qdrant using Docker Compose:
```bash
docker-compose up -d
```

Verify services are running:
```bash
docker ps
```

You should see:
- `Siemens_MongoDB` on port 27020
- `Siemens_Qdrant` on ports 6333 (REST) and 6334 (gRPC)

### 3. Backend Setup

#### Create Python Virtual Environment
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

#### Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### Download Embedding Model
The HuggingFace embedding model will download automatically on first run (~500MB). To pre-download:
```bash
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-base-en-v1.5')"
```

### 4. Frontend Setup

```bash
cd frontend
npm install
cd ..
```

---

## Configuration

### Environment Variables

Create or update the `.env` file in the project root:

```bash
# MongoDB Configuration
MONGODB_HOST=localhost
MONGODB_PORT=27020
MONGODB_DATABASE=internal_chatbot

# Qdrant Configuration
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_COLLECTION=pdf_docs

# API Keys (REQUIRED)
API_KEY=your_groq_api_key_here
GROQ_API_KEY=your_groq_api_key_here
SERPER_API_KEY=your_SERPER_api_key_here  # Optional for web search

# Model Configuration
CHAT_MODEL=llama-3.3-70b-versatile
EMBED_MODEL=BAAI/bge-base-en-v1.5

# Document Ingestion Settings
COLLECTION_NAME=pdf_docs
SOURCE_DIR=./backend/pdfs
CHUNK_SIZE=800
CHUNK_OVERLAP=150
BATCH_SIZE=64
```

### Important Configuration Notes

1. **API_KEY and GROQ_API_KEY**: Both should be set to your Groq API key
2. **SERPER_API_KEY**: Required only if you want web search fallback functionality
3. **CHUNK_SIZE**: Optimal for most documents (800 tokens)
4. **BATCH_SIZE**: Increase for faster ingestion on powerful machines

---

## Running the Application

### Quick Start (All Services)

#### Terminal 1: Backend API
```bash
source .venv/bin/activate  # Activate virtual environment
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`

#### Terminal 2: Frontend Development Server
```bash
cd frontend
npm start
```

Frontend will be available at: `http://localhost:3000`

### Production Build

#### Backend (Production)
```bash
source .venv/bin/activate
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### Frontend (Production)
```bash
cd frontend
npm run build
# Serve the build folder with your preferred static server
npx serve -s build -p 3000
```

### Verify Installation

1. **Backend Health Check**:
   ```bash
   curl http://localhost:8000/health
   ```
   Expected output: `{"status":"healthy","version":"1.0.0"}`

2. **Qdrant Status**:
   ```bash
   curl http://localhost:6333/health
   ```

3. **MongoDB Status**:
   ```bash
   docker logs Siemens_MongoDB
   ```

4. **Frontend**: Open browser to `http://localhost:3000`

---

## Document Ingestion

### Add Documents to Knowledge Base

#### 1. Place PDF Files
```bash
mkdir -p backend/pdfs
# Copy your PDF files to backend/pdfs/
cp /path/to/your/documents/*.pdf backend/pdfs/
```

#### 2. Run Ingestion Script
```bash
source .venv/bin/activate
python backend/ingest_pdfs_qdrant.py
```

#### Sample Output:
```
PDF Document Ingestion Pipeline
==================================================
✅ Source directory exists: ./backend/pdfs
✅ Found 3 PDF files
==================================================
Processing: document1.pdf
  → 45 pages, 234 chunks created
  → Embedded and uploaded to Qdrant
Processing: document2.pdf
  → 78 pages, 412 chunks created
  → Embedded and uploaded to Qdrant
==================================================
✅ Successfully ingested 3 documents (646 total chunks)
Collection: pdf_docs
```

#### 3. Verify Ingestion
```bash
# Check collection info
curl http://localhost:6333/collections/pdf_docs
```

### Ingestion Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `CHUNK_SIZE` | 800 | Token size per chunk |
| `CHUNK_OVERLAP` | 150 | Overlap between chunks |
| `BATCH_SIZE` | 64 | Embeddings per batch |
| `SOURCE_DIR` | `./backend/pdfs` | PDF source directory |

---

## Testing

### Run Complete Test Suite

```bash
source .venv/bin/activate
python tests/test_system.py
```

### Test Suite Components

1. **System Health Check**: Verifies backend API availability
2. **Knowledge Base Tests**: Tests RAG accuracy with 30 predefined questions
3. **Performance Tests**: Measures response latency and throughput
4. **Web Fallback Tests**: Validates web search integration

### Sample Test Output:
```
================================================================================
UNIFIED SYSTEM TESTING SUITE
================================================================================

📊 OVERALL RESULTS
  Grade: B
  Success Rate: 80.0%
  Total Tests: 30
  Passed: 24
  Failed: 6
  Duration: 354.5s

📚 KNOWLEDGE BASE TESTS
  Success Rate: 80.0% (24/30)
  Avg Keyword Coverage: 64.3%
  Avg Confidence: 91.8%
  Avg Response Time: 9.63s

⚡ PERFORMANCE METRICS
  Avg Latency: 10.98s
  Min Latency: 10.35s
  Max Latency: 11.78s
```

### Custom Test Output
```bash
python tests/test_system.py --output results/my_test_report.json
```

### Test Datasets
Located in `tests/test_datasets/`:
- `kb_questions_comprehensive.json`: 30 curated questions covering transformer architecture and hardware security

---

## API Documentation

### Interactive API Docs

Once the backend is running, access:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/api/v1/openapi.json`

### Key Endpoints

#### Chat Endpoints

**POST** `/api/v1/chat/query`
```json
{
  "question": "What is the Transformer architecture?",
  "session_id": "user-123"
}
```

Response:
```json
{
  "answer": "The Transformer is a neural network architecture...",
  "sources": [
    {
      "content": "...",
      "metadata": {"page": 1, "source": "transformer_paper.pdf"}
    }
  ],
  "confidence": 0.95
}
```

**GET** `/api/v1/chat/history/{session_id}`
- Retrieve chat history for a session

#### Document Endpoints

**POST** `/api/v1/documents/ingest`
- Upload and ingest documents via API

**GET** `/api/v1/documents/list`
- List all ingested documents

---

## Project Structure

```
Siemens_Demo/
├── backend/                    # FastAPI backend
│   ├── agents/                 # LangGraph agent orchestration
│   │   ├── nodes.py           # Agent node definitions
│   │   ├── orchestrator.py    # Main agent graph
│   │   └── web_agent.py       # Web search agent
│   ├── api/                   # API routes
│   │   ├── router.py          # Main router
│   │   └── endpoints/         # Endpoint modules
│   │       ├── chat.py        # Chat endpoints
│   │       └── documents.py   # Document endpoints
│   ├── core/                  # Core configuration
│   │   └── config.py          # Settings management
│   ├── db/                    # Database connections
│   │   ├── mongo.py           # MongoDB client
│   │   └── qdrant.py          # Qdrant client
│   ├── schemas/               # Pydantic models
│   │   ├── chat.py            # Chat schemas
│   │   └── document.py        # Document schemas
│   ├── services/              # Business logic
│   │   ├── document_ingestion.py
│   │   ├── llm.py             # LLM configuration
│   │   ├── rag_chain.py       # RAG pipeline
│   │   └── system_prompt.py   # System prompts
│   ├── pdfs/                  # PDF storage (user-added)
│   ├── main.py                # FastAPI app entry
│   └── ingest_pdfs_qdrant.py  # Ingestion script
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── ChatMessage.tsx
│   │   │   └── DocumentUpload.tsx
│   │   ├── pages/             # Page components
│   │   │   └── Index.tsx      # Main chat page
│   │   ├── config/            # Frontend config
│   │   │   └── api.ts         # API configuration
│   │   ├── App.tsx            # Root component
│   │   └── index.tsx          # Entry point
│   ├── public/                # Static assets
│   └── package.json           # Dependencies
├── tests/                     # Test suite
│   ├── test_system.py         # Main test runner
│   └── test_datasets/         # Test data
│       └── kb_questions_comprehensive.json
├── presentation_results/      # Test results
├── docker-compose.yaml        # Infrastructure services
├── requirements.txt           # Python dependencies
├── .env                       # Environment variables
└── README.md                  # This file
```

---

## Future Improvements

#### 1. **Enhanced RAG Capabilities**
- **Hybrid Search**: Combine semantic and keyword-based search (BM25 + vector)
- **Reranking**: Add cross-encoder reranking for better relevance
- **Query Rewritter/Intent Clarifier**: Implement query reformulation and expansion techniques

#### 2. **Advanced Agent Features**
- **Memory Management**: Long-term and short-term memory for agents
- **Tool Use**: Dynamic tool selection and execution
- **Multi-Agent Collaboration**: Cooperative agents for complex tasks
- **Agent Fine-tuning**: Specialized agents for different domains
- **Feedback Loop**: Learn from user feedback and corrections

#### 3. **Model & Embedding Improvements**
- **Fine-tuned Embeddings**: Domain-specific embedding models
- **Prompt Engineering**: Automated prompt optimization and testing

#### 4. **Advanced Search Features**
- **Faceted Search**: Filter by document type, date, author, tags
- **Temporal Queries/Date Agent**: "What changed since last month?"
- **Semantic Clustering**: Group similar documents automatically
- **Graph-based Search**: Entity relationship graphs for knowledge exploration
