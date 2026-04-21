import os
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("NUMEXPR_NUM_THREADS", "1")

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import uvicorn
from contextlib import asynccontextmanager
import logging
import time

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from .database import engine, Base
from .api import routes
from .websocket.manager import packet_manager, traffic_manager
from .sniffer import PacketSniffer

# Initialize tables — wrapped in try/except for robustness
try:
    if engine is not None:
        Base.metadata.create_all(bind=engine)
except Exception as e:
    logger.warning(f"Could not create DB tables (DB may be unreachable): {e}")

# Security: Configure CORS from environment variables
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
if "*" in CORS_ORIGINS:
    logger.warning("CORS_ORIGINS set to '*' - only use in development!")
else:
    logger.info(f"CORS_ORIGINS configured: {CORS_ORIGINS}")

# Security: Add security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response

# Security: Simple request rate limiter middleware
class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, calls: int = 100, period: int = 60):
        super().__init__(app)
        self.calls = calls
        self.period = period
        self.requests = {}
    
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        now = time.time()
        
        if client_ip not in self.requests:
            self.requests[client_ip] = []
        
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if now - req_time < self.period
        ]
        
        if len(self.requests[client_ip]) >= self.calls:
            logger.warning(f"Rate limit exceeded for {client_ip}")
            return Response("Rate limit exceeded", status_code=429)
        
        self.requests[client_ip].append(now)
        return await call_next(request)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Network Analyzer API")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    # Only start sniffer if not in Vercel/Serverless environment
    if not os.getenv("VERCEL"):
        logger.info("Starting Packet Sniffer...")
        sniffer = PacketSniffer(packet_manager, traffic_manager)
        app.state.sniffer = sniffer
        sniffer.start()
    else:
        logger.info("Running in Serverless mode - Packet Sniffer disabled")
    yield
    logger.info("Stopping Network Analyzer API")
    if not os.getenv("VERCEL") and hasattr(app.state, "sniffer"):
        logger.info("Stopping Packet Sniffer...")
        app.state.sniffer.stop()

app = FastAPI(
    title="Network Analyzer API",
    description="Production-grade network security analysis platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Add security middleware FIRST (order matters)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware, calls=100, period=60)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=3600,
)

app.include_router(routes.router, prefix="/api")

@app.websocket("/ws/live-packets")
async def websocket_packets(websocket: WebSocket):
    await packet_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        packet_manager.disconnect(websocket)

@app.websocket("/ws/traffic")
async def websocket_traffic(websocket: WebSocket):
    await traffic_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        traffic_manager.disconnect(websocket)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Keep for backward compatibility or general purpose
    await packet_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        packet_manager.disconnect(websocket)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
