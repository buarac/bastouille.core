
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

def test_supabase_connection():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    
    print(f"URL: {url}")
    print(f"KEY: {key[:5] if key else 'None'}...")
    
    if not url or not key:
        print("Missing Credentials!")
        return

    try:
        supabase = create_client(url, key)
        # Try a simple select to verify connection and table existence
        response = supabase.table("botanique_plantes").select("*").limit(1).execute()
        print("Connection Success!")
        print(f"Data: {response.data}")
    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    test_supabase_connection()
