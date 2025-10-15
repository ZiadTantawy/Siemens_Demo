#!/usr/bin/env python3
"""
Setup Testing Framework
=======================
Quick setup script to validate testing framework installation.
"""
import subprocess
import sys
from pathlib import Path

def main():
    print("="*80)
    print("TESTING FRAMEWORK SETUP")
    print("="*80)
    
    # Check if requirements are installed
    print("\n[1] Checking dependencies...")
    try:
        import pytest
        import langchain
        from qdrant_client import QdrantClient
        import pymongo
        print("✅ Core dependencies installed")
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("\nInstalling dependencies...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
    
    # Check test files exist
    print("\n[2] Checking test files...")
    test_files = [
        "tests/__init__.py",
        "tests/test_config.py",
        "tests/metrics.py",
        "tests/test_accuracy.py",
        "tests/test_web_fallback.py",
        "tests/test_performance.py",
        "tests/run_comprehensive_tests.py",
        "tests/quick_test.py",
        "tests/README.md"
    ]
    
    all_exist = True
    for file in test_files:
        if Path(file).exists():
            print(f"  ✅ {file}")
        else:
            print(f"  ❌ {file} - MISSING")
            all_exist = False
    
    if not all_exist:
        print("\n❌ Some test files are missing!")
        sys.exit(1)
    
    print("\n✅ All test files present")
    
    # Check infrastructure
    print("\n[3] Checking infrastructure...")
    infrastructure_ok = True
    
    # Check Qdrant
    try:
        from qdrant_client import QdrantClient
        client = QdrantClient(host="localhost", port=6333)
        client.get_collections()
        print("  ✅ Qdrant is running")
    except Exception as e:
        print(f"  ⚠️  Qdrant connection issue: {e}")
        print("     Start with: docker-compose up -d")
        infrastructure_ok = False
    
    # Check MongoDB
    try:
        from pymongo import MongoClient
        client = MongoClient("mongodb://localhost:27020/", serverSelectionTimeoutMS=2000)
        client.server_info()
        print("  ✅ MongoDB is running")
    except Exception as e:
        print(f"  ⚠️  MongoDB connection issue: {e}")
        print("     Start with: docker-compose up -d")
        infrastructure_ok = False
    
    # Summary
    print("\n" + "="*80)
    print("SETUP SUMMARY")
    print("="*80)
    
    if all_exist and infrastructure_ok:
        print("\n✅ Testing framework is fully set up and ready!")
        print("\nNext steps:")
        print("  1. Run quick validation:")
        print("     python tests/quick_test.py")
        print("\n  2. Run comprehensive tests:")
        print("     python tests/run_comprehensive_tests.py")
        print("\n  3. View reports in test_reports/")
    elif all_exist and not infrastructure_ok:
        print("\n⚠️  Testing framework files are ready, but infrastructure needs to be started.")
        print("\nStart infrastructure:")
        print("  docker-compose up -d")
        print("\nThen run tests:")
        print("  python tests/quick_test.py")
    else:
        print("\n❌ Setup incomplete. Please check error messages above.")
    
    print("="*80)

if __name__ == "__main__":
    main()
