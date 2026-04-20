# NetViz SOC - Production Real-Time Network Traffic Analyzer

A professional-grade network security analysis platform with a high-performance SOC dashboard, live packet monitoring, and threat detection.

## ✅ Deployment Readiness

This project is ready for internal deployment with the following caveats:

- The backend uses **Scapy** for raw packet capture and requires elevated privileges or `root` access on the host.
- Default database is **SQLite**. For production use, switch to a managed database such as PostgreSQL and update `DATABASE_URL`.
- The frontend is built with **React + Vite** and can be served as a static app behind any web server.
- API requests are expected to be served from the same origin in production, or the frontend should be configured with `VITE_API_BASE`.

> For full deployment instructions, see `DEPLOYMENT.md`.

## 🌐 Project Structure

```text
network-analyzer/
├── backend/
│   ├── app/
│   │   ├── api/routes.py       # REST API endpoints and chat interface
│   │   ├── websocket/          # WebSocket live packet and traffic managers
│   │   ├── sniffer.py          # Packet capture engine using Scapy
│   │   ├── detector.py         # Threat detection and alert logic
│   │   ├── flow_analyzer.py    # Flow/session aggregation
│   │   ├── chatbot.py          # AI assistant question processing
│   │   ├── main.py             # FastAPI application entrypoint
├── frontend/
│   ├── public/                 # Static frontend assets
│   ├── src/
│   │   ├── components/         # Shared UI components
│   │   ├── pages/              # Dashboard and feature pages
│   │   └── App.jsx             # React app router
└── requirements.txt            # Python dependencies
```

## 📦 Prerequisites

- Python 3.9+
- Node.js 18+
- Git
- Administrator / root access for backend packet sniffing

## 🛠️ Local Development

### 1. Backend

```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r ../requirements.txt
cp .env.example .env
```

Update `backend/.env` if you want to change the database or set production values.

Run the backend locally:

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the app at `http://localhost:5173`.

## 🚀 Production Deployment

### Backend

For a production backend, use a process manager such as **Gunicorn** with Uvicorn workers:

```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
```

If you want to run directly with Uvicorn in production:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend

Build the frontend for production:

```bash
cd frontend
npm run build
```

Serve the `frontend/dist` directory with any static web server such as **Nginx**, **Caddy**, or **Apache**.

### Environment Variables

Create `backend/.env` from `backend/.env.example`.

Example values:

```env
DATABASE_URL=postgresql://<supabase_db_user>:<supabase_db_password>@<supabase_host>.supabase.co:5432/<supabase_db_name>
```

For local testing, you can also use SQLite:

```env
# DATABASE_URL=sqlite:///./network_analyzer.db
```

For other production databases, use a proper database URL, such as:

```env
DATABASE_URL=postgresql://user:password@db-host:5432/network_analyzer
```

## 📌 Notes & Best Practices

- Do not expose packet capture or admin endpoints to the public internet without strong authentication and network isolation.
- Use a dedicated security monitoring host when enabling raw packet sniffing.
- Replace the default SQLite backend for scale and reliability.
- Keep dependencies updated and run `npm audit` and `pip check` periodically.

## 📘 Additional Documentation

See `DEPLOYMENT.md` for full production deployment guidance, recommended architecture, troubleshooting, and optional Docker deployment patterns.

## 🧹 Clean Up

To reset the backend database during development:

```bash
rm backend/network_analyzer.db
```

## 📝 Credits

Developed as a SOC network analysis platform with real-time packet visualization and threat response.
