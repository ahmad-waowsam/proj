import os
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

load_dotenv()

RACING_USERNAME = os.getenv("RACING_API_USERNAME")
RACING_PASSWORD = os.getenv("RACING_API_PASSWORD")

BASE_API_URL = os.getenv("RACING_API_BASE_URL")

# Database Schema Context for LLM
DATABASE_SCHEMA = {
    "tables": {
        "Course": {
            "description": "Represents a racecourse where races take place",
            "fields": {
                "course_id": "Primary key - Unique identifier for the course",
                "course": "Name of the course",
                "region_code": "Code representing the region",
                "region": "Name of the region"
            },
            "required_fields": ["course_id", "course"]
        },
        "Race": {
            "description": "Represents a specific race event",
            "fields": {
                "race_id": "Primary key - Unique identifier for the race",
                "course_id": "Foreign key - Reference to the course where the race takes place",
                "date": "Date of the race",
                "off_time": "Scheduled start time of the race",
                "race_name": "Name of the race",
                "distance": "Race distance",
                "distance_f": "Race distance in furlongs",
                "region": "Region where the race takes place",
                "type": "Type of race (e.g., Handicap, Maiden)",
                "going": "Track condition (e.g., Good, Soft)",
                "grade": "Race grade/class (e.g., Group 1, Class 2)"
            },
            "required_fields": ["race_id", "date", "race_name", "course_id", "distance", "going", "type", "grade"]
        },
        "Horse": {
            "description": "Represents a racehorse",
            "fields": {
                "horse_id": "Primary key - Unique identifier for the horse",
                "horse": "Name of the horse"
            },
            "required_fields": ["horse_id", "horse"]
        },
        "Jockey": {
            "description": "Represents a jockey who rides horses in races",
            "fields": {
                "jockey_id": "Unique identifier for the jockey",
                "jockey": "Name of the jockey"
            }
        },
        "Trainer": {
            "description": "Represents a horse trainer",
            "fields": {
                "trainer_id": "Unique identifier for the trainer",
                "trainer": "Name of the trainer"
            }
        },
        "Owner": {
            "description": "Represents a horse owner",
            "fields": {
                "owner_id": "Unique identifier for the owner",
                "owner": "Name of the owner"
            }
        },
        "Result": {
            "description": "Represents the result of a horse in a race",
            "fields": {
                "result_id": "Primary key - Unique identifier for the result",
                "race_id": "Foreign key - Reference to the race",
                "horse_id": "Foreign key - Reference to the horse",
                "position": "Finishing position",
                "sp_dec": "Starting price as decimal",
                "btn": "Beaten distance",
                "time": "Race completion time"
            },
            "required_fields": ["result_id", "race_id", "horse_id", "position"]
        }
    },
    "relationships": {
        "Result": {
            "Race": {
                "description": "A result belongs to a race",
                "join_field": "race_id",
                "required": True
            },
            "Horse": {
                "description": "A result is for a specific horse",
                "join_field": "horse_id",
                "required": True
            }
        },
        "Race": {
            "Course": {
                "description": "A race takes place at a course",
                "join_field": "course_id",
                "required": True
            }
        }
    },
    "query_patterns": {
        "horse_performance": {
            "description": "Find a horse's race results",
            "required_tables": ["Horse", "Result", "Race"],
            "join_path": "Horse -> Result -> Race",
            "example": {
                "query": "Show me the last 5 races for Constitution Hill",
                "filters": {
                    "Horse": {
                        "horse": {"contains": "Constitution Hill"},
                        "fields": ["horse_id", "horse"]
                    },
                    "Result": {
                        "fields": ["result_id", "race_id", "horse_id", "position"],
                        "sort": ["race_id", "desc"],
                        "limit": 5
                    },
                    "Race": {
                        "fields": ["race_id", "date", "race_name", "course_id", "distance", "going", "type", "grade"]
                    }
                },
                "content": ["Course"]
            }
        }
    }
}

def get_database_context() -> Dict[str, Any]:
    """Returns the database schema context for the LLM"""
    return DATABASE_SCHEMA

