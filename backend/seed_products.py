import sys

from db.init_db import init_db
from scraper.scraper import scrape_product
from scraper.catalog import discover_catalog_urls, discover_myntra_urls


def seed_urls(urls):
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
    return success, failed


def seed_amazon(query="bags", pages=20):
    print("[seed] Amazon: query={} pages={}".format(query, pages))
    urls, error = discover_catalog_urls(query=query, pages=pages)
    if error:
        print("[seed] Error: {}".format(error))
        return 0, 0
    print("[seed] Found {} Amazon URLs".format(len(urls)))
    return seed_urls(urls)


def seed_myntra(pages=5):
    print("[seed] Myntra: {} pages per category".format(pages))
    urls, error = discover_myntra_urls(pages=pages)
    if error:
        print("[seed] Error: {}".format(error))
        return 0, 0
    print("[seed] Found {} Myntra URLs".format(len(urls)))
    return seed_urls(urls)


if __name__ == "__main__":
    init_db()
    source = sys.argv[1] if len(sys.argv) > 1 else "amazon"

    if source == "myntra":
        pages = int(sys.argv[2]) if len(sys.argv) > 2 else 5
        s, f = seed_myntra(pages)
    elif source == "all":
        s1, f1 = seed_amazon()
        s2, f2 = seed_myntra()
        s, f = s1 + s2, f1 + f2
    else:
        query = sys.argv[2] if len(sys.argv) > 2 else "bags"
        pages = int(sys.argv[3]) if len(sys.argv) > 3 else 20
        s, f = seed_amazon(query, pages)

    print("[seed] Done: {} seeded, {} failed".format(s, f))
