from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import api

# from app.metrics import enable_metrics, metrics_router

app = FastAPI()
app.include_router(api.router)
# app.include_router(metrics_router)


# Prometheus metrics
# enable_metrics(app)


# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=False,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
