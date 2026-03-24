def calculate_discount(price, mrp):
    if not price or not mrp:
        return None

    discount = ((mrp - price) / mrp) * 100
    return round(discount, 2)

def clean_price(text):
    if not text:
        return None

    cleaned = (
        text.replace("₹", "")
            .replace(",", "")
            .strip()
    )

    try:
        return int(float(cleaned))
    except (ValueError, TypeError):
        return None