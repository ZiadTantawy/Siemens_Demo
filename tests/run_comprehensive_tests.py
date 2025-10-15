#!/usr/bin/env python3
"""
Comprehensive Testing Suite - Main Entry Point
===============================================
Runs all tests and generates comprehensive reports.
"""
import sys
import argparse
from pathlib import Path
import json

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from tests.test_accuracy import AccuracyTester
from tests.test_web_fallback import WebFallbackTester
from tests.test_performance import PerformanceTester


def run_all_tests(output_dir: str = "test_reports"):
    """
    Run all testing modules and generate comprehensive report.
    
    Args:
        output_dir: Directory to save test reports
    """
    import os
    os.makedirs(output_dir, exist_ok=True)
    
    print("="*80)
    print("COMPREHENSIVE RAG SYSTEM TESTING SUITE")
    print("="*80)
    print(f"\nTest reports will be saved to: {output_dir}/")
    
    # Import dependencies
    from backend.services.rag_chain import create_rag_chain
    from backend.db.qdrant import get_retriever
    
    # Placeholder for web agent
    def create_web_agent():
        return None
    
    # Initialize testers
    accuracy_tester = AccuracyTester(
        rag_chain_factory=create_rag_chain,
        retriever_factory=lambda: get_retriever(k=4)
    )
    
    web_fallback_tester = WebFallbackTester(
        web_agent_factory=create_web_agent
    )
    
    performance_tester = PerformanceTester(
        rag_chain_factory=create_rag_chain
    )
    
    # Run all tests
    comprehensive_report = {
        "test_suite": "Siemens RAG Chatbot - Comprehensive Testing",
        "timestamp": None,
        "accuracy_tests": None,
        "web_fallback_tests": None,
        "performance_tests": None,
        "summary": {}
    }
    
    # 1. Accuracy Tests
    print("\n" + "="*80)
    print("PHASE 1: ACCURACY TESTING")
    print("="*80)
    try:
        accuracy_report = accuracy_tester.generate_accuracy_report(
            output_file=f"{output_dir}/accuracy_report.json"
        )
        comprehensive_report["accuracy_tests"] = accuracy_report
        comprehensive_report["summary"]["accuracy_passed"] = True
    except Exception as e:
        print(f"❌ Accuracy tests failed: {e}")
        comprehensive_report["summary"]["accuracy_passed"] = False
        comprehensive_report["accuracy_tests"] = {"error": str(e)}
    
    # 2. Web Fallback Tests
    print("\n" + "="*80)
    print("PHASE 2: WEB FALLBACK TESTING")
    print("="*80)
    try:
        fallback_report = web_fallback_tester.generate_fallback_report(
            output_file=f"{output_dir}/web_fallback_report.json"
        )
        comprehensive_report["web_fallback_tests"] = fallback_report
        comprehensive_report["summary"]["web_fallback_passed"] = True
    except Exception as e:
        print(f"❌ Web fallback tests failed: {e}")
        comprehensive_report["summary"]["web_fallback_passed"] = False
        comprehensive_report["web_fallback_tests"] = {"error": str(e)}
    
    # 3. Performance Tests
    print("\n" + "="*80)
    print("PHASE 3: PERFORMANCE TESTING")
    print("="*80)
    try:
        performance_report = performance_tester.generate_performance_report(
            output_file=f"{output_dir}/performance_report.json"
        )
        comprehensive_report["performance_tests"] = performance_report
        comprehensive_report["summary"]["performance_passed"] = True
    except Exception as e:
        print(f"❌ Performance tests failed: {e}")
        comprehensive_report["summary"]["performance_passed"] = False
        comprehensive_report["performance_tests"] = {"error": str(e)}
    
    # Generate comprehensive summary
    comprehensive_report["timestamp"] = __import__('time').strftime("%Y-%m-%d %H:%M:%S")
    
    # Calculate overall metrics
    if comprehensive_report["accuracy_tests"] and "error" not in comprehensive_report["accuracy_tests"]:
        acc_tests = comprehensive_report["accuracy_tests"]
        comprehensive_report["summary"]["overall_accuracy"] = {
            "retrieval_success_rate": acc_tests["retrieval_accuracy"]["success_rate"],
            "response_success_rate": acc_tests["response_accuracy"]["success_rate"],
            "hallucination_rate": acc_tests["response_accuracy"]["hallucination_rate"]
        }
    
    if comprehensive_report["performance_tests"] and "error" not in comprehensive_report["performance_tests"]:
        perf_tests = comprehensive_report["performance_tests"]
        comprehensive_report["summary"]["overall_performance"] = {
            "mean_response_time": perf_tests["response_time"]["mean_time"],
            "throughput": perf_tests["concurrent_load"]["throughput"],
            "sustained_load_success_rate": perf_tests["sustained_load"]["successful_requests"] / 
                                           perf_tests["sustained_load"]["total_requests"]
        }
    
    # Save comprehensive report
    comprehensive_report_path = f"{output_dir}/comprehensive_report.json"
    with open(comprehensive_report_path, 'w') as f:
        json.dump(comprehensive_report, f, indent=2)
    
    # Print final summary
    print("\n" + "="*80)
    print("COMPREHENSIVE TEST SUMMARY")
    print("="*80)
    
    print(f"\n✅ Accuracy Tests: {'PASSED' if comprehensive_report['summary']['accuracy_passed'] else 'FAILED'}")
    if comprehensive_report["summary"].get("overall_accuracy"):
        oa = comprehensive_report["summary"]["overall_accuracy"]
        print(f"   - Retrieval Success: {oa['retrieval_success_rate']:.2%}")
        print(f"   - Response Success: {oa['response_success_rate']:.2%}")
        print(f"   - Hallucination Rate: {oa['hallucination_rate']:.2%}")
    
    print(f"\n✅ Web Fallback Tests: {'PASSED' if comprehensive_report['summary']['web_fallback_passed'] else 'FAILED'}")
    
    print(f"\n✅ Performance Tests: {'PASSED' if comprehensive_report['summary']['performance_passed'] else 'FAILED'}")
    if comprehensive_report["summary"].get("overall_performance"):
        op = comprehensive_report["summary"]["overall_performance"]
        print(f"   - Mean Response Time: {op['mean_response_time']:.3f}s")
        print(f"   - Throughput: {op['throughput']:.2f} req/s")
        print(f"   - Sustained Success Rate: {op['sustained_load_success_rate']:.2%}")
    
    print(f"\n📊 All reports saved to: {output_dir}/")
    print(f"   - Comprehensive Report: {comprehensive_report_path}")
    print(f"   - Accuracy Report: {output_dir}/accuracy_report.json")
    print(f"   - Web Fallback Report: {output_dir}/web_fallback_report.json")
    print(f"   - Performance Report: {output_dir}/performance_report.json")
    
    print("\n" + "="*80)
    print("TESTING COMPLETE")
    print("="*80)
    
    return comprehensive_report


