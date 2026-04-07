import os
from datetime import datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from db.operations import get_all_products
from scraper.catalog import discover_catalog_urls
from scraper.scraper import scrape_product

scheduler = BackgroundScheduler()


def refresh_all_products():
    """Re-scrape every tracked product and record the latest price."""
    products = get_all_products()
    print(f"[scheduler] Refreshing {len(products)} products...")
    for p in products:
        result = scrape_product(p["url"])
        if "error" in result:
            print(f"[scheduler] Failed {p['url']}: {result['error']}")
        else:
            print(f"[scheduler] Updated: {result['name']} → ₹{result['price']}")


def discover_new_products():
    """Discover and save additional products from Amazon catalog pages."""
    query = os.getenv("DISCOVERY_QUERY", "bags")
    pages = int(os.getenv("DISCOVERY_PAGES", "20"))
    max_urls = int(os.getenv("DISCOVERY_MAX_URLS", "40"))

    urls, error = discover_catalog_urls(query=query, pages=pages)
    if error:
        print(f"[scheduler] Discovery failed for '{query}': {error}")
        return

    print(f"[scheduler] Discovery found {len(urls)} URLs for '{query}'")
    if max_urls > 0:
        urls = urls[:max_urls]
        print(f"[scheduler] Discovery processing first {len(urls)} URLs for '{query}' (DISCOVERY_MAX_URLS={max_urls})")

    added = 0
    failed = 0
    for index, url in enumerate(urls, 1):
        result = scrape_product(url)
        if "error" in result:
            failed += 1
        else:
            added += 1

        if index % 10 == 0 or index == len(urls):
            print(
                f"[scheduler] Discovery progress '{query}': {index}/{len(urls)} processed "
                f"({added} saved, {failed} failed)"
            )

    print(f"[scheduler] Discovery complete for '{query}': {added} saved, {failed} failed")


def start_scheduler(interval_hours: int = 12):
    scheduler.add_job(
        refresh_all_products,
        trigger="interval",
        hours=interval_hours,
        id="refresh_products",
        replace_existing=True,
    )
    scheduler.add_job(
        discover_new_products,
        trigger="date",
        run_date=datetime.now() + timedelta(seconds=5),
        id="discover_products_startup",
        replace_existing=True,
    )
    scheduler.add_job(
        discover_new_products,
        trigger="interval",
        hours=24,
        id="discover_products",
        replace_existing=True,
    )
    scheduler.start()
    print(f"[scheduler] Started — refreshing every {interval_hours}h, startup discovery in 5s, and daily discovery")


def stop_scheduler():
    scheduler.shutdown()
