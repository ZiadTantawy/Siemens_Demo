#!/usr/bin/env python3
"""
Web Fallback Testing Module
============================
Tests the web search fallback functionality when internal RAG doesn't have answers.
"""
import sys
import time
from pathlib import Path
from typing import Dict, List, Any
import json

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from tests.test_config import EXTERNAL_WEB_TEST_CASES, AMBIGUOUS_TEST_CASES
from tests.metrics import (
    calculate_keyword_coverage,
    evaluate_source_attribution,
    evaluate_response_quality
)


class WebFallbackTester:
    """Tests web search fallback functionality."""
    
    def __init__(self, web_agent_factory):
        """
        Initialize the web fallback tester.
        
        Args:
            web_agent_factory: Function to create web search agent
        """
        self.web_agent_factory = web_agent_factory
        self.results = []
    
    def test_web_search_accuracy(self, test_cases: List = None) -> Dict[str, Any]:
        """
        Test accuracy of web search fallback.
        
        Args:
            test_cases: List of test cases requiring web search
            
        Returns:
            Dictionary containing web search metrics
        """
        if test_cases is None:
            test_cases = EXTERNAL_WEB_TEST_CASES
        
        print("\n" + "="*80)
        print("WEB FALLBACK ACCURACY TEST")
        print("="*80)
        
        results = {
            "total_queries": len(test_cases),
            "successful_searches": 0,
            "failed_searches": 0,
            "average_keyword_coverage": 0.0,
            "average_response_time": 0.0,
            "with_source_attribution": 0,
            "detailed_results": []
        }
        
        total_keyword_coverage = 0.0
        response_times = []
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n[{i}/{len(test_cases)}] Query: {test_case.query[:60]}...")
            
            start_time = time.time()
            try:
                # Simulate web search (replace with actual web agent when implemented)
                web_agent = self.web_agent_factory()
                response = self._perform_web_search(web_agent, test_case.query)
                
                response_time = time.time() - start_time
                response_times.append(response_time)
                
                # Calculate keyword coverage
                keyword_coverage = calculate_keyword_coverage(
                    response,
                    test_case.expected_keywords
                )
                total_keyword_coverage += keyword_coverage
                
                # Check source attribution
                attribution = evaluate_source_attribution(response)
                if attribution["has_attribution"]:
                    results["with_source_attribution"] += 1
                
                # Evaluate response quality
                quality = evaluate_response_quality(response)
                
                results["successful_searches"] += 1
                
                print(f"   ✅ Web search completed")
                print(f"   Keyword coverage: {keyword_coverage:.2%}")
                print(f"   Response time: {response_time:.3f}s")
                print(f"   Has attribution: {attribution['has_attribution']}")
                print(f"   Quality score: {quality['quality_score']:.2f}")
                
                results["detailed_results"].append({
                    "query": test_case.query,
                    "success": True,
                    "keyword_coverage": keyword_coverage,
                    "response_time": response_time,
                    "has_attribution": attribution["has_attribution"],
                    "quality_score": quality["quality_score"],
                    "response_preview": response[:200]
                })
                
            except Exception as e:
                results["failed_searches"] += 1
                print(f"   ❌ Error: {e}")
                results["detailed_results"].append({
                    "query": test_case.query,
                    "success": False,
                    "error": str(e)
                })
        
        # Calculate averages
        if results["successful_searches"] > 0:
            results["average_keyword_coverage"] = total_keyword_coverage / results["successful_searches"]
            results["attribution_rate"] = results["with_source_attribution"] / results["successful_searches"]
        
        if response_times:
            results["average_response_time"] = sum(response_times) / len(response_times)
            results["max_response_time"] = max(response_times)
            results["min_response_time"] = min(response_times)
        
        results["success_rate"] = results["successful_searches"] / results["total_queries"]
        
        return results
    
    def test_fallback_decision(self, test_cases: List = None) -> Dict[str, Any]:
        """
        Test the decision-making between internal RAG and web fallback.
        
        Args:
            test_cases: List of ambiguous test cases
            
        Returns:
            Dictionary containing decision accuracy metrics
        """
        if test_cases is None:
            test_cases = AMBIGUOUS_TEST_CASES
        
        print("\n" + "="*80)
        print("FALLBACK DECISION TEST")
        print("="*80)
        
        results = {
            "total_queries": len(test_cases),
            "correct_decisions": 0,
            "incorrect_decisions": 0,
            "detailed_results": []
        }
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n[{i}/{len(test_cases)}] Testing: {test_case.query[:60]}...")
            
            try:
                # Test if system makes correct decision
                decision = self._test_routing_decision(test_case)
                
                is_correct = self._evaluate_decision(decision, test_case.expected_source)
                
                if is_correct:
                    results["correct_decisions"] += 1
                    print(f"   ✅ Correct routing decision: {decision}")
                else:
                    results["incorrect_decisions"] += 1
                    print(f"   ❌ Incorrect routing (expected: {test_case.expected_source}, got: {decision})")
                
                results["detailed_results"].append({
                    "query": test_case.query,
                    "expected_source": test_case.expected_source,
                    "actual_decision": decision,
                    "correct": is_correct
                })
                
            except Exception as e:
                print(f"   ❌ Error: {e}")
                results["detailed_results"].append({
                    "query": test_case.query,
                    "error": str(e)
                })
        
        if results["total_queries"] > 0:
            results["decision_accuracy"] = results["correct_decisions"] / results["total_queries"]
        
        return results
    
    def _perform_web_search(self, web_agent, query: str) -> str:
        """
        Perform web search using web agent.
        
        Args:
            web_agent: Web search agent instance
            query: Search query
            
        Returns:
            Search results as string
        """
        # TODO: Implement actual web agent call when web_agent.py is complete
        # For now, return a simulated response
        return f"Web search results for: {query}\n\nThis is a simulated web search response. " \
               f"In production, this would contain actual search results from the web agent."
    
    def _test_routing_decision(self, test_case) -> str:
        """
        Test the routing decision for a query.
        
        Args:
            test_case: Test case to evaluate
            
        Returns:
            Decision string: "internal", "external", or "both"
        """
        # TODO: Implement actual routing logic when available
        # For now, return "internal" as default
        return "internal"
    
    def _evaluate_decision(self, actual_decision: str, expected_source: str) -> bool:
        """
        Evaluate if the routing decision was correct.
        
        Args:
            actual_decision: The decision made by the system
            expected_source: The expected source
            
        Returns:
            True if decision was correct
        """
        if expected_source == "both":
            return True  # Any decision is acceptable for ambiguous cases
        return actual_decision == expected_source
    
    def generate_fallback_report(self, output_file: str = "web_fallback_report.json"):
        """Generate comprehensive web fallback report."""
        print("\n" + "="*80)
        print("GENERATING WEB FALLBACK REPORT")
        print("="*80)
        
        report = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "test_type": "Web Fallback Testing",
            "web_search_accuracy": self.test_web_search_accuracy(),
            "fallback_decision": self.test_fallback_decision()
        }
        
        # Save to file
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n✅ Report saved to: {output_file}")
        
        # Print summary
        print("\n" + "="*80)
        print("WEB FALLBACK TEST SUMMARY")
        print("="*80)
        print(f"\nWeb Search Accuracy:")
        print(f"  Success Rate: {report['web_search_accuracy']['success_rate']:.2%}")
        print(f"  Avg Keyword Coverage: {report['web_search_accuracy']['average_keyword_coverage']:.2%}")
        print(f"  Attribution Rate: {report['web_search_accuracy'].get('attribution_rate', 0):.2%}")
        
        print(f"\nFallback Decision:")
        print(f"  Decision Accuracy: {report['fallback_decision'].get('decision_accuracy', 0):.2%}")
        
        return report


def run_web_fallback_tests():
    """Run all web fallback tests."""
    # Placeholder web agent factory
    def create_web_agent():
        return None  # Replace with actual web agent when implemented
    
    tester = WebFallbackTester(web_agent_factory=create_web_agent)
    report = tester.generate_fallback_report()
    return report


if __name__ == "__main__":
    run_web_fallback_tests()
