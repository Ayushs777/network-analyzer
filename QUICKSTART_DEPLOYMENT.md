# Quick Start Deployment Guide

## 📋 Deployment Checklist

Your project is ready for deployment. Everything is configured and built.

✅ Backend `.env` configured with SQLite database  
✅ Frontend production build complete (`frontend/dist/`)  
✅ API endpoints ready on port `8000`  
✅ Deployment helper scripts provided

---

## 🚀 Option 1: Windows Deployment (Quick Start)

### Backend

1. Open Command Prompt as **Administrator**
2. Navigate to project directory
3. Run: `start-backend.bat`

Backend will start on `http://localhost:8000`

### Frontend

Serve `frontend/dist/` using any of:

- **IIS** (built-in on Windows Pro/Enterprise)
- **Apache HTTP Server**
- **Nginx for Windows**
- **Python SimpleHTTPServer**: `cd frontend/dist && python -m http.server 8080`

---

## 🐧 Option 2: Linux/Raspberry Pi Deployment

### Quick Setup (All-in-one)

```bash
cd /path/to/network-analyzer
chmod +x setup-production.sh
./setup-production.sh
```

This will:

- Create Python virtual environment
- Install all dependencies
- Build frontend
- Create `.env` configuration

### Start Backend as Service

```bash
sudo cp LINUX_SERVICE_SETUP.md /tmp/setup.md
# Follow the instructions in that file to create a systemd service
```

Then:

```bash
sudo systemctl start network-analyzer
sudo systemctl status network-analyzer
```

### Setup Frontend (Nginx)

```bash
sudo apt install nginx
sudo cp nginx.conf.example /etc/nginx/sites-available/network-analyzer
sudo ln -s /etc/nginx/sites-available/network-analyzer /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

Access at `http://your-server-ip`

---

## 🪟 Option 3: Windows Service (Background Process)

See `WINDOWS_SERVICE_SETUP.md` for detailed NSSM setup instructions.

Quick version:

```cmd
nssm install NetworkAnalyzerAPI "C:\path\to\venv\Scripts\python.exe" "-m gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000"
nssm set NetworkAnalyzerAPI AppDirectory "C:\path\to\backend"
net start NetworkAnalyzerAPI
```

---

## 📊 Project Structure After Build

```
network-analyzer/
├── backend/
│   ├── venv/                    # Virtual environment
│   ├── app/                     # Source code
│   ├── network_analyzer.db      # SQLite database (created on first run)
│   └── .env                     # Configuration
├── frontend/
│   ├── dist/                    # Production build (ready to serve)
│   ├── src/                     # Source code
│   └── node_modules/            # npm packages
└── README.md
```

---

## 🔧 Configuration Reference

### Backend Environment (`backend/.env`)

```env
DATABASE_URL=postgresql://<supabase_db_user>:<supabase_db_password>@<supabase_host>.supabase.co:5432/<supabase_db_name>
```

For local development, you can also use SQLite:

```env
# DATABASE_URL=sqlite:///./network_analyzer.db
```

For other production PostgreSQL databases, change to:

```env
DATABASE_URL=postgresql://user:password@db-host:5432/network_analyzer
```

---

## 🌐 Accessing the Application

| Component   | URL                                        | Notes                                 |
| ----------- | ------------------------------------------ | ------------------------------------- |
| Frontend    | `http://localhost` or `http://your-server` | Served by web server                  |
| Backend API | `http://localhost:8000/api/`               | Direct access (proxied in production) |
| WebSocket   | `ws://localhost:8000/ws/`                  | Live packets and traffic              |

---

## 🛠️ Troubleshooting

### Backend won't start

```bash
# Check if port 8000 is in use
netstat -ano | findstr ":8000"  # Windows
lsof -i :8000                   # Linux

# Check logs
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload  # verbose mode
```

### Frontend shows blank page

- Verify `frontend/dist/` was built
- Check browser console for API errors (F12)
- Ensure backend is running
- If using proxy, verify `/api` is routed to backend

### Packet sniffing not working

- Run backend as **Administrator** / **root**
- On Windows: Run Command Prompt as Admin
- On Linux: Prefix with `sudo`

---

## 📚 Additional Resources

- `README.md` - Project overview and features
- `DEPLOYMENT.md` - Full deployment guide
- `LINUX_SERVICE_SETUP.md` - systemd service setup
- `WINDOWS_SERVICE_SETUP.md` - Windows Service setup
- `nginx.conf.example` - Nginx configuration template

---

## ⏱️ Typical Deployment Time

| Step           | Time          | Notes                   |
| -------------- | ------------- | ----------------------- |
| Backend setup  | 2-3 min       | venv + dependencies     |
| Frontend build | 15-20 sec     | Already done            |
| Configuration  | 1-2 min       | .env, web server config |
| Start services | 30 sec        | Usually instant         |
| **Total**      | **~5-10 min** | One-time setup          |

---

## 🎯 Next Steps

1. **Choose your platform** (Windows / Linux / other)
2. **Run the appropriate setup** from above
3. **Test access** to frontend and backend
4. **Configure firewall** if needed
5. **Set up SSL/HTTPS** for public access (use Let's Encrypt)
6. **Monitor logs** for any issues

---

Ready to deploy? Choose your platform above and follow the instructions! 🚀
