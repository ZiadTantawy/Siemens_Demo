# 🚀 How to Run and Test the RAG System

## Complete Step-by-Step Guide

---

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ Python 3.10+ installed
- ✅ Docker Desktop installed and running
- ✅ Git installed (if cloning from repository)

---

## 🎯 Step 1: Environment Setup

### 1.1 Create and Configure Environment File

Create a `.env` file in the project root:

```powershell
# Navigate to project directory
cd "d:\KR\GUC\Siemens Grad Project\Siemens_Demo"

# Create .env file
@"
# API Configuration
API_KEY=your_openai_or_groq_api_key_here
CHAT_MODEL=gpt-3.5-turbo
EMBED_MODEL=text-embedding-ada-002

# Qdrant Configuration
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_COLLECTION=pdf_docs

# MongoDB Configuration
MONGODB_HOST=localhost
MONGODB_PORT=27020
MONGODB_DATABASE=internal_chatbot
"@ | Out-File -FilePath .env -Encoding utf8
```

**Important:** Replace `your_openai_or_groq_api_key_here` with your actual API key!

### 1.2 Install Python Dependencies

```powershell
# Install all required packages
pip install -r requirements.txt

# Verify installation
python -c "import langchain, qdrant_client, pymongo; print('✅ Dependencies installed!')"
```

---

## 🐳 Step 2: Start Infrastructure (MongoDB & Qdrant)

### 2.1 Start Docker Services

```powershell
# Start MongoDB and Qdrant in detached mode
docker-compose up -d

# Wait a few seconds for services to initialize
Start-Sleep -Seconds 10
```

### 2.2 Verify Services are Running

```powershell
# Check running containers
docker ps

# You should see:
# - MongoDB on port 27020
# - Qdrant on port 6333
```

### 2.3 Test Connections

```powershell
# Test Qdrant connection
Invoke-WebRequest -Uri http://localhost:6333/health

# Test MongoDB connection
python -c "from pymongo import MongoClient; c = MongoClient('mongodb://localhost:27020/'); c.server_info(); print('✅ MongoDB connected!')"
```

---

## 📚 Step 3: Ingest Documents into Vector Database

### 3.1 Add Your PDF Documents

Place your PDF files in the `backend/pdfs/` directory:

```powershell
# Example: Copy PDFs to the pdfs folder
Copy-Item "C:\path\to\your\documents\*.pdf" -Destination "backend\pdfs\"

# List PDFs in the folder
Get-ChildItem backend\pdfs\*.pdf
```

### 3.2 Run Ingestion Script

```powershell
# Ingest PDFs into Qdrant
python backend/ingest_pdfs_qdrant.py

# This will:
# - Read all PDFs from backend/pdfs/
# - Split documents into chunks
# - Generate embeddings
# - Store in Qdrant vector database
```

### 3.3 Verify Documents Were Ingested

```powershell
# Check collection status
python -c "from backend.db.qdrant import qdrant_client, COLLECTION_NAME; info = qdrant_client.get_collection(COLLECTION_NAME); print(f'✅ Collection: {COLLECTION_NAME}'); print(f'   Documents: {info.points_count}')"
```

---

## 🧪 Step 4: Quick System Validation

### 4.1 Run Quick Test

```powershell
# Validate everything is set up correctly
python tests/quick_test.py

# Expected output:
# ✅ Test modules imported
# ✅ Test configuration valid
# ✅ Metrics functions work
# ✅ Qdrant connected
# ✅ MongoDB connected
```

### 4.2 Run Basic System Test

```powershell
# Test infrastructure and basic functionality
python test_system.py

# This checks:
# - MongoDB connection
# - Qdrant connection
# - Environment variables
# - LLM initialization
# - Embedding generation
```

---

## 🎮 Step 5: Run the RAG System

You have **3 ways** to run and test the RAG system:

### **Option A: Direct RAG Chain Test (Fastest)**

Test the RAG chain directly without API:

```powershell
# Test complete RAG functionality
python test_complete_rag.py

# This will:
# - Create a RAG chain
# - Ask sample questions
# - Display responses
```

**Sample Output:**
```
======================================================================
Question 1: What is the Transformer architecture?
======================================================================

The Transformer is a neural network architecture introduced in the paper
"Attention is All You Need" that relies entirely on self-attention mechanisms...
```

### **Option B: Run API Server (Production-like)**

Start the FastAPI server:

```powershell
# Start the API server
python backend/main.py

# Or with uvicorn directly:
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

**Server will be available at:**
- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

**In a NEW PowerShell terminal**, test the API:

```powershell
# Test the API endpoints
python test_api.py

# This will test:
# - Health check endpoint
# - Root endpoint
# - Chat endpoint
# - Technical questions
```

### **Option C: Test via HTTP Client**

With the server running, you can also test using curl or Invoke-WebRequest:

```powershell
# Health check
Invoke-WebRequest -Uri http://localhost:8000/health | Select-Object -ExpandProperty Content

