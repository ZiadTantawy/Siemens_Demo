#!/usr/bin/env python3
"""
Simple test script for the Siemens RAG Chatbot.
Tests basic functionality without running the full API server.
"""
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

print("=" * 80)
print("SIEMENS RAG CHATBOT - QUICK TEST")
print("=" * 80)

# Test 1: Check infrastructure
print("\n[1] Testing Infrastructure Connections...")
print("-" * 80)

try:
    from backend.db.mongo import get_mongo_client
    client = get_mongo_client()
    print("✅ MongoDB: Connected successfully")
    client.close()
except Exception as e:
    print(f"❌ MongoDB: Failed - {e}")

try:
    from qdrant_client import QdrantClient
    qdrant = QdrantClient(host="localhost", port=6333)
    collections = qdrant.get_collections()
    print(f"✅ Qdrant: Connected successfully ({len(collections.collections)} collections)")
except Exception as e:
    print(f"❌ Qdrant: Failed - {e}")

# Test 2: Check environment variables
print("\n[2] Testing Environment Configuration...")
print("-" * 80)

import os
from dotenv import load_dotenv

load_dotenv()

required_vars = ["API_KEY", "CHAT_MODEL", "EMBED_MODEL"]
for var in required_vars:
    value = os.getenv(var)
    if value:
        # Mask API key for security
        display_value = f"{value[:10]}..." if var == "API_KEY" else value
        print(f"✅ {var}: {display_value}")
    else:
        print(f"⚠️  {var}: Not set")

# Test 3: Test LLM initialization
print("\n[3] Testing LLM Initialization...")
print("-" * 80)

try:
    from backend.services.llm import llm, embedding_model, CHAT_MODEL, EMBED_MODEL
    print(f"✅ LLM Model: {CHAT_MODEL}")
    print(f"✅ Embedding Model: {EMBED_MODEL}")
    print("✅ LLM initialized successfully")
except Exception as e:
    print(f"❌ LLM initialization failed: {e}")
    print(f"   Error type: {type(e).__name__}")

# Test 4: Test embedding generation
print("\n[4] Testing Embedding Generation...")
print("-" * 80)

try:
    from backend.services.llm import embedding_model
    test_text = "This is a test sentence for embedding generation."
    embeddings = embedding_model.embed_query(test_text)
    print(f"✅ Generated embedding vector of dimension: {len(embeddings)}")
    print(f"   Sample values: [{embeddings[0]:.4f}, {embeddings[1]:.4f}, ...]")
except Exception as e:
    print(f"❌ Embedding generation failed: {e}")

# Test 5: Check Qdrant collection
print("\n[5] Checking Qdrant Collections...")
print("-" * 80)

try:
    from qdrant_client import QdrantClient
    qdrant = QdrantClient(host="localhost", port=6333)
    collections = qdrant.get_collections()
    
    if collections.collections:
        for col in collections.collections:
            info = qdrant.get_collection(col.name)
            print(f"✅ Collection: {col.name}")
            print(f"   Points count: {info.points_count}")
            print(f"   Vector size: {info.config.params.vectors.size}")
    else:
        print("⚠️  No collections found. Run ingestion script to add documents:")
        print("   python backend/ingest_pdfs_qdrant.py")
except Exception as e:
    print(f"❌ Failed to check collections: {e}")

# Test 6: Test simple RAG query (if collection exists)
print("\n[6] Testing RAG Chain...")
print("-" * 80)

try:
    from qdrant_client import QdrantClient
    qdrant = QdrantClient(host="localhost", port=6333)
    collections = qdrant.get_collections()
    
    if collections.collections:
        from backend.services.rag_chain import create_rag_chain
        
        test_question = "Hello, what can you help me with?"
        print(f"Question: {test_question}")
        
        rag_chain = create_rag_chain("test_session")
        response = rag_chain.invoke(test_question)
        
        print(f"✅ Response: {response[:200]}...")
    else:
        print("⚠️  Skipping RAG test - no documents in vector store")
        print("   Add documents first: python backend/ingest_pdfs_qdrant.py")
except Exception as e:
    print(f"❌ RAG chain test failed: {e}")
    import traceback
    traceback.print_exc()

# Summary
print("\n" + "=" * 80)
print("TEST SUMMARY")
print("=" * 80)
print("\n✅ If all tests passed, your system is ready!")
print("❌ If any tests failed, check the error messages above")
print("\nNext steps:")
print("1. If Qdrant has no collections, run: python backend/ingest_pdfs_qdrant.py")
print("2. Start the API server: python backend/main.py")
print("3. Test the API: curl http://localhost:8000/health")
print("=" * 80)
