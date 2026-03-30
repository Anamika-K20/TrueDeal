import requests
from bs4 import BeautifulSoup
import json
import re
from urllib.parse import urlparse

try:
    from scraper.utils import calculate_discount, clean_price
except ImportError:
    from utils import calculate_discount, clean_price

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept-Language": "en-US,en;q=0.9",
}


def _normalize_name(text):
    if not text:
        return None
    return " ".join(text.split()).strip()


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


def _extract_text_by_selectors(soup, selectors):
    for selector in selectors:
        node = soup.select_one(selector)
        if node:
            text = _normalize_name(node.get_text(" ", strip=True))
            if text:
                return text
    return None


def _extract_price_by_selectors(soup, selectors):
    for selector in selectors:
        node = soup.select_one(selector)
        if node:
            price = _parse_price_value(node.get_text(" ", strip=True))
            if price is not None:
                return price
    return None


def _extract_from_meta(soup):
    title = None
    for attr, key in [
        ("property", "og:title"),
        ("name", "title"),
        ("name", "twitter:title"),
    ]:
        tag = soup.find("meta", attrs={attr: key})
        if tag and tag.get("content"):
            title = _normalize_name(tag["content"])
            break

    price = None
    for attr, key in [
        ("property", "product:price:amount"),
        ("property", "og:price:amount"),
        ("itemprop", "price"),
    ]:
        tag = soup.find("meta", attrs={attr: key})
        if tag and tag.get("content"):
            price = _parse_price_value(tag["content"])
            if price is not None:
                break

    return title, price


def _extract_from_json_ld(soup):
    name = None
    price = None
    mrp = None

    scripts = soup.find_all("script", attrs={"type": "application/ld+json"})
    for script in scripts:
        raw = script.string or script.get_text(strip=True)
        if not raw:
            continue

        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue

        stack = [data]
        while stack:
            item = stack.pop()
            if isinstance(item, list):
                stack.extend(item)
                continue

            if not isinstance(item, dict):
                continue

            for key in ["@graph", "itemListElement", "mainEntity", "items"]:
                if key in item:
                    stack.append(item[key])

            item_type = item.get("@type")
            is_product = (
                item_type == "Product"
                or (isinstance(item_type, list) and "Product" in item_type)
            )
            if not is_product:
                continue

            if not name and item.get("name"):
                name = _normalize_name(str(item.get("name")))

            offers = item.get("offers")
            if isinstance(offers, list):
                offers = offers[0] if offers else None

            if isinstance(offers, dict):
                if price is None:
                    price = _parse_price_value(
                        offers.get("price")
                        or offers.get("lowPrice")
                    )
                if mrp is None:
                    mrp = _parse_price_value(
                        offers.get("highPrice")
                        or offers.get("priceBeforeDiscount")
                    )

                spec = offers.get("priceSpecification")
                if isinstance(spec, dict):
                    if mrp is None:
                        mrp = _parse_price_value(
                            spec.get("price") if spec.get("priceType") else None
                        )
                elif isinstance(spec, list):
                    for ps in spec:
                        if not isinstance(ps, dict):
                            continue
                        price_type = str(ps.get("priceType", "")).lower()
                        if "list" in price_type or "strikethrough" in price_type:
                            candidate = _parse_price_value(ps.get("price"))
                            if candidate is not None:
                                mrp = candidate
                                break

    return name, price, mrp


def _extract_amazon(soup):
    title = _extract_text_by_selectors(soup, ["#productTitle"])
    if title and "Amazon.in" in title:
        title = title.split("Amazon.in")[0].strip()

    price = _extract_price_by_selectors(
        soup,
        [
            "span.a-price-whole",
            "span.a-price span.a-offscreen",
            "span.priceToPay span.a-offscreen",
        ],
    )

    mrp = _extract_price_by_selectors(
        soup,
        [
            "span.a-price.a-text-price span.a-offscreen",
            "span.a-price.a-text-strike span.a-offscreen",
        ],
    )

    return title, price, mrp


