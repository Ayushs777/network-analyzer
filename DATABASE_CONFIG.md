# Database Configuration Summary

## Current Setup

The Network Analyzer is configured with **Supabase PostgreSQL** as the primary database. This replaces the default SQLite and provides production-grade reliability, scalability, and security.

### Connection Details

**Database System**: PostgreSQL 17.6 (Supabase)  
**Connection Type**: Direct TCP/IP via psycopg2  
**SSL/TLS**: Enabled by default  
**Connection Pooling**: Enabled with `pool_pre_ping=True`

### Location of Configuration

- **Primary Config File**: `backend/.env`
- **Template File**: `backend/.env.example`
- **Connection Logic**: `backend/app/database.py`

## Database Tables

All tables are automatically created when the backend starts:

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE SCHEMA                              │
├──────────────┬──────────────────────────────────────────────────┤
│ Table Name   │ Purpose                                            │
├──────────────┼──────────────────────────────────────────────────┤
│ packets      │ Individual packet data from network sniffing      │
│ flows        │ Aggregated network flows/sessions                │
│ alerts       │ Security events and threat detections            │
│ ip_scores    │ IP reputation and risk scoring                   │
└──────────────┴──────────────────────────────────────────────────┘
```

### Table Details

#### packets

- Stores raw packet data
- Indexed on: `src_ip`, `dst_ip`, `timestamp`
- Retention: Configurable (default: all)

#### flows

- Aggregated bidirectional traffic flows
- Unique constraint on: `flow_id`
- Key fields: `src_ip`, `dst_ip`, `protocol`, `src_port`, `dst_port`

#### alerts

- Security events and anomalies
- Indexed on: `timestamp`, `level`
- Key fields: `source_ip`, `level`, `description`

#### ip_scores

- IP reputation and risk calculation
- Indexed on: `ip_address`
- Key fields: `ip_address`, `score`, `risk_level`

## Configuration Steps

### Step 1: Create Supabase Project

1. Visit https://supabase.com
2. Create new project
3. Choose region and set strong password

### Step 2: Get Connection String

From Supabase Project Settings → Database:

```
postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

### Step 3: Update .env

Edit `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres
```

### Step 4: Verify Connection

```bash
cd backend
python -c "
from app.database import engine
from sqlalchemy import inspect
inspector = inspect(engine)
print('Connected:', inspector.get_table_names())
"
```

## Connection String Format

```
postgresql://[user]:[password]@[host]:[port]/[database]
```

### URL Encoding for Special Characters

If your password contains special characters, they must be URL-encoded:

| Character | Encoding |
| --------- | -------- |
| `@`       | `%40`    |
| `:`       | `%3A`    |
| `/`       | `%2F`    |
| `#`       | `%23`    |
| `?`       | `%3F`    |
| `&`       | `%26`    |
| `=`       | `%3D`    |
| `%`       | `%25`    |

### Example with Special Characters

```
# Password: myPass@word#123
DATABASE_URL=postgresql://postgres:myPass%40word%23123@db.xxxxx.supabase.co:5432/postgres
```

## Switching Between Databases

### SQLite (Development)

```env
DATABASE_URL=sqlite:///./network_analyzer.db
```

### PostgreSQL (Any Host)

```env
DATABASE_URL=postgresql://user:password@host:5432/database
```

### Supabase (Production)

```env
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

The backend automatically detects the database type and configures appropriately.

## Database Initialization

When the backend starts, it:

1. Reads `DATABASE_URL` from `.env`
2. Connects to the database
3. Creates tables if they don't exist (via SQLAlchemy declarative base)
4. Validates schema
5. Starts accepting API requests

### Manual Schema Creation

```python
import sys
sys.path.insert(0, 'backend')
from app.database import engine, Base
from app import models

# Create all tables
Base.metadata.create_all(bind=engine)
```

## Data Flow

```
┌──────────────────┐
│  Packet Sniffer  │
│    (scapy)       │
└────────┬─────────┘
         │ Raw packets
         ▼
