#!/usr/bin/env python3
"""
Quick Test Script - Fast validation of testing framework
=========================================================
Run this to quickly validate that the testing framework is set up correctly.
"""
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

print("="*80)
print("QUICK TEST - TESTING FRAMEWORK VALIDATION")
print("="*80)

# Test 1: Check imports
print("\n[1] Checking test module imports...")
try:
    from tests.test_config import ALL_TEST_CASES, QueryType
    from tests.metrics import calculate_keyword_coverage, evaluate_response_quality
    print(f"✅ Test modules imported successfully")
    print(f"   - Total test cases available: {len(ALL_TEST_CASES)}")
except Exception as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

# Test 2: Check test configuration
print("\n[2] Validating test configuration...")
try:
    from tests.test_config import (
        INTERNAL_RAG_TEST_CASES,
        EXTERNAL_WEB_TEST_CASES,
        AMBIGUOUS_TEST_CASES,
        EDGE_CASE_TEST_CASES
    )
    print(f"✅ Test configuration valid")
    print(f"   - Internal RAG tests: {len(INTERNAL_RAG_TEST_CASES)}")
    print(f"   - External web tests: {len(EXTERNAL_WEB_TEST_CASES)}")
    print(f"   - Ambiguous tests: {len(AMBIGUOUS_TEST_CASES)}")
    print(f"   - Edge case tests: {len(EDGE_CASE_TEST_CASES)}")
except Exception as e:
    print(f"❌ Configuration error: {e}")
    sys.exit(1)

# Test 3: Test metrics functions
print("\n[3] Testing metrics functions...")
try:
    # Test keyword coverage
    sample_text = "The transformer architecture uses attention mechanisms"
    keywords = ["transformer", "attention"]
    coverage = calculate_keyword_coverage(sample_text, keywords)
    print(f"✅ Keyword coverage metric works: {coverage:.2%}")
    
    # Test response quality
    quality = evaluate_response_quality(sample_text)
    print(f"✅ Response quality metric works: {quality['quality_score']:.2f}")
except Exception as e:
    print(f"❌ Metrics error: {e}")
    sys.exit(1)

# Test 4: Check backend connectivity
print("\n[4] Checking backend connectivity...")
try:
    from backend.db.qdrant import qdrant_client, COLLECTION_NAME
    from backend.db.mongo import get_mongo_client
    
    # Test Qdrant
    try:
        collections = qdrant_client.get_collections()
        print(f"✅ Qdrant connected: {len(collections.collections)} collections")
    except Exception as e:
        print(f"⚠️  Qdrant connection issue: {e}")
    
    # Test MongoDB
    try:
        mongo_client = get_mongo_client()
        mongo_client.server_info()
        print(f"✅ MongoDB connected")
        mongo_client.close()
    except Exception as e:
        print(f"⚠️  MongoDB connection issue: {e}")
        
except Exception as e:
    print(f"⚠️  Backend import error: {e}")

# Test 5: Sample test execution
print("\n[5] Running sample test...")
try:
    from tests.test_config import INTERNAL_RAG_TEST_CASES
    
    if INTERNAL_RAG_TEST_CASES:
        test_case = INTERNAL_RAG_TEST_CASES[0]
        print(f"✅ Sample test case loaded:")
        print(f"   Query: {test_case.query}")
        print(f"   Type: {test_case.query_type.value}")
        print(f"   Expected keywords: {', '.join(test_case.expected_keywords)}")
except Exception as e:
    print(f"❌ Test execution error: {e}")

# Summary
print("\n" + "="*80)
print("VALIDATION COMPLETE")
print("="*80)
print("\n✅ Testing framework is ready!")
print("\nNext steps:")
print("  1. Ensure infrastructure is running (MongoDB, Qdrant)")
print("  2. Ingest documents: python backend/ingest_pdfs_qdrant.py")
print("  3. Run comprehensive tests: python tests/run_comprehensive_tests.py")
print("\nFor specific tests:")
print("  - Accuracy: python tests/test_accuracy.py")
print("  - Web Fallback: python tests/test_web_fallback.py")
print("  - Performance: python tests/test_performance.py")
print("="*80)
