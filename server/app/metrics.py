import re
import string
from starlette_exporter import PrometheusMiddleware, handle_metrics
from prometheus_client import Counter

from fastapi import APIRouter


def enable_metrics(app):
    app.add_middleware(PrometheusMiddleware)
    app.add_route("/metrics", handle_metrics)


metrics_router = APIRouter()

ExperimentTSACreate_counter = Counter(
    "metrics_plbd_experiment_tsa_create",
    "Count of TSA experiment creations",
    ["user", "database", "url"],
)


@metrics_router.get("/api/metrics/plbd/experiment_tsa_create")
def ExperimentTSA_Create(user: str, database: str, url: str, count: int):
    ExperimentTSACreate_counter.labels(user=user, database=database, url=url).inc(count)