# Send a chat message
$body = @{
    text = "What is the Transformer architecture?"
    user_id = "test_user_123"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:8000/api/v1/chat/send_message `
    -Method POST `
    -Body $body `
    -ContentType "application/json" | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

---

## 🧪 Step 6: Run Comprehensive Tests

### 6.1 Run All Tests

```powershell
# Run complete test suite
python tests/run_comprehensive_tests.py

# This generates:
# - test_reports/comprehensive_report.json
# - test_reports/accuracy_report.json
# - test_reports/web_fallback_report.json
# - test_reports/performance_report.json
```

### 6.2 Run Specific Test Types

```powershell
# Accuracy tests only
python tests/run_comprehensive_tests.py --test-type accuracy

# Web fallback tests
python tests/run_comprehensive_tests.py --test-type web-fallback

# Performance tests
python tests/run_comprehensive_tests.py --test-type performance
```

### 6.3 Run Individual Test Modules

```powershell
# Test retrieval accuracy
python tests/test_accuracy.py

# Test web fallback
python tests/test_web_fallback.py

# Test performance
python tests/test_performance.py
```

### 6.4 View Test Results

```powershell
# List generated reports
Get-ChildItem test_reports\*.json

# View comprehensive report
code test_reports\comprehensive_report.json

# Or in PowerShell:
Get-Content test_reports\comprehensive_report.json | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

---

## 📊 Step 7: Generate Visualizations (Optional)

```powershell
# Install visualization dependencies (if not already installed)
pip install matplotlib seaborn

# Generate charts
python tests/visualize_results.py --reports-dir test_reports

# View generated images
start test_reports\accuracy_visualization.png
start test_reports\performance_visualization.png
```

---

## 🎯 Step 8: Interactive Testing

### Test with Custom Questions

Create a simple test script:

```powershell
# Create test_custom.py
@"
from backend.services.rag_chain import create_rag_chain

# Create RAG chain
session_id = 'my_test_session'
rag_chain = create_rag_chain(session_id)

# Ask questions
questions = [
    'What is attention mechanism?',
    'Explain transformers',
    'What are the main components?'
]

for q in questions:
    print(f'\nQ: {q}')
    print(f'A: {rag_chain.invoke(q)}\n')
    print('-' * 80)
"@ | Out-File -FilePath test_custom.py -Encoding utf8

# Run custom test
python test_custom.py
```

---

## 📈 Understanding Test Results

### Success Criteria

Your system is working well if:

✅ **Accuracy Tests:**
- Retrieval success rate > 90%
- Response success rate > 85%
- Hallucination rate < 10%
- Average relevance score > 70%

✅ **Performance Tests:**
- Mean response time < 5 seconds
- Throughput > 2 requests/second
- Sustained load success > 95%

✅ **Web Fallback Tests:**
- Web search success rate > 80%
- Attribution rate > 90%
- Decision accuracy > 75%

### Example Good Results

```json
{
  "summary": {
    "overall_accuracy": {
      "retrieval_success_rate": 0.95,
      "response_success_rate": 0.92,
      "hallucination_rate": 0.05
    },
    "overall_performance": {
      "mean_response_time": 2.3,
      "throughput": 4.2,
      "sustained_load_success_rate": 0.98
    }
  }
}
```

---

## 🔧 Troubleshooting

### Problem: "Connection refused" errors

```powershell
# Restart Docker services
docker-compose down
docker-compose up -d
Start-Sleep -Seconds 10
```

### Problem: "Collection not found"

```powershell
# Re-run ingestion
python backend/ingest_pdfs_qdrant.py
```

### Problem: "API key not set"

```powershell
# Check .env file exists
Test-Path .env

# View .env (without exposing key)
Get-Content .env | Select-String "API_KEY"
```

### Problem: Empty responses

```powershell
# Test retrieval
python test_rag_retrieval.py

# Check if documents are in Qdrant
python -c "from backend.db.qdrant import qdrant_client, COLLECTION_NAME; print(qdrant_client.get_collection(COLLECTION_NAME).points_count)"
```

---

## 🎓 Complete Testing Workflow

Here's the recommended testing workflow:

```powershell
# 1. Start fresh
docker-compose down
docker-compose up -d
Start-Sleep -Seconds 10

# 2. Ingest documents
python backend/ingest_pdfs_qdrant.py

# 3. Quick validation
python tests/quick_test.py

# 4. Test RAG directly
python test_complete_rag.py

# 5. Start API server (in separate terminal)
python backend/main.py

# 6. Test API (in another terminal)
python test_api.py

# 7. Run comprehensive tests
python tests/run_comprehensive_tests.py

# 8. Generate visualizations
python tests/visualize_results.py

# 9. Review results
code test_reports\comprehensive_report.json
start test_reports\accuracy_visualization.png
```

---

## 📚 Additional Resources

- **Testing Documentation:** `tests/README.md`
- **Quick Start Guide:** `QUICK_START_TESTING.md`
- **Implementation Details:** `TESTING_IMPLEMENTATION_SUMMARY.md`
- **API Documentation:** http://localhost:8000/docs (when server is running)

---

## 🎉 Success Checklist

- [ ] Environment variables configured (.env file)
- [ ] Dependencies installed (pip install -r requirements.txt)
- [ ] Docker services running (docker-compose up -d)
- [ ] Documents ingested (python backend/ingest_pdfs_qdrant.py)
- [ ] Quick test passed (python tests/quick_test.py)
- [ ] RAG chain works (python test_complete_rag.py)
- [ ] API server running (python backend/main.py)
- [ ] API tests pass (python test_api.py)
- [ ] Comprehensive tests completed (python tests/run_comprehensive_tests.py)
- [ ] Test reports generated (check test_reports/ folder)

---

## 💡 Pro Tips

1. **Keep Docker running:** The system needs MongoDB and Qdrant to work
2. **Monitor logs:** Check terminal output for errors
3. **Test incrementally:** Start with quick_test.py, then move to comprehensive tests
4. **Review reports:** Check test_reports/ after each test run
5. **Compare over time:** Save reports to track improvements

---

## 🆘 Need Help?

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review `tests/README.md` for detailed testing info
3. Examine error messages carefully
4. Verify all prerequisites are met
5. Check Docker container logs: `docker-compose logs`

---

**You're ready to go! Start with Step 1 and work through each step.** 🚀
