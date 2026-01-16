
import sys
import os
import asyncio

# Setup path to root
sys.path.append(os.path.join(os.getcwd(), ".."))

from agents.culture import CultureAgent

async def test():
    print("Initializing Agent...")
    try:
        agent = CultureAgent()
        print("Agent initialized.")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
