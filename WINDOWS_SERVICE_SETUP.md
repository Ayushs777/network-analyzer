# Network Analyzer - Windows Service Setup

# This guide explains how to run the backend as a Windows Service

## Prerequisites

- NSSM (Non-Sucking Service Manager) - Download from: https://nssm.cc/download
- Administrator access on Windows

## Setup Steps

### 1. Download NSSM

Download the appropriate version (32-bit or 64-bit) and extract it.

### 2. Install as Service

Open Command Prompt as Administrator:

```cmd
# Navigate to NSSM directory
cd C:\path\to\nssm-2.24\win64

# Install the service
nssm install NetworkAnalyzerAPI "C:\path\to\venv\Scripts\python.exe" "-m gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000"

# Set working directory
nssm set NetworkAnalyzerAPI AppDirectory "C:\path\to\network-analyzer\backend"

# Set startup type to automatic
nssm set NetworkAnalyzerAPI Start SERVICE_AUTO_START
```

### 3. Start/Stop Service

```cmd
# Start the service
net start NetworkAnalyzerAPI

# Stop the service
net stop NetworkAnalyzerAPI

# Remove the service (if needed)
nssm remove NetworkAnalyzerAPI confirm
```

### 4. View Service Status

```cmd
# In Services app (services.msc), look for "NetworkAnalyzerAPI"
```

## Troubleshooting

Check logs at: `C:\path\to\network-analyzer\backend\` for error logs.

Monitor with Task Manager or Resource Monitor to verify the service is running.
