from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from db.init_db import init_db
from db.operations import get_all_products, get_price_history
from scraper.scraper import scrape_product
from analysis.analyzer import analyze_product
from scheduler.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    start_scheduler(interval_hours=12)
    yield
    stop_scheduler()


app = FastAPI(title="TrueDeal API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScrapeRequest(BaseModel):
    url: str


@app.get("/")
def root_health():
    return {"status": "ok", "service": "TrueDeal API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/scrape")
def scrape(req: ScrapeRequest):
    result = scrape_product(req.url)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@app.get("/products")
def list_products():
    return get_all_products()


@app.get("/products/{product_id}/history")
def price_history(product_id: int):
    history = get_price_history(product_id)
    if not history:
        raise HTTPException(status_code=404, detail="No price history found")
    return history


@app.get("/products/{product_id}/analysis")
def product_analysis(product_id: int):
    result = analyze_product(product_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.post("/refresh")
def manual_refresh():
    """Trigger an immediate re-scrape of all tracked products."""
    from scheduler.scheduler import refresh_all_products
    refresh_all_products()
    return {"status": "done"}
