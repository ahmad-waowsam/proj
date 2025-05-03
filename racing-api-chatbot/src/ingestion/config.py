import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# API Configuration
API_BASE_URL = os.getenv('RACING_API_BASE_URL')
API_USERNAME = os.getenv('RACING_API_USERNAME')
API_PASSWORD = os.getenv('RACING_API_PASSWORD')

# Validate required environment variables
if not all([API_BASE_URL, API_USERNAME, API_PASSWORD]):
    raise ValueError(
        "Missing required environment variables. Please ensure RACING_API_BASE_URL, "
        "RACING_API_USERNAME, and RACING_API_PASSWORD are set in your .env file."
    ) 