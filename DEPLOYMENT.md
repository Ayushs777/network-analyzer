# Deployment Guide for NetViz SOC

This document describes how to deploy the network analyzer project in development and production environments.

## 1. Readiness Checklist

Before deployment, confirm the following:

- [ ] Backend app starts successfully with `uvicorn` or `gunicorn`
- [ ] Frontend builds successfully with `npm run build`
- [ ] `backend/.env` is configured and the database path is valid
- [ ] Port `8000` is available for backend traffic
- [ ] Port `5173` or your chosen static server port is available for frontend traffic
- [ ] Administrative privileges are available for packet sniffing
- [ ] The host network is trusted and authorized for traffic capture

## 2. Deployment Architecture

The project consists of two separate layers:

- **Backend**: FastAPI application serving REST endpoints and WebSocket streams
- **Frontend**: React + Vite single-page application

Typically deployment looks like:

- `backend` on `http://localhost:8000`
- `frontend` served from a web server or CDN
- API and frontend together behind a reverse proxy in production

## 3. Environment Configuration

Copy the example env file:

```bash
cp backend/.env.example backend/.env
```

Recommended environment variables:

```env
DATABASE_URL=postgresql://<supabase_db_user>:<supabase_db_password>@<supabase_host>.supabase.co:5432/<supabase_db_name>
```

For local development, you can also use:

```env
# DATABASE_URL=sqlite:///./network_analyzer.db
```

For other production PostgreSQL databases, use a managed database URL such as:

```env
DATABASE_URL=postgresql://user:password@host:5432/network_analyzer
```

## 4. Local Deployment

### Backend

```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r ../requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## 5. Production Deployment

### Backend Production

Use Gunicorn with Uvicorn workers for production stability:

```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
```

If you are deploying to a Linux host, use a process supervisor like `systemd`, `supervisord`, or `pm2` to keep the service running.

### Frontend Production

Build the frontend:

```bash
cd frontend
npm install
npm run build
```

Then serve the `frontend/dist` directory using any static web server.

#### Example with Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/network-analyzer/frontend/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 6. Docker Deployment (Optional)

Docker can simplify deployment, but packet capture may require host-level privileges.

### Build and run manually

```bash
docker build -f backend/Dockerfile -t netviz-backend .
docker build -f frontend/Dockerfile -t netviz-frontend .

docker run -d --rm --name netviz-backend -p 8000:8000 netviz-backend

docker run -d --rm --name netviz-frontend -p 5173:80 netviz-frontend
```

### Docker Notes

- The backend container will require network privileges if you want Scapy to capture traffic.
- Docker containers are typically not ideal for raw packet sniffing on Windows.
- For production, run the backend on a trusted Linux host with `CAP_NET_RAW` or `--privileged`.

## 7. Security Considerations

- Do not expose raw packet capture hosts to public networks.
- Keep the backend API behind a secure reverse proxy and firewall.
- Use TLS for the frontend and backend if exposed externally.
- Replace SQLite with a production-grade DB for scaling.

## 8. Troubleshooting

### Backend fails to start

- Ensure port `8000` is not already in use.
- Confirm `DATABASE_URL` is valid.
- If packet sniffing fails, run with elevated privileges.

### Frontend fails to connect to API

- Make sure the backend is running at `http://localhost:8000`.
- If using a reverse proxy, ensure `/api` is proxied correctly.

### Blank dashboard or missing data

- Verify the backend is receiving packet flows and alert records.
- Check browser developer console for failed network requests.

## 9. What's Not Included

- User authentication guard for the frontend
- Production-grade security hardening for exposed APIs
- External threat intelligence integration

## 10. Helpful Commands

```bash
# Build frontend
cd frontend && npm run build

# Run backend locally
cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Install Python deps
pip install -r requirements.txt
```