def main():
    """Main entry point for comprehensive testing."""
    parser = argparse.ArgumentParser(
        description="Comprehensive Testing Suite for Siemens RAG Chatbot"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="test_reports",
        help="Directory to save test reports (default: test_reports)"
    )
    parser.add_argument(
        "--test-type",
        type=str,
        choices=["all", "accuracy", "web-fallback", "performance"],
        default="all",
        help="Type of test to run (default: all)"
    )
    
    args = parser.parse_args()
    
    if args.test_type == "all":
        run_all_tests(output_dir=args.output_dir)
    elif args.test_type == "accuracy":
        from backend.services.rag_chain import create_rag_chain
        from backend.db.qdrant import get_retriever
        tester = AccuracyTester(create_rag_chain, lambda: get_retriever(k=4))
        tester.generate_accuracy_report(output_file=f"{args.output_dir}/accuracy_report.json")
    elif args.test_type == "web-fallback":
        tester = WebFallbackTester(lambda: None)
        tester.generate_fallback_report(output_file=f"{args.output_dir}/web_fallback_report.json")
    elif args.test_type == "performance":
        from backend.services.rag_chain import create_rag_chain
        tester = PerformanceTester(create_rag_chain)
        tester.generate_performance_report(output_file=f"{args.output_dir}/performance_report.json")


if __name__ == "__main__":
    main()