┌──────────────────┐
│  Flow Analyzer   │
│ (aggregation)    │
└────────┬─────────┘
         │ Flows + packets
         ▼
┌──────────────────┐
│  Threat Detector │
│ (ML models)      │
└────────┬─────────┘
         │ Alerts + scores
         ▼
┌──────────────────┐
│ Database Layer   │
│  (SQLAlchemy)    │
└────────┬─────────┘
         │ ORM operations
         ▼
┌──────────────────┐
│    Supabase      │
│  PostgreSQL      │
└──────────────────┘
```

## Backup & Recovery

### Supabase Backups

- Automatic daily backups (retained for 7 days)
- Point-in-time recovery available
- Enable in Project Settings → Backups

### Export Data

```bash
# Export all data to SQL
pg_dump -h db.xxxxx.supabase.co -U postgres -d postgres > backup.sql

# Export specific table to CSV
psql -h db.xxxxx.supabase.co -U postgres -d postgres \
  -c "\COPY flows TO 'flows.csv' WITH CSV HEADER"
```

### Import Data

```bash
# Restore from SQL backup
psql -h db.xxxxx.supabase.co -U postgres -d postgres < backup.sql

# Import from CSV
psql -h db.xxxxx.supabase.co -U postgres -d postgres \
  -c "\COPY flows FROM 'flows.csv' WITH CSV HEADER"
```

## Performance Considerations

### Indexing Strategy

- All frequently queried columns are indexed
- Foreign keys have indexes for join operations
- `flow_id` has unique constraint for integrity

### Query Optimization

- Connection pooling reduces overhead
- `pool_pre_ping=True` validates connections before use
- Batch operations for high-throughput writes

### Monitoring

```sql
-- Check active connections
SELECT pid, usename, application_name, state FROM pg_stat_activity;

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables WHERE schemaname = 'public';

-- Check slow queries
SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```

## Security Configuration

### Database User Privileges

Recommended minimum permissions:

```sql
CREATE ROLE analyzer WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE postgres TO analyzer;
GRANT USAGE ON SCHEMA public TO analyzer;
GRANT CREATE ON SCHEMA public TO analyzer;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO analyzer;
```

### Row-Level Security (RLS)

Example policy for multi-tenant setup:

```sql
ALTER TABLE packets ENABLE ROW LEVEL SECURITY;
CREATE POLICY packets_isolation ON packets
  FOR SELECT USING (auth.uid() = user_id);
```

### Connection Limits

Set in Supabase Project Settings → Database:

- Default: 100 connections
- Adjust based on concurrent user load

## Troubleshooting

### Connection Issues

```python
# Test connection
from app.database import engine
with engine.connect() as conn:
    result = conn.execute("SELECT 1")
    print("Connected OK")
```

### Data Verification

```python
from app.database import SessionLocal
from app import models

db = SessionLocal()
print(f"Total packets: {db.query(models.Packet).count()}")
print(f"Total flows: {db.query(models.Flow).count()}")
print(f"Total alerts: {db.query(models.Alert).count()}")
db.close()
```

### Query Performance

```python
# Enable SQLAlchemy logging
import logging
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
```

## Migration From SQLite

If you need to migrate from SQLite to Supabase:

1. **Export from SQLite**

   ```bash
   sqlite3 network_analyzer.db .dump > export.sql
   ```

2. **Transform SQL** (SQLite → PostgreSQL compatibility)
   - Remove SQLite-specific syntax
   - Adjust data types if needed

3. **Import to Supabase**

   ```bash
   psql -h db.xxxxx.supabase.co -U postgres -d postgres < export.sql
   ```

4. **Update DATABASE_URL** in `.env`

5. **Verify data integrity**
   ```python
   # Compare row counts between old and new database
   ```

## Resources

- **Supabase Documentation**: https://supabase.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/17/
- **SQLAlchemy ORM**: https://docs.sqlalchemy.org/
- **psycopg2 Driver**: https://www.psycopg.org/

---

**Configuration Last Verified**: April 20, 2026  
**Database Engine**: PostgreSQL 17.6  
**Status**: Production Ready
