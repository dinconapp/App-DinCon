import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import get_settings
from app.core.exceptions import BusinessRuleError, NotFoundError
from app.interfaces.api.routes import (
    auth_routes,
    bill_routes,
    billing_routes,
    budget_routes,
    category_routes,
    dashboard_routes,
    health_routes,
    projection_routes,
    savings_routes,
    transaction_routes,
    user_routes,
    whatsapp_routes,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()
settings.validate_runtime_security()

app = FastAPI(title="Planejamento Financeiro API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_cors_origins,
    allow_origin_regex=None if settings.is_production else r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def local_cors_headers(request: Request) -> dict[str, str]:
    origin = request.headers.get("origin", "")
    if not settings.is_production and origin.startswith(("http://localhost:", "http://127.0.0.1:")):
        return {"Access-Control-Allow-Origin": origin, "Access-Control-Allow-Credentials": "true"}
    if origin.rstrip("/") in settings.allowed_cors_origins:
        return {"Access-Control-Allow-Origin": origin, "Access-Control-Allow-Credentials": "true"}
    return {}


@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError):
    return JSONResponse(status_code=404, content={"detail": str(exc)}, headers=local_cors_headers(request))


@app.exception_handler(BusinessRuleError)
async def business_rule_handler(request: Request, exc: BusinessRuleError):
    return JSONResponse(status_code=400, content={"detail": str(exc)}, headers=local_cors_headers(request))


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(status_code=400, content={"detail": str(exc)}, headers=local_cors_headers(request))


@app.exception_handler(Exception)
async def generic_handler(request: Request, exc: Exception):
    logger.exception(
        "api.unhandled_error path=%s method=%s",
        request.url.path,
        request.method,
    )
    return JSONResponse(status_code=500, content={"detail": "Erro interno do servidor."}, headers=local_cors_headers(request))


app.include_router(health_routes.router, prefix="/api")
app.include_router(auth_routes.router, prefix="/api")
app.include_router(user_routes.router, prefix="/api")
app.include_router(category_routes.router, prefix="/api")
app.include_router(budget_routes.router, prefix="/api")
app.include_router(transaction_routes.router, prefix="/api")
app.include_router(bill_routes.router, prefix="/api")
app.include_router(billing_routes.router, prefix="/api")
app.include_router(dashboard_routes.router, prefix="/api")
app.include_router(projection_routes.router, prefix="/api")
app.include_router(savings_routes.router, prefix="/api")
app.include_router(whatsapp_routes.router, prefix="/api")
