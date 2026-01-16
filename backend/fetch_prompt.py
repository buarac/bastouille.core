
import os
from dotenv import load_dotenv
load_dotenv()
from services.persistence import get_supabase_client

try:
    client = get_supabase_client()
    res = client.table('agent_configurations').select('system_prompt').eq('agent_key', 'culture_v1').execute()
    if res.data:
        print(res.data[0]['system_prompt'])
    else:
        print("No prompt found for culture_v1")
except Exception as e:
    print(f"Error: {e}")
