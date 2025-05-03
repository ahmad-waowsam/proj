import os
import json
from typing import Dict
from datetime import datetime
from src.utils.api_client import RaceAPIClient

def log_message(message: str):
    """Helper function to log messages with timestamp"""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}", flush=True)

class DataFetcher:
    def __init__(self):
        log_message("Initializing DataFetcher...")
        self.api_client = RaceAPIClient()
        self.raw_data_dir = "data/raw"
        os.makedirs(self.raw_data_dir, exist_ok=True)
        log_message("DataFetcher initialized successfully")

    def save_to_json(self, data: Dict, filename: str) -> None:
        """Save data to a JSON file in the raw data directory."""
        file_path = os.path.join(self.raw_data_dir, filename)
        try:
            with open(file_path, 'w') as f:
                json.dump(data, f, indent=2)
            log_message(f"Data saved to {file_path}")
        except Exception as e:
            log_message(f"Error saving data to {file_path}: {str(e)}")
            raise

    def fetch_courses(self) -> None:
        """Fetch courses data and save to JSON file."""
        try:
            log_message("Fetching courses data...")
            courses_data = self.api_client.get_courses()
            filename = f"courses_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            self.save_to_json(courses_data, filename)
            log_message("Courses data fetched and saved successfully")
        except Exception as e:
            log_message(f"Error fetching courses data: {str(e)}")
            raise

    def fetch_racecards(self) -> None:
        """Fetch racecards data and save to JSON file."""
        try:
            log_message("Fetching racecards data...")
            racecards_data = self.api_client.get_racecards_standard()
            filename = f"racecards_date_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            self.save_to_json(racecards_data, filename)
            log_message("Racecards data fetched and saved successfully")
        except Exception as e:
            log_message(f"Error fetching racecards data: {str(e)}")
            raise

    def fetch_results(self) -> None:
        """Fetch results data and save to JSON file."""
        try:
            log_message("Fetching results data...")
            results_data = self.api_client.get_today_results()
            filename = f"results_date_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            self.save_to_json(results_data, filename)
            log_message("Results data fetched and saved successfully")
        except Exception as e:
            log_message(f"Error fetching results data: {str(e)}")
            raise

    def run_fetch(self) -> None:
        """Run the complete data fetching process."""
        log_message("Starting data fetching process...")
        try:
            # Fetch courses
            self.fetch_courses()
            
            # Fetch racecards
            self.fetch_racecards()
            
            # Fetch results
            self.fetch_results()
            
            log_message("Data fetching process completed successfully")
        except Exception as e:
            log_message(f"Error in data fetching process: {str(e)}")
            raise

if __name__ == "__main__":
    try:
        log_message("Starting data fetching script...")
        fetcher = DataFetcher()
        fetcher.run_fetch()
    except Exception as e:
        log_message(f"Fatal error: {str(e)}")
        sys.exit(1) 