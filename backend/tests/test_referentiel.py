
import pytest
from unittest.mock import MagicMock, patch
from services.referentiel import ReferentielService

@pytest.fixture
def mock_persistence_service():
    with patch("services.referentiel.BotaniquePersistenceService") as MockService:
        mock_instance = MockService.return_value
        # Mock supabase client inside persistence
        mock_instance.supabase = MagicMock()
        yield mock_instance

@pytest.mark.asyncio
async def test_get_gestes_all(mock_persistence_service):
    # Setup
    mock_supabase = mock_persistence_service.supabase
    mock_supabase.table.return_value.select.return_value.order.return_value.order.return_value.execute.return_value.data = [
        {"id": 1, "verbe": "Arroser", "famille": "Entretien"}
    ]
    
    service = ReferentielService()
    # Manual injection if __init__ ran before patch took full effect or to be safe
    # But since we patched Class initialization:
    service.persistence = mock_persistence_service
    service.supabase = mock_persistence_service.supabase
    
    gestes = await service.get_gestes()
    
    assert len(gestes) == 1
    assert gestes[0]["verbe"] == "Arroser"
    mock_supabase.table.assert_called_with("referentiel_gestes")

@pytest.mark.asyncio
async def test_get_gestes_filtered(mock_persistence_service):
    mock_supabase = mock_persistence_service.supabase
    # Return mock
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.order.return_value.execute.return_value.data = []
    
    service = ReferentielService()
    service.persistence = mock_persistence_service
    service.supabase = mock_supabase
    
    await service.get_gestes(famille="Semis")
    
    # Verify .eq was called
    mock_supabase.table.return_value.select.return_value.eq.assert_called_with("famille", "Semis")

@pytest.mark.asyncio
async def test_get_familles(mock_persistence_service):
    mock_supabase = mock_persistence_service.supabase
    mock_supabase.table.return_value.select.return_value.execute.return_value.data = [
        {"famille": "Entretien"}, {"famille": "Culture"}, {"famille": "Entretien"}
    ]
    
    service = ReferentielService()
    service.persistence = mock_persistence_service
    service.supabase = mock_supabase
    
    familles = await service.get_familles()
    
    # Should be deduped and sorted
    assert familles == ["Culture", "Entretien"]
