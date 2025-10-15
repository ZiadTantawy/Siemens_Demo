#!/usr/bin/env python3
"""
Test the complete RAG chain end-to-end with actual questions.
"""
import os
from dotenv import load_dotenv

load_dotenv()

from backend.services.rag_chain import create_rag_chain

def test_rag_chain():
    """Test the RAG chain with sample questions."""
    print("\n" + "="*70)
    print("TESTING COMPLETE RAG CHAIN")
    print("="*70)
    
    # Create RAG chain with a test session
    session_id = "test_session_001"
    rag_chain = create_rag_chain(session_id)
    
    test_questions = [
        "What is the Transformer architecture?",
        "Explain the attention mechanism",
        "What are the main components of the Transformer model?",
    ]
    
    for i, question in enumerate(test_questions, 1):
        print(f"\n{'='*70}")
        print(f"Question {i}: {question}")
        print("="*70)
        
        try:
            response = rag_chain.invoke(question)
            print(f"\n{response}\n")
            print("-"*70)
            
        except Exception as e:
            print(f"❌ Error processing question: {e}")
            import traceback
            traceback.print_exc()
    
    print("\n" + "="*70)
    print("✅ RAG CHAIN TEST COMPLETED")
    print("="*70 + "\n")

if __name__ == "__main__":
    test_rag_chain()
