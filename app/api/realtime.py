"""
Real-time WebSocket API endpoints.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List
import json
import asyncio

from ..core.realtime import get_realtime_manager, RealtimeManager, default_realtime_callback
from ..core.logging import get_logger
from ..core.database import get_db_manager, DatabaseManager

logger = get_logger(__name__)
router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections for real-time updates."""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.table_subscribers: Dict[str, List[str]] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"WebSocket client connected: {client_id}")
    
    def disconnect(self, client_id: str):
        """Remove a WebSocket connection."""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            
            # Remove from all table subscriptions
            for table_name in self.table_subscribers:
                if client_id in self.table_subscribers[table_name]:
                    self.table_subscribers[table_name].remove(client_id)
            
            logger.info(f"WebSocket client disconnected: {client_id}")
    
    def subscribe_to_table(self, client_id: str, table_name: str):
        """Subscribe a client to table changes."""
        if table_name not in self.table_subscribers:
            self.table_subscribers[table_name] = []
        
        if client_id not in self.table_subscribers[table_name]:
            self.table_subscribers[table_name].append(client_id)
            logger.info(f"Client {client_id} subscribed to {table_name}")
    
    def unsubscribe_from_table(self, client_id: str, table_name: str):
        """Unsubscribe a client from table changes."""
        if table_name in self.table_subscribers:
            if client_id in self.table_subscribers[table_name]:
                self.table_subscribers[table_name].remove(client_id)
                logger.info(f"Client {client_id} unsubscribed from {table_name}")
    
    async def send_to_client(self, client_id: str, message: dict):
        """Send a message to a specific client."""
        if client_id in self.active_connections:
            try:
                websocket = self.active_connections[client_id]
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Failed to send message to client {client_id}: {str(e)}")
                self.disconnect(client_id)
    
    async def broadcast_to_table_subscribers(self, table_name: str, message: dict):
        """Broadcast a message to all subscribers of a table."""
        if table_name in self.table_subscribers:
            for client_id in self.table_subscribers[table_name]:
                await self.send_to_client(client_id, message)


# Global connection manager
connection_manager = ConnectionManager()


def create_realtime_callback(table_name: str):
    """Create a callback function for real-time events that broadcasts to WebSocket clients."""
    async def callback(table: str, event_type: str, payload: Dict):
        message = {
            "type": "realtime_event",
            "table": table,
            "event": event_type,
            "data": payload
        }
        await connection_manager.broadcast_to_table_subscribers(table_name, message)
    
    return callback


@router.websocket("/ws/{client_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    client_id: str,
    realtime_manager: RealtimeManager = Depends(get_realtime_manager)
):
    """WebSocket endpoint for real-time updates."""
    await connection_manager.connect(websocket, client_id)
    
    try:
        while True:
            # Receive messages from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "subscribe":
                table_name = message.get("table")
                if table_name:
                    # Subscribe to WebSocket updates
                    connection_manager.subscribe_to_table(client_id, table_name)
                    
                    # Subscribe to real-time database events
                    callback = create_realtime_callback(table_name)
                    realtime_manager.subscribe_to_table(table_name, callback)
                    
                    await websocket.send_text(json.dumps({
                        "type": "subscription_confirmed",
                        "table": table_name
                    }))
            
            elif message.get("type") == "unsubscribe":
                table_name = message.get("table")
                if table_name:
                    connection_manager.unsubscribe_from_table(client_id, table_name)
                    
                    await websocket.send_text(json.dumps({
                        "type": "unsubscription_confirmed", 
                        "table": table_name
                    }))
            
            elif message.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    
    except WebSocketDisconnect:
        connection_manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error for client {client_id}: {str(e)}")
        connection_manager.disconnect(client_id)


@router.get("/config")
async def get_realtime_config(
    realtime_manager: RealtimeManager = Depends(get_realtime_manager)
):
    """Get real-time configuration for client setup."""
    return realtime_manager.get_websocket_config() 