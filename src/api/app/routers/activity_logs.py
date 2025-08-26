from fastapi import APIRouter, Depends, Query, HTTPException
from app.lifespan_manager import get_db_connection_pool
from app.services.activity_log_service import ActivityLogService
import asyncpg

router = APIRouter(
    prefix="/activity_logs",
    tags=["Activity Logs"],
)

def get_activity_log_service(pool: asyncpg.Pool = Depends(get_db_connection_pool)) -> ActivityLogService:
    """Dependency to get the activity log service."""
    return ActivityLogService(pool)


@router.get("/")
async def list_activity_logs(
    limit: int = Query(default=5, description="Number of log entries to retrieve"),
    activity_service: ActivityLogService = Depends(get_activity_log_service)
):
    """Get the most recent activity logs, limited by the 'limit' parameter."""
    try:

        logs = await activity_service.get_activity_logs(limit=limit)
        return {"logs": logs}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

