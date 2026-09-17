from fastapi import APIRouter, WebSocket

from app.realtime.websocket_manager import handle_connection

router = APIRouter()


@router.websocket("/ws/auctions/{auction_id}")
async def auction_ws(websocket: WebSocket, auction_id: str):
    await handle_connection(websocket, auction_id)
