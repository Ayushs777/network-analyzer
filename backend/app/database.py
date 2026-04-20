import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

import pathlib
env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/network_analyzer")

# Fix for Supabase on Vercel: use connection pooler params to avoid IPv6 issues
if DATABASE_URL and "supabase.co" in DATABASE_URL and "pgbouncer" not in DATABASE_URL:
    if "?" in DATABASE_URL:
        DATABASE_URL += "&pgbouncer=true&connection_limit=1"
    else:
        DATABASE_URL += "?pgbouncer=true&connection_limit=1"

try:
    if DATABASE_URL.startswith("sqlite"):
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    else:
        engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_size=1,
            max_overflow=0,
            connect_args={"connect_timeout": 10}
        )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    print(f"[WARNING] Database engine creation failed: {e}")
    engine = None
    SessionLocal = None

Base = declarative_base()

def get_db():
    if SessionLocal is None:
        # Return a dummy generator so routes don't crash
        yield None
        return
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
