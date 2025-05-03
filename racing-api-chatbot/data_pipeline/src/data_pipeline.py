import sys
from datetime import datetime
from typing import  Generator
from sqlalchemy import text
from src.db.database import DatabaseManager
from src.db.models import (
    Course, Race, Horse, Trainer, Jockey, Owner,
    Runner, Result, Odds, RunnerMedical, RunnerQuote,
    TrainerStatistics, JockeyStatistics, HorseStatistics
)
from src.utils.api_client import RaceAPIClient

BATCH_SIZE = 100 

def log_message(message: str):
    """Helper function to log messages with timestamp"""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}", flush=True)

def batch_generator(items: list, batch_size: int) -> Generator[list, None, None]:
    """Generator to yield items in batches"""
    for i in range(0, len(items), batch_size):
        yield items[i:i + batch_size]

class DataPipeline:
    def __init__(self):
        log_message("Initializing DataPipeline...")
        self.api_client = RaceAPIClient()
        self.db_manager = DatabaseManager()
        log_message("Pipeline initialized successfully")

    def _store_courses(self, courses_data: list) -> None:
        """Store courses data in the database."""
        db = self.db_manager.SessionLocal()
        try:
            total_stored = 0
            for batch in batch_generator(courses_data, BATCH_SIZE):
                try:
                    for course_data in batch:
                        course = Course(
                            course_id=course_data["id"],
                            course=course_data["course"],
                            region_code=course_data["region_code"],
                            region=course_data["region"]
                        )
                        db.merge(course)
                    db.commit()
                    total_stored += len(batch)
                    log_message(f"Stored batch of {len(batch)} courses (Total: {total_stored})")
                except Exception as e:
                    db.rollback()
                    log_message(f"Error storing course batch: {str(e)}")
                    continue
            log_message(f"Completed storing {total_stored} courses")
        finally:
            db.close()

    def _store_racecards(self, racecards_data: list) -> None:
        """Store racecards data in the database."""
        db = self.db_manager.SessionLocal()
        try:
            total_stored = 0
            for batch in batch_generator(racecards_data, BATCH_SIZE):
                try:
                    for racecard in batch:
                        # Store course
                        course = Course(
                            course_id=racecard["course_id"],
                            course=racecard["course"],
                            region_code=racecard["region"],
                            region=racecard["region"]
                        )
                        db.merge(course)

                        # Store race
                        race = Race(
                            race_id=racecard["race_id"],
                            course_id=racecard["course_id"],
                            date=racecard.get("date"),
                            off_time=racecard.get("off_time"),
                            race_name=racecard.get("race_name"),
                            distance=racecard.get("distance"),
                            distance_f=racecard.get("distance_f"),
                            region=racecard.get("region"),
                            type=racecard.get("type"),
                            going=racecard.get("going")
                        )
                        db.merge(race)

                        # Store runners
                        for runner_data in racecard.get("runners", []):
                            # Store horse
                            horse = Horse(
                                horse_id=runner_data["horse_id"],
                                horse=runner_data["horse"]
                            )
                            db.merge(horse)

                            # Store trainer
                            trainer = Trainer(
                                trainer_id=runner_data["trainer_id"],
                                trainer=runner_data["trainer"]
                            )
                            db.merge(trainer)

                            # Store jockey if available - handle individually to avoid batch insert issues
                            if "jockey_id" in runner_data and "jockey" in runner_data:
                                jockey = Jockey(
                                    jockey_id=runner_data["jockey_id"],
                                    jockey=runner_data["jockey"]
                                )
                                try:
                                    db.merge(jockey)
                                    db.commit()  # Commit after each jockey to handle unique constraints
                                except Exception as e:
                                    db.rollback()
                                    log_message(f"Error storing jockey {runner_data['jockey_id']}: {str(e)}")
                                    continue

                            # Store owner if available
                            if "owner_id" in runner_data and "owner" in runner_data:
                                owner = Owner(
                                    owner_id=runner_data["owner_id"],
                                    owner=runner_data["owner"]
                                )
                                db.merge(owner)

                            # Store runner
                            runner = Runner(
                                runner_id=f"{racecard['race_id']}_{runner_data['horse_id']}",
                                race_id=racecard["race_id"],
                                horse_id=runner_data["horse_id"],
                                jockey_id=runner_data.get("jockey_id"),
                                trainer_id=runner_data["trainer_id"],
                                owner_id=runner_data.get("owner_id"),
                                number=runner_data.get("number", "0"),
                                draw=runner_data.get("draw", "0"),
                                lbs=runner_data.get("lbs", "0"),
                                ofr=runner_data.get("ofr", "0"),
                                rpr=runner_data.get("rpr", "0"),
                                ts=runner_data.get("ts", "0"),
                                last_run=runner_data.get("last_run", ""),
                                form=runner_data.get("form", ""),
                                comment=runner_data.get("comment", ""),
                                spotlight=runner_data.get("spotlight", ""),
                                silk_url=runner_data.get("silk_url", ""),
                                headgear=runner_data.get("headgear", ""),
                                headgear_run=runner_data.get("headgear_run", ""),
                                wind_surgery=runner_data.get("wind_surgery", ""),
                                wind_surgery_run=runner_data.get("wind_surgery_run", ""),
                                trainer_rtf=runner_data.get("trainer_rtf", ""),
                                is_non_runner=runner_data.get("is_non_runner", False)
                            )
                            db.merge(runner)

                    db.commit()
                    total_stored += len(batch)
                    log_message(f"Stored batch of {len(batch)} racecards (Total: {total_stored})")
                except Exception as e:
                    db.rollback()
                    log_message(f"Error storing racecard batch: {str(e)}")
                    continue

            log_message(f"Completed storing {total_stored} racecards")
        finally:
            db.close()

    def _store_results(self, results_data: list) -> None:
        """Store results data in the database."""
        db = self.db_manager.SessionLocal()
        try:
            total_stored = 0
            for batch in batch_generator(results_data, BATCH_SIZE):
                try:
                    for result_data in batch:
                        # Store course if not exists
                        course = Course(
                            course_id=result_data["course_id"],
                            course=result_data["course"],
                            region_code=result_data["region"],
                            region=result_data["region"]
                        )
                        db.merge(course)

                        # Store race if not exists
                        race = Race(
                            race_id=result_data["race_id"],
                            course_id=result_data["course_id"],
                            date=result_data.get("date"),
                            off_time=result_data.get("off"),
                            race_name=result_data.get("race_name"),
                            distance=result_data.get("dist"),
                            distance_f=result_data.get("dist_f"),
                            region=result_data.get("region"),
                            type=result_data.get("type"),
                            going=result_data.get("going")
                        )
                        db.merge(race)

                        # Store runners and their results
                        for runner_data in result_data.get("runners", []):
                            # Store horse if not exists
                            horse = Horse(
                                horse_id=runner_data["horse_id"],
                                horse=runner_data["horse"]
                            )
                            db.merge(horse)

                            # Store jockey if not exists - handle individually to avoid batch insert issues
                            if "jockey_id" in runner_data and "jockey" in runner_data:
                                jockey = Jockey(
                                    jockey_id=runner_data["jockey_id"],
                                    jockey=runner_data["jockey"]
                                )
                                try:
                                    db.merge(jockey)
                                    db.commit()  # Commit after each jockey to handle unique constraints
                                except Exception as e:
                                    db.rollback()
                                    log_message(f"Error storing jockey {runner_data['jockey_id']}: {str(e)}")
                                    continue

                            # Store trainer if not exists
                            if "trainer_id" in runner_data and "trainer" in runner_data:
                                trainer = Trainer(
                                    trainer_id=runner_data["trainer_id"],
                                    trainer=runner_data["trainer"]
                                )
                                db.merge(trainer)

                            # Store owner if not exists
                            if "owner_id" in runner_data and "owner" in runner_data:
                                owner = Owner(
                                    owner_id=runner_data["owner_id"],
                                    owner=runner_data["owner"]
                                )
                                db.merge(owner)

                            # Store result
                            result = Result(
                                result_id=f"{result_data['race_id']}_{runner_data['horse_id']}",
                                race_id=result_data["race_id"],
                                horse_id=runner_data["horse_id"],
                                jockey_id=runner_data.get("jockey_id"),
                                trainer_id=runner_data.get("trainer_id"),
                                owner_id=runner_data.get("owner_id", "unknown"),
                                sp=runner_data.get("sp"),
                                sp_dec=runner_data.get("sp_dec"),
                                number=runner_data.get("number"),
                                position=runner_data.get("position"),
                                draw=runner_data.get("draw"),
                                btn=runner_data.get("btn"),
                                ovr_btn=runner_data.get("ovr_btn"),
                                age=runner_data.get("age"),
                                sex=runner_data.get("sex"),
                                weight=runner_data.get("weight"),
                                weight_lbs=runner_data.get("weight_lbs"),
                                headgear=runner_data.get("headgear"),
                                time=runner_data.get("time"),
                                or_rating=runner_data.get("or"),
                                rpr=runner_data.get("rpr"),
                                tsr=runner_data.get("tsr"),
                                prize=runner_data.get("prize"),
                                comment=runner_data.get("comment", ""),
                                silk_url=runner_data.get("silk_url", "")
                            )
                            db.merge(result)

                    db.commit()
                    total_stored += len(batch)
                    log_message(f"Stored batch of {len(batch)} results (Total: {total_stored})")
                except Exception as e:
                    db.rollback()
                    log_message(f"Error storing results batch: {str(e)}")
                    continue

            log_message(f"Completed storing {total_stored} results")
        finally:
            db.close()

    def _store_odds(self, race_id: str) -> None:
        """Store odds data for a race in the database.
        
        Args:
            race_id (str): The unique ID of the race.
        """
        db = self.db_manager.SessionLocal()
        try:
            # First get all runners for this race
            runners = self.db_manager.get_runners_by_race(db, race_id)
            if not runners:
                log_message(f"No runners found for race {race_id}, skipping odds storage")
                return

            # Get odds data for the race
            odds_data = self.api_client.get_odds(race_id)
            if not odds_data:
                log_message(f"No odds data found for race {race_id}")
                return

            # Process odds for each runner
            for runner in runners:
                horse_id = runner.horse_id
                # Get specific odds for this horse
                horse_odds = self.api_client.get_odds(race_id, horse_id)
                if not horse_odds:
                    log_message(f"No odds data found for horse {horse_id} in race {race_id}")
                    continue

                # Store the odds data
                for bookmaker, odds_info in horse_odds.get("odds", {}).items():
                    # Create odds record
                    odds = Odds(
                        odds_id=f"{race_id}_{horse_id}_{bookmaker}",
                        race_id=race_id,
                        horse_id=horse_id,
                        runner_id=f"{race_id}_{horse_id}",
                        bookmaker=bookmaker,
                        fractional=odds_info.get("fractional", ""),
                        decimal=odds_info.get("decimal", ""),
                        ew_places=odds_info.get("ew_places"),
                        ew_denom=odds_info.get("ew_denom"),
                        updated=odds_info.get("updated"),
                        is_current=True
                    )
                    
                    # Set previous odds for this runner/bookmaker as not current
                    db.query(Odds).filter(
                        Odds.race_id == race_id,
                        Odds.horse_id == horse_id,
                        Odds.bookmaker == bookmaker,
                        Odds.is_current == True
                    ).update({"is_current": False})
                    
                    db.merge(odds)

            db.commit()
            log_message(f"Successfully stored odds for race {race_id}")
            
        except Exception as e:
            db.rollback()
            log_message(f"Error storing odds for race {race_id}: {str(e)}")
            raise
        finally:
            db.close()

    def run_pipeline(self) -> None:
        """Run the complete data pipeline."""
        log_message("Starting data pipeline...")
        
        try:
            # Get database session
            db = self.db_manager.SessionLocal()
            try:
                # Test database connection with proper text() usage
                db.execute(text("SELECT 1"))
                log_message("Database connection verified")
                
                # Fetch and store courses
                log_message("Fetching and storing courses...")
                courses_data = self.api_client.get_courses()
                if "courses" in courses_data:
                    self._store_courses(courses_data["courses"])
                
                # Fetch and store racecards
                log_message("Fetching and storing racecards...")
                racecards_data = self.api_client.get_racecards_standard()
                if "racecards" in racecards_data:
                    self._store_racecards(racecards_data["racecards"])
                    
                    # Fetch and store odds for each race
                    log_message("Fetching and storing odds...")
                    for racecard in racecards_data["racecards"]:
                        race_id = racecard["race_id"]
                        try:
                            self._store_odds(race_id)
                        except Exception as e:
                            log_message(f"Error fetching odds for race {race_id}: {str(e)}")
                            continue
                
                # Fetch and store results
                log_message("Fetching and storing results...")
                results_data = self.api_client.get_today_results()
                if "results" in results_data:
                    self._store_results(results_data["results"])
                
                log_message("Data pipeline completed successfully")
                
            finally:
                db.close()
            
        except Exception as e:
            log_message(f"Error in data pipeline: {str(e)}")
            raise

if __name__ == "__main__":
    try:
        log_message("Starting data pipeline script...")
        pipeline = DataPipeline()
        pipeline.run_pipeline()
        log_message("Data pipeline completed. Exiting...")
    except Exception as e:
        log_message(f"Fatal error: {str(e)}")
        sys.exit(1) 