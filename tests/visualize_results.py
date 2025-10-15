#!/usr/bin/env python3
"""
Test Results Visualization
===========================
Generates visual reports from test results (optional - requires matplotlib).
"""
import json
import sys
from pathlib import Path

try:
    import matplotlib.pyplot as plt
    import matplotlib
    matplotlib.use('Agg')  # Use non-interactive backend
    MATPLOTLIB_AVAILABLE = True
except ImportError:
    MATPLOTLIB_AVAILABLE = False
    print("⚠️  Matplotlib not installed. Install with: pip install matplotlib")


def visualize_accuracy_results(report_path: str, output_dir: str = "test_reports"):
    """Generate accuracy visualization charts."""
    if not MATPLOTLIB_AVAILABLE:
        print("Cannot generate visualizations without matplotlib")
        return
    
    with open(report_path, 'r') as f:
        report = json.load(f)
    
    # Create figure with subplots
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle('RAG System Accuracy Report', fontsize=16, fontweight='bold')
    
    # 1. Retrieval Success Rates
    ax1 = axes[0, 0]
    retrieval = report['retrieval_accuracy']
    categories = ['Successful', 'Failed']
    values = [retrieval['successful_retrievals'], retrieval['failed_retrievals']]
    colors = ['#2ecc71', '#e74c3c']
    ax1.pie(values, labels=categories, autopct='%1.1f%%', colors=colors, startangle=90)
    ax1.set_title('Retrieval Success Rate')
    
    # 2. Response Metrics
    ax2 = axes[0, 1]
    response = report['response_accuracy']
    metrics = ['Success\nRate', 'Keyword\nCoverage', 'Hallucination\nRate (inv)']
    values = [
        response['success_rate'] * 100,
        response['average_keyword_coverage'] * 100,
        (1 - response['hallucination_rate']) * 100
    ]
    bars = ax2.bar(metrics, values, color=['#3498db', '#9b59b6', '#1abc9c'])
    ax2.set_ylabel('Percentage (%)')
    ax2.set_title('Response Accuracy Metrics')
    ax2.set_ylim(0, 100)
    ax2.axhline(y=80, color='r', linestyle='--', alpha=0.3, label='Target: 80%')
    ax2.legend()
    
    # Add value labels on bars
    for bar in bars:
        height = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2., height,
                f'{height:.1f}%', ha='center', va='bottom')
    
    # 3. Timing Statistics
    ax3 = axes[1, 0]
    if 'average_retrieval_time' in retrieval:
        timing_data = {
            'Retrieval': retrieval.get('average_retrieval_time', 0),
            'Response': response.get('average_response_time', 0)
        }
        ax3.bar(timing_data.keys(), timing_data.values(), color=['#f39c12', '#e67e22'])
        ax3.set_ylabel('Time (seconds)')
        ax3.set_title('Average Processing Time')
        ax3.axhline(y=5.0, color='r', linestyle='--', alpha=0.3, label='Target: 5s')
        ax3.legend()
    
    # 4. Detailed Results Table
    ax4 = axes[1, 1]
    ax4.axis('off')
    
    summary_text = f"""
    SUMMARY STATISTICS
    
    Retrieval:
    • Total Queries: {retrieval['total_queries']}
    • Success Rate: {retrieval['success_rate']:.1%}
    • Avg Relevance: {retrieval['average_relevance_score']:.1%}
    • Above Threshold: {retrieval['above_threshold_rate']:.1%}
    
    Response:
    • Success Rate: {response['success_rate']:.1%}
    • Keyword Coverage: {response['average_keyword_coverage']:.1%}
    • Hallucination Rate: {response['hallucination_rate']:.1%}
    • Avg Response Time: {response.get('average_response_time', 0):.2f}s
    """
    
    ax4.text(0.1, 0.5, summary_text, fontsize=10, family='monospace',
             verticalalignment='center')
    
    plt.tight_layout()
    output_path = f"{output_dir}/accuracy_visualization.png"
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    print(f"✅ Accuracy visualization saved to: {output_path}")
    plt.close()


