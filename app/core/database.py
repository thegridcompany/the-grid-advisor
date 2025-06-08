"""
Database connection and utilities for Grid Brain.
"""
from typing import Optional, Any, Dict, List
from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions
import asyncio
from functools import lru_cache
from contextlib import asynccontextmanager

from .config import settings
from .logging import get_logger

logger = get_logger(__name__)


class SupabaseClient:
    """Wrapper for Supabase client with additional utilities."""
    
    def __init__(self):
        self._client: Optional[Client] = None
        self._service_client: Optional[Client] = None
        
    @property
    def client(self) -> Client:
        """Get Supabase client for public operations."""
        if not self._client:
            self._client = create_client(
                settings.supabase_url,
                settings.supabase_anon_key,
                options=ClientOptions(
                    auto_refresh_token=True,
                    persist_session=True,
                )
            )
            logger.info("Supabase client initialized")
        return self._client
    
    @property
    def service_client(self) -> Client:
        """Get Supabase service client for admin operations."""
        if not self._service_client:
            self._service_client = create_client(
                settings.supabase_url,
                settings.supabase_service_key,
                options=ClientOptions(
                    auto_refresh_token=False,
                    persist_session=False,
                )
            )
            logger.info("Supabase service client initialized")
        return self._service_client
    
    async def health_check(self) -> bool:
        """Check if Supabase connection is healthy."""
        try:
            # Try a simple query
            result = self.client.table("team_members").select("id").limit(1).execute()
            return True
        except Exception as e:
            logger.error("Supabase health check failed", error=str(e))
            return False
    
    def get_table(self, table_name: str, use_service: bool = False):
        """Get a table reference."""
        client = self.service_client if use_service else self.client
        return client.table(table_name)
    
    async def execute_rpc(self, function_name: str, params: Dict[str, Any] = None):
        """Execute a stored procedure."""
        try:
            result = self.client.rpc(function_name, params or {}).execute()
            return result.data
        except Exception as e:
            logger.error(f"RPC execution failed: {function_name}", error=str(e), params=params)
            raise
    
    def realtime_subscribe(self, channel: str, table: str, callback):
        """Subscribe to realtime changes."""
        return self.client.realtime.channel(channel).on(
            "postgres_changes",
            filter={"table": table},
            callback=callback
        ).subscribe()


# Global Supabase client instance
supabase = SupabaseClient()


@lru_cache()
def get_supabase() -> SupabaseClient:
    """Get the global Supabase client instance."""
    return supabase


class DatabaseError(Exception):
    """Custom exception for database operations."""
    pass


class DatabaseManager:
    """Manager for common database operations."""
    
    def __init__(self, supabase_client: SupabaseClient):
        self.db = supabase_client
        self.logger = get_logger(self.__class__.__name__)
    
    async def get_by_id(self, table: str, id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get a record by ID, respecting RLS."""
        try:
            # In a real Supabase RLS setup, you'd set the user context before the query
            # For example, by calling an RPC function.
            # self.db.rpc('set_user_context', {'user_id': user_id}).execute()
            result = self.db.get_table(table).select("*").eq("id", id).single().execute()
            return result.data
        except Exception as e:
            self.logger.error(f"Failed to get record", table=table, id=id, error=str(e))
            return None
    
    async def get_many(
        self, 
        table: str, 
        filters: Dict[str, Any] = None,
        order_by: str = None,
        limit: int = None,
        offset: int = None,
        user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get multiple records with filters, respecting RLS."""
        try:
            # Placeholder for setting RLS context
            # self.db.rpc('set_user_context', {'user_id': user_id}).execute()
            query = self.db.get_table(table).select("*")
            
            # Apply filters
            if filters:
                for key, value in filters.items():
                    query = query.eq(key, value)
            
            # Apply ordering
            if order_by:
                desc = order_by.startswith("-")
                column = order_by[1:] if desc else order_by
                query = query.order(column, desc=desc)
            
            # Apply pagination
            if limit:
                query = query.limit(limit)
            if offset:
                query = query.offset(offset)
            
            result = query.execute()
            return result.data
        except Exception as e:
            self.logger.error(f"Failed to get records", table=table, filters=filters, error=str(e))
            return []
    
    async def create(self, table: str, data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Create a new record, respecting RLS."""
        try:
            # Placeholder for setting RLS context
            result = self.db.get_table(table).insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            self.logger.error(f"Failed to create record", table=table, error=str(e))
            raise DatabaseError(f"Failed to create record in {table}: {str(e)}")
    
    async def update(self, table: str, id: str, data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Update a record, respecting RLS."""
        try:
            # Placeholder for setting RLS context
            result = self.db.get_table(table).update(data).eq("id", id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            self.logger.error(f"Failed to update record", table=table, id=id, error=str(e))
            raise DatabaseError(f"Failed to update record in {table}: {str(e)}")
    
    async def delete(self, table: str, id: str, user_id: Optional[str] = None) -> bool:
        """Delete a record, respecting RLS."""
        try:
            # Placeholder for setting RLS context
            self.db.get_table(table).delete().eq("id", id).execute()
            return True
        except Exception as e:
            self.logger.error(f"Failed to delete record", table=table, id=id, error=str(e))
            return False
    
    async def upsert(self, table: str, data: Dict[str, Any], on_conflict: str = "id", user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Upsert a record, respecting RLS."""
        try:
            # Placeholder for setting RLS context
            result = self.db.get_table(table).upsert(data, on_conflict=on_conflict).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            self.logger.error(f"Failed to upsert record", table=table, error=str(e))
            raise DatabaseError(f"Failed to upsert record in {table}: {str(e)}")


# Global database manager
db_manager = DatabaseManager(supabase)


def get_db_manager() -> DatabaseManager:
    """Get the global database manager instance."""
    return db_manager 