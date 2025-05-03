from sqlalchemy import (
    Column, Integer, String, Float, Boolean, 
    DateTime, Date, Time, ForeignKey, Text,
    UniqueConstraint, Index, Numeric, JSON, create_engine
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, relationship
from datetime import datetime
from typing import List, Dict

Base = declarative_base()

class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    thread_id = Column(String, index=True)
    user_key = Column(String, index=True)
    query = Column(String)
    response = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

class Course(Base):
    __tablename__ = "courses"
    
    course_id = Column(String(20), primary_key=True)
    course = Column(String(100), nullable=False)
    region_code = Column(String(10), nullable=False)
    region = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    races = relationship("Race", back_populates="course")
    
    __table_args__ = (
        Index("idx_course_region_code", region_code),
    )

class Race(Base):
    __tablename__ = "races"
    
    race_id = Column(String(30), primary_key=True)
    course_id = Column(String(20), ForeignKey("courses.course_id"), nullable=False)
    date = Column(Date, nullable=False)
    off_time = Column(Time, nullable=False)
    off_dt = Column(DateTime)
    race_name = Column(String(255), nullable=False)
    distance_round = Column(String(20))
    distance = Column(String(20), nullable=False)
    distance_f = Column(String(20), nullable=False)
    region = Column(String(50), nullable=False)
    pattern = Column(String(20))
    sex_restriction = Column(String(20), default="")
    race_class = Column(String(20))
    type = Column(String(20), nullable=False)
    age_band = Column(String(20))
    rating_band = Column(String(30))
    prize = Column(String(20))
    field_size = Column(String(10))
    going_detailed = Column(Text)
    rail_movements = Column(String(255))
    stalls = Column(String(50))
    weather = Column(String(100))
    going = Column(String(30), nullable=False)
    surface = Column(String(20))
    jumps = Column(Text, default="")
    big_race = Column(Boolean, default=False)
    is_abandoned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    course = relationship("Course", back_populates="races")
    runners = relationship("Runner", back_populates="race")
    results = relationship("Result", back_populates="race")
    
    __table_args__ = (
        Index("idx_race_date", date),
        Index("idx_race_course_date", course_id, date),
        Index("idx_race_pattern", pattern),
        Index("idx_race_class", race_class),
        Index("idx_race_big", big_race),
    )

class Horse(Base):
    __tablename__ = "horses"
    
    horse_id = Column(String(30), primary_key=True)
    horse = Column(String(100), nullable=False)
    dob = Column(String(20))
    age = Column(String(10))
    sex = Column(String(10))
    sex_code = Column(String(5))
    colour = Column(String(20))
    region = Column(String(20))
    breeder = Column(String(100))
    dam = Column(String(100))
    dam_id = Column(String(30))
    dam_region = Column(String(20), default="")
    sire = Column(String(100))
    sire_id = Column(String(30))
    sire_region = Column(String(20), default="")
    damsire = Column(String(100))
    damsire_id = Column(String(30))
    damsire_region = Column(String(20), default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    runners = relationship("Runner", back_populates="horse")
    results = relationship("Result", back_populates="horse")
    
    __table_args__ = (
        Index("idx_horses_name", horse),
        Index("idx_horses_sire", sire_id),
        Index("idx_horses_dam", dam_id),
        Index("idx_horses_damsire", damsire_id),
    )

class Trainer(Base):
    __tablename__ = "trainers"
    
    trainer_id = Column(String(30), primary_key=True)
    trainer = Column(String(100), nullable=False)
    trainer_location = Column(String(100), default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    runners = relationship("Runner", back_populates="trainer")
    results = relationship("Result", back_populates="trainer")
    
    __table_args__ = (
        Index("idx_trainers_name", trainer),
    )

class Jockey(Base):
    __tablename__ = "jockeys"
    
    jockey_id = Column(String(30), primary_key=True)
    jockey = Column(String(100), nullable=False)
    first_name = Column(String(50))
    middle_name = Column(String(50))
    last_name = Column(String(50))
    first_name_initial = Column(String(5))
    type = Column(String(30))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    runners = relationship("Runner", back_populates="jockey")
    results = relationship("Result", back_populates="jockey")
    
    __table_args__ = (
        Index("idx_jockeys_name", jockey),
    )

class Owner(Base):
    __tablename__ = "owners"
    
    owner_id = Column(String(30), primary_key=True)
    owner = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    runners = relationship("Runner", back_populates="owner")
    results = relationship("Result", back_populates="owner")
    
    __table_args__ = (
        Index("idx_owners_name", owner),
    )

class Runner(Base):
    __tablename__ = "runners"
    
    runner_id = Column(String(40), primary_key=True)
    race_id = Column(String(30), ForeignKey("races.race_id"), nullable=False)
    horse_id = Column(String(30), ForeignKey("horses.horse_id"), nullable=False)
    jockey_id = Column(String(30), ForeignKey("jockeys.jockey_id"))
    trainer_id = Column(String(30), ForeignKey("trainers.trainer_id"), nullable=False)
    owner_id = Column(String(30), ForeignKey("owners.owner_id"), nullable=False)
    number = Column(String(10), nullable=False)
    draw = Column(String(10), nullable=False)
    headgear = Column(String(20), default="")
    headgear_run = Column(String(20), default="")
    wind_surgery = Column(String(20), default="")
    wind_surgery_run = Column(String(20), default="")
    lbs = Column(String(10), nullable=False)
    ofr = Column(String(10), nullable=False)
    rpr = Column(String(10), nullable=False)
    ts = Column(String(10), nullable=False)
    last_run = Column(String(20), nullable=False)
    form = Column(String(20))
    comment = Column(Text, default="")
    spotlight = Column(Text, default="")
    silk_url = Column(Text, default="")
    trainer_rtf = Column(Text)
    is_non_runner = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    race = relationship("Race", back_populates="runners")
    horse = relationship("Horse", back_populates="runners")
    jockey = relationship("Jockey", back_populates="runners")
    trainer = relationship("Trainer", back_populates="runners")
    owner = relationship("Owner", back_populates="runners")
    odds = relationship("Odds", back_populates="runner")
    
    __table_args__ = (
        UniqueConstraint("race_id", "horse_id", name="uq_runners_race_horse"),
        Index("idx_runners_race", race_id),
        Index("idx_runners_horse", horse_id),
        Index("idx_runners_jockey", jockey_id),
        Index("idx_runners_trainer", trainer_id),
        Index("idx_runners_headgear", headgear),
        Index("idx_runners_wind_surgery", wind_surgery),
        Index("idx_runners_non_runner", is_non_runner),
    )

class Result(Base):
    __tablename__ = "results"
    
    result_id = Column(String(40), primary_key=True)
    race_id = Column(String(30), ForeignKey("races.race_id"), nullable=False)
    horse_id = Column(String(30), ForeignKey("horses.horse_id"), nullable=False)
    jockey_id = Column(String(30), ForeignKey("jockeys.jockey_id"))
    trainer_id = Column(String(30), ForeignKey("trainers.trainer_id"), nullable=False)
    owner_id = Column(String(30), ForeignKey("owners.owner_id"), nullable=False)
    sp = Column(String(20))
    sp_dec = Column(String(20))
    number = Column(String(10))
    position = Column(String(10))
    draw = Column(String(10))
    btn = Column(String(20))
    ovr_btn = Column(String(20))
    age = Column(String(10))
    sex = Column(String(10))
    weight = Column(String(10))
    weight_lbs = Column(String(10))
    headgear = Column(String(20))
    time = Column(String(20))
    or_rating = Column(String(10))
    rpr = Column(String(10))
    tsr = Column(String(10))
    prize = Column(String(20))
    comment = Column(Text)
    silk_url = Column(String(255), default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    race = relationship("Race", back_populates="results")
    horse = relationship("Horse", back_populates="results")
    jockey = relationship("Jockey", back_populates="results")
    trainer = relationship("Trainer", back_populates="results")
    owner = relationship("Owner", back_populates="results")
    
    __table_args__ = (
        UniqueConstraint("race_id", "horse_id", name="uq_results_race_horse"),
        Index("idx_results_race", race_id),
        Index("idx_results_horse", horse_id),
        Index("idx_results_position", position),
    )

class Odds(Base):
    __tablename__ = "odds"
    
    odds_id = Column(String(40), primary_key=True)
    race_id = Column(String(30), nullable=False)
    horse_id = Column(String(30), nullable=False)
    runner_id = Column(String(40), ForeignKey("runners.runner_id"))
    bookmaker = Column(String(50), nullable=False)
    fractional = Column(String(20), nullable=False)
    decimal = Column(String(20), nullable=False)
    ew_places = Column(String(10))
    ew_denom = Column(String(10))
    updated = Column(String(30))
    is_current = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    runner = relationship("Runner", back_populates="odds")
    
    __table_args__ = (
        Index("idx_odds_race_horse", race_id, horse_id),
        Index("idx_odds_current", is_current),
    )

class RunnerMedical(Base):
    __tablename__ = "runner_medical"
    
    id = Column(Integer, primary_key=True)
    horse_id = Column(String(30), ForeignKey("horses.horse_id"), nullable=False)
    date = Column(String(20), default="")
    type = Column(String(50), default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index("idx_runner_medical_horse", horse_id),
    )

class RunnerQuote(Base):
    __tablename__ = "runner_quotes"
    
    id = Column(Integer, primary_key=True)
    horse_id = Column(String(30), ForeignKey("horses.horse_id"), nullable=False)
    date = Column(String(20), default="")
    race = Column(String(100), default="")
    course = Column(String(100), default="")
    course_id = Column(String(20), default="")
    distance_f = Column(String(20), default="")
    distance_y = Column(String(20), default="")
    quote = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index("idx_runner_quotes_horse", horse_id),
    )

class ApiSyncLog(Base):
    __tablename__ = "api_sync_log"
    
    id = Column(Integer, primary_key=True)
    endpoint = Column(String(100), nullable=False)
    parameters = Column(Text)
    records_processed = Column(Integer)
    status = Column(String(20))
    error_message = Column(Text)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    duration_seconds = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

class APICache(Base):
    __tablename__ = "api_cache"
    
    id = Column(Integer, primary_key=True)
    endpoint = Column(String(100), nullable=False)
    params = Column(Text, nullable=False)
    response_data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    
    __table_args__ = (
        Index("idx_api_cache_endpoint", endpoint),
        Index("idx_api_cache_expires", expires_at),
    )

class TrainerStatistics(Base):
    __tablename__ = "trainer_statistics"
    
    id = Column(Integer, primary_key=True)
    trainer_id = Column(String(30), ForeignKey("trainers.trainer_id"), nullable=False)
    period_type = Column(String(20), nullable=False)  # 14_days, season, course, etc.
    period_value = Column(String(30))  # course_id, season_year, etc.
    runs = Column(Integer, nullable=False, default=0)
    wins = Column(Integer, nullable=False, default=0)
    places = Column(Integer, nullable=False, default=0)
    win_percentage = Column(Numeric(5, 2), nullable=False, default=0)
    ae = Column(Numeric(5, 2), default=0)  # a/e
    pl = Column(Numeric(10, 2), default=0)  # one unit p/l
    last_calculated = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index("idx_trainer_statistics_trainer", trainer_id),
        Index("idx_trainer_statistics_period", period_type, period_value),
    )

class JockeyStatistics(Base):
    __tablename__ = "jockey_statistics"
    
    id = Column(Integer, primary_key=True)
    jockey_id = Column(String(30), ForeignKey("jockeys.jockey_id"), nullable=False)
    period_type = Column(String(20), nullable=False)
    period_value = Column(String(30))
    rides = Column(Integer, nullable=False, default=0)
    wins = Column(Integer, nullable=False, default=0)
    places = Column(Integer, nullable=False, default=0)
    win_percentage = Column(Numeric(5, 2), nullable=False, default=0)
    ae = Column(Numeric(5, 2), default=0)
    pl = Column(Numeric(10, 2), default=0)
    last_calculated = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index("idx_jockey_statistics_jockey", jockey_id),
        Index("idx_jockey_statistics_period", period_type, period_value),
    )

class HorseStatistics(Base):
    __tablename__ = "horse_statistics"
    
    id = Column(Integer, primary_key=True)
    horse_id = Column(String(30), ForeignKey("horses.horse_id"), nullable=False)
    stat_type = Column(String(20), nullable=False)  # course, going, distance, class
    stat_value = Column(String(30), nullable=False)  # course_id, going type, etc.
    runs = Column(Integer, nullable=False, default=0)
    wins = Column(Integer, nullable=False, default=0)
    places = Column(Integer, nullable=False, default=0)
    win_percentage = Column(Numeric(5, 2), nullable=False, default=0)
    best_position = Column(String(10))
    last_calculated = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        UniqueConstraint("horse_id", "stat_type", "stat_value", name="uq_horse_stat"),
        Index("idx_horse_statistics_horse", horse_id),
        Index("idx_horse_statistics_stat", stat_type, stat_value),
    )

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_user_email", email),
        Index("idx_user_username", username),
    )

