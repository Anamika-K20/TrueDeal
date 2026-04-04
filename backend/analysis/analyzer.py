from db.operations import get_price_history


def analyze_product(product_id: int) -> dict:
    """
    Given a product_id, analyze its price history and return deal insights.
    """
    history = get_price_history(product_id)

    if not history:
        return {"error": "No price history available for this product"}

    prices = [h["price"] for h in history if h["price"] is not None]

    if not prices:
        return {"error": "No valid price data found"}

    current_price = prices[0]  # newest first
    lowest_price = min(prices)
    highest_price = max(prices)
    avg_price = round(sum(prices) / len(prices), 2)

    # Latest MRP for discount calc
    latest_mrp = next((h["mrp"] for h in history if h["mrp"] is not None), None)
    current_discount = _calc_discount(current_price, latest_mrp)

    # Deal verdict
    verdict, reason = _get_verdict(current_price, lowest_price, avg_price)

    return {
        "product_id": product_id,
        "current_price": current_price,
        "lowest_ever": lowest_price,
        "highest_ever": highest_price,
        "average_price": avg_price,
        "mrp": latest_mrp,
        "current_discount_percent": current_discount,
        "is_lowest_ever": current_price == lowest_price,
        "verdict": verdict,
        "reason": reason,
        "data_points": len(prices),
    }


def _calc_discount(price, mrp):
    if not price or not mrp or mrp <= price:
        return None
    return round(((mrp - price) / mrp) * 100, 2)


def _get_verdict(current, lowest, avg):
    diff_from_lowest = current - lowest
    pct_above_lowest = (diff_from_lowest / lowest) * 100 if lowest else 0
    pct_above_avg = ((current - avg) / avg) * 100 if avg else 0

    if current == lowest:
        return "great_deal", "This is the lowest price we've ever seen"
    elif pct_above_lowest <= 5:
        return "good_deal", f"Only {pct_above_lowest:.1f}% above the lowest ever price"
    elif pct_above_avg <= 0:
        return "fair_deal", "Price is at or below the average"
    elif pct_above_avg <= 10:
        return "average", f"Price is {pct_above_avg:.1f}% above average"
    else:
        return "overpriced", f"Price is {pct_above_avg:.1f}% above average — consider waiting"