def _extract_flipkart(soup):
    title = _extract_text_by_selectors(
        soup,
        [
            "span.B_NuCI",
            "h1 span",
            "h1",
        ],
    )

    price = _extract_price_by_selectors(
        soup,
        [
            "div._30jeq3._16Jk6d",
            "div._30jeq3",
            "div.Nx9bqj.CxhGGd",
            "div[class*='Nx9bqj']",
        ],
    )

    mrp = _extract_price_by_selectors(
        soup,
        [
            "div._3I9_wc",
            "span._3I9_wc",
            "div[class*='yRaY8j']",
            "div[class*='A6+E6v']",
            "del",
        ],
    )

    return title, price, mrp


def _extract_myntra(soup):
    brand = _extract_text_by_selectors(soup, ["h1.pdp-title"])
    name = _extract_text_by_selectors(soup, ["h1.pdp-name", "h1"])
    title = _normalize_name(f"{brand} {name}" if brand and name else (name or brand))

    price = _extract_price_by_selectors(
        soup,
        [
            "span.pdp-price strong",
            "span.pdp-discounted-price",
            "span.pdp-price",
        ],
    )

    mrp = _extract_price_by_selectors(
        soup,
        [
            "span.pdp-mrp s",
            "span.pdp-mrp",
            "span.pdp-strike",
        ],
    )

    return title, price, mrp


def _extract_ajio(soup):
    title = _extract_text_by_selectors(
        soup,
        [
            "h1.prod-name",
            "div.prod-name",
            "h1",
        ],
    )

    price = _extract_price_by_selectors(
        soup,
        [
            "span.prod-sp",
            "div.prod-sp",
            "span[class*='prod-sp']",
            "span[class*='price']",
        ],
    )

    mrp = _extract_price_by_selectors(
        soup,
        [
            "span.prod-mrp",
            "div.prod-mrp",
            "span[class*='prod-mrp']",
            "span[class*='prod-cp']",
            "del",
        ],
    )

    return title, price, mrp


def _extract_nykaa(soup):
    title = _extract_text_by_selectors(
        soup,
        [
            "h1",
            "div.css-175oi2r h1",
        ],
    )

    price = _extract_price_by_selectors(
        soup,
        [
            "span.css-111z9ua",
            "span.css-1jczs19",
            "span[class*='price']",
        ],
    )

    mrp = _extract_price_by_selectors(
        soup,
        [
            "span.css-u05rr",
            "span.css-1jczs19",
            "span[class*='mrp']",
            "del",
        ],
    )

    return title, price, mrp


def scrape_product(url):

    try:
        response = requests.get(url, headers=HEADERS, timeout=10)

        # Handle bad response
        if response.status_code != 200:
            return {"error": "Failed to fetch page"}

        soup = BeautifulSoup(response.content, "html.parser")

        domain = urlparse(url).netloc.lower()
        if "amazon." in domain:
            name, price, mrp = _extract_amazon(soup)
        elif "flipkart." in domain:
            name, price, mrp = _extract_flipkart(soup)
        elif "myntra." in domain:
            name, price, mrp = _extract_myntra(soup)
        elif "ajio." in domain:
            name, price, mrp = _extract_ajio(soup)
        elif "nykaa." in domain:
            name, price, mrp = _extract_nykaa(soup)
        else:
            return {"error": "Unsupported domain"}

        ld_name, ld_price, ld_mrp = _extract_from_json_ld(soup)
        meta_name, meta_price = _extract_from_meta(soup)

        product_name = name or ld_name or meta_name or "No title found"
        product_price = price if price is not None else (ld_price if ld_price is not None else meta_price)
        product_mrp = mrp if mrp is not None else ld_mrp

        if product_mrp is not None and product_price is not None and product_mrp < product_price:
            product_mrp = None

        discount = calculate_discount(product_price, product_mrp)
        return {
            "name": product_name,
            "price": product_price,
            "mrp": product_mrp,
            "discount_percent": discount
        }

    except Exception as e:
        return {
            "error": str(e)
        }
    