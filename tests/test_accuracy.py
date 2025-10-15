#!/usr/bin/env python3
"""
Accuracy Testing Module
=======================
Tests the accuracy of RAG retrieval and response generation.
Includes metrics for relevance, correctness, and hallucination detection.
"""
import sys
import time
from pathlib import Path
from typing import Dict, List, Any
import json

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from tests.test_config import (
    ALL_TEST_CASES,
    INTERNAL_RAG_TEST_CASES,
    QueryType
)
from tests.metrics import (
    calculate_keyword_coverage,
    calculate_semantic_similarity,
    detect_hallucination,
    calculate_response_time,
    evaluate_source_attribution
)


class AccuracyTester:
    """Tests accuracy of the RAG system."""
    
    def __init__(self, rag_chain_factory, retriever_factory):
        """
        Initialize the accuracy tester.
        
        Args:
            rag_chain_factory: Function to create RAG chain
            retriever_factory: Function to create retriever
        """
        self.rag_chain_factory = rag_chain_factory
        self.retriever_factory = retriever_factory
        self.results = []
    
    def test_retrieval_accuracy(self, test_cases: List = None) -> Dict[str, Any]:
        """
        Test accuracy of document retrieval.
        
        Args:
            test_cases: List of test cases to evaluate
            
        Returns:
            Dictionary containing retrieval metrics
        """
        if test_cases is None:
            test_cases = INTERNAL_RAG_TEST_CASES
        
        print("\n" + "="*80)
        print("RETRIEVAL ACCURACY TEST")
        print("="*80)
        
        retriever = self.retriever_factory()
        results = {
            "total_queries": len(test_cases),
            "successful_retrievals": 0,
            "failed_retrievals": 0,
            "average_relevance_score": 0.0,
            "queries_above_threshold": 0,
            "retrieval_times": [],
            "detailed_results": []
        }
        
        total_relevance = 0.0
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n[{i}/{len(test_cases)}] Testing: {test_case.query[:60]}...")
            
            start_time = time.time()
            try:
                docs = retriever.invoke(test_case.query)
                retrieval_time = time.time() - start_time
                results["retrieval_times"].append(retrieval_time)
                
                if docs and len(docs) > 0:
                    results["successful_retrievals"] += 1
                    
                    # Calculate keyword coverage in retrieved docs
                    combined_content = " ".join([doc.page_content for doc in docs])
                    keyword_score = calculate_keyword_coverage(
                        combined_content,
                        test_case.expected_keywords
                    )
                    
                    total_relevance += keyword_score
                    
                    if keyword_score >= test_case.evaluation_criteria.get("min_relevance_score", 0.5):
                        results["queries_above_threshold"] += 1
                    
                    print(f"   ✅ Retrieved {len(docs)} documents")
                    print(f"   Keyword coverage: {keyword_score:.2%}")
                    print(f"   Retrieval time: {retrieval_time:.3f}s")
                    
                    results["detailed_results"].append({
                        "query": test_case.query,
                        "success": True,
                        "num_docs": len(docs),
                        "relevance_score": keyword_score,
                        "retrieval_time": retrieval_time
                    })
                else:
                    results["failed_retrievals"] += 1
                    print(f"   ❌ No documents retrieved")
                    
                    results["detailed_results"].append({
                        "query": test_case.query,
                        "success": False,
                        "error": "No documents found"
                    })
                    
            except Exception as e:
                results["failed_retrievals"] += 1
                print(f"   ❌ Error: {e}")
                results["detailed_results"].append({
                    "query": test_case.query,
                    "success": False,
                    "error": str(e)
                })
        
        # Calculate averages
        if results["successful_retrievals"] > 0:
            results["average_relevance_score"] = total_relevance / results["successful_retrievals"]
        
        if results["retrieval_times"]:
            results["average_retrieval_time"] = sum(results["retrieval_times"]) / len(results["retrieval_times"])
            results["max_retrieval_time"] = max(results["retrieval_times"])
            results["min_retrieval_time"] = min(results["retrieval_times"])
        
        # Calculate success rate
        results["success_rate"] = results["successful_retrievals"] / results["total_queries"]
        results["above_threshold_rate"] = results["queries_above_threshold"] / results["total_queries"]
        
        return results
    
    def test_response_accuracy(self, test_cases: List = None) -> Dict[str, Any]:
        """
        Test accuracy of generated responses.
        
        Args:
            test_cases: List of test cases to evaluate
            
        Returns:
            Dictionary containing response accuracy metrics
        """
        if test_cases is None:
            test_cases = INTERNAL_RAG_TEST_CASES
        
        print("\n" + "="*80)
        print("RESPONSE ACCURACY TEST")
        print("="*80)
        
        session_id = "accuracy_test_session"
        rag_chain = self.rag_chain_factory(session_id)
        
        results = {
            "total_queries": len(test_cases),
            "successful_responses": 0,
            "failed_responses": 0,
            "average_keyword_coverage": 0.0,
            "average_response_time": 0.0,
            "hallucination_detected": 0,
            "detailed_results": []
        }
        
        total_keyword_coverage = 0.0
        response_times = []
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n[{i}/{len(test_cases)}] Query: {test_case.query[:60]}...")
            
            start_time = time.time()
            try:
                response = rag_chain.invoke(test_case.query)
                response_time = time.time() - start_time
                response_times.append(response_time)
                
                # Calculate keyword coverage
                keyword_coverage = calculate_keyword_coverage(
                    response,
                    test_case.expected_keywords
                )
                total_keyword_coverage += keyword_coverage
                
                # Check for hallucination (if ground truth available)
                hallucination_score = 0.0
                if test_case.ground_truth_answer:
                    hallucination_score = detect_hallucination(
                        response,
                        test_case.ground_truth_answer,
                        test_case.expected_keywords
                    )
                    if hallucination_score > 0.5:
                        results["hallucination_detected"] += 1
                
                results["successful_responses"] += 1
                
                print(f"   ✅ Response generated")
                print(f"   Keyword coverage: {keyword_coverage:.2%}")
                print(f"   Response time: {response_time:.3f}s")
                if hallucination_score > 0:
                    print(f"   Hallucination score: {hallucination_score:.2f}")
                print(f"   Response preview: {response[:150]}...")
                
                results["detailed_results"].append({
                    "query": test_case.query,
                    "success": True,
                    "keyword_coverage": keyword_coverage,
                    "response_time": response_time,
                    "hallucination_score": hallucination_score,
                    "response_preview": response[:200]
                })
                
            except Exception as e:
                results["failed_responses"] += 1
                print(f"   ❌ Error: {e}")
                results["detailed_results"].append({
                    "query": test_case.query,
                    "success": False,
                    "error": str(e)
                })
        
        # Calculate averages
        if results["successful_responses"] > 0:
            results["average_keyword_coverage"] = total_keyword_coverage / results["successful_responses"]
        
        if response_times:
            results["average_response_time"] = sum(response_times) / len(response_times)
            results["max_response_time"] = max(response_times)
            results["min_response_time"] = min(response_times)
        
        results["success_rate"] = results["successful_responses"] / results["total_queries"]
        results["hallucination_rate"] = results["hallucination_detected"] / results["total_queries"]
        
        return results
    
    def generate_accuracy_report(self, output_file: str = "accuracy_report.json"):
        """Generate comprehensive accuracy report."""
        print("\n" + "="*80)
        print("GENERATING COMPREHENSIVE ACCURACY REPORT")
        print("="*80)
        
        report = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "test_type": "Accuracy Testing",
            "retrieval_accuracy": self.test_retrieval_accuracy(),
            "response_accuracy": self.test_response_accuracy()
        }
        
        # Save to file
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n✅ Report saved to: {output_file}")
        
        # Print summary
        print("\n" + "="*80)
        print("ACCURACY TEST SUMMARY")
        print("="*80)
        print(f"\nRetrieval Accuracy:")
        print(f"  Success Rate: {report['retrieval_accuracy']['success_rate']:.2%}")
        print(f"  Avg Relevance: {report['retrieval_accuracy']['average_relevance_score']:.2%}")
        print(f"  Above Threshold: {report['retrieval_accuracy']['above_threshold_rate']:.2%}")
        
        print(f"\nResponse Accuracy:")
        print(f"  Success Rate: {report['response_accuracy']['success_rate']:.2%}")
        print(f"  Avg Keyword Coverage: {report['response_accuracy']['average_keyword_coverage']:.2%}")
        print(f"  Hallucination Rate: {report['response_accuracy']['hallucination_rate']:.2%}")
        
        return report


def run_accuracy_tests():
    """Run all accuracy tests."""
    from backend.services.rag_chain import create_rag_chain
    from backend.db.qdrant import get_retriever
    
    tester = AccuracyTester(
        rag_chain_factory=create_rag_chain,
        retriever_factory=lambda: get_retriever(k=4)
    )
    
    report = tester.generate_accuracy_report()
    return report


if __name__ == "__main__":
    run_accuracy_tests()
