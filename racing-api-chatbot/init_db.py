from src.db.database import db_manager

if __name__ == "__main__":
    print("Initializing database schema...")
    db_manager.init_db()
    print("Database initialization completed!")