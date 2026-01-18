import asyncio
import logging
from uuid import uuid4
from datetime import datetime

# Adjust path to include backend
import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from models.agronome import FichePlant, Identite, Portrait, Agronomie, Calendrier, Guide, Valorisation, Botanique, TypePlante, CategoriePlante, Exposition, BesoinEau, Morphologie
from services.fiche_service import FicheService
from dotenv import load_dotenv

import os
from dotenv import load_dotenv

env_path = os.path.join(os.getcwd(), '.env')
loaded = load_dotenv(env_path)
print(f"DEBUG: Loading .env from {env_path} -> {loaded}")
print(f"DEBUG: SUPABASE_URL exists: {'SUPABASE_URL' in os.environ}")
print(f"DEBUG: SUPABASE_KEY exists: {'SUPABASE_KEY' in os.environ}")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_persistence():
    service = FicheService()
    
    # 1. Create Dummy Fiche
    logger.info("--- Step 1: Create Dummy Fiche ---")
    fiche = FichePlant(
        identite=Identite(
            variete="Solaris",
            espece="Tomate",
            nom="Tomate Solaris",
            botanique=Botanique(
                ordre="Solanales",
                famille="Solanaceae",
                genre="Solanum",
                espece="lycopersicum"
            ),
            type=TypePlante.ANNUELLE,
            categorie=CategoriePlante.LEGUME_FRUIT,
            pollinisateurs=["Abeilles"]
        ),
        portrait=Portrait(
            description="Une tomate jaune éclatante.",
            poeme="Jaune comme le soleil,\nElle brille au jardin,\nDouceur sans pareille,\nUn délice divin.",
            pays_origine="France",
            morphologie=Morphologie(
                couleur="Jaune", forme="Ronde", texture="Ferme", gout="Sucré", calibre="Moyen"
            )
        ),
        agronomie=Agronomie(
            exposition=Exposition.SOLEIL,
            besoin_eau=BesoinEau.MOYEN,
            sol_ideal="Riche",
            sol_ideal_ph=[6.0, 7.0],
            rusticite="0°C",
            densite="3/m2"
        ),
        calendrier=Calendrier(),
        guide=Guide(
            installation="Planter au soleil.",
            entretien="Taille légère.",
            arrosage="Régulier."
        ),
        valorisation=Valorisation(
            conservation="1 semaine",
            signes_maturite=["Couleur jaune vif"]
        )
    )
    
    try:
        created = await service.create_fiche(fiche)
        if created:
            logger.info(f"✅ Fiche Created: {created.id} - {created.nom}")
        else:
            logger.error("❌ Failed to create fiche")
            return

        # 2. Search Exact
        logger.info("\n--- Step 2: Search Exact 'Solaris' ---")
        results = await service.search_exact("Solaris")
        logger.info(f"Found {len(results)} exact matches.")
        for r in results:
            logger.info(f" - {r.nom} ({r.id})")
            
        # 3. Search Vector
        logger.info("\n--- Step 3: Search Vector 'Tomate jaune' ---")
        results_v = await service.search_vector("Tomate jaune", limit=3)
        logger.info(f"Found {len(results_v)} vector matches.")
        for r in results_v:
            # We assume similarity logic works if we get results
            logger.info(f" - {r.nom} ({r.id})")
            
    except Exception as e:
        logger.error(f"Test Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_persistence())
