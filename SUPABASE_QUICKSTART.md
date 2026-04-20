# Supabase Quick Reference

## In 5 Minutes

### 1. Create Supabase Project

```
1. Go to supabase.com
2. Click "New Project"
3. Set password (save it!)
4. Wait for it to create (2-3 min)
```

### 2. Get Your Connection String

```
Supabase Dashboard → Project Settings → Database → Connection parameters

Format: postgresql://postgres:PASSWORD@HOST:5432/postgres

Example:
postgresql://postgres:MyPassword123@db.abc123def.supabase.co:5432/postgres
```

### 3. Update Configuration

```bash
# Edit backend/.env
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:5432/postgres

# Replace PASSWORD and HOST with your actual values!
```

### 4. Start Backend

```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# Or with Gunicorn (production)
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
```

### 5. Verify It Works

```bash
curl http://localhost:8000/api/stats

# Should return JSON like:
# {"total_packets":0,"total_bytes":0,"total_flows":0,"total_alerts":0,"high_alerts":0}
```

## Current Status ✓

- PostgreSQL 17.6 on Supabase
- Tables: packets, flows, alerts, ip_scores
- Connection: Active and verified
- Status: Ready for production

## Environment Variable

```bash
# .env file location
backend/.env

# Current value (example)
DATABASE_URL=postgresql://postgres:Admin%407652082597@db.ojdqiuvdaksfydnanbpv.supabase.co:5432/postgres
```

## Common Issues

| Problem            | Fix                                              |
| ------------------ | ------------------------------------------------ |
| Connection refused | Check DATABASE_URL is correct                    |
| Auth failed        | Check password in URL (URL-encode special chars) |
| Slow connection    | Check network/firewall rules                     |
| Tables missing     | Backend will create them automatically on start  |

## Special Characters in Password

If your password has `@`, `#`, `:`, encode it:

```
Password: my@pass#123
URL: my%40pass%23123

@ = %40
# = %23
: = %3A
/ = %2F
```

## Backup Your .env

⚠️ **IMPORTANT**: Never commit `.env` to Git!

```bash
# Backup safely
cp backend/.env backend/.env.backup
chmod 600 backend/.env backend/.env.backup

# It's already in .gitignore - don't remove it!
cat backend/.gitignore  # Should contain .env
```

## Full Documentation

For complete setup instructions, see:

- **SUPABASE_SETUP.md** - Full guide with troubleshooting
- **DATABASE_CONFIG.md** - Schema and configuration details
- **DEPLOYMENT_CHECKLIST.md** - Production deployment steps

## Support Links

- Supabase Help: https://supabase.com/docs
- Database Issues: https://www.postgresql.org/docs/17/
- Project Issues: Check main README.md

---

**Status**: ✓ Ready for deployment  
**Database**: Supabase PostgreSQL 17.6  
**Verified**: April 20, 2026
