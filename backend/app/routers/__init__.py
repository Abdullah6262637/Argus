"""API router paketleri."""
from app.routers.agents import router as agents_router
from app.routers.approvals import router as approvals_router
from app.routers.chat import router as chat_router
from app.routers.coordinator import router as coordinator_router
from app.routers.logs import router as logs_router
from app.routers.mcp import router as mcp_router
from app.routers.memory import router as memory_router
from app.routers.skills import router as skills_router
from app.routers.system import router as system_router
from app.routers.tasks import router as tasks_router
from app.routers.voice import router as voice_router
from app.routers.workflows import router as workflows_router
from app.routers.ws import router as ws_router

__all__ = [
    "agents_router",
    "approvals_router",
    "chat_router",
    "coordinator_router",
    "logs_router",
    "mcp_router",
    "memory_router",
    "skills_router",
    "system_router",
    "tasks_router",
    "voice_router",
    "workflows_router",
    "ws_router",
]