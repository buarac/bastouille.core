from fastapi import APIRouter
from services.traceability import TraceabilityService

router = APIRouter(
    prefix="/admin",
    tags=["admin"]
)

traceability_service = TraceabilityService()

@router.get("/logs")
async def get_agent_logs(limit: int = 50, offset: int = 0):
    return await traceability_service.get_logs(limit, offset)

@router.get("/llm_logs")
async def get_llm_logs(limit: int = 50, offset: int = 0, conversation_id: str = None):
    """
    Récupère les logs techniques (low-level) de la table llm_logs.
    """
    from services.persistence import get_supabase_client
    supabase = get_supabase_client()
    
    query = supabase.table("llm_logs").select("*").order("created_at", desc=True)
    
    if conversation_id:
        query = query.eq("conversation_id", conversation_id)
        
    res = query.range(offset, offset + limit - 1).execute()
        
    return res.data if res.data else []

@router.get("/conversations")
async def get_conversations(limit: int = 50):
    """
    Récupère la liste des conversations uniques depuis les logs.
    Grouping by conversation_id. Note: Supabase doesn't support complex GROUP BY/Aggregation easily via JS client?
    We might need a helper function or raw SQL if possible, but let's try python-side aggregation for MVP if data size allows,
    OR better: Use an RPC function in Supabase if we were in Prod.
    For now, filtering distinct IDs via distinct() is not directly supported in simple client select?
    Workaround: Fetch logs, distinct in Python. (Not scalable but OK for MVP < 1000 logs).
    Better: Creating a view in DB would be best.
    Let's try creating a view via SQL tool first?
    Actually, let's keep it simple: Select conversation_id, created_at from llm_logs order by created_at desc.
    Then deduplicate in Python.
    """
    from services.persistence import get_supabase_client
    supabase = get_supabase_client()
    
    # Fetch recent logs (enough to cover recent sessions)
    # We select specific columns to minimize data transfer
    res = supabase.table("llm_logs")\
        .select("conversation_id, created_at, method_name, input_tokens, output_tokens")\
        .order("created_at", desc=True)\
        .limit(500)\
        .execute()
        
    logs = res.data if res.data else []
    
    # Group by conversation_id in Python
    conversations = {}
    for log in logs:
        c_id = log.get("conversation_id")
        if not c_id:
            continue
            
        if c_id not in conversations:
            conversations[c_id] = {
                "id": c_id,
                "latest_at": log["created_at"],
                "start_at": log["created_at"], # Will allow update
                "interaction_count": 0,
                "total_input_tokens": 0,
                "total_output_tokens": 0
            }
        
        # Update stats
        conversations[c_id]["interaction_count"] += 1
        conversations[c_id]["total_input_tokens"] += (log.get("input_tokens") or 0)
        conversations[c_id]["total_output_tokens"] += (log.get("output_tokens") or 0)
        
        # timestamp is string, but logic of 'latest' is handled by order desc of query (first found is latest)
        # We just need to find oldest for 'start_at'
        conversations[c_id]["start_at"] = log["created_at"] # Since we iterate desc, last one will be start
        
    return list(conversations.values())[:limit]

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """
    Supprime tous les logs associés à une conversation.
    """
    from services.persistence import get_supabase_client
    supabase = get_supabase_client()
    
    # Delete all logs with this conversation_id
    res = supabase.table("llm_logs").delete().eq("conversation_id", conversation_id).execute()
    
    return {"status": "success", "deleted": True}
