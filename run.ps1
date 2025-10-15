# Quick Run Script - Start Everything with One Command
# Run this with: .\run.ps1

Write-Host "================================================================================================" -ForegroundColor Cyan
Write-Host "                    SIEMENS RAG CHATBOT - QUICK START                                           " -ForegroundColor Cyan
Write-Host "================================================================================================" -ForegroundColor Cyan

$ErrorActionPreference = "Continue"

# Step 1: Check Prerequisites
Write-Host "`n[1/7] Checking Prerequisites..." -ForegroundColor Yellow
Write-Host "----------------------------------------"

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found! Please install Python 3.10+" -ForegroundColor Red
    exit 1
}

# Check Docker
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "✅ Docker: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not found! Please install Docker Desktop" -ForegroundColor Red
    exit 1
}

# Check .env file
if (Test-Path .env) {
    Write-Host "✅ .env file exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env file not found! Creating template..." -ForegroundColor Yellow
    @"
# API Configuration
API_KEY=your_api_key_here
CHAT_MODEL=gpt-3.5-turbo
EMBED_MODEL=text-embedding-ada-002

# Qdrant Configuration
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_COLLECTION=pdf_docs

# MongoDB Configuration
MONGODB_HOST=localhost
MONGODB_PORT=27020
MONGODB_DATABASE=internal_chatbot
"@ | Out-File -FilePath .env -Encoding utf8
    Write-Host "⚠️  Please edit .env file and add your API key!" -ForegroundColor Yellow
    Write-Host "   Then run this script again." -ForegroundColor Yellow
    exit 1
}

# Step 2: Install Dependencies
Write-Host "`n[2/7] Installing Python Dependencies..." -ForegroundColor Yellow
Write-Host "----------------------------------------"
pip install -r requirements.txt --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some dependencies may have issues, continuing..." -ForegroundColor Yellow
}

# Step 3: Start Docker Services
Write-Host "`n[3/7] Starting Docker Services (MongoDB & Qdrant)..." -ForegroundColor Yellow
Write-Host "----------------------------------------"
docker-compose up -d
Start-Sleep -Seconds 10

# Check if services are running
$qdrantRunning = docker ps | Select-String "qdrant"
$mongoRunning = docker ps | Select-String "mongo"

if ($qdrantRunning -and $mongoRunning) {
    Write-Host "✅ Docker services started successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some services may not be running" -ForegroundColor Yellow
}

# Step 4: Test Connections
Write-Host "`n[4/7] Testing Service Connections..." -ForegroundColor Yellow
Write-Host "----------------------------------------"

# Test Qdrant
try {
    $response = Invoke-WebRequest -Uri http://localhost:6333/health -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Qdrant: Connected" -ForegroundColor Green
} catch {
    Write-Host "❌ Qdrant: Connection failed" -ForegroundColor Red
}

# Test MongoDB
try {
    python -c "from pymongo import MongoClient; c = MongoClient('mongodb://localhost:27020/', serverSelectionTimeoutMS=2000); c.server_info()" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MongoDB: Connected" -ForegroundColor Green
    } else {
        Write-Host "❌ MongoDB: Connection failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ MongoDB: Connection failed" -ForegroundColor Red
}

# Step 5: Check Document Ingestion
Write-Host "`n[5/7] Checking Document Ingestion..." -ForegroundColor Yellow
Write-Host "----------------------------------------"

$pdfCount = (Get-ChildItem backend\pdfs\*.pdf -ErrorAction SilentlyContinue).Count
Write-Host "📄 PDFs in backend/pdfs/: $pdfCount"

