# Comprehensive Testing Methodology

## Overview

This testing framework provides a comprehensive methodology to evaluate the Siemens RAG Chatbot system's accuracy in both internal RAG retrieval and web-fallback scenarios.

## Test Structure

```
tests/
├── __init__.py                    # Package initialization
├── test_config.py                 # Test cases and ground truth dataset
├── metrics.py                     # Evaluation metrics
├── test_accuracy.py               # RAG accuracy testing
├── test_web_fallback.py           # Web search fallback testing
├── test_performance.py            # Performance and stress testing
├── run_comprehensive_tests.py     # Main test runner
└── README.md                      # This file
```

## Test Categories

### 1. Accuracy Testing (`test_accuracy.py`)

Tests the accuracy of RAG retrieval and response generation.

**Metrics Evaluated:**
- **Retrieval Accuracy**: Measures how well the system retrieves relevant documents
  - Success rate
  - Relevance score (keyword coverage)
  - Above-threshold rate
  - Retrieval time

- **Response Accuracy**: Measures quality of generated responses
  - Success rate
  - Keyword coverage
  - Hallucination detection
  - Response time

**Test Cases:**
- Internal factual questions (from documents)
- Internal conceptual questions (complex understanding)
- Edge cases (empty queries, very long queries, etc.)

### 2. Web Fallback Testing (`test_web_fallback.py`)

Tests the web search fallback functionality when internal RAG doesn't have answers.

**Metrics Evaluated:**
- Web search success rate
- Keyword coverage in web results
- Source attribution rate
- Response quality score
- Fallback decision accuracy (routing between internal/external)

**Test Cases:**
- Current events queries (requires recent information)
- General knowledge queries (not in documents)
- Ambiguous queries (could be either internal or external)

### 3. Performance Testing (`test_performance.py`)

Tests system performance under various load conditions.

**Metrics Evaluated:**
- **Response Time**: Mean, median, std dev, min, max
- **Concurrent Load**: Throughput, success rate under concurrent requests
- **Sustained Load**: Performance over time, P95/P99 response times

**Test Scenarios:**
- Sequential requests (baseline)
- Concurrent requests (5+ simultaneous)
- Sustained load (requests over 60+ seconds)

## Running Tests

### Run All Tests

```bash
python tests/run_comprehensive_tests.py
```

This will run all test categories and generate comprehensive reports.

### Run Specific Test Categories

```bash
# Accuracy tests only
python tests/run_comprehensive_tests.py --test-type accuracy

# Web fallback tests only
python tests/run_comprehensive_tests.py --test-type web-fallback

# Performance tests only
python tests/run_comprehensive_tests.py --test-type performance
```

### Specify Output Directory

```bash
python tests/run_comprehensive_tests.py --output-dir my_test_results
```

### Run Individual Test Files

```bash
# Accuracy testing
python tests/test_accuracy.py

# Web fallback testing
python tests/test_web_fallback.py

# Performance testing
python tests/test_performance.py
```

## Test Configuration

### Ground Truth Dataset (`test_config.py`)

The `test_config.py` file contains predefined test cases with:
- Query text
- Query type (internal_factual, internal_conceptual, external_current, etc.)
- Expected source (internal, external, both)
- Expected keywords (for validation)
- Evaluation criteria (thresholds, timing requirements)
- Ground truth answers (for hallucination detection)

### Adding New Test Cases

To add new test cases, edit `tests/test_config.py`:

```python
from tests.test_config import TestCase, QueryType

new_test_case = TestCase(
    query="Your question here?",
    query_type=QueryType.INTERNAL_FACTUAL,
    expected_source="internal",
    expected_keywords=["keyword1", "keyword2"],
    evaluation_criteria={
        "must_retrieve_docs": True,
        "min_relevance_score": 0.7,
        "max_response_time": 5.0
    },
    ground_truth_answer="The correct answer...",
    category="your_category"
)

# Add to appropriate list
INTERNAL_RAG_TEST_CASES.append(new_test_case)
```

## Evaluation Metrics

### Keyword Coverage

Measures what percentage of expected keywords appear in the response.

```
coverage = (found_keywords / total_expected_keywords) * 100%
```

### Semantic Similarity

Compares generated response with ground truth using token overlap (can be enhanced with embeddings).

### Hallucination Detection

Detects potential hallucinations by comparing:
- Semantic similarity with ground truth
- Keyword coverage
- Inverse scoring: Higher score = more likely hallucination

### Source Attribution

Checks if response properly cites sources using patterns like:
- [Source]
- "according to"
- "based on"
- "from the document"

### Response Quality

Evaluates:
- Response length (not too short/long)
- Proper structure (punctuation, formatting)
- Content presence

## Test Reports

After running tests, reports are saved in JSON format:

### `comprehensive_report.json`
Complete overview of all tests with summary metrics.

### `accuracy_report.json`
Detailed retrieval and response accuracy metrics.

### `web_fallback_report.json`
Web search and fallback decision metrics.

### `performance_report.json`
Response time, throughput, and load testing results.

## Example Report Structure

```json
{
  "timestamp": "2025-10-15 14:30:00",
  "test_suite": "Siemens RAG Chatbot - Comprehensive Testing",
  "summary": {
    "accuracy_passed": true,
    "web_fallback_passed": true,
    "performance_passed": true,
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
  },
  "accuracy_tests": { ... },
  "web_fallback_tests": { ... },
  "performance_tests": { ... }
}
```

## Success Criteria

### Accuracy Tests
- ✅ Retrieval success rate > 90%
- ✅ Average relevance score > 70%
- ✅ Response success rate > 85%
- ✅ Hallucination rate < 10%

### Web Fallback Tests
- ✅ Web search success rate > 80%
- ✅ Source attribution rate > 90%
- ✅ Decision accuracy > 75%

### Performance Tests
- ✅ Mean response time < 5 seconds
- ✅ Concurrent throughput > 2 req/s
- ✅ Sustained load success rate > 95%

## Best Practices

1. **Run tests regularly**: After any system changes or updates
2. **Monitor trends**: Compare reports over time to detect regressions
3. **Update test cases**: Add new test cases as system evolves
4. **Adjust thresholds**: Tune evaluation criteria based on requirements
5. **Test edge cases**: Include unusual or adversarial inputs

## Troubleshooting

### Tests Failing to Connect

Ensure infrastructure is running:
```bash
# Check MongoDB
docker ps | grep mongo

# Check Qdrant
docker ps | grep qdrant

# Check if data is ingested
python backend/ingest_pdfs_qdrant.py
```

### Low Accuracy Scores

- Review retrieved documents in detailed results
- Check if documents are properly ingested
- Verify embedding model is working correctly
- Review system prompts

### Performance Issues

- Check database connection latency
- Monitor memory usage during tests
- Review concurrent connection limits
- Consider caching strategies

## Future Enhancements

- [ ] Integration with semantic similarity models (sentence-transformers)
- [ ] Automated regression testing in CI/CD pipeline
- [ ] A/B testing framework for prompt variations
- [ ] User feedback integration for real-world accuracy
- [ ] Visual dashboards for test results
- [ ] Automated alert system for test failures

## Contributing

To add new test categories:

1. Create new test file in `tests/` directory
2. Import necessary dependencies from `test_config.py` and `metrics.py`
3. Follow existing test structure patterns
4. Update `run_comprehensive_tests.py` to include new tests
5. Document new tests in this README

## Support

For questions or issues with the testing framework, please refer to the main project documentation or contact the development team.
