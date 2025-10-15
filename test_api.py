#!/usr/bin/env python3
"""
API Test Script - Tests the FastAPI endpoints
Run this after starting the server with: python backend/main.py
"""
import requests
import json

API_BASE = "http://localhost:8000"

print("=" * 80)
print("TESTING SIEMENS RAG CHATBOT API")
print("=" * 80)

# Test 1: Health check
print("\n[1] Testing Health Endpoint...")
print("-" * 80)
try:
    response = requests.get(f"{API_BASE}/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    if response.status_code == 200:
        print("✅ Health check passed!")
    else:
        print("❌ Health check failed!")
except Exception as e:
    print(f"❌ Error: {e}")
    print("   Make sure the server is running: python backend/main.py")

# Test 2: Root endpoint
print("\n[2] Testing Root Endpoint...")
print("-" * 80)
try:
    response = requests.get(f"{API_BASE}/")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    if response.status_code == 200:
        print("✅ Root endpoint passed!")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 3: Chat endpoint
print("\n[3] Testing Chat Endpoint...")
print("-" * 80)
try:
    payload = {
        "text": "Hello! What can you help me with?",
        "user_id": "test_user_123"
    }
    print(f"Request payload: {json.dumps(payload, indent=2)}")
    
    response = requests.post(
        f"{API_BASE}/api/v1/chat/send_message",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        print("✅ Chat endpoint passed!")
    else:
        print(f"Response: {response.text}")
        print("❌ Chat endpoint failed!")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 4: Another chat message
print("\n[4] Testing Chat with Technical Question...")
print("-" * 80)
try:
    payload = {
        "text": "What are the main topics covered in the documentation?",
        "user_id": "test_user_123"
    }
    print(f"Request payload: {json.dumps(payload, indent=2)}")
    
    response = requests.post(
        f"{API_BASE}/api/v1/chat/send_message",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Response message: {result.get('message', 'No message')[:300]}...")
        print("✅ Technical question passed!")
    else:
        print(f"Response: {response.text}")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 80)
print("API TEST COMPLETE")
print("=" * 80)
print("\nTo view interactive API docs:")
print("- Swagger UI: http://localhost:8000/docs")
print("- ReDoc: http://localhost:8000/redoc")
print("=" * 80)