class RaceAPIClient():
    def __init__(self):
        self.username = os.getenv("RACING_API_USERNAME")
        self.password = os.getenv("RACING_API_PASSWORD")
        self.database_context = get_database_context()

    # Courses API Client
    def get_courses(self) -> 'CoursesResponse':
        """
        Get list of all race courses.
        """
        url = f"{BASE_API_URL}/courses/"


    def get_course_regions(self) -> 'CourseRegionsResponse':
        """
        Get list of course regions.
        """
        url = f"{BASE_API_URL}/courses/regions/"


    # Dams API Client
    def get_search_dams(self):
        """
        Search for dams using the Racing API.
        """
        url = f"{BASE_API_URL}/dams/search"



    def get_dam_results(self, dam_id):
        """
        Get results for a specific dam.
        """
        url = f"{BASE_API_URL}/dams/{dam_id}/results"


    def get_dam_class_analysis(self, dam_id):
        """
        Get class analysis for a specific dam.
        """
        url = f"{BASE_API_URL}/dams/{dam_id}/analysis/classes"

    def get_dam_distance_analysis(self, dam_id):
        """
        Get distance analysis for a specific dam.
        """
        url = f"{BASE_API_URL}/dams/{dam_id}/analysis/distances"
    # Damsires API Client
    def get_search_damsires(self):
        """
        Search for damsires using the Racing API.
        """
        url = f"{BASE_API_URL}/damsires/search"

    def get_damsire_results(self, damsire_id):
        """
        Get results for a specific damsire.
        """
        url = f"{BASE_API_URL}/damsires/{damsire_id}/results"


    def get_damsire_class_analysis(self, damsire_id):
        """
        Get class analysis for a specific damsire.
        """
        url = f"{BASE_API_URL}/damsires/{damsire_id}/analysis/classes"

    def get_damsire_distance_analysis(self, damsire_id):
        """
        Get distance analysis for a specific damsire.
        """
        url = f"{BASE_API_URL}/damsires/{damsire_id}/analysis/distances"

    # Horses API Client
    def get_search_horses(self):
        """
        Search for horses using the Racing API
        Args:
            Empty
        """
        url = f"{BASE_API_URL}/horses/search"

    def get_horse_results(self, horse_id):
        """
        Get race results for a specific horse.
        Args:
            horse_id (str): The unique ID of the horse.
        """
        url = f"{BASE_API_URL}/horses/{horse_id}/results"


    def get_horse_distance_times(self, horse_id):
        """
        Get distance-times analysis for a specific horse.
        Args:
            horse_id (str): The unique ID of the horse.
        """
        url = f"{BASE_API_URL}/horses/{horse_id}/analysis/distance-times"


    def get_horse_standard(self, horse_id):
        """
        Get standard data for a specific horse.
        Args:
            horse_id (str): The unique ID of the horse.
        """
        url = f"{BASE_API_URL}/horses/{horse_id}/standard"


    def get_horse_pro(self, horse_id):
        """
        Get pro data for a specific horse.
        Args:
            horse_id (str): The unique ID of the horse.
        """
        url = f"{BASE_API_URL}/horses/{horse_id}/pro"

    # Jockeys API Client
    def get_search_jockeys(self):
        """
        Search for jockeys using the Racing API.
        """
        url = f"{BASE_API_URL}/jockeys/search"

    def get_jockey_results(self, jockey_id):
        """
        Get race results for a specific jockey.
        Args:
            jockey_id (str): The unique ID of the jockey.
        """
        url = f"{BASE_API_URL}/jockeys/{jockey_id}/results"

    def get_jockey_course_analysis(self, jockey_id):
        """
        Get course analysis for a specific jockey.
        Args:
            jockey_id (str): The unique ID of the jockey.
        """
        url = f"{BASE_API_URL}/jockeys/{jockey_id}/analysis/courses"


    def get_jockey_distance_analysis(self, jockey_id):
        """
        Get distance analysis for a specific jockey.
        """
        url = f"{BASE_API_URL}/jockeys/{jockey_id}/analysis/distances"


    def get_jockey_owner_analysis(self, jockey_id):
        """
        Get owner analysis for a specific jockey.
        """
        url = f"{BASE_API_URL}/jockeys/{jockey_id}/analysis/owners"


    def get_jockey_trainer_analysis(self, jockey_id):
        """
        Get trainer analysis for a specific jockey.

        """
        url = f"{BASE_API_URL}/jockeys/{jockey_id}/analysis/trainers"

    # Odds API Client
    def get_odds(self, race_id, horse_id):
        """
        Get odds for a specific horse in a race.
        """
        url = f"{BASE_API_URL}/odds/{race_id}/{horse_id}"


    # Owners API Client
    def get_search_owners(self):
        """
        Search for owners using the Racing API.
        """
        url = f"{BASE_API_URL}/owners/search"



    def get_owner_results(self, owner_id):
        """
        Get results for a specific owner.
        """
        url = f"{BASE_API_URL}/owners/{owner_id}/results"



    def get_owner_course_analysis(self, owner_id):
        """
        Get course analysis for a specific owner.
        """
        url = f"{BASE_API_URL}/owners/{owner_id}/analysis/courses"

    def get_owner_distance_analysis(self, owner_id):
        """
        Get distance analysis for a specific owner.
        """
        url = f"{BASE_API_URL}/owners/{owner_id}/analysis/distances"

    def get_owner_jockey_analysis(self, owner_id):
        """
        Get jockey analysis for a specific owner.
        """
        url = f"{BASE_API_URL}/owners/{owner_id}/analysis/jockeys"


    def get_owner_trainer_analysis(self, owner_id):
        """
        Get trainer analysis for a specific owner.
        """
        url = f"{BASE_API_URL}/owners/{owner_id}/analysis/trainers"

    # Racecards API Client
    def get_racecards_free(self) -> 'RacecardsFreeResponse':
        url = f"{BASE_API_URL}/racecards/free"

    def get_racecards_basic(self) -> 'RacecardsStandardResponse':
        url = f"{BASE_API_URL}/racecards/basic"

    def get_racecards_standard(self) -> 'RacecardsStandardResponse':
        url = f"{BASE_API_URL}/racecards/standard"
        
    def get_racecards_pro(self) -> 'RacecardsProResponse':
        url = f"{BASE_API_URL}/racecards/pro"

    def get_racecards_big_races(self) -> 'RacecardsProResponse':
        url = f"{BASE_API_URL}/racecards/big-races"

    def get_racecards_summaries(self) -> 'RacecardsSummariesResponse':
        url = f"{BASE_API_URL}/racecards/summaries"
        
    def get_racecard_horse_results(self, horse_id) -> 'RaceResult':
        url = f"{BASE_API_URL}/racecards/{horse_id}/results"

    def get_racecard_standard(self, race_id) -> 'Racecard':
        url = f"{BASE_API_URL}/racecards/{race_id}/standard"

    def get_racecard_pro(self, race_id) -> 'Racecard':
        url = f"{BASE_API_URL}/racecards/{race_id}/pro"

    # Results API Client
    def get_all_results(self) -> 'AllResultsResponse':
        url = f"{BASE_API_URL}/results"

    def get_today_results(self) -> 'AllResultsResponse':
        url = f"{BASE_API_URL}/results/today"

    def get_race_result(self, race_id) -> 'RaceResult':
        url = f"{BASE_API_URL}/results/{race_id}"

    # Sires API Client
    def get_search_sires(self):
        url = f"{BASE_API_URL}/sires/search"

    def get_sire_results(self, sire_id):
        url = f"{BASE_API_URL}/sires/{sire_id}/results"


    def get_sire_class_analysis(self, sire_id):
        url = f"{BASE_API_URL}/sires/{sire_id}/analysis/classes"

    def get_sire_distance_analysis(self, sire_id):
        url = f"{BASE_API_URL}/sires/{sire_id}/analysis/distances"

    # Trainers API Client
    def get_search_trainers(self):
        url = f"{BASE_API_URL}/trainers/search"


    def get_trainer_results(self, trainer_id):
        url = f"{BASE_API_URL}/trainers/{trainer_id}/results"


    def get_trainer_horse_age_analysis(self, trainer_id):
        url = f"{BASE_API_URL}/trainers/{trainer_id}/analysis/horse-age"

    def get_trainer_course_analysis(self, trainer_id):
        url = f"{BASE_API_URL}/trainers/{trainer_id}/analysis/courses"

    def get_trainer_distance_analysis(self, trainer_id):
        url = f"{BASE_API_URL}/trainers/{trainer_id}/analysis/distances"


    def get_trainer_jockey_analysis(self, trainer_id):
        url = f"{BASE_API_URL}/trainers/{trainer_id}/analysis/jockeys"


    def get_trainer_owner_analysis(self, trainer_id):
        url = f"{BASE_API_URL}/trainers/{trainer_id}/analysis/owners"

    # North America API Client
    def get_na_meets(self):
        url = f"{BASE_API_URL}/north-america/meets"


    def get_na_meet_entries(self, meet_id):
        url = f"{BASE_API_URL}/north-america/meets/{meet_id}/entries"

    def get_na_meet_results(self, meet_id):
        url = f"{BASE_API_URL}/north-america/meets/{meet_id}/results"

