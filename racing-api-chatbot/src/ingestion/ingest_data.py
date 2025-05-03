import logging
import requests
from datetime import datetime
from typing import Optional, Dict
from .config import API_BASE_URL, API_USERNAME, API_PASSWORD

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_race_results(race_id: str, date: str) -> Optional[Dict]:
    """
    Fetch race results for a specific race ID and date.
    """
    try:
        url = f"{API_BASE_URL}/results"
        params = {
            'race_id': race_id,
            'date': date
        }
        auth = (API_USERNAME, API_PASSWORD)
        
        logger.info(f"Fetching results for race {race_id} on {date}")
        response = requests.get(url, params=params, auth=auth)
        
        if response.status_code == 404:
            logger.info(f"No results found for race {race_id} on {date}")
            return None
            
        response.raise_for_status()
        data = response.json()
        logger.info(f"Successfully fetched results for race {race_id}")
        return data
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching results for race {race_id}: {str(e)}")
        return None

def ingest_data():
    """
    Main function to ingest race data.
    """
    try:
        # Get today's date in YYYY-MM-DD format
        today = datetime.now().strftime('%Y-%m-%d')
        logger.info(f"Starting data ingestion for date: {today}")
        
        # Get courses for today
        courses_url = f"{API_BASE_URL}/courses"
        auth = (API_USERNAME, API_PASSWORD)
        
        logger.info("Fetching courses...")
        courses_response = requests.get(courses_url, params={'date': today}, auth=auth)
        courses_response.raise_for_status()
        courses_data = courses_response.json()
        
        # Extract courses from the nested structure
        courses = courses_data.get('courses', [])
        logger.info(f"Found {len(courses)} courses")
        
        # Process each course
        for course in courses:
            course_id = course.get('id')
            course_name = course.get('course')
            logger.info(f"Processing course {course_name} (ID: {course_id})")
            
            try:
                # Get racecard for the course
                racecard_url = f"{API_BASE_URL}/racecard"
                racecard_response = requests.get(
                    racecard_url,
                    params={'course_id': course_id, 'date': today},
                    auth=auth
                )
                
                if racecard_response.status_code == 404:
                    logger.info(f"No races found for {course_name} on {today}")
                    continue
                    
                racecard_response.raise_for_status()
                racecard = racecard_response.json()
                logger.info(f"Found {len(racecard)} races for {course_name}")
                
                # Process each race
                for race in racecard:
                    race_id = race.get('id')
                    race_number = race.get('race_number', 'Unknown')
                    logger.info(f"Processing race {race_number} (ID: {race_id})")
                    
                    # Get race results
                    results = get_race_results(race_id, today)
                    if results:
                        logger.info(f"Successfully processed race {race_id}")
                    else:
                        logger.info(f"No results available yet for race {race_id}")
                        
            except requests.exceptions.RequestException as e:
                logger.error(f"Error processing course {course_name}: {str(e)}")
                continue
        
        logger.info("Data ingestion completed successfully")
    except Exception as e:
        logger.error(f"Error during data ingestion: {str(e)}")
        raise

if __name__ == "__main__":
    ingest_data() 