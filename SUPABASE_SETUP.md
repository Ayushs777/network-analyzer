# Supabase PostgreSQL Configuration

## Overview

The Network Analyzer project is configured to use **Supabase PostgreSQL** as the production database instead of the default SQLite. This provides a scalable, managed database solution with automatic backups and global access.

## Current Status

✅ **Connected**: The backend is currently connected to Supabase PostgreSQL  
✅ **Tables**: `packets`, `flows`, `alerts`, `ip_scores` are created and ready  
✅ **Verified**: PostgreSQL 17.6 running on Supabase infrastructure

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **New Project**
4. Enter project details:
   - **Name**: `network-analyzer` (or your preferred name)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose the region closest to your deployment target
5. Wait for the project to be created (2-3 minutes)

### 2. Get Your Database Credentials

Once your project is ready:

1. Go to **Project Settings** → **Database**
2. Copy the following information:
   - **Host**: Under "Connection parameters"
   - **Database**: Default is `postgres`
   - **User**: Default is `postgres`
   - **Password**: The password you set during creation
   - **Port**: Default is `5432`

### 3. Build the Connection String

Construct your `DATABASE_URL` in this format:

```
postgresql://<user>:<password>@<host>:5432/<database>
```

**Example** (with placeholder credentials):

```
postgresql://postgres:MySecurePassword123@db.ojdqiuvdaksfydnanbpv.supabase.co:5432/postgres
```

### 4. Configure the Backend

#### Option A: Set Environment Variable

1. Open `backend/.env`
2. Update or add the `DATABASE_URL` line:
   ```env
   DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>
   ```
3. Save the file

#### Option B: System Environment Variable (Production)

On your production server, set the environment variable before starting the backend:

**Windows:**

```powershell
$env:DATABASE_URL = "postgresql://user:password@host:5432/database"
```

**Linux/macOS:**

```bash
export DATABASE_URL="postgresql://user:password@host:5432/database"
```

### 5. Initialize the Database Schema

The first time the backend starts, it automatically creates all necessary tables:

```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The backend will:

1. Connect to Supabase
2. Create tables if they don't exist (via SQLAlchemy ORM)
3. Start accepting requests

## Database Schema

The following tables are automatically created:

| Table       | Purpose                           |
| ----------- | --------------------------------- |
| `packets`   | Raw packet capture data           |
| `flows`     | Aggregated network flows/sessions |
| `alerts`    | Security alerts and anomalies     |
| `ip_scores` | IP reputation scores              |

## Verification

To verify your Supabase connection is working:

```python
import sys
sys.path.insert(0, 'backend')
from app.database import engine
from sqlalchemy import inspect, text

inspector = inspect(engine)
print("Dialect:", engine.dialect.name)
print("Tables:", inspector.get_table_names())

with engine.connect() as conn:
    result = conn.execute(text("SELECT version()"))
    print("Server:", result.scalar())
```

## Security Best Practices

### 1. Protect Credentials

- **Never commit `.env` files** to Git
- Add `backend/.env` to `.gitignore` (already done)
- Use strong, unique passwords for Supabase

### 2. Database Access

- Use Supabase's **RLS (Row Level Security)** for fine-grained access control
- Limit database user permissions to only required operations
- Consider using a separate read-only user for analytics

### 3. Network Security

- Enable SSL/TLS for all connections (enabled by default in Supabase)
- Use firewall rules to restrict IP access if needed
- Monitor database activity via Supabase logs

### 4. Backups

- Supabase provides **automatic daily backups**
- Enable **point-in-time recovery** in project settings
- Regularly test backup restoration

## Troubleshooting

### Connection Refused

**Problem**: `psycopg2.OperationalError: connection refused`

**Solution**:

1. Verify the connection string is correct
2. Check that the Supabase project is running
3. Confirm network/firewall allows outbound HTTPS on port 5432

### Authentication Failed

**Problem**: `psycopg2.OperationalError: FATAL: invalid username/password`

**Solution**:

1. Double-check credentials in `.env`
2. If password contains special characters, ensure they're URL-encoded
3. Reset the database password in Supabase if unsure

### SSL/TLS Errors

**Problem**: `SSL: CERTIFICATE_VERIFY_FAILED`

**Solution**:

- This is typically resolved automatically by SQLAlchemy
- If persists, add to `DATABASE_URL`: `?sslmode=require`

## Migration from SQLite

If you're migrating from SQLite:

1. **Backup existing data** (SQLite database file)
2. **Export data** from SQLite tables
3. **Import into Supabase** using pgAdmin or SQL client
4. **Update DATABASE_URL** in `.env`
5. **Restart backend** and verify data integrity

## Performance Optimization

For production deployments:

1. **Connection Pooling**: Already enabled via `pool_pre_ping=True`
2. **Indexes**: Database tables have indexes on frequently queried columns
3. **Query Optimization**: Use `.limit()` for large result sets
4. **Caching**: Consider Redis for frequently accessed data

## Scaling Considerations

As your deployment grows:

| Metric                  | SQLite Limit | Supabase Option |
| ----------------------- | ------------ | --------------- |
| Concurrent Users        | ~5           | 1000+           |
| Database Size           | ~10GB        | Unlimited       |
| Backup Frequency        | Manual       | Automatic Daily |
| Geographic Distribution | Single Host  | Global          |

## Support

- **Supabase Documentation**: https://supabase.com/docs
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Project Issues**: Check the main README.md for project-specific support

## Next Steps

1. Create a Supabase account and project
2. Update `backend/.env` with your credentials
3. Restart the backend
4. Verify data is being written to Supabase
5. Configure monitoring and backups in Supabase dashboard
