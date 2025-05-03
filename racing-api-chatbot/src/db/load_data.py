import json
from typing import Dict
from sqlalchemy import text
from src.db.database import db_manager
from src.utils.context import (
    Course, CourseRegion, Racecard, RacecardSummary, 
    RaceResult, CoursesResponse, CourseRegionsResponse,
    RacecardsFreeResponse, RacecardsStandardResponse,
    RacecardsProResponse, RacecardsSummariesResponse,
    AllResultsResponse
)

def load_courses(session, data: Dict):
    """Load courses data into the database"""
    if 'courses' in data:
        courses_response = CoursesResponse.model_validate(data)
        for course in courses_response.courses:
            session.execute(
                text("""
                    INSERT INTO courses (id, name, country, region, type, surface, distance)
                    VALUES (:id, :name, :country, :region, :type, :surface, :distance)
                    ON CONFLICT (id) DO UPDATE
                    SET name = EXCLUDED.name,
                        country = EXCLUDED.country,
                        region = EXCLUDED.region,
                        type = EXCLUDED.type,
                        surface = EXCLUDED.surface,
                        distance = EXCLUDED.distance
                """),
                {
                    'id': course.id,
                    'name': course.name,
                    'country': course.country,
                    'region': course.region,
                    'type': course.type,
                    'surface': course.surface,
                    'distance': course.distance
                }
            )

def load_course_regions(session, data: Dict):
    """Load course regions data into the database"""
    if 'regions' in data:
        regions_response = CourseRegionsResponse.model_validate(data)
        for region in regions_response.regions:
            # Insert region
            session.execute(
                text("""
                    INSERT INTO course_regions (id, name, country)
                    VALUES (:id, :name, :country)
                    ON CONFLICT (id) DO UPDATE
                    SET name = EXCLUDED.name,
                        country = EXCLUDED.country
                """),
                {
                    'id': region.id,
                    'name': region.name,
                    'country': region.country
                }
            )
            
            # Insert region-course relationships
            for course_id in region.courses:
                session.execute(
                    text("""
                        INSERT INTO region_courses (region_id, course_id)
                        VALUES (:region_id, :course_id)
                        ON CONFLICT (region_id, course_id) DO NOTHING
                    """),
                    {
                        'region_id': region.id,
                        'course_id': course_id
                    }
                )

def load_racecards(session, data: Dict, table: str):
    """Load racecards data into the database"""
    if 'racecards' in data:
        racecards_response = RacecardsFreeResponse.model_validate(data)
        for racecard in racecards_response.racecards:
            # Insert racecard
            session.execute(
                text(f"""
                    INSERT INTO {table} (id, race_name, race_time, course_id, distance, going, prize_money, number_of_runners)
                    VALUES (:id, :race_name, :race_time, :course_id, :distance, :going, :prize_money, :number_of_runners)
                    ON CONFLICT (id) DO UPDATE
                    SET race_name = EXCLUDED.race_name,
                        race_time = EXCLUDED.race_time,
                        course_id = EXCLUDED.course_id,
                        distance = EXCLUDED.distance,
                        going = EXCLUDED.going,
                        prize_money = EXCLUDED.prize_money,
                        number_of_runners = EXCLUDED.number_of_runners
                """),
                {
                    'id': racecard.id,
                    'race_name': racecard.race_name,
                    'race_time': racecard.race_time,
                    'course_id': racecard.course,
                    'distance': racecard.distance,
                    'going': racecard.going,
                    'prize_money': racecard.prize_money,
                    'number_of_runners': len(racecard.runners)
                }
            )
            
            # Insert runners
            for runner_id in racecard.runners:
                session.execute(
                    text(f"""
                        INSERT INTO racecard_runners (racecard_id, runner_id)
                        VALUES (:racecard_id, :runner_id)
                        ON CONFLICT (racecard_id, runner_id) DO NOTHING
                    """),
                    {
                        'racecard_id': racecard.id,
                        'runner_id': runner_id
                    }
                )

def load_race_results(session, data: Dict):
    """Load race results data into the database"""
    if 'results' in data:
        results_response = AllResultsResponse.model_validate(data)
        for result in results_response.results:
            # Insert race result
            session.execute(
                text("""
                    INSERT INTO race_results (id, race_name, race_time, course_id, distance, going, prize_money)
                    VALUES (:id, :race_name, :race_time, :course_id, :distance, :going, :prize_money)
                    ON CONFLICT (id) DO UPDATE
                    SET race_name = EXCLUDED.race_name,
                        race_time = EXCLUDED.race_time,
                        course_id = EXCLUDED.course_id,
                        distance = EXCLUDED.distance,
                        going = EXCLUDED.going,
                        prize_money = EXCLUDED.prize_money
                """),
                {
                    'id': int(result.id),  # Convert to integer
                    'race_name': result.race_name,
                    'race_time': result.race_time,
                    'course_id': result.course,
                    'distance': result.distance,
                    'going': result.going,
                    'prize_money': result.prize_money
                }
            )
            
            # Insert positions
            for position, pos_data in enumerate(result.positions, 1):
                session.execute(
                    text("""
                        INSERT INTO race_positions (race_id, position, horse_id, jockey_id, trainer_id)
                        VALUES (:race_id, :position, :horse_id, :jockey_id, :trainer_id)
                        ON CONFLICT (race_id, position) DO UPDATE
                        SET horse_id = EXCLUDED.horse_id,
                            jockey_id = EXCLUDED.jockey_id,
                            trainer_id = EXCLUDED.trainer_id
                    """),
                    {
                        'race_id': int(result.id),  # Convert to integer
                        'position': position,
                        'horse_id': pos_data.get('horse_id'),
                        'jockey_id': pos_data.get('jockey_id'),
                        'trainer_id': pos_data.get('trainer_id')
                    }
                )

def main():
    # Initialize database session
    session = db_manager.SessionLocal()
    
    try:
        # Load data from JSON file
        with open('data.json', 'r') as f:
            data = json.load(f)
        
        # Load each type of data
        load_courses(session, data)
        load_course_regions(session, data)
        load_racecards(session, data, 'racecards')
        load_race_results(session, data)
        
        # Commit the transaction
        session.commit()
        print("Data loaded successfully!")
        
    except Exception as e:
        print(f"Error loading data: {str(e)}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    main() 