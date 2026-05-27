from fastapi import FastAPI
from guard import SecurityConfig, SecurityMiddleware
from guard.lifespan import guard_lifespan

from app.config import get_settings
from app.routers.branches import router as branches_router
from app.routers.health import router as health_router
from app.routers.sales import router as sales_router
from app.routers.webhook import router as webhook_router


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, lifespan=guard_lifespan)

    app.add_middleware(
        SecurityMiddleware,
        config=SecurityConfig(
            enable_redis=False,
            enable_rate_limiting=True,
            rate_limit=settings.guard_rate_limit,
            rate_limit_window=settings.guard_rate_window_seconds,
            enable_ip_banning=True,
            auto_ban_threshold=10,
            enable_penetration_detection=True,
            exclude_paths=["/health", "/webhooks/whatsapp", "/webhooks/whatsapp/"],
        ),
    )

    app.include_router(health_router)
    app.include_router(branches_router)
    app.include_router(sales_router)
    app.include_router(webhook_router)

    return app


app = create_app()