if ($pdfCount -eq 0) {
    Write-Host "⚠️  No PDFs found in backend/pdfs/" -ForegroundColor Yellow
    Write-Host "   Please add your PDF documents to backend/pdfs/" -ForegroundColor Yellow
    Write-Host "   Then run: python backend/ingest_pdfs_qdrant.py" -ForegroundColor Yellow
} else {
    $ingest = Read-Host "`nDo you want to ingest PDFs into Qdrant? (y/n)"
    if ($ingest -eq "y" -or $ingest -eq "Y") {
        Write-Host "`nIngesting documents..." -ForegroundColor Yellow
        python backend/ingest_pdfs_qdrant.py
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Documents ingested successfully" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Ingestion may have had issues" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⏭️  Skipping ingestion" -ForegroundColor Gray
    }
}

# Step 6: Run Quick Validation
Write-Host "`n[6/7] Running Quick Validation..." -ForegroundColor Yellow
Write-Host "----------------------------------------"
python tests/quick_test.py

# Step 7: Show Options
Write-Host "`n[7/7] What would you like to do?" -ForegroundColor Yellow
Write-Host "================================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Test RAG directly (fastest)" -ForegroundColor White
Write-Host "   python test_complete_rag.py" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start API server" -ForegroundColor White
Write-Host "   python backend/main.py" -ForegroundColor Gray
Write-Host "   Then in another terminal: python test_api.py" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Run comprehensive tests" -ForegroundColor White
Write-Host "   python tests/run_comprehensive_tests.py" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Run specific test type" -ForegroundColor White
Write-Host "   python tests/test_accuracy.py" -ForegroundColor Gray
Write-Host "   python tests/test_performance.py" -ForegroundColor Gray
Write-Host "   python tests/test_web_fallback.py" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Generate visualizations" -ForegroundColor White
Write-Host "   python tests/visualize_results.py" -ForegroundColor Gray
Write-Host ""
Write-Host "================================================================================================" -ForegroundColor Cyan

$choice = Read-Host "`nEnter your choice (1-5, or 'q' to quit)"

switch ($choice) {
    "1" {
        Write-Host "`nStarting RAG test..." -ForegroundColor Green
        python test_complete_rag.py
    }
    "2" {
        Write-Host "`nStarting API server..." -ForegroundColor Green
        Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
        Write-Host "API will be available at: http://localhost:8000" -ForegroundColor Cyan
        Write-Host "Swagger UI: http://localhost:8000/docs" -ForegroundColor Cyan
        python backend/main.py
    }
    "3" {
        Write-Host "`nRunning comprehensive tests..." -ForegroundColor Green
        python tests/run_comprehensive_tests.py
        Write-Host "`n✅ Check test_reports/ folder for results" -ForegroundColor Green
    }
    "4" {
        Write-Host "`nWhich test would you like to run?" -ForegroundColor Yellow
        Write-Host "  a. Accuracy" -ForegroundColor White
        Write-Host "  b. Performance" -ForegroundColor White
        Write-Host "  c. Web Fallback" -ForegroundColor White
        $testChoice = Read-Host "`nEnter choice (a/b/c)"
        
        switch ($testChoice) {
            "a" { python tests/test_accuracy.py }
            "b" { python tests/test_performance.py }
            "c" { python tests/test_web_fallback.py }
            default { Write-Host "Invalid choice" -ForegroundColor Red }
        }
    }
    "5" {
        Write-Host "`nGenerating visualizations..." -ForegroundColor Green
        python tests/visualize_results.py
        Write-Host "`n✅ Check test_reports/ folder for images" -ForegroundColor Green
    }
    "q" {
        Write-Host "`nExiting..." -ForegroundColor Gray
    }
    default {
        Write-Host "`nInvalid choice. Run script again to choose an option." -ForegroundColor Yellow
    }
}

Write-Host "`n================================================================================================" -ForegroundColor Cyan
Write-Host "                              Script Completed!                                                 " -ForegroundColor Cyan
Write-Host "================================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 For detailed guides, see:" -ForegroundColor White
Write-Host "   - RUN_AND_TEST_GUIDE.md - Complete step-by-step guide" -ForegroundColor Gray
Write-Host "   - QUICK_START_TESTING.md - Quick start guide" -ForegroundColor Gray
Write-Host "   - tests/README.md - Testing documentation" -ForegroundColor Gray
Write-Host ""
