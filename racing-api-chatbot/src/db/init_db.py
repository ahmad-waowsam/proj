from dotenv import load_dotenv
from src.db.database import db_manager

def init_database():
    """Initialize the database by creating all tables."""
    try:
        # Load environment variables
        load_dotenv()
        
        print("Starting database initialization...")
        db_manager.init_db()
        print("Database initialization completed successfully")
    except Exception as e:
        print(f"Error initializing database: {str(e)}")
        raise

if __name__ == "__main__":
    init_database() 