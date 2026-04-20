# Production Deployment Checklist

## Pre-Deployment Verification

- [x] Backend code tested and working
- [x] Frontend build tested and working
- [x] All dependencies installed (`pip check`: No broken requirements)
- [x] Supabase PostgreSQL connected and verified
- [x] Database tables created and accessible

## Database Setup (Supabase)

### Current Status

✅ **Active Connection**: PostgreSQL 17.6 on Supabase  
✅ **Tables Created**: `packets`, `flows`, `alerts`, `ip_scores`  
✅ **Connection String**: Configured in `backend/.env`

### Required Configuration Files

- [x] `backend/.env` - Contains `DATABASE_URL` for Supabase
- [x] `backend/.env.example` - Template with clear instructions
- [x] `SUPABASE_SETUP.md` - Complete setup and troubleshooting guide

## Backend Deployment

### Prerequisites

- [ ] Server with Python 3.9+
- [ ] 2GB RAM minimum
- [ ] Elevated privileges (for packet sniffing)
- [ ] Outbound HTTPS access to Supabase (port 5432)

### Installation Steps

1. **Clone repository**

   ```bash
   git clone <repo-url>
   cd network-analyzer
   ```

2. **Setup Python environment**

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Linux/macOS
   # or
   .\venv\Scripts\activate   # Windows
   ```

3. **Install dependencies**

   ```bash
   pip install -r ../requirements.txt
   ```

4. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env and add your Supabase DATABASE_URL
   ```

5. **Start backend**

   ```bash
   # Development
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

   # Production (with Gunicorn)
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
   ```

### Environment Variables to Set

```bash
# Supabase PostgreSQL connection
DATABASE_URL=postgresql://user:password@host:5432/database

# Optional thread limits (set on Windows to avoid OpenBLAS issues)
OPENBLAS_NUM_THREADS=1
OMP_NUM_THREADS=1
MKL_NUM_THREADS=1
NUMEXPR_NUM_THREADS=1
```

## Frontend Deployment

### Prerequisites

- [ ] Node.js 18+ installed
- [ ] npm or yarn package manager

### Installation Steps

1. **Build for production**

   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Output**
   - Build output: `frontend/dist/`
   - Serve with any static web server (Nginx, Apache, Caddy, etc.)

3. **Configure API proxy** (optional but recommended)
   - If backend and frontend are on different domains
   - Add to `frontend/.env.production`:
     ```
     VITE_API_BASE=https://your-api-domain.com
     ```

### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve frontend
    location / {
        root /var/www/network-analyzer/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy WebSocket connections
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## API Endpoints Verification

### Expected Endpoints

- `GET /api/stats` - Network statistics
- `GET /api/flows` - Flow records
- `GET /api/packets` - Packet records
- `GET /api/alerts` - Security alerts
- `POST /api/simulate` - Simulate traffic
- `WS /ws/live-packets` - WebSocket live packets
- `WS /ws/traffic` - WebSocket traffic stats

### Test Commands

```bash
# Test stats endpoint
curl http://localhost:8000/api/stats

# Test simulate endpoint
curl -X POST http://localhost:8000/api/simulate

# Test WebSocket (requires wscat or similar)
npm install -g wscat
wscat -c ws://localhost:8000/ws/live-packets
```

## Database Connection Verification

Run this Python script to verify Supabase connection:

```python
import sys
sys.path.insert(0, 'backend')
from app.database import engine
from sqlalchemy import inspect, text

# Check connection
inspector = inspect(engine)
print("Dialect:", engine.dialect.name)
print("Tables:", inspector.get_table_names())

# Check server version
with engine.connect() as conn:
    result = conn.execute(text("SELECT version()"))
    print("Server:", result.scalar())
```

## Security Checklist

- [ ] Database credentials are NOT in version control
- [ ] `.env` file is in `.gitignore`
- [ ] Use HTTPS in production (not HTTP)
- [ ] Configure Supabase RLS (Row Level Security)
- [ ] Enable database connection SSL (default in Supabase)
- [ ] Restrict API access (firewall, authentication)
- [ ] Monitor database activity and alerts
- [ ] Regular backup testing

## Performance Tuning

### Backend

- Use Gunicorn with multiple workers: `-w 4`
- Enable connection pooling (already enabled)
- Monitor CPU and memory usage

### Frontend

- Serve with gzip compression
- Enable HTTP/2
- Use CDN for static assets

### Database

- Regular maintenance (VACUUM, ANALYZE)
- Monitor query performance
- Create indexes on frequently queried columns

## Monitoring & Logging

### Backend Logs

```bash
# View logs (if using systemd)
journalctl -u network-analyzer-backend -f

# Or capture to file
python -m uvicorn app.main:app --log-config /etc/logging.ini
```

### Supabase Monitoring

1. Go to Supabase Dashboard
2. Check **Logs** → **Database Logs**
3. Monitor connection count and query performance
4. Set up alerts for CPU/memory usage

## Troubleshooting

| Issue                       | Solution                                            |
| --------------------------- | --------------------------------------------------- |
| Database connection refused | Verify DATABASE_URL and Supabase project is running |
| Packet sniffing not working | Run with elevated privileges/root access            |
| High memory usage           | Check for memory leaks; restart backend             |
| Slow database queries       | Add indexes; optimize queries; check Supabase logs  |
| WebSocket connection fails  | Check firewall rules for port 8000                  |

## Rollback Plan

If issues occur during deployment:

1. **Stop the new backend**

   ```bash
   sudo systemctl stop network-analyzer-backend
   ```

2. **Restore from backup** (if database issue)
   - Use Supabase's point-in-time recovery
   - Or restore from database backup

3. **Verify data integrity**
   - Run test queries
   - Check packet/flow counts

4. **Restart previous version** if needed

## Post-Deployment Steps

- [ ] Test all API endpoints
- [ ] Verify WebSocket connections
- [ ] Test packet sniffing (if enabled)
- [ ] Monitor resource usage
- [ ] Set up log aggregation
- [ ] Configure alerts and monitoring
- [ ] Document any customizations
- [ ] Schedule regular backups
- [ ] Plan disaster recovery procedures

## Support & Documentation

- **Supabase Setup**: See `SUPABASE_SETUP.md`
- **Project README**: See `README.md`
- **Quick Start**: See `QUICKSTART_DEPLOYMENT.md`
- **Linux Service Setup**: See `LINUX_SERVICE_SETUP.md`
- **Windows Service Setup**: See `WINDOWS_SERVICE_SETUP.md`
- **Deployment Guide**: See `DEPLOYMENT.md`

---

**Last Updated**: April 20, 2026  
**Status**: Ready for Production Deployment
