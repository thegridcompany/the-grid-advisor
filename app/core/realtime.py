"""
Supabase Real-time Configuration and Management
"""
from typing import Dict, List, Optional, Callable, Any
from enum import Enum
import json

from .config import settings
from .logging import get_logger

logger = get_logger(__name__)


class RealtimeEvent(str, Enum):
    """Real-time database events."""
    INSERT = "INSERT"
    UPDATE = "UPDATE" 
    DELETE = "DELETE"


class RealtimeChannel:
    """Configuration for a real-time channel subscription."""
    
    def __init__(
        self,
        name: str,
        table: str,
        events: List[RealtimeEvent],
        filter_config: Optional[Dict[str, Any]] = None,
        callback: Optional[Callable] = None
    ):
        self.name = name
        self.table = table
        self.events = events
        self.filter_config = filter_config or {}
        self.callback = callback


# Project Management Real-time Channels Configuration
PROJECT_MANAGEMENT_CHANNELS = [
    RealtimeChannel(
        name="projects_changes",
        table="project",
        events=[RealtimeEvent.INSERT, RealtimeEvent.UPDATE, RealtimeEvent.DELETE],
        filter_config={"schema": "public"}
    ),
    RealtimeChannel(
        name="tickets_changes", 
        table="ticket",
        events=[RealtimeEvent.INSERT, RealtimeEvent.UPDATE, RealtimeEvent.DELETE],
        filter_config={"schema": "public"}
    ),
    RealtimeChannel(
        name="comments_changes",
        table="comment", 
        events=[RealtimeEvent.INSERT, RealtimeEvent.UPDATE, RealtimeEvent.DELETE],
        filter_config={"schema": "public"}
    ),
    RealtimeChannel(
        name="epics_changes",
        table="epic",
        events=[RealtimeEvent.INSERT, RealtimeEvent.UPDATE, RealtimeEvent.DELETE], 
        filter_config={"schema": "public"}
    ),
    RealtimeChannel(
        name="sprints_changes",
        table="sprint",
        events=[RealtimeEvent.INSERT, RealtimeEvent.UPDATE, RealtimeEvent.DELETE],
        filter_config={"schema": "public"}
    )
]


class RealtimeManager:
    """Manages Supabase real-time subscriptions."""
    
    def __init__(self):
        self.active_channels: Dict[str, RealtimeChannel] = {}
        self.subscribers: Dict[str, List[Callable]] = {}
    
    def get_channel_config(self, table_name: str) -> Optional[RealtimeChannel]:
        """Get real-time channel configuration for a table."""
        for channel in PROJECT_MANAGEMENT_CHANNELS:
            if channel.table == table_name:
                return channel
        return None
    
    def subscribe_to_table(
        self, 
        table_name: str, 
        callback: Callable,
        events: Optional[List[RealtimeEvent]] = None
    ) -> bool:
        """Subscribe to real-time changes for a specific table."""
        try:
            channel_config = self.get_channel_config(table_name)
            if not channel_config:
                logger.warning(f"No real-time configuration found for table: {table_name}")
                return False
            
            # Filter events if specified
            if events:
                channel_config.events = events
            
            # Store subscription
            if table_name not in self.subscribers:
                self.subscribers[table_name] = []
            self.subscribers[table_name].append(callback)
            
            logger.info(f"Subscribed to real-time changes for table: {table_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to subscribe to table {table_name}: {str(e)}")
            return False
    
    def unsubscribe_from_table(self, table_name: str, callback: Callable) -> bool:
        """Unsubscribe from real-time changes for a specific table."""
        try:
            if table_name in self.subscribers:
                if callback in self.subscribers[table_name]:
                    self.subscribers[table_name].remove(callback)
                    logger.info(f"Unsubscribed from real-time changes for table: {table_name}")
                    return True
            
            logger.warning(f"No active subscription found for table: {table_name}")
            return False
            
        except Exception as e:
            logger.error(f"Failed to unsubscribe from table {table_name}: {str(e)}")
            return False
    
    def handle_realtime_event(self, table_name: str, event_type: str, payload: Dict[str, Any]):
        """Handle incoming real-time events."""
        try:
            if table_name in self.subscribers:
                for callback in self.subscribers[table_name]:
                    try:
                        callback(table_name, event_type, payload)
                    except Exception as e:
                        logger.error(f"Error in real-time callback for {table_name}: {str(e)}")
            
        except Exception as e:
            logger.error(f"Failed to handle real-time event for {table_name}: {str(e)}")
    
    def get_websocket_config(self) -> Dict[str, Any]:
        """Get configuration for WebSocket client connections."""
        return {
            "url": f"{settings.supabase_url.replace('https://', 'wss://').replace('http://', 'ws://')}/realtime/v1/websocket",
            "apikey": settings.supabase_anon_key,
            "channels": [
                {
                    "name": channel.name,
                    "table": channel.table,
                    "events": [event.value for event in channel.events],
                    "filter": channel.filter_config
                }
                for channel in PROJECT_MANAGEMENT_CHANNELS
            ]
        }


# Global real-time manager instance
realtime_manager = RealtimeManager()


def get_realtime_manager() -> RealtimeManager:
    """Get the global real-time manager instance."""
    return realtime_manager


# Example callback function for real-time events
def default_realtime_callback(table_name: str, event_type: str, payload: Dict[str, Any]):
    """Default callback for real-time events."""
    logger.info(
        f"Real-time event received",
        table=table_name,
        event=event_type,
        record_id=payload.get("new", {}).get("id") or payload.get("old", {}).get("id")
    ) 