# Database connection setup
def get_db_engine(database_url: str):
    return create_engine(database_url)

def init_db(engine):
    """Initialize database tables in the correct order based on dependencies."""
    # Drop all existing tables first
    Base.metadata.drop_all(engine)
    
    # Create tables in order of dependencies
    tables_in_order = [
        ChatHistory.__table__,
        Course.__table__,  # Must be created before Race
        Horse.__table__,   # Must be created before Runner and Result
        Trainer.__table__, # Must be created before Runner and Result
        Jockey.__table__,  # Must be created before Runner and Result
        Owner.__table__,   # Must be created before Runner and Result
        Race.__table__,    # Depends on Course
        Runner.__table__,  # Depends on Race, Horse, Trainer, Jockey, Owner
        Result.__table__,  # Depends on Race, Horse, Trainer, Jockey, Owner
        Odds.__table__,    # Depends on Runner
        RunnerMedical.__table__,  # Depends on Horse
        RunnerQuote.__table__,    # Depends on Horse
        ApiSyncLog.__table__,
        APICache.__table__,
        TrainerStatistics.__table__,  # Depends on Trainer
        JockeyStatistics.__table__,   # Depends on Jockey
        HorseStatistics.__table__,    # Depends on Horse
        User.__table__,
    ]
    
    # Create tables one by one in the specified order
    for table in tables_in_order:
        try:
            table.create(engine, checkfirst=True)
        except Exception as e:
            print(f"Error creating table {table.name}: {str(e)}")
            raise e

def store_racecards(self, db: Session, racecards_data: List[Dict]) -> None:
    """Store racecards data in respective tables."""
    for racecard in racecards_data:
        # Store course
        course = Course(
            course_id=racecard['course_id'],
            course=racecard['course'],
            region_code=racecard['region'],
            region=racecard['region']
        )
        db.add(course)

        # Store race
        race = Race(
            race_id=racecard['race_id'],
            course_id=racecard['course_id'],
            date=racecard['date'],
            # ... other race fields
        )
        db.add(race)

        # Store runners
        for runner in racecard['runners']:
            # Store horse
            horse = Horse(
                horse_id=runner['horse_id'],
                horse=runner['horse'],
                # ... other horse fields
            )
            db.add(horse)

            # Store runner
            runner_obj = Runner(
                runner_id=f"{racecard['race_id']}_{runner['horse_id']}",
                race_id=racecard['race_id'],
                horse_id=runner['horse_id'],
                # ... other runner fields
            )
            db.add(runner_obj) 