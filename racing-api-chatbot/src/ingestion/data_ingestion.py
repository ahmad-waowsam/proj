import sys
from datetime import datetime
from typing import Dict, List
from sqlalchemy.orm import Session
from db.database import DatabaseManager
from db.models import (
    Course, Race, Horse, Trainer, Jockey, Owner,
    Runner, Result, Odds, RunnerMedical, RunnerQuote,
    ApiSyncLog, APICache
)
from utils.cached_api_client import CachedRaceAPIClient

def log_message(message: str):
    """Helper function to log messages with timestamp"""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}", flush=True)

class DataIngestionPipeline:
    def __init__(self):
        log_message("Initializing DataIngestionPipeline...")
        self.db_manager = DatabaseManager()
        self.api_client = CachedRaceAPIClient()
        log_message("Pipeline initialized successfully")

    def fetch_api_data(self, endpoint: str, params: Dict = None) -> Dict:
        """Fetch data from the racing API using cached client."""
        try:
            log_message(f"Fetching data from {endpoint}...")
            # Map endpoint to appropriate method
            if endpoint == "courses":
                data = self.api_client.get_courses()
            elif endpoint == "racecards":
                data = self.api_client.get_racecards_pro(params)
            elif endpoint == "results":
                data = self.api_client.get_today_results()
            elif endpoint.startswith("odds/"):
                race_id = endpoint.split("/")[1]
                data = self.api_client.get_odds(race_id)
            elif endpoint.startswith("horses/"):
                horse_id = endpoint.split("/")[1]
                data = self.api_client.get_horse_pro(horse_id)
            else:
                raise ValueError(f"Unknown endpoint: {endpoint}")
            
            log_message(f"Successfully fetched data from {endpoint}")
            return data
        except Exception as e:
            log_message(f"Error fetching data from {endpoint}: {str(e)}")
            raise

    def store_courses(self, db: Session, courses_data: List[Dict]) -> None:
        """Store courses data in batches."""
        try:
            if not courses_data:
                log_message("No courses data to process")
                return
                
            log_message(f"Storing {len(courses_data)} courses...")
            batch_size = 100  # Process in smaller batches
            total_batches = (len(courses_data) + batch_size - 1) // batch_size
            
            for batch_num in range(total_batches):
                start_idx = batch_num * batch_size
                end_idx = min((batch_num + 1) * batch_size, len(courses_data))
                batch = courses_data[start_idx:end_idx]
                
                log_message(f"Processing batch {batch_num + 1}/{total_batches} ({len(batch)} courses)...")
                
                # Create course objects for the batch
                courses = []
                for course_data in batch:
                    try:
                        course = Course(
                            course_id=course_data["id"],
                            course=course_data["course"],
                            region_code=course_data["region_code"],
                            region=course_data["region"]
                        )
                        courses.append(course)
                    except Exception as e:
                        log_message(f"Error preparing course data: {str(e)}")
                        log_message(f"Course data: {course_data}")
                        raise
                
                # Bulk insert the batch
                try:
                    db.bulk_save_objects(courses)
                    db.commit()
                    log_message(f"Successfully stored batch {batch_num + 1}")
                except Exception as e:
                    db.rollback()
                    log_message(f"Error storing batch {batch_num + 1}: {str(e)}")
                    raise
                
                # Add a small delay between batches
                import time
                time.sleep(1)
            
            log_message("All courses stored successfully")
            
        except Exception as e:
            log_message(f"Error storing courses: {str(e)}")
            db.rollback()
            raise

    def store_racecards(self, db: Session, racecards_data: List[Dict]) -> None:
        """Store racecards data in respective tables."""
        try:
            self.db_manager._store_racecards(db, racecards_data)
        except Exception as e:
            log_message(f"Error storing racecards: {str(e)}")
            raise

    def store_results(self, db: Session, results_data: List[Dict]) -> None:
        """Store race results."""
        try:
            self.db_manager._store_results(db, results_data)
        except Exception as e:
            log_message(f"Error storing results: {str(e)}")
            raise

    def store_odds(self, db: Session, odds_data: Dict) -> None:
        """Store odds data."""
        try:
            self.db_manager._store_odds(db, odds_data)
        except Exception as e:
            log_message(f"Error storing odds: {str(e)}")
            raise

    def store_horse(self, db: Session, horse_data: Dict) -> None:
        """Store detailed horse data."""
        try:
            self.db_manager._store_horse(db, horse_data)
        except Exception as e:
            log_message(f"Error storing horse data: {str(e)}")
            raise

    def run_pipeline(self, date: str = None) -> None:
        """Run the complete data ingestion pipeline."""
        log_message("Starting data ingestion pipeline...")
        if date is None:
            date = datetime.now().strftime("%Y-%m-%d")
            log_message(f"Using current date: {date}")

        db = next(self.db_manager.get_db())
        try:
            # Initialize database
            log_message("Initializing database...")
            self.db_manager.init_db(session=db)
            log_message("Database initialized successfully")
            
            # Fetch and store courses
            log_message("Fetching courses...")
            try:
                courses_data = self.fetch_api_data("courses")
                if courses_data and "courses" in courses_data:
                    self.store_courses(db, courses_data["courses"])
                    log_message("Courses stored successfully")
                else:
                    log_message("No courses data received from API")
            except Exception as e:
                log_message(f"Error processing courses: {str(e)}")
                raise
            
            # Fetch and store racecards
            log_message("Fetching racecards...")
            racecards_data = self.fetch_api_data("racecards", {"date": date})
            self.store_racecards(db, racecards_data.get("racecards", []))
            log_message("Racecards stored successfully")
            
            # Fetch and store results
            log_message("Fetching results...")
            results_data = self.fetch_api_data("results", {"date": date})
            self.store_results(db, results_data.get("results", []))
            log_message("Results stored successfully")
            
            # Get all race IDs from today's races
            races = db.query(Race).filter(Race.date == date).all()
            log_message(f"Found {len(races)} races to process")
            
            for race in races:
                # Fetch and store odds for each race
                log_message(f"Fetching odds for race {race.race_id}...")
                odds_data = self.fetch_api_data(f"odds/{race.race_id}")
                self.store_odds(db, odds_data)
                log_message(f"Odds stored for race {race.race_id}")
                
                # Get all horse IDs from the race
                runners = db.query(Runner).filter(Runner.race_id == race.race_id).all()
                log_message(f"Found {len(runners)} runners in race {race.race_id}")
                
                for runner in runners:
                    # Fetch and store detailed horse data
                    log_message(f"Fetching horse data for {runner.horse_id}...")
                    horse_data = self.fetch_api_data(f"horses/{runner.horse_id}")
                    self.store_horse(db, horse_data)
                    log_message(f"Horse data stored for {runner.horse_id}")
            
            db.commit()
            log_message("Data ingestion pipeline completed successfully")
            
        except Exception as e:
            db.rollback()
            log_message(f"Error in data ingestion pipeline: {str(e)}")
            raise
        finally:
            db.close()
            log_message("Database connection closed")

if __name__ == "__main__":
    try:
        log_message("Starting data ingestion script...")
        pipeline = DataIngestionPipeline()
        pipeline.run_pipeline()
    except Exception as e:
        log_message(f"Fatal error: {str(e)}")
        sys.exit(1)