#-------------------------- PYDANTIC MODELS --------------------------

class Course(BaseModel):
    id: str
    name: str
    country: str
    region: Optional[str] = None
    type: Optional[str] = None
    surface: Optional[str] = None
    distance: Optional[float] = None

class CourseRegion(BaseModel):
    id: str
    name: str
    country: str
    courses: List[str]

class Racecard(BaseModel):
    id: str
    race_name: str
    race_time: str
    course: str
    distance: str
    going: Optional[str] = None
    prize_money: Optional[float] = None
    runners: List[str]

class RacecardSummary(BaseModel):
    id: str
    race_name: str
    race_time: str
    course: str
    distance: str
    going: Optional[str] = None
    prize_money: Optional[float] = None
    number_of_runners: int

class RaceResult(BaseModel):
    id: str
    race_name: str
    race_time: str
    course: str
    distance: str
    going: Optional[str] = None
    prize_money: Optional[float] = None
    positions: List[dict]

class CoursesResponse(BaseModel):
    courses: List[Course]

class CourseRegionsResponse(BaseModel):
    regions: List[CourseRegion]

class RacecardsFreeResponse(BaseModel):
    racecards: List[Racecard]

class RacecardsStandardResponse(BaseModel):
    racecards: List[Racecard]

class RacecardsProResponse(BaseModel):
    racecards: List[Racecard]

class RacecardsSummariesResponse(BaseModel):
    summaries: List[RacecardSummary]

class AllResultsResponse(BaseModel):
    results: List[RaceResult]