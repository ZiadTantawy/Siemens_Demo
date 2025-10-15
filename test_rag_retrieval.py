#!/usr/bin/env python3
"""
Test script to debug RAG chain retrieval issues.
Checks Qdrant collection, embeddings, and retrieval functionality.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Set up environment variables if not already set
os.environ.setdefault("QDRANT_HOST", "localhost")
os.environ.setdefault("QDRANT_PORT", "6333")
os.environ.setdefault("QDRANT_COLLECTION", "pdf_docs")

from backend.db.qdrant import qdrant_client, get_retriever, COLLECTION_NAME
from backend.services.llm import embedding_model

def test_qdrant_connection():
    """Test connection to Qdrant."""
    print("\n" + "="*70)
    print("1. TESTING QDRANT CONNECTION")
    print("="*70)
    try:
        collections = qdrant_client.get_collections()
        print(f"✅ Connected to Qdrant successfully")
        print(f"   Available collections: {[c.name for c in collections.collections]}")
        return True
    except Exception as e:
        print(f"❌ Failed to connect to Qdrant: {e}")
        return False

def test_collection_exists():
    """Check if the collection exists and has documents."""
    print("\n" + "="*70)
    print("2. CHECKING COLLECTION STATUS")
    print("="*70)
    try:
        collection_info = qdrant_client.get_collection(collection_name=COLLECTION_NAME)
        print(f"✅ Collection '{COLLECTION_NAME}' exists")
        print(f"   Points count: {collection_info.points_count}")
        print(f"   Vector size: {collection_info.config.params.vectors.size}")
        
        if collection_info.points_count == 0:
            print(f"\n⚠️  WARNING: Collection has 0 documents!")
            print(f"   You need to run: python backend/ingest_pdfs_qdrant.py")
            return False
        return True
    except Exception as e:
        print(f"❌ Collection '{COLLECTION_NAME}' does not exist or error: {e}")
        print(f"   Run: python backend/ingest_pdfs_qdrant.py to create it")
        return False

def test_embedding_model():
    """Test the embedding model."""
    print("\n" + "="*70)
    print("3. TESTING EMBEDDING MODEL")
    print("="*70)
    try:
        test_text = "This is a test document about Siemens technology."
        embedding = embedding_model.embed_query(test_text)
        print(f"✅ Embedding model works")
        print(f"   Model: {embedding_model.model_name}")
        print(f"   Embedding dimension: {len(embedding)}")
        return embedding
    except Exception as e:
        print(f"❌ Embedding model failed: {e}")
        return None

def test_retriever_search():
    """Test retriever with sample queries."""
    print("\n" + "="*70)
    print("4. TESTING RETRIEVER")
    print("="*70)
    
    test_queries = [
        "What is Siemens?",
        "industrial automation",
        "technology and innovation",
        "manufacturing solutions"
    ]
    
    try:
        retriever = get_retriever(k=3)
        print(f"✅ Retriever created successfully")
        
        for query in test_queries:
            print(f"\n   Query: '{query}'")
            docs = retriever.invoke(query)
            print(f"   Retrieved documents: {len(docs)}")
            
            if docs:
                for i, doc in enumerate(docs, 1):
                    content_preview = doc.page_content[:150].replace('\n', ' ')
                    print(f"      [{i}] {content_preview}...")
                    if hasattr(doc, 'metadata'):
                        print(f"          Metadata: {doc.metadata}")
            else:
                print(f"      ⚠️  No documents retrieved for this query")
        
        return len(docs) > 0 if docs else False
        
    except Exception as e:
        print(f"❌ Retriever test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_direct_qdrant_search():
    """Test direct Qdrant search to isolate issues."""
    print("\n" + "="*70)
    print("5. TESTING DIRECT QDRANT SEARCH")
    print("="*70)
    try:
        # Create a test query embedding
        test_query = "Siemens industrial automation"
        query_embedding = embedding_model.embed_query(test_query)
        
        # Direct search in Qdrant
        search_result = qdrant_client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_embedding,
            limit=3
        )
        
        print(f"✅ Direct Qdrant search successful")
        print(f"   Query: '{test_query}'")
        print(f"   Results found: {len(search_result)}")
        
        for i, hit in enumerate(search_result, 1):
            print(f"\n   [{i}] Score: {hit.score:.4f}")
            if hit.payload:
                # Show first 200 chars of content
                content = str(hit.payload.get('page_content', 'N/A'))[:200]
                print(f"       Content: {content}...")
                print(f"       Metadata: {hit.payload.get('metadata', {})}")
        
        return len(search_result) > 0
        
    except Exception as e:
        print(f"❌ Direct search failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def inspect_sample_documents():
    """Fetch and display sample documents from the collection."""
    print("\n" + "="*70)
    print("6. INSPECTING SAMPLE DOCUMENTS")
    print("="*70)
    try:
        # Scroll through first few points
        records, _ = qdrant_client.scroll(
            collection_name=COLLECTION_NAME,
            limit=3,
            with_payload=True,
            with_vectors=False
        )
        
        print(f"✅ Retrieved {len(records)} sample documents")
        
        for i, record in enumerate(records, 1):
            print(f"\n   Document {i}:")
            print(f"   ID: {record.id}")
            if record.payload:
                content = str(record.payload.get('page_content', 'N/A'))[:200]
                print(f"   Content: {content}...")
                print(f"   Metadata: {record.payload.get('metadata', {})}")
        
        return True
        
    except Exception as e:
        print(f"❌ Document inspection failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests."""
    print("\n" + "="*70)
    print("RAG CHAIN RETRIEVAL DIAGNOSTIC TOOL")
    print("="*70)
    print(f"Collection: {COLLECTION_NAME}")
    print(f"Qdrant Host: {os.getenv('QDRANT_HOST', 'localhost')}")
    print(f"Qdrant Port: {os.getenv('QDRANT_PORT', '6333')}")
    
    results = {
        "connection": test_qdrant_connection(),
        "collection": test_collection_exists(),
        "embedding": test_embedding_model() is not None,
    }
    
    if results["collection"]:
        results["sample_docs"] = inspect_sample_documents()
        results["direct_search"] = test_direct_qdrant_search()
        results["retriever"] = test_retriever_search()
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.upper()}: {status}")
    
    print("\n" + "="*70)
    if all(results.values()):
        print("✅ ALL TESTS PASSED - RAG chain should work correctly")
    else:
        print("⚠️  ISSUES DETECTED - See details above")
        if not results.get("collection", False):
            print("\n   RECOMMENDED ACTION:")
            print("   1. Make sure PDFs are in ./backend/pdfs/ directory")
            print("   2. Run: python backend/ingest_pdfs_qdrant.py")
            print("   3. Re-run this test script")
    print("="*70 + "\n")

if __name__ == "__main__":
    main()
