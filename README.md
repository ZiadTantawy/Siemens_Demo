# Internal RAG Chatbot

A comprehensive Retrieval-Augmented Generation (RAG) chatbot system with internal document retrieval and web search fallback capabilities.

## Features

- 🔍 **Internal RAG**: Retrieves information from ingested PDF documents
- 🌐 **Web Fallback**: Falls back to web search for queries not covered in internal documents
- 💬 **Conversational Memory**: Maintains conversation history using MongoDB
- 📊 **Vector Search**: Uses Qdrant for efficient similarity search
- 🧪 **Comprehensive Testing**: Full test suite for accuracy, performance, and reliability

## Testing Framework

This project includes a comprehensive testing methodology to evaluate system accuracy in both internal RAG and web-fallback scenarios.

### Quick Test Validation

```bash
python tests/quick_test.py
```

### Run All Tests

```bash
python tests/run_comprehensive_tests.py
```

### Run Specific Tests

```bash
# Accuracy tests only
python tests/run_comprehensive_tests.py --test-type accuracy

# Web fallback tests only
python tests/run_comprehensive_tests.py --test-type web-fallback

# Performance tests only
python tests/run_comprehensive_tests.py --test-type performance
```

### Test Categories

1. **Accuracy Testing** (`tests/test_accuracy.py`)
   - Retrieval accuracy and relevance
   - Response accuracy and quality
   - Hallucination detection
   - Keyword coverage metrics

2. **Web Fallback Testing** (`tests/test_web_fallback.py`)
   - Web search functionality
   - Source attribution
   - Fallback decision accuracy
   - Response quality evaluation

3. **Performance Testing** (`tests/test_performance.py`)
   - Response time analysis
   - Concurrent load testing
   - Sustained load testing
   - Throughput measurements

For detailed testing documentation, see [tests/README.md](tests/README.md).

## Setup

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start Infrastructure**
   ```bash
   docker-compose up -d
   ```

3. **Ingest Documents**
   ```bash
   python backend/ingest_pdfs_qdrant.py
   ```

4. **Run Tests**
   ```bash
   python tests/quick_test.py
   python tests/run_comprehensive_tests.py
   ```

5. **Start API Server**
   ```bash
   python backend/main.py
   ```

## Project Structure

```
Siemens_Demo/
├── backend/
│   ├── agents/              # Web search agents
│   ├── api/                 # FastAPI endpoints
│   ├── core/                # Configuration
│   ├── db/                  # Database connections
│   ├── schemas/             # Pydantic models
│   └── services/            # Core services (RAG, LLM)
├── tests/                   # Comprehensive testing suite
│   ├── test_accuracy.py     # Accuracy testing
│   ├── test_web_fallback.py # Web fallback testing
│   ├── test_performance.py  # Performance testing
│   ├── test_config.py       # Test configuration
│   ├── metrics.py           # Evaluation metrics
│   └── README.md            # Testing documentation
├── docker-compose.yaml
├── requirements.txt
└── README.md
```

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `POST /api/v1/chat/send_message` - Send chat message
- `GET /api/v1/documents/` - List documents

## Testing Reports

After running tests, reports are generated in `test_reports/`:

- `comprehensive_report.json` - Overall test summary
- `accuracy_report.json` - Detailed accuracy metrics
- `web_fallback_report.json` - Web fallback metrics
- `performance_report.json` - Performance metrics

## Success Criteria

### Accuracy
- ✅ Retrieval success rate > 90%
- ✅ Response success rate > 85%
- ✅ Hallucination rate < 10%

### Performance
- ✅ Mean response time < 5 seconds
- ✅ Throughput > 2 req/s
- ✅ Sustained load success > 95%

## Development

### Running the API
```bash
uvicorn backend.main:app --reload
```

### Running Tests
```bash
# Quick validation
python tests/quick_test.py

# Full test suite
python tests/run_comprehensive_tests.py

# Individual test modules
python tests/test_accuracy.py
python tests/test_web_fallback.py
python tests/test_performance.py
```

## Environment Variables

Create a `.env` file with:
```
API_KEY=your_api_key
CHAT_MODEL=your_chat_model
EMBED_MODEL=your_embedding_model
QDRANT_HOST=localhost
QDRANT_PORT=6333
MONGODB_HOST=localhost
MONGODB_PORT=27020
```

## License

[Your License Here]