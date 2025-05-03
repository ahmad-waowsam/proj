from datetime import datetime, timedelta
from typing import Dict, Optional
from db.models import (
    Course, Race, Horse, Trainer, Jockey, Owner,
    Runner, Result, Odds, RunnerMedical, RunnerQuote
)
from src.db.database import DatabaseManager

class CachedRaceAPIClient:
    def __init__(self):
        self.db_manager = DatabaseManager()

    def get_courses(self) -> Dict:
        """Get all courses from the database."""
        db = self.db_manager.SessionLocal()
        try:
            courses = db.query(Course).all()
            return {"courses": [self._model_to_dict(course) for course in courses]}
        finally:
            db.close()

    def get_racecards(self, date: Optional[str] = None) -> Dict:
        """Get racecards from the database, optionally filtered by date."""
        db = self.db_manager.SessionLocal()
        try:
            query = db.query(Race).join(Course)
            if date:
                query = query.filter(Race.date == date)
            races = query.all()
            return {"racecards": [self._model_to_dict(race, include_relationships=True) for race in races]}
        finally:
            db.close()

    def get_results(self, date: Optional[str] = None) -> Dict:
        """Get results from the database, optionally filtered by date."""
        db = self.db_manager.SessionLocal()
        try:
            query = db.query(Result).join(Race)
            if date:
                query = query.filter(Race.date == date)
            results = query.all()
            return {"results": [self._model_to_dict(result, include_relationships=True) for result in results]}
        finally:
            db.close()

    def get_horse(self, horse_id: str) -> Dict:
        """Get horse details from the database."""
        db = self.db_manager.SessionLocal()
        try:
            horse = db.query(Horse).filter(Horse.horse_id == horse_id).first()
            if horse:
                return {"horse": self._model_to_dict(horse, include_relationships=True)}
            return {"horse": None}
        finally:
            db.close()

    def get_odds(self, race_id: str) -> Dict:
        """Get odds for a specific race from the database."""
        db = self.db_manager.SessionLocal()
        try:
            odds = db.query(Odds).filter(Odds.race_id == race_id).all()
            return {"odds": [self._model_to_dict(odd) for odd in odds]}
        finally:
            db.close()

    def _model_to_dict(self, model: any, include_relationships: bool = False) -> Dict:
        """Convert SQLAlchemy model to dictionary."""
        result = {}
        for column in model.__table__.columns:
            value = getattr(model, column.name)
            if isinstance(value, (datetime, timedelta)):
                value = str(value)
            result[column.name] = value

        if include_relationships:
            for relationship in model.__mapper__.relationships:
                related_obj = getattr(model, relationship.key)
                if related_obj is not None:
                    if isinstance(related_obj, list):
                        result[relationship.key] = [
                            self._model_to_dict(item) for item in related_obj
                        ]
                    else:
                        result[relationship.key] = self._model_to_dict(related_obj)

        return result
