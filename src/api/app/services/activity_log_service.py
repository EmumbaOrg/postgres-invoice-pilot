import asyncpg
from typing import List

class ActivityLogService:
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool
    
    async def log_activity(
        self,
        action: str,
        resource_type: str,
        resource_name: str,
        custom_message: str = None
    ) -> int:
        """Log an activity to the database."""
        try:
            if custom_message:
                message = custom_message
            else:
                message = f"{resource_type.capitalize()} '{resource_name}' is {action}"

            async with self.pool.acquire() as conn:
                activity_id = await conn.fetchval(
                    """
                    INSERT INTO activity_logs (action, resource_type, resource_name, message) 
                    VALUES ($1, $2, $3, $4)
                    RETURNING id
                    """,
                    action, resource_type, resource_name, message
                )
            return activity_id
        except:
            raise Exception("Failed to log activity. Please check the database connection and schema.")
    
    async def get_activity_logs(self, limit:int) -> List[str]:
        """Retrieve recent activity log messages, limited by the given value."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT message
                FROM activity_logs 
                ORDER BY timestamp DESC
                LIMIT $1
                """,
                limit
            )
            
            return [row['message'] for row in rows]