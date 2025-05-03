from src.utils.api_client import RaceAPIClient

def test_api_connection():
    print("Testing API connection...")
    client = RaceAPIClient()
    
    print("\nTesting courses endpoint...")
    try:
        response = client.get_courses()
        print(f"Success! Response: {response}")
    except Exception as e:
        print(f"Error: {str(e)}")
    
    print("\nTesting racecards endpoint...")
    try:
        response = client.get_racecards()
        print(f"Success! Response: {response}")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_api_connection() 