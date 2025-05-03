import os
import sys
import json
from typing import Dict
from datetime import datetime
from src.db.database import DatabaseManager
from src.db.models import (
    Course, Race, Horse, Trainer, Jockey, Owner,
    Runner, Result, Odds, RunnerMedical, RunnerQuote,
    TrainerStatistics, JockeyStatistics, HorseStatistics
)

def log_message(message: str):
    """Helper function to log messages with timestamp"""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}", flush=True)

class DataIngestionPipelineV2:
    def __init__(self):
        log_message("Initializing DataIngestionPipelineV2...")
        self.db_manager = DatabaseManager()
        self.raw_data_dir = "data/raw"
        log_message("Pipeline initialized successfully")

    def read_json_file(self, filename: str) -> dict:
        """Read and parse a JSON file from the raw data directory."""
        file_path = os.path.join(self.raw_data_dir, filename)
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            log_message(f"Error reading file {filename}: {str(e)}")
            raise

    def fetch_and_store_data(self, data_type: str) -> None:
        """Read data from JSON files and store in database."""
        try:
            log_message(f"Processing {data_type} data...")
            
            if data_type == "courses":
                # Find the most recent courses file
                courses_files = [f for f in os.listdir(self.raw_data_dir) if f.startswith("courses_")]
                if not courses_files:
                    raise FileNotFoundError("No courses files found")
                latest_courses_file = max(courses_files)
                data = self.read_json_file(latest_courses_file)
                if "courses" in data:
                    self._store_courses(data["courses"])
            
            elif data_type == "racecards":
                # Find the most recent racecards file
                racecards_files = [f for f in os.listdir(self.raw_data_dir) if f.startswith("racecards_date_")]
                if not racecards_files:
                    raise FileNotFoundError("No racecards files found")
                latest_racecards_file = max(racecards_files)
                data = self.read_json_file(latest_racecards_file)
                if "racecards" in data:
                    self._store_racecards(data["racecards"])
            
            elif data_type == "results":
                # Find the most recent results file
                results_files = [f for f in os.listdir(self.raw_data_dir) if f.startswith("results_date_")]
                if not results_files:
                    raise FileNotFoundError("No results files found")
                latest_results_file = max(results_files)
                data = self.read_json_file(latest_results_file)
                if "results" in data:
                    self._store_results(data["results"])
            
            else:
                raise ValueError(f"Unknown data type: {data_type}")
            
            log_message(f"Successfully processed {data_type} data")
            
        except Exception as e:
            log_message(f"Error processing {data_type} data: {str(e)}")
            raise

    def _store_courses(self, courses_data: list) -> None:
        """Store courses data in the database."""
        db = self.db_manager.SessionLocal()
        try:
            for course_data in courses_data:
                course = Course(
                    course_id=course_data["id"],
                    course=course_data["course"],
                    region_code=course_data["region_code"],
                    region=course_data["region"]
                )
                db.merge(course)
            db.commit()
            log_message(f"Stored {len(courses_data)} courses")
        except Exception as e:
            db.rollback()
            raise
        finally:
            db.close()

    def _store_racecards(self, racecards_data: list) -> None:
        """Store racecards data in the database."""
        db = self.db_manager.SessionLocal()
        try:
            for racecard in racecards_data:
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
                    # Store horse - using get_or_create pattern
                    horse = db.query(Horse).filter_by(horse_id=runner_data["horse_id"]).first()
                    if not horse:
                        horse = Horse(
                            horse_id=runner_data["horse_id"],
                            horse=runner_data["horse"]
                        )
                        db.add(horse)
                        db.flush()  # Flush to get the horse ID

                    # Store trainer - using get_or_create pattern
                    trainer = db.query(Trainer).filter_by(trainer_id=runner_data["trainer_id"]).first()
                    if not trainer:
                        trainer = Trainer(
                            trainer_id=runner_data["trainer_id"],
                            trainer=runner_data["trainer"]
                        )
                        db.add(trainer)
                        db.flush()

                    # Store jockey if available - using get_or_create pattern
                    jockey = None
                    if "jockey_id" in runner_data and "jockey" in runner_data:
                        jockey = db.query(Jockey).filter_by(jockey_id=runner_data["jockey_id"]).first()
                        if not jockey:
                            jockey = Jockey(
                                jockey_id=runner_data["jockey_id"],
                                jockey=runner_data["jockey"]
                            )
                            db.add(jockey)
                            db.flush()

                    # Store owner if available - using get_or_create pattern
                    owner = None
                    if "owner_id" in runner_data and "owner" in runner_data:
                        owner = db.query(Owner).filter_by(owner_id=runner_data["owner_id"]).first()
                        if not owner:
                            owner = Owner(
                                owner_id=runner_data["owner_id"],
                                owner=runner_data["owner"]
                            )
                            db.add(owner)
                            db.flush()

                    # Store runner
                    runner = Runner(
                        runner_id=f"{racecard['race_id']}_{runner_data['horse_id']}",
                        race_id=racecard["race_id"],
                        horse_id=runner_data["horse_id"],
                        jockey_id=runner_data.get("jockey_id"),
                        trainer_id=runner_data["trainer_id"],
                        owner_id=runner_data.get("owner_id"),
                        number=runner_data.get("number", "0"),  # Default to "0" if not provided
                        draw=runner_data.get("draw", "0"),      # Default to "0" if not provided
                        lbs=runner_data.get("lbs", "0"),        # Default to "0" if not provided
                        ofr=runner_data.get("ofr", "0"),        # Default to "0" if not provided
                        rpr=runner_data.get("rpr", "0"),        # Default to "0" if not provided
                        ts=runner_data.get("ts", "0"),          # Default to "0" if not provided
                        last_run=runner_data.get("last_run", ""),  # Default to empty string
                        form=runner_data.get("form", ""),       # Default to empty string
                        comment=runner_data.get("comment", ""), # Default to empty string
                        spotlight=runner_data.get("spotlight", ""), # Default to empty string
                        silk_url=runner_data.get("silk_url", ""),   # Default to empty string
                        headgear=runner_data.get("headgear", ""),   # Default to empty string
                        headgear_run=runner_data.get("headgear_run", ""), # Default to empty string
                        wind_surgery=runner_data.get("wind_surgery", ""), # Default to empty string
                        wind_surgery_run=runner_data.get("wind_surgery_run", ""), # Default to empty string
                        trainer_rtf=runner_data.get("trainer_rtf", ""), # Default to empty string
                        is_non_runner=runner_data.get("is_non_runner", False)  # Default to False
                    )
                    db.merge(runner)

                # Commit after each racecard to avoid large transactions
                db.commit()
                log_message(f"Stored racecard {racecard['race_id']}")

            log_message(f"Stored {len(racecards_data)} racecards")
        except Exception as e:
            db.rollback()
            raise
        finally:
            db.close()

    def _store_results(self, results_data: list) -> None:
        """Store results data in the database."""
        db = self.db_manager.SessionLocal()
        try:
            for result_data in results_data:
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

                    # Store jockey if not exists
                    if "jockey_id" in runner_data and "jockey" in runner_data:
                        jockey = Jockey(
                            jockey_id=runner_data["jockey_id"],
                            jockey=runner_data["jockey"]
                        )
                        db.merge(jockey)

                    # Store trainer if not exists
                    if "trainer_id" in runner_data and "trainer" in runner_data:
                        trainer = Trainer(
                            trainer_id=runner_data["trainer_id"],
                            trainer=runner_data["trainer"]
                        )
                        db.merge(trainer)

                    # Store result
                    result = Result(
                        result_id=f"{result_data['race_id']}_{runner_data['horse_id']}",
                        race_id=result_data["race_id"],
                        horse_id=runner_data["horse_id"],
                        jockey_id=runner_data.get("jockey_id"),
                        trainer_id=runner_data.get("trainer_id"),
                        owner_id=runner_data.get("owner_id", "unknown"),  # Default to "unknown" if not available
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
            log_message(f"Stored {len(results_data)} results")
        except Exception as e:
            db.rollback()
            raise
        finally:
            db.close()

    def _store_odds(self, odds_data: Dict) -> None:
        """Store odds data in the database."""
        db = self.db_manager.SessionLocal()
        try:
            race_id = odds_data["race_id"]
            for horse_id, odds_info in odds_data.get("odds", {}).items():
                odds = Odds(
                    odds_id=f"{race_id}_{horse_id}",
                    race_id=race_id,
                    horse_id=horse_id,
                    runner_id=f"{race_id}_{horse_id}",
                    bookmaker=odds_info.get("bookmaker"),
                    fractional=odds_info.get("fractional"),
                    decimal=odds_info.get("decimal")
                )
                db.merge(odds)
            db.commit()
            log_message(f"Stored odds for race {race_id}")
        except Exception as e:
            db.rollback()
            raise
        finally:
            db.close()

    def _store_horse(self, horse_data: Dict) -> None:
        """Store horse data in the database."""
        db = self.db_manager.SessionLocal()
        try:
            horse = Horse(
                horse_id=horse_data["horse_id"],
                horse=horse_data["horse"],
                dob=horse_data.get("dob"),
                age=horse_data.get("age"),
                sex=horse_data.get("sex")
            )
            db.merge(horse)
            db.commit()
            log_message(f"Stored horse {horse_data['horse']}")
        except Exception as e:
            db.rollback()
            raise
        finally:
            db.close()

    def _store_runner_medical(self, medical_data: Dict) -> None:
        """Store runner medical data in the database."""
        db = self.db_manager.SessionLocal()
        try:
            medical = RunnerMedical(
                horse_id=medical_data["horse_id"],
                date=medical_data.get("date"),
                type=medical_data.get("type")
            )
            db.merge(medical)
            db.commit()
            log_message(f"Stored medical data for horse {medical_data['horse_id']}")
        except Exception as e:
            db.rollback()
            raise
        finally:
            db.close()

    def _store_runner_quote(self, quote_data: Dict) -> None:
        """Store runner quote data in the database."""
        db = self.db_manager.SessionLocal()
        try:
            quote = RunnerQuote(
                horse_id=quote_data["horse_id"],
                date=quote_data.get("date"),
                race=quote_data.get("race"),
                course=quote_data.get("course"),
                course_id=quote_data.get("course_id"),
                distance_f=quote_data.get("distance_f"),
                distance_y=quote_data.get("distance_y"),
                quote=quote_data.get("quote")
            )
            db.merge(quote)
            db.commit()
            log_message(f"Stored quote for horse {quote_data['horse_id']}")
        except Exception as e:
            db.rollback()
            raise
        finally:
            db.close()

    def _store_trainer_statistics(self, stats_data: Dict) -> None:
        """Store trainer statistics in the database."""
        db = self.db_manager.SessionLocal()
        try:
            stats = TrainerStatistics(
                trainer_id=stats_data["trainer_id"],
                period_type=stats_data["period_type"],
                period_value=stats_data.get("period_value"),
                runs=stats_data.get("runs", 0),
                wins=stats_data.get("wins", 0),
                places=stats_data.get("places", 0),
                win_percentage=stats_data.get("win_percentage", 0),
                ae=stats_data.get("ae", 0),
                pl=stats_data.get("pl", 0)
            )
            db.merge(stats)
            db.commit()
            log_message(f"Stored statistics for trainer {stats_data['trainer_id']}")
        except Exception as e:
            db.rollback()
            raise
        finally:
            db.close()

    def _store_jockey_statistics(self, stats_data: Dict) -> None:
        """Store jockey statistics in the database."""
        db = self.db_manager.SessionLocal()
        try:
            stats = JockeyStatistics(
                jockey_id=stats_data["jockey_id"],
                period_type=stats_data["period_type"],
                period_value=stats_data.get("period_value"),
                rides=stats_data.get("rides", 0),
                wins=stats_data.get("wins", 0),
                places=stats_data.get("places", 0),
                win_percentage=stats_data.get("win_percentage", 0),
                ae=stats_data.get("ae", 0),
                pl=stats_data.get("pl", 0)
            )
            db.merge(stats)
            db.commit()
            log_message(f"Stored statistics for jockey {stats_data['jockey_id']}")
        except Exception as e:
            db.rollback()
            raise
        finally:
            db.close()

    def _store_horse_statistics(self, stats_data: Dict) -> None:
        """Store horse statistics in the database."""
        db = self.db_manager.SessionLocal()
        try:
            stats = HorseStatistics(
                horse_id=stats_data["horse_id"],
                stat_type=stats_data["stat_type"],
                stat_value=stats_data["stat_value"],
                runs=stats_data.get("runs", 0),
                wins=stats_data.get("wins", 0),
                places=stats_data.get("places", 0),
                win_percentage=stats_data.get("win_percentage", 0),
                best_position=stats_data.get("best_position")
            )
            db.merge(stats)
            db.commit()
            log_message(f"Stored statistics for horse {stats_data['horse_id']}")
        except Exception as e:
            db.rollback()
            raise
        finally:
            db.close()

    def run_pipeline(self) -> None:
        """Run the complete data ingestion pipeline."""
        log_message("Starting data ingestion pipeline...")
        
        try:
            # Initialize database
            log_message("Initializing database...")
            db = self.db_manager.SessionLocal()
            try:
                self.db_manager.init_db(session=db)
                log_message("Database initialized successfully")
            finally:
                db.close()
            
            # Step 1: Process all data types
            log_message("Step 1: Processing data from files...")
            
            # Process courses
            self.fetch_and_store_data("courses")
            
            # Process racecards
            self.fetch_and_store_data("racecards")
            
            # Process results
            self.fetch_and_store_data("results")
            
            log_message("Data ingestion pipeline completed successfully")
            
        except Exception as e:
            log_message(f"Error in data ingestion pipeline: {str(e)}")
            raise

if __name__ == "__main__":
    try:
        log_message("Starting data ingestion script...")
        pipeline = DataIngestionPipelineV2()
        pipeline.run_pipeline()
    except Exception as e:
        log_message(f"Fatal error: {str(e)}")
        sys.exit(1) 