def visualize_performance_results(report_path: str, output_dir: str = "test_reports"):
    """Generate performance visualization charts."""
    if not MATPLOTLIB_AVAILABLE:
        print("Cannot generate visualizations without matplotlib")
        return
    
    with open(report_path, 'r') as f:
        report = json.load(f)
    
    # Create figure with subplots
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle('RAG System Performance Report', fontsize=16, fontweight='bold')
    
    # 1. Response Time Distribution
    ax1 = axes[0, 0]
    response_time = report['response_time']
    if 'all_times' in response_time:
        ax1.hist(response_time['all_times'], bins=20, color='#3498db', alpha=0.7, edgecolor='black')
        ax1.axvline(response_time['mean_time'], color='r', linestyle='--', 
                   label=f"Mean: {response_time['mean_time']:.2f}s")
        ax1.set_xlabel('Response Time (seconds)')
        ax1.set_ylabel('Frequency')
        ax1.set_title('Response Time Distribution')
        ax1.legend()
    
    # 2. Concurrent Load Performance
    ax2 = axes[0, 1]
    concurrent = report['concurrent_load']
    categories = ['Successful', 'Failed']
    values = [concurrent['successful_requests'], concurrent['failed_requests']]
    colors = ['#2ecc71', '#e74c3c']
    ax2.pie(values, labels=categories, autopct='%1.1f%%', colors=colors, startangle=90)
    ax2.set_title(f"Concurrent Load ({concurrent['num_concurrent']} concurrent)")
    
    # 3. Performance Metrics Comparison
    ax3 = axes[1, 0]
    metrics = {
        'Mean\nTime': response_time['mean_time'],
        'Median\nTime': response_time['median_time'],
        'Min\nTime': response_time['min_time'],
        'Max\nTime': response_time['max_time']
    }
    bars = ax3.bar(metrics.keys(), metrics.values(), color=['#3498db', '#9b59b6', '#2ecc71', '#e74c3c'])
    ax3.set_ylabel('Time (seconds)')
    ax3.set_title('Response Time Statistics')
    
    # Add value labels
    for bar in bars:
        height = bar.get_height()
        ax3.text(bar.get_x() + bar.get_width()/2., height,
                f'{height:.2f}s', ha='center', va='bottom')
    
    # 4. Sustained Load Summary
    ax4 = axes[1, 1]
    ax4.axis('off')
    
    sustained = report['sustained_load']
    summary_text = f"""
    PERFORMANCE SUMMARY
    
    Response Time Test:
    • Mean: {response_time['mean_time']:.3f}s
    • Median: {response_time['median_time']:.3f}s
    • Std Dev: {response_time['std_dev']:.3f}s
    
    Concurrent Load:
    • Total Time: {concurrent['total_time']:.2f}s
    • Throughput: {concurrent['throughput']:.2f} req/s
    • Success Rate: {concurrent['successful_requests']/concurrent['num_concurrent']:.1%}
    
    Sustained Load:
    • Duration: {sustained['actual_duration']:.1f}s
    • Total Requests: {sustained['total_requests']}
    • Success Rate: {sustained['successful_requests']/sustained['total_requests']:.1%}
    • Actual RPS: {sustained['actual_rps']:.2f}
    """
    
    if 'p95_response_time' in sustained:
        summary_text += f"\n    • P95: {sustained['p95_response_time']:.3f}s"
        summary_text += f"\n    • P99: {sustained['p99_response_time']:.3f}s"
    
    ax4.text(0.1, 0.5, summary_text, fontsize=10, family='monospace',
             verticalalignment='center')
    
    plt.tight_layout()
    output_path = f"{output_dir}/performance_visualization.png"
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    print(f"✅ Performance visualization saved to: {output_path}")
    plt.close()


def generate_all_visualizations(reports_dir: str = "test_reports"):
    """Generate all available visualizations."""
    print("\n" + "="*80)
    print("GENERATING VISUALIZATIONS")
    print("="*80)
    
    reports_path = Path(reports_dir)
    
    # Accuracy visualization
    accuracy_report = reports_path / "accuracy_report.json"
    if accuracy_report.exists():
        print("\n[1] Generating accuracy visualization...")
        try:
            visualize_accuracy_results(str(accuracy_report), reports_dir)
        except Exception as e:
            print(f"❌ Error: {e}")
    else:
        print(f"\n⚠️  Accuracy report not found: {accuracy_report}")
    
    # Performance visualization
    performance_report = reports_path / "performance_report.json"
    if performance_report.exists():
        print("\n[2] Generating performance visualization...")
        try:
            visualize_performance_results(str(performance_report), reports_dir)
        except Exception as e:
            print(f"❌ Error: {e}")
    else:
        print(f"\n⚠️  Performance report not found: {performance_report}")
    
    print("\n" + "="*80)
    print("VISUALIZATION COMPLETE")
    print("="*80)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate test result visualizations")
    parser.add_argument(
        "--reports-dir",
        type=str,
        default="test_reports",
        help="Directory containing test reports"
    )
    
    args = parser.parse_args()
    
    if not MATPLOTLIB_AVAILABLE:
        print("\n" + "="*80)
        print("MATPLOTLIB NOT INSTALLED")
        print("="*80)
        print("\nTo generate visualizations, install matplotlib:")
        print("  pip install matplotlib seaborn")
        print("\nThen run this script again.")
        print("="*80)
        sys.exit(1)
    
    generate_all_visualizations(args.reports_dir)
