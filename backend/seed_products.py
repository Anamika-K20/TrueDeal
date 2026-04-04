import json
import subprocess
import sys
from pathlib import Path

from db.init_db import init_db
from scraper.scraper import scrape_product

CATALOG_SCRIPT = Path(__file__).parent / "scraper" / "puppeteer_catalog.js"


def discover_urls(query="bags", pages=3):
    print("[seed] Discovering URLs for query={} pages={}".format(query, pages))
    try:
        result = subprocess.run(
            ["node", str(CATALOG_SCRIPT), query, str(pages)],
            capture_output=True, text=True, timeout=120,
        )
    except FileNotFoundError:
        print("[seed] Error: Node.js not found")
        return []
    except subprocess.TimeoutExpired:
        print("[seed] Error: timed out")
        return []

    stdout = (result.stdout or "").strip()
    if not stdout:
        print("[seed] No output: {}".format(result.stderr))
        return []

    try:
        data = json.loads(stdout)
    except json.JSONDecodeError:
        print("[seed] Invalid JSON: {}".format(stdout))
        return []

    if "error" in data:
        print("[seed] Error: {}".format(data["error"]))
        return []

    urls = data.get("urls", [])
    print("[seed] Found {} product URLs".format(len(urls)))
    return urls


def seed(query="bags", pages=3):
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
    pages = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    seed(query, pages)
