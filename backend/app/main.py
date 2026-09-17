"""FastAPI app entry point. Kept minimal on purpose (Backend_Build_Guide.md
STEP 2): app creation, middleware, lifespan wiring, and router includes only.
No business logic lives here.
"""
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import admin, auctions, auth, bids, health, metrics, websocket
from app.core.config import settings
from app.core.exceptions import AuctionError
from app.core.logging import get_logger, setup_logging
from app.db.engine import get_engine
from app.db.init_db import create_schema
from app.realtime.outbox_worker import start_outbox_worker, stop_outbox_worker
from app.realtime.redis import close_redis

setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    engine = get_engine()

    if settings.AUTO_CREATE_SCHEMA:
        logger.info("AUTO_CREATE_SCHEMA=true -- ensuring schema exists...")
        await create_schema(engine)

    outbox_task = asyncio.create_task(start_outbox_worker())
    logger.info("RTB Auction System started (env=%s).", settings.ENV)

    yield

    logger.info("Shutting down...")
    await stop_outbox_worker(outbox_task)
    await close_redis()
    await engine.dispose()


app = FastAPI(title="RTB Auction System", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AuctionError)
async def auction_error_handler(request: Request, exc: AuctionError) -> JSONResponse:
    """Safety-net handler for any AuctionError not already caught by a
    route (routes/bids.py catches the specific bid-related subclasses
    explicitly so it can attach extra fields like `minimum_bid`; this
    handler exists so a future AuctionError subtype never leaks as a
    bare 500).
    """
    return JSONResponse(status_code=exc.status_code, content={"accepted": False, "code": exc.code})


# Register all routers. health/metrics are unprefixed (operational
# endpoints); everything else lives under /api/v1 per
# RTB_Auction_System_Framework.md section 9.
app.include_router(health.router, tags=["health"])
app.include_router(metrics.router, tags=["metrics"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(auctions.router, prefix="/api/v1", tags=["auctions"])
app.include_router(bids.router, prefix="/api/v1", tags=["bids"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])

# WebSocket route already carries its full path ("/ws/auctions/{id}");
# it's a router like any other, just not under /api/v1 (see WebSocket
# Contract, RTB_Auction_System_Framework.md section 10).
app.include_router(websocket.router, tags=["websocket"])


@app.get("/")
async def root():
    return {
        "service": "RTB Auction System",
        "docs": "/docs",
        "health": "/health/live",
    }
