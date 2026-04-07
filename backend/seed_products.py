import sys

from db.init_db import init_db
from scraper.scraper import scrape_product
from scraper.catalog import discover_catalog_urls


def discover_urls(query="bags", pages=20):
    print("[seed] Discovering URLs for query={} pages={}".format(query, pages))
    urls, error = discover_catalog_urls(query=query, pages=pages)
    if error:
        print("[seed] Error: {}".format(error))
        return []
    print("[seed] Found {} product URLs".format(len(urls)))
    return urls


def seed(query="bags", pages=20):
    init_db()
    urls = discover_urls(query, pages)
    if not urls:
        print("[seed] No URLs to process.")
        return

    success, failed = 0, 0
    for i, url in enumerate(urls, 1):
        print("[{}/{}] {}".format(i, len(urls), url))
        result = scrape_product(url)
        if "error" in result:
            print("  x {}".format(result["error"]))
            failed += 1
        else:
            print("  ok {} -> Rs.{}".format(result["name"], result["price"]))
            success += 1

    print("[seed] Done: {} seeded, {} failed".format(success, failed))


if __name__ == "__main__":
    query = sys.argv[1] if len(sys.argv) > 1 else "bags"
    pages = int(sys.argv[2]) if len(sys.argv) > 2 else 20
    seed(query, pages)
