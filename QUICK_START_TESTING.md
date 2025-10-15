# Testing Framework - Quick Start Guide

## 🚀 Getting Started

### Step 1: Setup
```powershell
# Install dependencies
pip install -r requirements.txt

# Verify setup
python setup_tests.py
```

### Step 2: Start Infrastructure
```powershell
# Start MongoDB and Qdrant
docker-compose up -d

# Verify services are running
docker ps
```

### Step 3: Ingest Documents
```powershell
# Ingest PDFs into Qdrant
python backend/ingest_pdfs_qdrant.py
```

### Step 4: Run Tests
```powershell
# Quick validation
python tests/quick_test.py

# Run all tests
python tests/run_comprehensive_tests.py

# View results
ls test_reports/
```

## 📋 Common Commands

### Run Specific Test Types
```powershell
# Accuracy tests only
python tests/run_comprehensive_tests.py --test-type accuracy

# Web fallback tests
python tests/run_comprehensive_tests.py --test-type web-fallback

# Performance tests
python tests/run_comprehensive_tests.py --test-type performance
```

### Run Individual Test Modules
```powershell
python tests/test_accuracy.py
python tests/test_web_fallback.py
python tests/test_performance.py
```

### Generate Visualizations
```powershell
# Install matplotlib (if not already installed)
pip install matplotlib seaborn

# Generate charts
python tests/visualize_results.py --reports-dir test_reports
```

## 📊 Understanding Results

### Report Files

After running tests, check `test_reports/`:

1. **comprehensive_report.json** - Overall summary
2. **accuracy_report.json** - Detailed accuracy metrics
3. **web_fallback_report.json** - Web fallback metrics
4. **performance_report.json** - Performance metrics

### Key Metrics to Monitor

**Accuracy:**
- Retrieval success rate (target: >90%)
- Response success rate (target: >85%)
- Hallucination rate (target: <10%)

**Performance:**
- Mean response time (target: <5s)
- Throughput (target: >2 req/s)
- Sustained success rate (target: >95%)

### Example Output

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

## 🛠️ Customization

### Add Custom Test Cases

Edit `tests/test_config.py`:

```python
from tests.test_config import TestCase, QueryType

# Add to INTERNAL_RAG_TEST_CASES
INTERNAL_RAG_TEST_CASES.append(
    TestCase(
        query="What is your custom question?",
        query_type=QueryType.INTERNAL_FACTUAL,
        expected_source="internal",
        expected_keywords=["keyword1", "keyword2"],
        evaluation_criteria={
            "must_retrieve_docs": True,
            "min_relevance_score": 0.7,
            "max_response_time": 5.0
        },
        category="custom"
    )
)
```

### Adjust Test Parameters

```python
# In test files, modify parameters:

# Number of iterations
tester.test_response_time(num_iterations=20)

# Concurrent requests
tester.test_concurrent_requests(num_concurrent=10)

# Sustained load duration
tester.test_sustained_load(duration_seconds=120, requests_per_second=5)
```

## 🔍 Troubleshooting

### Problem: "Connection refused" errors

**Solution:**
```powershell
# Check if services are running
docker ps

# Restart services if needed
docker-compose down
docker-compose up -d

# Wait a few seconds for services to start
Start-Sleep -Seconds 10
```

### Problem: No documents retrieved

**Solution:**
```powershell
# Re-ingest documents
python backend/ingest_pdfs_qdrant.py

# Verify collection exists
python -c "from backend.db.qdrant import qdrant_client; print(qdrant_client.get_collections())"
```

### Problem: Import errors

**Solution:**
```powershell
# Reinstall dependencies
pip install -r requirements.txt --upgrade

# Verify Python path
python -c "import sys; print('\n'.join(sys.path))"
```

## 📈 Continuous Testing

### Daily Testing
Set up Windows Task Scheduler:
```powershell
# Create a batch file: run_daily_tests.bat
@echo off
cd "d:\KR\GUC\Siemens Grad Project\Siemens_Demo"
python tests/run_comprehensive_tests.py
```

### Monitor Trends
```powershell
# Compare reports over time
dir test_reports\*.json | Sort-Object LastWriteTime

# Archive old reports
mkdir test_reports\archive
Move-Item test_reports\*.json test_reports\archive\
```

## 🎯 Best Practices

1. **Run tests before committing code**
   ```powershell
   python tests/quick_test.py
   git add .
   git commit -m "Your commit message"
   ```

2. **Monitor metrics after changes**
   ```powershell
   # Before changes
   python tests/run_comprehensive_tests.py
   Copy-Item test_reports\comprehensive_report.json before_changes.json
   
   # Make changes, then test again
   python tests/run_comprehensive_tests.py
   
   # Compare results
   code before_changes.json test_reports\comprehensive_report.json
   ```

3. **Review detailed results**
   ```powershell
   # Open report in VS Code
   code test_reports\comprehensive_report.json
   
   # Or view in browser
   python -m json.tool test_reports\comprehensive_report.json > formatted_report.txt
   code formatted_report.txt
   ```

## 📚 Additional Resources

- Full documentation: `tests/README.md`
- Implementation details: `TESTING_IMPLEMENTATION_SUMMARY.md`
- Metric definitions: `tests/metrics.py`
- Test configurations: `tests/test_config.py`

## 💡 Tips

- Use `--output-dir` to organize test runs by date:
  ```powershell
  $date = Get-Date -Format "yyyy-MM-dd"
  python tests/run_comprehensive_tests.py --output-dir "test_reports\$date"
  ```

- Run quick smoke tests frequently:
  ```powershell
  python tests/quick_test.py
  ```

- Generate visualizations for presentations:
  ```powershell
  python tests/visualize_results.py
  # Opens: test_reports\*.png
  ```

## 🎉 Success!

You're now ready to comprehensively test your RAG system!

For questions or issues, refer to:
- `tests/README.md` - Detailed documentation
- `TESTING_IMPLEMENTATION_SUMMARY.md` - Implementation overview
