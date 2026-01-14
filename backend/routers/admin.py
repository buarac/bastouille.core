from fastapi import APIRouter
from services.traceability import TraceabilityService

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"]
)

traceability_service = TraceabilityService()

@router.get("/logs")
async def get_agent_logs(limit: int = 50, offset: int = 0):
    return await traceability_service.get_logs(limit, offset)
