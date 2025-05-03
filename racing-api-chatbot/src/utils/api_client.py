from requests.auth import HTTPBasicAuth
import requests
import os
from dotenv import load_dotenv
from typing import Dict, Optional

load_dotenv()

RACING_USERNAME = os.getenv("RACING_API_USERNAME")
RACING_PASSWORD = os.getenv("RACING_API_PASSWORD")

BASE_API_URL = os.getenv("RACING_API_BASE_URL")


class RaceAPIBaseClient:
    def login(self, email, password):
        raise NotImplementedError()

    def get_wallet_token_balance(self, wallet_token_pairs):
        raise NotImplementedError()

    def conversion_api(self, input_amount, input_token_address, output_token_address):
        raise NotImplementedError()

    def swap_quote(self, wallet_token_pairs):
        raise NotImplementedError()

    def swap_transaction(self, transaction_ids):
        raise NotImplementedError()

    def get_wallets_from_group(self, group_name):
        raise NotImplementedError()

    def get_all_wallets(self):
        raise NotImplementedError()

    def get_token_address(self, token_symbol_list):
        raise NotImplementedError()

    def get_token_details(self, token_symbol_list, include_details=False):
        raise NotImplementedError()


class RaceAPIClient(RaceAPIBaseClient):
    def __init__(self):
        self.username = RACING_USERNAME
        self.password = RACING_PASSWORD
        self.base_url = BASE_API_URL

    def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Dict:
        """Make an API request with authentication."""
        url = f"{self.base_url}/{endpoint}"
        try:
            print(f"Making request to {url} with params: {params}")
            response = requests.get(
                url,
                auth=HTTPBasicAuth(self.username, self.password),
                params=params,
                timeout=30  # 30 second timeout
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.Timeout:
            print(f"Request to {url} timed out after 30 seconds")
            raise
        except requests.exceptions.RequestException as e:
            print(f"Error making request to {url}: {str(e)}")
            raise

    def get_courses(self) -> Dict:
        """Get all courses from the API."""
        return self._make_request("courses")

    def get_racecards(self, date: Optional[str] = None) -> Dict:
        """Get racecards from the API."""
        # The basic endpoint doesn't accept a date parameter
        return self._make_request("racecards/basic")

    def get_results(self, date: Optional[str] = None) -> Dict:
        """Get results from the API."""
        # The today endpoint doesn't accept a date parameter
        return self._make_request("results/today")

    def get_horse(self, horse_id: str) -> Dict:
        """Get horse details from the API."""
        return self._make_request(f"horses/{horse_id}/standard")

    def get_odds(self, race_id: str, horse_id: Optional[str] = None) -> Dict:
        """Get odds for a specific race or horse.
        
        Args:
            race_id (str): The unique ID of the race.
            horse_id (Optional[str]): The unique ID of the horse. If provided, returns odds for specific horse.
        
        Returns:
            Dict: Odds data for the race or specific horse.
        """
        endpoint = f"odds/{race_id}"
        if horse_id:
            endpoint = f"{endpoint}/{horse_id}"
        return self._make_request(endpoint)

    # Courses API
    def get_course_regions(self) -> Dict:
        """Get list of course regions."""
        return self._make_request("courses/regions")

    # Dams API Client
    def get_search_dams(self):
        """
        Search for dams using the Racing API.
        """
        return self._make_request("dams/search")


    def get_dam_results(self, dam_id):
        """
        Get results for a specific dam.
        """
        return self._make_request(f"dams/{dam_id}/results")


    def get_dam_class_analysis(self, dam_id):
        """
        Get class analysis for a specific dam.
        """
        return self._make_request(f"dams/{dam_id}/analysis/classes")


    def get_dam_distance_analysis(self, dam_id):
        """
        Get distance analysis for a specific dam.
        """
        return self._make_request(f"dams/{dam_id}/analysis/distances")

    # Damsires API Client
    def get_search_damsires(self):
        """
        Search for damsires using the Racing API.
        """
        return self._make_request("damsires/search")


    def get_damsire_results(self, damsire_id):
        """
        Get results for a specific damsire.
        """
        return self._make_request(f"damsires/{damsire_id}/results")


    def get_damsire_class_analysis(self, damsire_id):
        """
        Get class analysis for a specific damsire.
        """
        return self._make_request(f"damsires/{damsire_id}/analysis/classes")

    def get_damsire_distance_analysis(self, damsire_id):
        """
        Get distance analysis for a specific damsire.
        """
        return self._make_request(f"damsires/{damsire_id}/analysis/distances")

    # Horses API Client
    def get_search_horses(self, query: str) -> Dict:
        """Search for horses."""
        return self._make_request("horses/search", {"query": query})

    def get_horse_results(self, horse_id: str) -> Dict:
        """Get results for a specific horse."""
        return self._make_request(f"horses/{horse_id}/results")


    def get_horse_distance_times(self, horse_id):
        """
        Get distance-times analysis for a specific horse.
        Args:
            horse_id (str): The unique ID of the horse.
        """
        return self._make_request(f"horses/{horse_id}/analysis/distance-times")


    def get_horse_standard(self, horse_id: str) -> Dict:
        """Get standard data for a specific horse."""
        return self._make_request(f"horses/{horse_id}/standard")


    def get_horse_pro(self, horse_id: str) -> Dict:
        """Get pro data for a specific horse."""
        return self._make_request(f"horses/{horse_id}/pro")

    # Jockeys API Client
    def get_search_jockeys(self, query: str) -> Dict:
        """Search for jockeys."""
        return self._make_request("jockeys/search", {"query": query})


    def get_jockey_results(self, jockey_id: str) -> Dict:
        """Get results for a specific jockey."""
        return self._make_request(f"jockeys/{jockey_id}/results")


    def get_jockey_course_analysis(self, jockey_id):
        """
        Get course analysis for a specific jockey.
        Args:
            jockey_id (str): The unique ID of the jockey.
        """
        return self._make_request(f"jockeys/{jockey_id}/analysis/courses")


    def get_jockey_distance_analysis(self, jockey_id):
        """
        Get distance analysis for a specific jockey.
        Args:
            jockey_id (str): The unique ID of the jockey.
        """
        return self._make_request(f"jockeys/{jockey_id}/analysis/distances")


    def get_jockey_owner_analysis(self, jockey_id):
        """
        Get owner analysis for a specific jockey.
        Args:
            jockey_id (str): The unique ID of the jockey.
        """
        return self._make_request(f"jockeys/{jockey_id}/analysis/owners")


    def get_jockey_trainer_analysis(self, jockey_id):
        """
        Get trainer analysis for a specific jockey.
        Args:
            jockey_id (str): The unique ID of the jockey.
        """
        return self._make_request(f"jockeys/{jockey_id}/analysis/trainers")

    # Odds API Client
    def get_odds(self, race_id: str, horse_id: Optional[str] = None) -> Dict:
        """Get odds for a specific race or horse.
        
        Args:
            race_id (str): The unique ID of the race.
            horse_id (Optional[str]): The unique ID of the horse. If provided, returns odds for specific horse.
        
        Returns:
            Dict: Odds data for the race or specific horse.
        """
        endpoint = f"odds/{race_id}"
        if horse_id:
            endpoint = f"{endpoint}/{horse_id}"
        return self._make_request(endpoint)

    # Owners API Client
    def get_search_owners(self):
        """
        Search for owners using the Racing API.
        """
        return self._make_request("owners/search")


    def get_owner_results(self, owner_id):
        """
        Get results for a specific owner.
        """
        return self._make_request(f"owners/{owner_id}/results")


    def get_owner_course_analysis(self, owner_id):
        """
        Get course analysis for a specific owner.
        """
        return self._make_request(f"owners/{owner_id}/analysis/courses")


    def get_owner_distance_analysis(self, owner_id):
        """
        Get distance analysis for a specific owner.
        """
        return self._make_request(f"owners/{owner_id}/analysis/distances")


    def get_owner_jockey_analysis(self, owner_id):
        """
        Get jockey analysis for a specific owner.
        """
        return self._make_request(f"owners/{owner_id}/analysis/jockeys")


    def get_owner_trainer_analysis(self, owner_id):
        """
        Get trainer analysis for a specific owner.
        """
        return self._make_request(f"owners/{owner_id}/analysis/trainers")

    # Racecards API Client
    def get_racecards_free(self) -> Dict:
        """Get free racecards."""
        return self._make_request("racecards/free")

    def get_racecards_basic(self):
        return self._make_request("racecards/basic")

    def get_racecards_standard(self) -> Dict:
        """Get standard racecards."""
        return self._make_request("racecards/standard")

    def get_racecards_pro(self) -> Dict:
        """Get pro racecards."""
        return self._make_request("racecards/pro")

    def get_racecards_big_races(self):
        return self._make_request("racecards/big-races")

    def get_racecards_summaries(self) -> Dict:
        """Get racecard summaries."""
        return self._make_request("racecards/summaries")

    def get_racecard_horse_results(self, horse_id):
        return self._make_request(f"racecards/{horse_id}/results")

    def get_racecard_standard(self, race_id: str) -> Dict:
        """Get standard racecard for a specific race."""
        return self._make_request(f"racecards/{race_id}/standard")

    def get_racecard_pro(self, race_id: str) -> Dict:
        """Get pro racecard for a specific race."""
        return self._make_request(f"racecards/{race_id}/pro")

    # Results API Client
    def get_all_results(self) -> Dict:
        """Get all results."""
        return self._make_request("results")

    def get_today_results(self) -> Dict:
        """Get today's results."""
        return self._make_request("results/today")

    def get_race_result(self, race_id: str) -> Dict:
        """Get result for a specific race."""
        return self._make_request(f"results/{race_id}")

    # Sires API Client
    def get_search_sires(self):
        return self._make_request("sires/search")

    def get_sire_results(self, sire_id):
        return self._make_request(f"sires/{sire_id}/results")

    def get_sire_class_analysis(self, sire_id):
        return self._make_request(f"sires/{sire_id}/analysis/classes")

    def get_sire_distance_analysis(self, sire_id):
        return self._make_request(f"sires/{sire_id}/analysis/distances")

    # Trainers API Client
    def get_search_trainers(self):
        return self._make_request("trainers/search")

    def get_trainer_results(self, trainer_id):
        return self._make_request(f"trainers/{trainer_id}/results")

    def get_trainer_horse_age_analysis(self, trainer_id):
        return self._make_request(f"trainers/{trainer_id}/analysis/horse-age")

    def get_trainer_course_analysis(self, trainer_id):
        return self._make_request(f"trainers/{trainer_id}/analysis/courses")

    def get_trainer_distance_analysis(self, trainer_id):
        return self._make_request(f"trainers/{trainer_id}/analysis/distances")

    def get_trainer_jockey_analysis(self, trainer_id):
        return self._make_request(f"trainers/{trainer_id}/analysis/jockeys")

    def get_trainer_owner_analysis(self, trainer_id):
        return self._make_request(f"trainers/{trainer_id}/analysis/owners")

    # North America API Client
    def get_na_meets(self):
        return self._make_request("north-america/meets")

    def get_na_meet_entries(self, meet_id):
        return self._make_request(f"north-america/meets/{meet_id}/entries")

    def get_na_meet_results(self, meet_id):
        return self._make_request(f"north-america/meets/{meet_id}/results")