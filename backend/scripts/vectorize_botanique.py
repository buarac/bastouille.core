import asyncio
import sys
import os
import logging

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from services.llm import get_llm_provider
from services.persistence import get_supabase_client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vectorizer")

async def main():
    logger.info("Starting Vectorization Process...")
    
    supabase = get_supabase_client()
    llm = get_llm_provider()
    
    if not supabase:
        logger.error("Supabase client not available")
        return

    # 1. Fetch all plants
    # Optimization: Could filter where embedding is null
    res = supabase.table("botanique_plantes").select("id, nom_commun, espece, variete").execute()
    plants = res.data
    
    logger.info(f"Found {len(plants)} plants to process.")
    
    count = 0
    errors = 0
    
    for plant in plants:
        try:
            pid = plant["id"]
            nom = plant["nom_commun"] or ""
            variete = plant["variete"] or ""
            espece = plant["espece"] or ""
            
            # Construct semantic string for embedding
            # "Tomate Coeur de Boeuf (Solanum lycopersicum)"
            text_to_embed = f"{nom} {variete} ({espece})".strip()
            
            if not text_to_embed:
                continue
                
            logger.info(f"Embedding: {text_to_embed}")
            
            # Generate Vector
            vector = await llm.embed_text(text_to_embed)
            
            # Update DB
            supabase.table("botanique_plantes").update({"embedding": vector}).eq("id", pid).execute()
            count += 1
            
            # Rate limiting / Sleep to avoid hitting API limits hard
            if count % 10 == 0:
                await asyncio.sleep(1)
                
        except Exception as e:
            logger.error(f"Error processing plant {plant.get('nom_commun')}: {e}")
            errors += 1
            
    logger.info(f"Done! Processed {count} plants. Errors: {errors}")

if __name__ == "__main__":
    asyncio.run(main())
