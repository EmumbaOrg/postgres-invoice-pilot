from fastapi import APIRouter, Depends, Query, HTTPException
from app.lifespan_manager import get_db_connection_pool, get_activity_log_service
from app.services.activity_log_service import ActivityLogService
import asyncpg

router = APIRouter(
    prefix="/activity_logs",
    tags=["Activity Logs"],
)

@router.get("/")
async def list_activity_logs(
    limit: int = Query(default=5, description="Number of log entries to retrieve"),
    activity_service: ActivityLogService = Depends(get_activity_log_service), pool:asyncpg = Depends(get_db_connection_pool)
):
    """Get the most recent activity logs, limited by the 'limit' parameter."""
    try:

        logs = await activity_service.get_activity_logs(limit=limit, pool=pool)
        return {"logs": logs}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

