import json
import re
import subprocess
from pathlib import Path
from urllib.parse import urlparse

try:
    from scraper.utils import calculate_discount, clean_price
    from db.operations import get_or_create_product, insert_price
except ImportError:
    from utils import calculate_discount, clean_price
    from db.operations import get_or_create_product, insert_price

BAGS_KEYWORDS = [
    "bag", "bags", "backpack", "handbag", "satchel", "luggage",
    "wallet", "trolley", "tote", "clutch", "sling", "duffel",
    "duffle", "rucksack", "briefcase", "messenger", "crossbody",
    "laptop bag", "purse",
]


def _parse_price_value(raw_value):
    if raw_value is None:
        return None
    parsed = clean_price(str(raw_value))
    if parsed is not None:
        return parsed
    text = str(raw_value).replace(",", "")
    match = re.search(r"(\d+(?:\.\d+)?)", text)
    if not match:
        return None
    try:
        return int(float(match.group(1)))
    except (TypeError, ValueError):
        return None


def _is_amazon_domain(domain):
    return "amazon." in domain


def _is_myntra_domain(domain):
    return "myntra.com" in domain


def _contains_bags_keyword(text):
    lowered = (text or "").lower()
    return any(keyword in lowered for keyword in BAGS_KEYWORDS)


def _is_bags_payload(url, payload):
    checks = [url, payload.get("name"), payload.get("title"), payload.get("breadcrumb")]
    return any(_contains_bags_keyword(item) for item in checks if item)


def _run_puppeteer(script_name, url):
    script_path = Path(__file__).with_name(script_name)
    try:
        completed = subprocess.run(
            ["node", str(script_path), url],
            capture_output=True, text=True, timeout=70, check=False,
        )
    except FileNotFoundError:
        return {"error": "Node.js is required to run Puppeteer scraper"}
    except subprocess.TimeoutExpired:
        return {"error": "Puppeteer scraping timed out"}

    stdout = (completed.stdout or "").strip()
    stderr = (completed.stderr or "").strip()

    if not stdout:
        return {"error": stderr or "Puppeteer returned empty output"}

    try:
        payload = json.loads(stdout)
    except json.JSONDecodeError:
        return {"error": "Invalid Puppeteer response", "details": stdout}

    if completed.returncode != 0 and "error" not in payload:
        return {"error": stderr or "Puppeteer execution failed"}

    return payload


def scrape_product(url):
    try:
        domain = urlparse(url).netloc.lower()

        if _is_amazon_domain(domain):
            extracted = _run_puppeteer("puppeteer_amazon.js", url)
        elif _is_myntra_domain(domain):
            extracted = _run_puppeteer("puppeteer_myntra.js", url)
        else:
            return {"error": "Only Amazon and Myntra URLs are supported"}

        if extracted.get("error"):
            return extracted

        product_name = extracted.get("name") or "No title found"
        product_price = _parse_price_value(extracted.get("price"))
        product_mrp = _parse_price_value(extracted.get("mrp"))

        if product_price is None:
            return {"error": "Could not parse product price from page"}

        if not _is_bags_payload(url, extracted):
            return {"error": "Only bags category URLs are supported"}

        if product_mrp is not None and product_price is not None and product_mrp < product_price:
            product_mrp = None

        discount = calculate_discount(product_price, product_mrp)

        image_url = extracted.get("image") or None
        product_id = get_or_create_product(product_name, url, image_url)
        insert_price(product_id, product_price, product_mrp)

        return {
            "product_id": product_id,
            "name": product_name,
            "price": product_price,
            "mrp": product_mrp,
            "discount_percent": discount,
            "image_url": image_url,
            "source": "myntra" if _is_myntra_domain(domain) else "amazon",
        }

    except Exception as e:
        return {"error": str(e)}
