from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from . import __version__
from .astronomy import SkyfieldProvider
from .engine import Engine
from .errors import DataError, InputError
from .models import (
    DailyRequest,
    DailyResponse,
    NatalRequest,
    NatalResponse,
    SynastryRequest,
    SynastryResponse,
    TransitRequest,
    TransitResponse,
)


def create_app(provider: SkyfieldProvider | None = None) -> FastAPI:
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.engine = None
        app.state.data_error = None
        owned_provider = None
        try:
            try:
                active = provider
                if active is None:
                    owned_provider = active = SkyfieldProvider()
                app.state.engine = Engine(active)
            except DataError as error:
                app.state.data_error = str(error)
            yield
        finally:
            if owned_provider is not None:
                owned_provider.close()

    app = FastAPI(
        title="Од Тойрог calculation API",
        version=__version__,
        lifespan=lifespan,
        description=(
            "Tropical geocentric positions, aspects, synastry, and sampled daily transits. "
            "Birth time required. Houses and rising signs are not implemented in v0.1."
        ),
    )

    @app.exception_handler(InputError)
    async def input_error_handler(request: Request, error: InputError):
        return JSONResponse(status_code=422, content={"code": error.code, "detail": str(error)})

    @app.exception_handler(DataError)
    async def data_error_handler(request: Request, error: DataError):
        return JSONResponse(
            status_code=503, content={"code": "data_unavailable", "detail": str(error)}
        )

    def engine() -> Engine:
        if app.state.engine is None:
            raise DataError(app.state.data_error or "Astronomy data is unavailable.")
        return app.state.engine

    @app.get("/health")
    def health():
        ready = app.state.engine is not None
        return JSONResponse(
            status_code=200 if ready else 503,
            content={"status": "ready" if ready else "data_unavailable", "version": __version__},
        )

    @app.get("/v1/config")
    def config():
        return {
            "provenance": engine().provider.provenance.model_dump(mode="json"),
            "supported_features": [
                "natal",
                "synastry",
                "transit_snapshot",
                "sampled_daily_transits",
            ],
            "not_yet_supported": ["houses", "ascendant", "midheaven", "unknown_birth_time"],
            "reading_languages": ["en"],
        }

    @app.post("/v1/natal", response_model=NatalResponse)
    def natal(request: NatalRequest):
        return engine().natal(request)

    @app.post("/v1/synastry", response_model=SynastryResponse)
    def synastry(request: SynastryRequest):
        return engine().synastry(request)

    @app.post("/v1/transits", response_model=TransitResponse)
    def transits(request: TransitRequest):
        return engine().transits(request)

    @app.post("/v1/daily", response_model=DailyResponse)
    def daily(request: DailyRequest):
        return engine().daily(request)

    return app


app = create_app()
