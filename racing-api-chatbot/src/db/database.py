import os
import json
from sqlalchemy import create_engine
from datetime import datetime, timedelta
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session, sessionmaker
from .models import (
    get_db_engine, init_db, ChatHistory, APICache,
    Course, Race, Horse, Trainer, Jockey, Owner,
    Runner, Result, Odds, RunnerMedical, RunnerQuote,
    ApiSyncLog, TrainerStatistics, JockeyStatistics, HorseStatistics,
    User, Base
)
from langchain_core.messages import ToolMessage
from sqlalchemy.sql import text
from urllib.parse import urlparse, urlunparse


def log_message(message: str):
    """Helper function to log messages with timestamp"""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}", flush=True)


class DatabaseManager:
    def __init__(self):
        # Get the database URL from environment
        db_url = os.getenv("DATABASE_URL")
        
        # If running outside Docker, replace 'postgres' host with 'localhost'
        if os.getenv("DOCKER_ENV", "").lower() != "true":
            parsed = urlparse(db_url)
            if parsed.hostname == "postgres":
                # Only replace the hostname part, keeping username and password intact
                netloc_parts = parsed.netloc.split("@")
                if len(netloc_parts) == 2:
                    auth, host_port = netloc_parts
                    host_port = host_port.replace("postgres", "localhost")
                    new_netloc = f"{auth}@{host_port}"
                else:
                    new_netloc = parsed.netloc.replace("postgres", "localhost")
                
                db_url = urlunparse((
                    parsed.scheme,
                    new_netloc,
                    parsed.path,
                    parsed.params,
                    parsed.query,
                    parsed.fragment
                ))
        
        self.database_url = db_url
        
        # Add connection parameters with increased timeouts
        connect_args = {
            'connect_timeout': 120,  # 120 seconds timeout for initial connection
            'application_name': 'racing-api-chatbot',
            'options': '-c statement_timeout=1800000'  # 30 minute timeout for statements
        }
        
        print(f"Connecting to database at {self.database_url}...")
        self.engine = create_engine(
            self.database_url,
            connect_args=connect_args,
            pool_size=5,
            max_overflow=10,
            pool_timeout=120,
            pool_recycle=1800,
            pool_pre_ping=True
        )
        
        # Test the connection
        try:
            with self.engine.connect() as conn:
                # Set longer timeouts for the session
                conn.execute(text("SET statement_timeout = '1800000'"))  # 30 minutes
                conn.execute(text("SET lock_timeout = '1800000'"))  # 30 minutes
                conn.execute(text("SET idle_in_transaction_session_timeout = '1800000'"))  # 30 minutes
                conn.execute(text("SELECT 1"))
            print("Database connection test successful")
        except Exception as e:
            print(f"Database connection test failed: {str(e)}")
            raise
        
        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine,
            expire_on_commit=False
        )

    def init_db(self, session: Optional[Session] = None):
        """Initialize the database by dropping all tables and recreating them."""
        try:
            print("Starting database initialization...")
            
            if session:
                # Use provided session
                conn = session.connection()
                print("Using provided database session...")
                # Use the session's transaction
                transaction = session.get_transaction()
                if not transaction:
                    transaction = session.begin()
            else:
                # Create new connection
                engine = self.engine
                print("Attempting to connect to database...")
                conn = engine.connect()
                print("Connected to database successfully")
                # Create a new transaction
                transaction = conn.begin()
            
            try:
                # Set longer timeouts for table creation
                conn.execute(text("SET statement_timeout = '1800000'"))  # 30 minutes
                conn.execute(text("SET lock_timeout = '600000'"))  # 10 minutes
                
                # Drop all existing tables
                print("\nDropping all existing tables...")
                Base.metadata.drop_all(bind=conn)
                print("All tables dropped successfully")
                
                # Create all tables using SQLAlchemy's metadata
                print("\nCreating new tables...")
                Base.metadata.create_all(bind=conn)
                print("All tables created successfully")
                
                # Commit the transaction
                transaction.commit()
                print("Database initialization completed successfully")
                
            except Exception as e:
                print(f"Error during database initialization: {str(e)}")
                transaction.rollback()
                raise
            
        except Exception as e:
            print(f"Database initialization failed: {str(e)}")
            raise

    def get_db(self):
        """Get a database session with proper transaction handling."""
        db = self.SessionLocal()
        try:
            # Set longer timeouts for the session
            db.execute(text("SET statement_timeout = '300000'"))  # 5 minutes
            db.execute(text("SET lock_timeout = '300000'"))  # 5 minutes
            db.execute(text("SET idle_in_transaction_session_timeout = '300000'"))  # 5 minutes
            yield db
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()

    def store_api_response(self, db: Session, endpoint: str, response_data: Dict[str, Any]) -> None:
        """Store API response data in normalized database tables."""
        try:
            print(f"\nProcessing API response for endpoint: {endpoint}")
            print(f"Response data keys: {list(response_data.keys())}")
            
            # Log the raw response data for debugging
            if 'courses' in response_data:
                print(f"Number of courses in response: {len(response_data['courses'])}")
                print(f"Sample course data: {response_data['courses'][0] if response_data['courses'] else 'No courses'}")
            
            # Process the data with retry logic
            max_retries = 5  # Increased retry count
            retry_count = 0
            while retry_count < max_retries:
                try:
                    if endpoint == "get_racecards_pro" or endpoint == "get_racecards_standard":
                        print("Processing racecards data...")
                        self._store_racecards(db, response_data.get("racecards", []))
                    elif endpoint == "get_courses":
                        print("Processing courses data...")
                        courses_data = response_data.get("courses", [])
                        print(f"Found {len(courses_data)} courses to process")
                        self._store_courses(db, courses_data)
                    elif endpoint == "get_horse_results":
                        print("Processing horse results data...")
                        self._store_results(db, response_data)
                    elif endpoint == "get_odds":
                        print("Processing odds data...")
                        self._store_odds(db, response_data)
                    elif endpoint == "get_horse_pro" or endpoint == "get_horse_standard":
                        print("Processing horse data...")
                        self._store_horse(db, response_data)
                    elif endpoint == "get_jockey_results":
                        print("Processing jockey results data...")
                        self._store_jockey_results(db, response_data)
                    elif endpoint == "get_trainer_results":
                        print("Processing trainer results data...")
                        self._store_trainer_results(db, response_data)
                    
                    # If we get here, the operation was successful
                    break
                    
                except Exception as e:
                    retry_count += 1
                    print(f"Error processing data (attempt {retry_count}/{max_retries}): {str(e)}")
                    if retry_count < max_retries:
                        print("Retrying after 10 seconds...")
                        import time
                        time.sleep(10)  # Increased delay between retries
                        # Rollback the transaction before retrying
                        db.rollback()
                    else:
                        raise
            
            # Log the sync status in a separate transaction
            try:
                sync_db = self.SessionLocal()
                try:
                    sync_log = ApiSyncLog(
                        endpoint=endpoint,
                        parameters=json.dumps(response_data.get("parameters", {})),
                        status="success",
                        start_time=datetime.utcnow(),
                        end_time=datetime.utcnow(),
                        records_processed=len(response_data)
                    )
                    sync_db.add(sync_log)
                    sync_db.commit()
                    print("API sync logged successfully")
                finally:
                    sync_db.close()
            except Exception as e:
                print(f"Error logging API sync: {str(e)}")
                # Don't raise this error as the main data processing was successful
            
        except Exception as e:
            print(f"Error storing API response: {str(e)}")
            raise

    def _store_courses(self, db: Session, courses_data: List[Dict]) -> None:
        """Store courses data in batches."""
        try:
            if not courses_data:
                print("No courses data to process")
                return
                
            print(f"\nStoring {len(courses_data)} courses...")
            batch_size = 25  # Further reduced batch size
            total_batches = (len(courses_data) + batch_size - 1) // batch_size
            
            for batch_num in range(total_batches):
                start_idx = batch_num * batch_size
                end_idx = min((batch_num + 1) * batch_size, len(courses_data))
                batch = courses_data[start_idx:end_idx]
                
                print(f"\nProcessing batch {batch_num + 1}/{total_batches} ({len(batch)} courses)...")
                
                # Create course objects for the batch
                courses = []
                for course_data in batch:
                    try:
                        course = Course(
                            course_id=course_data["id"],  # Changed from "course_id" to "id" based on sample data
                            course=course_data["course"],
                            region_code=course_data["region_code"],
                            region=course_data["region"]
                        )
                        courses.append(course)
                        print(f"Prepared course: {course.course} (ID: {course.course_id})")
                    except Exception as e:
                        print(f"Error preparing course data: {str(e)}")
                        print(f"Course data: {course_data}")
                        raise
                
                # Bulk insert the batch with retry
                max_retries = 5  # Increased retry count
                retry_count = 0
                while retry_count < max_retries:
                    try:
                        db.bulk_save_objects(courses)
                        db.commit()
                        print(f"Successfully stored batch {batch_num + 1}")
                        break
                    except Exception as e:
                        retry_count += 1
                        print(f"Error storing batch {batch_num + 1} (attempt {retry_count}/{max_retries}): {str(e)}")
                        if retry_count < max_retries:
                            print("Retrying after 10 seconds...")
                            import time
                            time.sleep(10)  # Increased delay between retries
                            db.rollback()
                        else:
                            raise
                
                # Add a small delay between batches
                import time
                time.sleep(2)
            
            # Verify the data was stored
            print("\nVerifying stored courses...")
            stored_courses = db.query(Course).all()
            print(f"Total courses in database: {len(stored_courses)}")
            
        except Exception as e:
            print(f"Error storing courses: {str(e)}")
            db.rollback()
            raise

    def _store_racecards(self, db: Session, racecards_data: List[Dict]) -> None:
        """Store racecards with proper jockey handling."""
        try:
            for racecard in racecards_data:
                # Store race data
                race = Race(
                    race_id=racecard["race_id"],
                    course_id=racecard["course_id"],
                    race_name=racecard.get("race_name"),
                    race_type=racecard.get("race_type"),
                    race_class=racecard.get("race_class"),
                    race_distance=racecard.get("race_distance"),
                    race_time=racecard.get("race_time"),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(race)
                db.flush()

                # Store runners
                for runner in racecard.get("runners", []):
                    # Store jockey with unique constraint handling
                    if "jockey" in runner:
                        jockey = self._store_jockey(db, runner["jockey"])
                        jockey_id = jockey.jockey_id
                    else:
                        jockey_id = None

                    # Create runner
                    runner_obj = Runner(
                        runner_id=runner["runner_id"],
                        race_id=race.race_id,
                        horse_id=runner.get("horse_id"),
                        jockey_id=jockey_id,
                        trainer_id=runner.get("trainer_id"),
                        owner_id=runner.get("owner_id"),
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    db.add(runner_obj)
                    db.flush()

            db.commit()
        except SQLAlchemyError as e:
            db.rollback()
            print(f"Error storing racecards: {str(e)}")
            raise

    def _store_results(self, db: Session, results_data: List[Dict]) -> None:
        """Store results with proper jockey handling."""
        try:
            for result in results_data:
                # Store race result
                race_result = Result(
                    race_id=result["race_id"],
                    result_status=result.get("result_status"),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(race_result)
                db.flush()

                # Store runners
                for runner in result.get("runners", []):
                    # Store jockey with unique constraint handling
                    if "jockey" in runner:
                        jockey = self._store_jockey(db, runner["jockey"])
                        jockey_id = jockey.jockey_id
                    else:
                        jockey_id = None

                    # Update runner with result
                    runner_obj = db.query(Runner).filter(
                        Runner.runner_id == runner["runner_id"]
                    ).first()

                    if runner_obj:
                        runner_obj.finishing_position = runner.get("finishing_position")
                        runner_obj.distance_beaten = runner.get("distance_beaten")
                        runner_obj.updated_at = datetime.utcnow()
                    else:
                        runner_obj = Runner(
                            runner_id=runner["runner_id"],
                            race_id=result["race_id"],
                            horse_id=runner.get("horse_id"),
                            jockey_id=jockey_id,
                            trainer_id=runner.get("trainer_id"),
                            owner_id=runner.get("owner_id"),
                            finishing_position=runner.get("finishing_position"),
                            distance_beaten=runner.get("distance_beaten"),
                            created_at=datetime.utcnow(),
                            updated_at=datetime.utcnow()
                        )
                        db.add(runner_obj)
                    db.flush()

            db.commit()
        except SQLAlchemyError as e:
            db.rollback()
            print(f"Error storing results: {str(e)}")
            raise

    def _store_odds(self, db: Session, odds_data: Dict) -> None:
        """Store odds data in the database.
        
        Args:
            db (Session): Database session
            odds_data (Dict): Dictionary containing odds data with the following structure:
                {
                    "race_id": str,
                    "horse_id": str,
                    "odds": {
                        "bookmaker_name": {
                            "fractional": str,
                            "decimal": str,
                            "ew_places": str,
                            "ew_denom": str,
                            "updated": str
                        }
                    }
                }
        """
        try:
            race_id = odds_data["race_id"]
            horse_id = odds_data["horse_id"]
            runner_id = f"{race_id}_{horse_id}"
            
            for bookmaker, odds_info in odds_data.get("odds", {}).items():
                # Create odds record
                odds = Odds(
                    odds_id=f"{runner_id}_{bookmaker}",
                    race_id=race_id,
                    horse_id=horse_id,
                    runner_id=runner_id,
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
            log_message(f"Stored odds for race {race_id}, horse {horse_id}")
            
        except Exception as e:
            db.rollback()
            log_message(f"Error storing odds: {str(e)}")
            raise

    def get_current_odds_by_race(self, db: Session, race_id: str) -> List[Odds]:
        """Get current odds for all runners in a race.
        
        Args:
            db (Session): Database session
            race_id (str): Race ID
            
        Returns:
            List[Odds]: List of current odds for all runners in the race
        """
        return db.query(Odds).filter(
            Odds.race_id == race_id,
            Odds.is_current == True
        ).all()

    def get_current_odds_by_runner(self, db: Session, runner_id: str) -> List[Odds]:
        """Get current odds for a specific runner.
        
        Args:
            db (Session): Database session
            runner_id (str): Runner ID (format: race_id_horse_id)
            
        Returns:
            List[Odds]: List of current odds for the runner
        """
        return db.query(Odds).filter(
            Odds.runner_id == runner_id,
            Odds.is_current == True
        ).all()

    def get_odds_history(self, db: Session, runner_id: str, bookmaker: str = None) -> List[Odds]:
        """Get odds history for a runner.
        
        Args:
            db (Session): Database session
            runner_id (str): Runner ID (format: race_id_horse_id)
            bookmaker (str, optional): Filter by specific bookmaker
            
        Returns:
            List[Odds]: List of odds history for the runner
        """
        query = db.query(Odds).filter(Odds.runner_id == runner_id)
        if bookmaker:
            query = query.filter(Odds.bookmaker == bookmaker)
        return query.order_by(Odds.created_at.desc()).all()

    def _store_horse(self, db: Session, horse_data: Dict) -> None:
        """Store detailed horse data."""
        horse = Horse(
            horse_id=horse_data["horse_id"],
            horse=horse_data["horse"],
            dob=horse_data.get("dob"),
            age=horse_data.get("age"),
            sex=horse_data.get("sex"),
            sex_code=horse_data.get("sex_code"),
            colour=horse_data.get("colour"),
            region=horse_data.get("region"),
            breeder=horse_data.get("breeder"),
            dam=horse_data.get("dam"),
            dam_id=horse_data.get("dam_id"),
            dam_region=horse_data.get("dam_region", ""),
            sire=horse_data.get("sire"),
            sire_id=horse_data.get("sire_id"),
            sire_region=horse_data.get("sire_region", ""),
            damsire=horse_data.get("damsire"),
            damsire_id=horse_data.get("damsire_id"),
            damsire_region=horse_data.get("damsire_region", "")
        )
        db.merge(horse)
        
        # Store medical history if available
        for medical in horse_data.get("medical_history", []):
            medical_record = RunnerMedical(
                horse_id=horse_data["horse_id"],
                date=medical.get("date"),
                type=medical.get("type")
            )
            db.add(medical_record)
            
        # Store quotes if available
        for quote in horse_data.get("quotes", []):
            quote_record = RunnerQuote(
                horse_id=horse_data["horse_id"],
                date=quote.get("date"),
                race=quote.get("race"),
                course=quote.get("course"),
                course_id=quote.get("course_id"),
                distance_f=quote.get("distance_f"),
                distance_y=quote.get("distance_y"),
                quote=quote.get("quote")
            )
            db.add(quote_record)
            
        db.commit()

    def filter_api_response(self, db: Session, response_data: Dict[str, Any], filters: Dict[str, Any], max_results: int = 5) -> Dict[str, Any]:
        """Filter API response data using SQL queries."""
        try:
            filtered_response = {}
            
            for func_name, data in response_data.items():
                if not data:
                    continue
                    
                # Map API endpoints to database tables
                table_mapping = {
                    "get_racecards_pro": Race,
                    "get_courses": Course,
                    "get_horse_results": Result,
                    "get_odds": Odds,
                    "get_horse_pro": Horse,
                    "get_jockey_results": Result,
                    "get_trainer_results": Result
                }
                
                if func_name in table_mapping:
                    # Build query based on filters
                    query = db.query(table_mapping[func_name])
                    
                    for key, value in filters.items():
                        if hasattr(table_mapping[func_name], key):
                            query = query.filter(getattr(table_mapping[func_name], key).ilike(f"%{value}%"))
                    
                    # Get results
                    results = query.limit(max_results).all()
                    
                    # Convert to dictionary
                    filtered_response[func_name] = [
                        {c.name: getattr(result, c.name) 
                         for c in result.__table__.columns}
                        for result in results
                    ]
                else:
                    # For unhandled endpoints, return original data with limit
                    if isinstance(data, list):
                        filtered_response[func_name] = data[:max_results]
                    else:
                        filtered_response[func_name] = data
            
            return filtered_response
            
        except SQLAlchemyError as e:
            db.rollback()
            raise e

    def get_cache_entry(self, db: Session, endpoint: str, params: dict = None) -> dict:
        """Get a cached API response if available and not expired."""
        try:
            params_str = json.dumps(params, sort_keys=True) if params else "{}"
            cache_entry = db.query(APICache).filter(
                APICache.endpoint == endpoint,
                APICache.params == params_str,
                APICache.expires_at > datetime.utcnow()
            ).first()
            
            if cache_entry:
                return json.loads(cache_entry.response_data)
            return None
        except SQLAlchemyError as e:
            db.rollback()
            raise e

    def store_cache_entry(self, db: Session, endpoint: str, params: dict, response_data: dict, ttl_hours: int = 24):
        """Store an API response in the cache."""
        try:
            # First store the normalized data
            self.store_api_response(db, endpoint, response_data)
            
            # Then store in cache
            params_str = json.dumps(params, sort_keys=True) if params else "{}"
            expires_at = datetime.utcnow() + timedelta(hours=ttl_hours)
            
            cache_entry = APICache(
                endpoint=endpoint,
                params=params_str,
                response_data=json.dumps(response_data),
                expires_at=expires_at
            )
            
            db.add(cache_entry)
            db.commit()
            return cache_entry
        except SQLAlchemyError as e:
            db.rollback()
            raise e

    def _serialize_response(self, response: Any) -> Dict[str, Any]:
        if isinstance(response, ToolMessage):
            try:
                # Extract the actual content from the ToolMessage
                content = response.content
                if isinstance(content, str):
                    try:
                        # If it's a JSON string, parse it
                        content = json.loads(content)
                    except json.JSONDecodeError:
                        # If not JSON, keep as string
                        pass
                
                # Format for chat_history table
                return {
                    "content": content,
                    "tool_call_id": response.tool_call_id,
                    "type": "tool_message"
                }
            except Exception as e:
                # Fallback to string representation
                return {
                    "content": str(response.content),
                    "tool_call_id": str(response.tool_call_id),
                    "type": "tool_message"
                }
        elif isinstance(response, dict):
            # If it's already a dict, ensure all values are serializable
            serialized = {}
            for key, value in response.items():
                if isinstance(value, (str, int, float, bool, type(None))):
                    serialized[key] = value
                elif isinstance(value, (list, dict)):
                    serialized[key] = self._serialize_response(value)
                else:
                    serialized[key] = str(value)
            return serialized
        elif isinstance(response, list):
            # If it's a list, ensure all items are serializable
            return [self._serialize_response(item) for item in response]
        else:
            # For any other type, convert to string
            return {"content": str(response), "type": "unknown"}

    def save_chat_history(self, db: Session, thread_id: str, user_key: str, query: str, response: Any) -> ChatHistory:
        """Save chat history to the database."""
        try:
            # First serialize the response
            serialized_response = self._serialize_response(response)
            
            # Create the chat history entry
            chat_history = ChatHistory(
                thread_id=thread_id,
                user_key=user_key,
                query=query,
                response=serialized_response
            )
            
            # Add to session and commit
            db.add(chat_history)
            db.commit()
            db.refresh(chat_history)
            return chat_history
        except SQLAlchemyError as e:
            db.rollback()
            raise e

    def get_chat_history(self, db: Session, thread_id: Optional[str] = None, user_key: Optional[str] = None, limit: int = 10) -> list[ChatHistory]:
        """Get chat history from the database."""
        query = db.query(ChatHistory)
        if thread_id:
            query = query.filter(ChatHistory.thread_id == thread_id)
        if user_key:
            query = query.filter(ChatHistory.user_key == user_key)
        return query.order_by(ChatHistory.created_at.desc()).limit(limit).all()

    def get_runners_by_race(self, db: Session, race_id: str) -> List[Runner]:
        """Get all runners for a specific race."""
        return db.query(Runner).filter(Runner.race_id == race_id).all()

    def _store_jockey(self, db: Session, jockey_data: Dict) -> None:
        """Store a jockey with unique constraint handling."""
        try:
            jockey = db.query(Jockey).filter(Jockey.jockey_id == jockey_data["jockey_id"]).first()
            if not jockey:
                jockey = Jockey(
                    jockey_id=jockey_data["jockey_id"],
                    jockey=jockey_data.get("jockey"),
                    first_name=jockey_data.get("first_name"),
                    middle_name=jockey_data.get("middle_name"),
                    last_name=jockey_data.get("last_name"),
                    first_name_initial=jockey_data.get("first_name_initial"),
                    type=jockey_data.get("type"),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(jockey)
                db.flush()
            return jockey
        except SQLAlchemyError as e:
            db.rollback()
            print(f"Error storing jockey: {str(e)}")
            raise

    def _store_jockey_results(self, db: Session, response_data: Dict) -> None:
        """Store jockey results data."""
        try:
            for jockey_data in response_data.get("jockey_results", []):
                # Store jockey with unique constraint handling
                jockey = self._store_jockey(db, jockey_data)
                jockey_id = jockey.jockey_id

                # Store results
                for result_data in jockey_data.get("results", []):
                    result = Result(
                        result_id=f"{result_data['race_id']}_{result_data['horse_id']}",
                        race_id=result_data["race_id"],
                        horse_id=result_data["horse_id"],
                        jockey_id=jockey_id,
                        trainer_id=result_data["trainer_id"],
                        owner_id=result_data["owner_id"],
                        sp=result_data.get("sp"),
                        sp_dec=result_data.get("sp_dec"),
                        number=result_data.get("number"),
                        position=result_data.get("position"),
                        draw=result_data.get("draw"),
                        btn=result_data.get("btn"),
                        ovr_btn=result_data.get("ovr_btn"),
                        age=result_data.get("age"),
                        sex=result_data.get("sex"),
                        weight=result_data.get("weight"),
                        weight_lbs=result_data.get("weight_lbs"),
                        headgear=result_data.get("headgear"),
                        time=result_data.get("time"),
                        or_rating=result_data.get("or"),
                        rpr=result_data.get("rpr"),
                        tsr=result_data.get("tsr"),
                        prize=result_data.get("prize"),
                        comment=result_data.get("comment"),
                        silk_url=result_data.get("silk_url", "")
                    )
                    db.merge(result)
            db.commit()
        except Exception as e:
            print(f"Error storing jockey results: {str(e)}")
            db.rollback()
            raise

    def _store_trainer_results(self, db: Session, response_data: Dict) -> None:
        """Store trainer results data."""
        try:
            for trainer_data in response_data.get("trainer_results", []):
                # Store trainer
                trainer = Trainer(
                    trainer_id=trainer_data["trainer_id"],
                    trainer=trainer_data["trainer"],
                    trainer_location=trainer_data.get("trainer_location", "")
                )
                db.merge(trainer)

                # Store results
                for result_data in trainer_data.get("results", []):
                    result = Result(
                        result_id=f"{result_data['race_id']}_{result_data['horse_id']}",
                        race_id=result_data["race_id"],
                        horse_id=result_data["horse_id"],
                        trainer_id=trainer_data["trainer_id"],
                        owner_id=result_data["owner_id"],
                        sp=result_data.get("sp"),
                        sp_dec=result_data.get("sp_dec"),
                        number=result_data.get("number"),
                        position=result_data.get("position"),
                        draw=result_data.get("draw"),
                        btn=result_data.get("btn"),
                        ovr_btn=result_data.get("ovr_btn"),
                        age=result_data.get("age"),
                        sex=result_data.get("sex"),
                        weight=result_data.get("weight"),
                        weight_lbs=result_data.get("weight_lbs"),
                        headgear=result_data.get("headgear"),
                        time=result_data.get("time"),
                        or_rating=result_data.get("or"),
                        rpr=result_data.get("rpr"),
                        tsr=result_data.get("tsr"),
                        prize=result_data.get("prize"),
                        comment=result_data.get("comment"),
                        silk_url=result_data.get("silk_url", "")
                    )
                    db.merge(result)
            db.commit()
        except Exception as e:
            print(f"Error storing trainer results: {str(e)}")
            db.rollback()
            raise

    def get_user_chat_count(self, user_email: str) -> int:
        """Get the number of chat messages for a specific user.
        
        Args:
            user_email (str): The user's email address
            
        Returns:
            int: Number of chat messages
        """
        # Input validation
        if not user_email:
            log_message("Warning: Empty user_email provided to get_user_chat_count")
            return 0
            
        log_message(f"Getting chat count for user: {user_email}")
        
        try:
            # Create a dedicated session for this operation
            db = self.SessionLocal()
            
            try:
                # Get count with error handling
                count = db.query(ChatHistory).filter(
                    ChatHistory.user_key == user_email
                ).count()
                
                log_message(f"Found {count} chat messages for user: {user_email}")
                return count
                
            except Exception as e:
                log_message(f"Error querying chat count for {user_email}: {str(e)}")
                # Explicitly rollback on error
                db.rollback()
                return 0
                
            finally:
                # Always ensure the session is closed
                db.close()
                
        except Exception as e:
            log_message(f"Unexpected error in get_user_chat_count: {str(e)}")
            return 0

def get_db():
    """Get a database session."""
    db = DatabaseManager().SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create a global instance of DatabaseManager
db_manager = DatabaseManager()