from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.db.models import (
    Course, Race, Horse, Trainer, Jockey, Owner,
    Runner, Result, Odds, RunnerMedical, RunnerQuote
)
import os
from dotenv import load_dotenv
from datetime import datetime

def log_message(message: str):
    """Helper function to log messages with timestamp"""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}", flush=True)

def check_database():
    # Load environment variables
    load_dotenv()
    
    # Get database URL from environment
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in environment variables")
        return

    # Create engine and session
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Get list of all tables
        tables = [
            Course, Race, Horse, Trainer, Jockey, Owner,
            Runner, Result, Odds, RunnerMedical, RunnerQuote
        ]

        for table in tables:
            # Get table name
            table_name = table.__tablename__
            
            # Count records
            count = session.query(table).count()
            
            # Get first few records
            records = session.query(table).limit(5).all()
            
            print(f"\n=== {table_name} ===")
            print(f"Total records: {count}")
            print("Sample records:")
            for record in records:
                print(record)
            
            # Add a separator
            print("\n" + "="*50)

    except Exception as e:
        print(f"Error checking database: {str(e)}")
    finally:
        session.close()

if __name__ == "__main__":
    check_database() 