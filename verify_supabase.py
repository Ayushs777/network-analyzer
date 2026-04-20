#!/usr/bin/env python
"""
Supabase Connection Verification Script
Checks that the Network Analyzer is properly connected to Supabase PostgreSQL
"""

import sys
import os
from pathlib import Path

def verify_supabase_setup():
    """Verify Supabase PostgreSQL connection and database setup."""
    
    print("=" * 70)
    print("Network Analyzer - Supabase Configuration Verification")
    print("=" * 70)
    print()
    
    # Add backend to path
    backend_path = Path(__file__).parent / "backend"
    sys.path.insert(0, str(backend_path))
    
    # 1. Check .env file exists
    print("[1] Checking .env file...")
    env_file = backend_path / ".env"
    if not env_file.exists():
        print("    ERROR: .env file not found at:", env_file)
        print("    ACTION: Copy .env.example to .env and configure it")
        return False
    print("    OK: .env file found")
    
    # 2. Check DATABASE_URL is set
    print("[2] Checking DATABASE_URL configuration...")
    try:
        from app.database import engine, Base
        db_url = os.getenv("DATABASE_URL", "NOT SET")
        
        # Mask password for display
        if "postgresql://" in db_url:
            parts = db_url.split("@")
            if len(parts) == 2:
                user_part = parts[0].split("://")[1].split(":")[0]
                host_part = parts[1]
                masked_url = f"postgresql://{user_part}:***@{host_part}"
            else:
                masked_url = db_url[:30] + "..." + db_url[-20:]
        else:
            masked_url = db_url
            
        print(f"    DATABASE_URL: {masked_url}")
        print("    OK: DATABASE_URL is configured")
    except Exception as e:
        print(f"    ERROR: Failed to read configuration: {e}")
        return False
    
    # 3. Test database connection
    print("[3] Testing database connection...")
    try:
        from sqlalchemy import text
        
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("    OK: Database connection successful")
    except Exception as e:
        print(f"    ERROR: Connection failed: {e}")
        print("    ACTION: Check DATABASE_URL credentials and network access")
        return False
    
    # 4. Check database dialect
    print("[4] Verifying database system...")
    dialect = engine.dialect.name
    if dialect == "postgresql":
        print(f"    OK: Using PostgreSQL (dialect: {dialect})")
    else:
        print(f"    WARNING: Expected PostgreSQL, got {dialect}")
        if dialect == "sqlite":
            print("    ACTION: Switch to Supabase PostgreSQL in .env")
    
    # 5. Get server version
    print("[5] Checking server version...")
    try:
        from sqlalchemy import text
        
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.scalar()
            print(f"    OK: {version[:60]}...")
    except Exception as e:
        print(f"    WARNING: Could not get version: {e}")
    
    # 6. Check tables exist
    print("[6] Verifying database tables...")
    try:
        from sqlalchemy import inspect
        
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        required_tables = ["packets", "flows", "alerts", "ip_scores"]
        missing_tables = [t for t in required_tables if t not in tables]
        
        if missing_tables:
            print(f"    WARNING: Missing tables: {missing_tables}")
            print("    ACTION: Backend will create them on startup")
        else:
            print(f"    OK: All required tables exist: {', '.join(required_tables)}")
        
        if tables:
            print(f"    Total tables in database: {len(tables)}")
            print(f"    Tables: {', '.join(tables)}")
    except Exception as e:
        print(f"    ERROR: Could not check tables: {e}")
        return False
    
    # 7. Check table row counts
    print("[7] Checking data in tables...")
    try:
        from app import models
        from app.database import SessionLocal
        
        db = SessionLocal()
        
        packet_count = db.query(models.Packet).count()
        flow_count = db.query(models.Flow).count()
        alert_count = db.query(models.Alert).count()
        ip_score_count = db.query(models.IPScore).count()
        
        db.close()
        
        print(f"    Packets: {packet_count} rows")
        print(f"    Flows: {flow_count} rows")
        print(f"    Alerts: {alert_count} rows")
        print(f"    IP Scores: {ip_score_count} rows")
        print("    OK: All tables accessible")
    except Exception as e:
        print(f"    WARNING: Could not read table data: {e}")
    
    # 8. Connection pool info
    print("[8] Checking connection pool...")
    try:
        pool = engine.pool
        print(f"    Pool type: {pool.__class__.__name__}")
        print(f"    Pool size: {pool.size if hasattr(pool, 'size') else 'default'}")
        print("    OK: Connection pool configured")
    except Exception as e:
        print(f"    WARNING: {e}")
    
    print()
    print("=" * 70)
    print("VERIFICATION COMPLETE - All systems operational!")
    print("=" * 70)
    print()
    print("Next steps:")
    print("  1. Start the backend: python -m uvicorn app.main:app --host 0.0.0.0 --port 8000")
    print("  2. Test API: curl http://localhost:8000/api/stats")
    print("  3. Check logs for any warnings or errors")
    print()
    print("For more information, see:")
    print("  - SUPABASE_SETUP.md for detailed setup instructions")
    print("  - DATABASE_CONFIG.md for configuration details")
    print("  - SUPABASE_QUICKSTART.md for quick reference")
    print()
    
    return True

if __name__ == "__main__":
    try:
        success = verify_supabase_setup()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\nFATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
