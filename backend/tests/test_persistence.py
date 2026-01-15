
import pytest
from unittest.mock import MagicMock, patch
from services.persistence import BotaniquePersistenceService

# Mock response data
MOCK_PLANT_DATA = {
    "id": "123",
    "nom_commun": "Tomate",
    "espece": "Solanum lycopersicum",
    "variete": "Coeur de Boeuf",
    "data": {
        "taxonomie": {
            "nom_commun": "Tomate",
            "genre": "Solanum",
            "espece": "lycopersicum",
            "variete": "Coeur de Boeuf"
        }
    }
}

@pytest.fixture
def mock_supabase():
    with patch("services.persistence.create_client") as mock_create:
        mock_client = MagicMock()
        mock_create.return_value = mock_client
        yield mock_client

def test_save_plant_success(mock_supabase):
    # Setup mock
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [MOCK_PLANT_DATA]
    
    service = BotaniquePersistenceService()
    # Force mock client inject (in case init failed or we want to be sure)
    service.supabase = mock_supabase
    
    result = service.save_plant(MOCK_PLANT_DATA["data"])
    
    assert result == MOCK_PLANT_DATA
    mock_supabase.table.assert_called_with("botanique_plantes")
    mock_supabase.table.return_value.insert.assert_called()

def test_get_all_plants(mock_supabase):
    # Setup mock
    mock_supabase.table.return_value.select.return_value.order.return_value.execute.return_value.data = [MOCK_PLANT_DATA]
    
    service = BotaniquePersistenceService()
    service.supabase = mock_supabase
    
    plants = service.get_all_plants()
    
    assert len(plants) == 1
    assert plants[0]["nom_commun"] == "Tomate"

def test_delete_plant_success(mock_supabase):
    mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = "success"
    
    service = BotaniquePersistenceService()
    service.supabase = mock_supabase
    
    result = service.delete_plant("123")
    assert result is True
