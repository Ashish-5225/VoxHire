import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

db_url = os.getenv("DATABASE_URL", settings.DATABASE_URL)

# Handle postgresql schema alias for Supabase / Neon / Render
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# If on Vercel, Render or serverless environment and using relative sqlite path, use /tmp
if ("VERCEL" in os.environ or "RENDER" in os.environ or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")) and db_url.startswith("sqlite:///"):
    db_url = "sqlite:////tmp/sql_app.db"

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(db_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
