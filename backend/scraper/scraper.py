import requests
from bs4 import BeautifulSoup


def scrape_product(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept-Language": "en-US,en;q=0.9"
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)

        # Handle bad response
        if response.status_code != 200:
            return {"error": "Failed to fetch page"}

        soup = BeautifulSoup(response.content, "html.parser")

        # Extract title
        title = soup.find("span", {"id": "productTitle"})
        product_name = title.text.strip() if title else "No title found"

        # Clean title
        if "Amazon.in" in product_name:
            product_name = product_name.split("Amazon.in")[0].strip()

        # Extract price (IMPORTANT)
        price = soup.find("span", {"class": "a-price-whole"})
        product_price = price.text.strip() if price else "Price not found"

        return {
            "name": product_name,
            "price": product_price
        }

    except Exception as e:
        return {
            "error": str(e)
        }
    