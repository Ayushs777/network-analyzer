# Network Analyzer - Linux systemd Service Setup

# This guide explains how to run the backend as a systemd service on Linux

## Prerequisites

- Linux (Ubuntu, Debian, CentOS, etc.)
- systemd installed (standard on most modern Linux distributions)
- Python 3.9+ with venv

## Setup Steps

### 1. Create systemd Service File

Create `/etc/systemd/system/network-analyzer.service`:

```ini
[Unit]
Description=Network Analyzer Backend Service
After=network.target

[Service]
Type=notify
User=pi
WorkingDirectory=/home/pi/network-analyzer/backend
Environment="PATH=/home/pi/network-analyzer/backend/venv/bin"
ExecStart=/home/pi/network-analyzer/backend/venv/bin/gunicorn \
    -w 4 \
    -k uvicorn.workers.UvicornWorker \
    app.main:app \
    --bind 0.0.0.0:8000

Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Replace `/home/pi/network-analyzer` with your actual project path.
Replace `pi` with your actual user account.

### 2. Enable and Start Service

```bash
# Reload systemd daemon
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable network-analyzer

# Start the service
sudo systemctl start network-analyzer

# Verify service is running
sudo systemctl status network-analyzer
```

### 3. Managing the Service

```bash
# Check status
sudo systemctl status network-analyzer

# View recent logs
sudo journalctl -u network-analyzer -n 50

# View live logs
sudo journalctl -u network-analyzer -f

# Stop the service
sudo systemctl stop network-analyzer

# Restart the service
sudo systemctl restart network-analyzer
```

## Setup Frontend (Nginx)

Install Nginx:

```bash
sudo apt install nginx
```

Create `/etc/nginx/sites-available/network-analyzer`:

```nginx
upstream backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name your-domain.com;

    root /home/pi/network-analyzer/frontend/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /ws/ {
        proxy_pass http://backend;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/network-analyzer /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

## Troubleshooting

### Service fails to start

```bash
sudo journalctl -u network-analyzer -n 100
```

### Port already in use

```bash
sudo lsof -i :8000
```

### Permission denied

Ensure the `User=` in the service file has proper permissions to the project directory.
