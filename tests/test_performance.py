#!/usr/bin/env python3
"""
Performance and Stress Testing Module
======================================
Tests system performance under various load conditions.
"""
import sys
import time
import concurrent.futures
from pathlib import Path
from typing import Dict, List, Any
import json
import statistics

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from tests.test_config import INTERNAL_RAG_TEST_CASES


class PerformanceTester:
    """Tests system performance and scalability."""
    
    def __init__(self, rag_chain_factory):
        """
        Initialize the performance tester.
        
        Args:
            rag_chain_factory: Function to create RAG chain
        """
        self.rag_chain_factory = rag_chain_factory
    
    def test_response_time(self, num_iterations: int = 10) -> Dict[str, Any]:
        """
        Test response time consistency.
        
        Args:
            num_iterations: Number of iterations per query
            
        Returns:
            Dictionary containing timing statistics
        """
        print("\n" + "="*80)
        print("RESPONSE TIME TEST")
        print("="*80)
        
        session_id = "perf_test_session"
        rag_chain = self.rag_chain_factory(session_id)
        
        test_query = "What is the Transformer architecture?"
        response_times = []
        
        print(f"\nRunning {num_iterations} iterations...")
        
        for i in range(num_iterations):
            start_time = time.time()
            try:
                _ = rag_chain.invoke(test_query)
                elapsed = time.time() - start_time
                response_times.append(elapsed)
                print(f"  Iteration {i+1}/{num_iterations}: {elapsed:.3f}s")
            except Exception as e:
                print(f"  ❌ Iteration {i+1} failed: {e}")
        
        if not response_times:
            return {"error": "All iterations failed"}
        
        results = {
            "num_iterations": num_iterations,
            "successful_iterations": len(response_times),
            "mean_time": statistics.mean(response_times),
            "median_time": statistics.median(response_times),
            "std_dev": statistics.stdev(response_times) if len(response_times) > 1 else 0,
            "min_time": min(response_times),
            "max_time": max(response_times),
            "all_times": response_times
        }
        
        print(f"\n✅ Response Time Statistics:")
        print(f"   Mean: {results['mean_time']:.3f}s")
        print(f"   Median: {results['median_time']:.3f}s")
        print(f"   Std Dev: {results['std_dev']:.3f}s")
        print(f"   Min: {results['min_time']:.3f}s")
        print(f"   Max: {results['max_time']:.3f}s")
        
        return results
    
    def test_concurrent_requests(self, num_concurrent: int = 5) -> Dict[str, Any]:
        """
        Test system performance under concurrent load.
        
        Args:
            num_concurrent: Number of concurrent requests
            
        Returns:
            Dictionary containing concurrency metrics
        """
        print("\n" + "="*80)
        print(f"CONCURRENT REQUESTS TEST ({num_concurrent} concurrent)")
        print("="*80)
        
        test_queries = [tc.query for tc in INTERNAL_RAG_TEST_CASES[:num_concurrent]]
        
        def process_query(query_tuple):
            idx, query = query_tuple
            session_id = f"concurrent_test_{idx}"
            rag_chain = self.rag_chain_factory(session_id)
            
            start_time = time.time()
            try:
                response = rag_chain.invoke(query)
                elapsed = time.time() - start_time
                return {
                    "success": True,
                    "query_idx": idx,
                    "response_time": elapsed,
                    "response_length": len(response)
                }
            except Exception as e:
                return {
                    "success": False,
                    "query_idx": idx,
                    "error": str(e)
                }
        
        start_time = time.time()
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=num_concurrent) as executor:
            results_list = list(executor.map(process_query, enumerate(test_queries)))
        
        total_time = time.time() - start_time
        
        successful = [r for r in results_list if r["success"]]
        failed = [r for r in results_list if not r["success"]]
        
        results = {
            "num_concurrent": num_concurrent,
            "total_time": total_time,
            "successful_requests": len(successful),
            "failed_requests": len(failed),
            "throughput": len(successful) / total_time if total_time > 0 else 0,
            "detailed_results": results_list
        }
        
        if successful:
            response_times = [r["response_time"] for r in successful]
            results["average_response_time"] = statistics.mean(response_times)
            results["max_response_time"] = max(response_times)
            results["min_response_time"] = min(response_times)
        
        print(f"\n✅ Concurrent Test Results:")
        print(f"   Total Time: {results['total_time']:.3f}s")
        print(f"   Successful: {results['successful_requests']}/{num_concurrent}")
        print(f"   Failed: {results['failed_requests']}/{num_concurrent}")
        print(f"   Throughput: {results['throughput']:.2f} requests/second")
        if successful:
            print(f"   Avg Response Time: {results['average_response_time']:.3f}s")
        
        return results
    
    def test_sustained_load(self, duration_seconds: int = 60, requests_per_second: int = 2) -> Dict[str, Any]:
        """
        Test system under sustained load.
        
        Args:
            duration_seconds: Test duration in seconds
            requests_per_second: Target requests per second
            
        Returns:
            Dictionary containing sustained load metrics
        """
        print("\n" + "="*80)
        print(f"SUSTAINED LOAD TEST ({duration_seconds}s at {requests_per_second} req/s)")
        print("="*80)
        
        test_queries = [tc.query for tc in INTERNAL_RAG_TEST_CASES]
        interval = 1.0 / requests_per_second
        
        results = {
            "duration": duration_seconds,
            "target_rps": requests_per_second,
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "response_times": []
        }
        
        start_time = time.time()
        request_count = 0
        
        print("\nStarting sustained load test...")
        
        while time.time() - start_time < duration_seconds:
            query = test_queries[request_count % len(test_queries)]
            session_id = f"sustained_test_{request_count}"
            
            try:
                rag_chain = self.rag_chain_factory(session_id)
                req_start = time.time()
                _ = rag_chain.invoke(query)
                req_time = time.time() - req_start
                
                results["successful_requests"] += 1
                results["response_times"].append(req_time)
                
                if request_count % 10 == 0:
                    elapsed = time.time() - start_time
                    print(f"  Progress: {elapsed:.1f}s / {duration_seconds}s - {request_count} requests")
                
            except Exception as e:
                results["failed_requests"] += 1
                print(f"  ❌ Request {request_count} failed: {e}")
            
            results["total_requests"] += 1
            request_count += 1
            
            # Sleep to maintain target rate
            time.sleep(interval)
        
        actual_duration = time.time() - start_time
        results["actual_duration"] = actual_duration
        results["actual_rps"] = results["total_requests"] / actual_duration
        
        if results["response_times"]:
            results["mean_response_time"] = statistics.mean(results["response_times"])
            results["median_response_time"] = statistics.median(results["response_times"])
            results["p95_response_time"] = sorted(results["response_times"])[int(len(results["response_times"]) * 0.95)]
            results["p99_response_time"] = sorted(results["response_times"])[int(len(results["response_times"]) * 0.99)]
        
        print(f"\n✅ Sustained Load Results:")
        print(f"   Total Requests: {results['total_requests']}")
        print(f"   Successful: {results['successful_requests']}")
        print(f"   Failed: {results['failed_requests']}")
        print(f"   Actual RPS: {results['actual_rps']:.2f}")
        if results["response_times"]:
            print(f"   Mean Response Time: {results['mean_response_time']:.3f}s")
            print(f"   P95 Response Time: {results['p95_response_time']:.3f}s")
            print(f"   P99 Response Time: {results['p99_response_time']:.3f}s")
        
        return results
    
    def generate_performance_report(self, output_file: str = "performance_report.json"):
        """Generate comprehensive performance report."""
        print("\n" + "="*80)
        print("GENERATING PERFORMANCE REPORT")
        print("="*80)
        
        report = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "test_type": "Performance Testing",
            "response_time": self.test_response_time(num_iterations=10),
            "concurrent_load": self.test_concurrent_requests(num_concurrent=5),
            "sustained_load": self.test_sustained_load(duration_seconds=30, requests_per_second=2)
        }
        
        # Save to file
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n✅ Report saved to: {output_file}")
        
        return report


def run_performance_tests():
    """Run all performance tests."""
    from backend.services.rag_chain import create_rag_chain
    
    tester = PerformanceTester(rag_chain_factory=create_rag_chain)
    report = tester.generate_performance_report()
    return report


if __name__ == "__main__":
    run_performance_tests()
