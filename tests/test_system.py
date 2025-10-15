#!/usr/bin/env python3
"""
Unified System Testing Suite
=============================
Comprehensive test that evaluates the entire RAG system using 30 curated questions
and generates a complete JSON report with all important metrics.

Usage:
    python tests/test_system.py
    python tests/test_system.py --output results/final_report.json
"""
import sys
import json
import time
import requests
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Configuration
API_BASE = "http://localhost:8000"
CHAT_ENDPOINT = f"{API_BASE}/api/v1/chat/send_message"
HEALTH_ENDPOINT = f"{API_BASE}/health"
KB_QUESTIONS_PATH = "tests/test_datasets/kb_questions_comprehensive.json"


def load_kb_questions(filepath: str = KB_QUESTIONS_PATH) -> List[Dict]:
    """Load knowledge base questions from JSON file."""
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Warning: {filepath} not found, using empty list")
        return []
    except json.JSONDecodeError as e:
        print(f"Error parsing {filepath}: {e}")
        return []


class SystemTester:
    """Comprehensive system testing class."""
    
    def __init__(self):
        self.results = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "test_duration_seconds": 0,
            "system_health": {},
            "kb_tests": {},
            "web_tests": {},
            "performance_metrics": {},
            "summary": {},
            "recommendations": []
        }
        self.start_time = None
    
    def check_system_health(self) -> bool:
        """Check if all required services are running."""
        print("\n" + "="*80)
        print("SYSTEM HEALTH CHECK")
        print("="*80)
        
        health = {
            "backend_api": False,
            "backend_response_time": None,
            "errors": []
        }
        
        try:
            start = time.time()
            response = requests.get(HEALTH_ENDPOINT, timeout=5)
            health["backend_response_time"] = time.time() - start
            
            if response.status_code == 200:
                health["backend_api"] = True
                print(f"✅ Backend API: Running (response time: {health['backend_response_time']:.3f}s)")
            else:
                health["errors"].append(f"Backend returned status {response.status_code}")
                print(f"❌ Backend API: Error {response.status_code}")
        except Exception as e:
            health["errors"].append(f"Backend connection failed: {str(e)}")
            print(f"❌ Backend API: Not reachable - {str(e)}")
        
        self.results["system_health"] = health
        return health["backend_api"]
    
    def calculate_keyword_coverage(self, text: str, keywords: List[str]) -> float:
        """Calculate percentage of keywords found in text."""
        if not keywords:
            return 1.0
        text_lower = text.lower()
        found = sum(1 for kw in keywords if kw.lower() in text_lower)
        return found / len(keywords)
    
    def test_kb_questions(self, questions: List[Dict]) -> Dict:
        """Test knowledge base questions."""
        print("\n" + "="*80)
        print(f"KNOWLEDGE BASE TESTING ({len(questions)} questions)")
        print("="*80)
        
        results = {
            "total_questions": len(questions),
            "successful": 0,
            "failed": 0,
            "avg_response_time": 0.0,
            "avg_keyword_coverage": 0.0,
            "avg_confidence": 0.0,
            "with_sources": 0,
            "with_inline_citations": 0,
            "by_difficulty": {"easy": {"total": 0, "success": 0}, 
                             "medium": {"total": 0, "success": 0},
                             "hard": {"total": 0, "success": 0}},
            "by_category": {},
            "failed_questions": [],
            "detailed_results": []
        }
        
        response_times = []
        keyword_coverages = []
        confidences = []
        
        for i, test in enumerate(questions, 1):
            print(f"\n[{i}/{len(questions)}] {test['id']}: {test['question'][:60]}...")
            
            # Send query
            start = time.time()
            try:
                response = requests.post(
                    CHAT_ENDPOINT,
                    json={"text": test["question"]},
                    timeout=30
                )
                response_time = time.time() - start
                response_times.append(response_time)
                
                if response.status_code != 200:
                    raise Exception(f"HTTP {response.status_code}")
                
                data = response.json()
                answer = data.get("message", "")
                sources = data.get("sources", [])
                confidence = data.get("confidence", 0.0)
                
                # Calculate metrics
                keyword_coverage = self.calculate_keyword_coverage(
                    answer, 
                    test.get("expected_keywords", [])
                )
                keyword_coverages.append(keyword_coverage)
                confidences.append(confidence)
                
                has_sources = len(sources) > 0 if sources else False
                has_citations = any(f"[{i}]" in answer for i in range(1, 5))
                
                # Determine success
                success = keyword_coverage >= 0.5 and (has_sources or has_citations)
                
                if success:
                    results["successful"] += 1
                    print(f"  ✅ SUCCESS (coverage: {keyword_coverage:.1%}, confidence: {confidence:.1%})")
                else:
                    results["failed"] += 1
                    results["failed_questions"].append({
                        "id": test["id"],
                        "question": test["question"],
                        "keyword_coverage": keyword_coverage,
                        "reason": "Low keyword coverage" if keyword_coverage < 0.5 else "No citations"
                    })
                    print(f"  ❌ FAILED (coverage: {keyword_coverage:.1%})")
                
                # Update difficulty stats
                diff = test.get("difficulty", "medium")
                results["by_difficulty"][diff]["total"] += 1
                if success:
                    results["by_difficulty"][diff]["success"] += 1
                
                # Update category stats
                cat = test.get("category", "unknown")
                if cat not in results["by_category"]:
                    results["by_category"][cat] = {"total": 0, "success": 0}
                results["by_category"][cat]["total"] += 1
                if success:
                    results["by_category"][cat]["success"] += 1
                
                # Track citations
                if has_sources:
                    results["with_sources"] += 1
                if has_citations:
                    results["with_inline_citations"] += 1
                
                # Store detailed result
                results["detailed_results"].append({
                    "id": test["id"],
                    "success": success,
                    "keyword_coverage": keyword_coverage,
                    "confidence": confidence,
                    "response_time": response_time,
                    "has_sources": has_sources,
                    "has_inline_citations": has_citations
                })
                
            except Exception as e:
                results["failed"] += 1
                response_times.append(0)
                print(f"  ❌ ERROR: {str(e)}")
                results["failed_questions"].append({
                    "id": test["id"],
                    "question": test["question"],
                    "error": str(e)
                })
            
            # Rate limiting delay
            time.sleep(1)
        
        # Calculate averages
        results["avg_response_time"] = sum(response_times) / len(response_times) if response_times else 0
        results["avg_keyword_coverage"] = sum(keyword_coverages) / len(keyword_coverages) if keyword_coverages else 0
        results["avg_confidence"] = sum(confidences) / len(confidences) if confidences else 0
        results["success_rate"] = results["successful"] / results["total_questions"] if results["total_questions"] > 0 else 0
        
        return results
    
    def test_web_fallback(self, questions: List[Dict]) -> Dict:
        """Test web fallback functionality."""
        print("\n" + "="*80)
        print(f"WEB FALLBACK TESTING ({len(questions)} questions)")
        print("="*80)
        
        results = {
            "total_questions": len(questions),
            "successful": 0,
            "failed": 0,
            "avg_response_time": 0.0,
            "triggered_web_search": 0,
            "detailed_results": []
        }
        
        response_times = []
        
        for i, test in enumerate(questions, 1):
            print(f"\n[{i}/{len(questions)}] {test['id']}: {test['question'][:60]}...")
            
            start = time.time()
            try:
                response = requests.post(
                    CHAT_ENDPOINT,
                    json={"text": test["question"]},
                    timeout=30
                )
                response_time = time.time() - start
                response_times.append(response_time)
                
                if response.status_code != 200:
                    raise Exception(f"HTTP {response.status_code}")
                
                data = response.json()
                answer = data.get("message", "")
                
                # Check if web search was triggered
                used_web = "web" in answer.lower() or "search" in answer.lower()
                
                if used_web:
                    results["triggered_web_search"] += 1
                    results["successful"] += 1
                    print(f"  ✅ Web search triggered ({response_time:.2f}s)")
                else:
                    results["successful"] += 1  # Still successful if it answered
                    print(f"  ⚠️  Answered from KB ({response_time:.2f}s)")
                
                results["detailed_results"].append({
                    "id": test["id"],
                    "used_web": used_web,
                    "response_time": response_time
                })
                
            except Exception as e:
                results["failed"] += 1
                print(f"  ❌ ERROR: {str(e)}")
            
            time.sleep(1)
        
        results["avg_response_time"] = sum(response_times) / len(response_times) if response_times else 0
        results["web_fallback_rate"] = results["triggered_web_search"] / results["total_questions"] if results["total_questions"] > 0 else 0
        
        return results
    
    def measure_performance(self) -> Dict:
        """Measure system performance metrics."""
        print("\n" + "="*80)
        print("PERFORMANCE TESTING")
        print("="*80)
        
        test_question = "What is the Transformer architecture?"
        
        # Single query latency
        print("\n[1] Single query latency test...")
        latencies = []
        for i in range(3):
            start = time.time()
            try:
                response = requests.post(
                    CHAT_ENDPOINT,
                    json={"text": test_question},
                    timeout=30
                )
                latency = time.time() - start
                latencies.append(latency)
                print(f"  Query {i+1}: {latency:.2f}s")
            except Exception as e:
                print(f"  Query {i+1}: ERROR - {str(e)}")
            time.sleep(1)
        
        return {
            "avg_latency": sum(latencies) / len(latencies) if latencies else 0,
            "min_latency": min(latencies) if latencies else 0,
            "max_latency": max(latencies) if latencies else 0,
            "latency_samples": latencies
        }
    
    def generate_summary(self):
        """Generate summary and recommendations."""
        kb = self.results.get("kb_tests", {})
        web = self.results.get("web_tests", {})
        perf = self.results.get("performance_metrics", {})
        
        summary = {
            "overall_success_rate": kb.get("success_rate", 0),
            "total_tests_run": kb.get("total_questions", 0) + web.get("total_questions", 0),
            "total_passed": kb.get("successful", 0) + web.get("successful", 0),
            "total_failed": kb.get("failed", 0) + web.get("failed", 0),
            "avg_response_time": perf.get("avg_latency", 0),
            "citation_rate": kb.get("with_sources", 0) / kb.get("total_questions", 1),
            "avg_confidence": kb.get("avg_confidence", 0),
            "grade": "F"
        }
        
        # Calculate grade
        success_rate = summary["overall_success_rate"]
        if success_rate >= 0.95:
            summary["grade"] = "A+"
        elif success_rate >= 0.90:
            summary["grade"] = "A"
        elif success_rate >= 0.85:
            summary["grade"] = "B+"
        elif success_rate >= 0.80:
            summary["grade"] = "B"
        elif success_rate >= 0.75:
            summary["grade"] = "C+"
        elif success_rate >= 0.70:
            summary["grade"] = "C"
        else:
            summary["grade"] = "D"
        
        self.results["summary"] = summary
        
        # Generate recommendations
        recommendations = []
        
        if kb.get("success_rate", 0) < 0.85:
            recommendations.append({
                "priority": "HIGH",
                "area": "Accuracy",
                "issue": f"KB success rate is {kb.get('success_rate', 0):.1%}, below 85% target",
                "suggestion": "Review failed questions and improve retrieval or prompts"
            })
        
        if kb.get("avg_keyword_coverage", 0) < 0.70:
            recommendations.append({
                "priority": "MEDIUM",
                "area": "Response Quality",
                "issue": f"Keyword coverage is {kb.get('avg_keyword_coverage', 0):.1%}, below 70% target",
                "suggestion": "Enhance system prompt to include more specific terminology"
            })
        
        if perf.get("avg_latency", 0) > 5:
            recommendations.append({
                "priority": "MEDIUM",
                "area": "Performance",
                "issue": f"Avg response time is {perf.get('avg_latency', 0):.2f}s, above 5s target",
                "suggestion": "Optimize retrieval or consider API tier upgrade"
            })
        
        if kb.get("with_inline_citations", 0) / kb.get("total_questions", 1) < 0.80:
            recommendations.append({
                "priority": "LOW",
                "area": "Citations",
                "issue": "Less than 80% of responses include inline citations",
                "suggestion": "Emphasize citation requirements in system prompt"
            })
        
        if not recommendations:
            recommendations.append({
                "priority": "INFO",
                "area": "System Status",
                "issue": "All metrics within acceptable ranges",
                "suggestion": "Continue monitoring and maintain current configuration"
            })
        
        self.results["recommendations"] = recommendations
    
    def print_report(self):
        """Print comprehensive report to console."""
        print("\n" + "="*80)
        print("COMPREHENSIVE TEST REPORT")
        print("="*80)
        
        summary = self.results["summary"]
        kb = self.results["kb_tests"]
        web = self.results["web_tests"]
        perf = self.results["performance_metrics"]
        
        print(f"\n📊 OVERALL RESULTS")
        print(f"  Grade: {summary['grade']}")
        print(f"  Success Rate: {summary['overall_success_rate']:.1%}")
        print(f"  Total Tests: {summary['total_tests_run']}")
        print(f"  Passed: {summary['total_passed']}")
        print(f"  Failed: {summary['total_failed']}")
        print(f"  Duration: {self.results['test_duration_seconds']:.1f}s")
        
        print(f"\n📚 KNOWLEDGE BASE TESTS")
        print(f"  Success Rate: {kb.get('success_rate', 0):.1%} ({kb.get('successful', 0)}/{kb.get('total_questions', 0)})")
        print(f"  Avg Keyword Coverage: {kb.get('avg_keyword_coverage', 0):.1%}")
        print(f"  Avg Confidence: {kb.get('avg_confidence', 0):.1%}")
        print(f"  With Sources: {kb.get('with_sources', 0)}/{kb.get('total_questions', 0)}")
        print(f"  With Inline Citations: {kb.get('with_inline_citations', 0)}/{kb.get('total_questions', 0)}")
        print(f"  Avg Response Time: {kb.get('avg_response_time', 0):.2f}s")
        
        print(f"\n  By Difficulty:")
        for diff, stats in kb.get('by_difficulty', {}).items():
            if stats['total'] > 0:
                rate = stats['success'] / stats['total']
                print(f"    {diff.capitalize()}: {stats['success']}/{stats['total']} ({rate:.1%})")
        
        if web.get('total_questions', 0) > 0:
            print(f"\n🌐 WEB FALLBACK TESTS")
            print(f"  Total Questions: {web.get('total_questions', 0)}")
            print(f"  Web Search Triggered: {web.get('triggered_web_search', 0)}/{web.get('total_questions', 0)}")
            print(f"  Avg Response Time: {web.get('avg_response_time', 0):.2f}s")
        
        print(f"\n⚡ PERFORMANCE METRICS")
        print(f"  Avg Latency: {perf.get('avg_latency', 0):.2f}s")
        print(f"  Min Latency: {perf.get('min_latency', 0):.2f}s")
        print(f"  Max Latency: {perf.get('max_latency', 0):.2f}s")
        
        if kb.get('failed_questions'):
            print(f"\n❌ FAILED QUESTIONS ({len(kb['failed_questions'])})")
            for fq in kb['failed_questions'][:5]:  # Show first 5
                print(f"  {fq['id']}: {fq['question'][:60]}...")
                if 'keyword_coverage' in fq:
                    print(f"    Coverage: {fq['keyword_coverage']:.1%}, Reason: {fq.get('reason', 'Unknown')}")
        
        print(f"\n💡 RECOMMENDATIONS")
        for rec in self.results.get('recommendations', []):
            print(f"  [{rec['priority']}] {rec['area']}")
            print(f"    Issue: {rec['issue']}")
            print(f"    → {rec['suggestion']}")
        
        print("\n" + "="*80)
    
    def save_report(self, output_path: str):
        """Save report to JSON file."""
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"\n💾 Report saved to: {output_path}")
    
    def run(self, kb_questions: List[Dict] = None, web_questions: List[Dict] = None):
        """Run complete test suite."""
        self.start_time = time.time()
        
        print("="*80)
        print("UNIFIED SYSTEM TESTING SUITE")
        print("="*80)
        print(f"Start time: {self.results['timestamp']}")
        
        # Health check
        if not self.check_system_health():
            print("\n❌ System health check failed. Please start the backend server.")
            print("   Run: uvicorn backend.main:app --reload")
            return False
        
        # Load and test knowledge base questions
        kb_qs = kb_questions if kb_questions else load_kb_questions()
        if not kb_qs:
            print("\n⚠️  No KB questions loaded, skipping KB tests")
        else:
            self.results["kb_tests"] = self.test_kb_questions(kb_qs)
        
        # Web fallback tests (optional)
        if web_questions:
            self.results["web_tests"] = self.test_web_fallback(web_questions)
        else:
            # Skip web tests by default
            self.results["web_tests"] = {
                "total_questions": 0,
                "message": "Web fallback tests skipped"
            }
        
        # Performance tests
        self.results["performance_metrics"] = self.measure_performance()
        
        # Calculate duration
        self.results["test_duration_seconds"] = time.time() - self.start_time
        
        # Generate summary
        self.generate_summary()
        
        # Print report
        self.print_report()
        
        return True


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Unified System Testing Suite")
    parser.add_argument(
        "--output",
        default="presentation_results/system_test_report.json",
        help="Output path for JSON report"
    )
    parser.add_argument(
        "--questions",
        type=int,
        default=None,
        help="Limit number of KB questions to test (default: all 30)"
    )
    parser.add_argument(
        "--dataset",
        default=KB_QUESTIONS_PATH,
        help="Path to KB questions dataset JSON file"
    )
    
    args = parser.parse_args()
    
    # Load questions from dataset
    print(f"Loading questions from: {args.dataset}")
    all_kb_questions = load_kb_questions(args.dataset)
    print(f"Loaded {len(all_kb_questions)} KB questions")
    
    # Limit questions if specified
    kb_qs = all_kb_questions[:args.questions] if args.questions else all_kb_questions
    
    if not kb_qs:
        print("❌ No questions loaded. Exiting.")
        sys.exit(2)
    
    print(f"Testing with {len(kb_qs)} KB questions")
    
    # Run tests
    tester = SystemTester()
    success = tester.run(kb_questions=kb_qs, web_questions=None)
    
    if success:
        tester.save_report(args.output)
        
        # Exit code based on success rate
        if tester.results["summary"]["overall_success_rate"] >= 0.80:
            sys.exit(0)  # Success
        else:
            sys.exit(1)  # Failed to meet threshold
    else:
        sys.exit(2)  # System health check failed


if __name__ == "__main__":
    main()
