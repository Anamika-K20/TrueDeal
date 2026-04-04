from apscheduler.schedulers.background import BackgroundScheduler
from db.operations import get_all_products
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


def start_scheduler(interval_hours: int = 12):
    scheduler.add_job(
        refresh_all_products,
        trigger="interval",
        hours=interval_hours,
        id="refresh_products",
        replace_existing=True,
    )
    scheduler.start()
    print(f"[scheduler] Started — refreshing every {interval_hours}h")


def stop_scheduler():
    scheduler.shutdown()
