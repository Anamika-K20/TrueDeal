try:
    from .database import get_connection
except ImportError:
    from db.database import get_connection


def _get_verdict(current, lowest, avg):
    if current is None or lowest is None or avg is None:
        return None

    diff_from_lowest = current - lowest
    pct_above_lowest = (diff_from_lowest / lowest) * 100 if lowest else 0
    pct_above_avg = ((current - avg) / avg) * 100 if avg else 0

    if current == lowest:
        return "great_deal"
    if pct_above_lowest <= 5:
        return "good_deal"
    if pct_above_avg <= 0:
        return "fair_deal"
    if pct_above_avg <= 10:
        return "average"
    return "overpriced"


def get_or_create_product(name, url):
    """Return existing product_id if URL already tracked, else insert and return new id."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM products WHERE url = %s", (url,))
    row = cursor.fetchone()

    if row:
        conn.close()
        return row[0]

    cursor.execute(
        "INSERT INTO products (name, url) VALUES (%s, %s) RETURNING id",
        (name, url),
    )
    product_id = cursor.fetchone()[0]
    conn.commit()
    conn.close()
    return product_id


def insert_price(product_id, price, mrp):
    """Insert a price snapshot for a product."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO price_history (product_id, price, mrp) VALUES (%s, %s, %s)",
        (product_id, price, mrp),
    )
    conn.commit()
    conn.close()


def get_price_history(product_id):
    """Return all price snapshots for a product, newest first."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT price, mrp, timestamp FROM price_history WHERE product_id = %s ORDER BY timestamp DESC",
        (product_id,),
    )
    rows = cursor.fetchall()
    conn.close()
    return [{"price": r[0], "mrp": r[1], "timestamp": r[2]} for r in rows]


def get_all_products():
    """Return all tracked products."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT p.id, p.name, p.url, ph.price, ph.mrp, stats.lowest_price, stats.avg_price
        FROM products p
        LEFT JOIN LATERAL (
            SELECT price, mrp
            FROM price_history
            WHERE product_id = p.id
            ORDER BY timestamp DESC
            LIMIT 1
        ) ph ON TRUE
        LEFT JOIN LATERAL (
            SELECT MIN(price) AS lowest_price, AVG(price) AS avg_price
            FROM price_history
            WHERE product_id = p.id AND price IS NOT NULL
        ) stats ON TRUE
        ORDER BY p.id DESC
        """
    )
    rows = cursor.fetchall()
    conn.close()

    products = []
    for r in rows:
        products.append(
            {
                "id": r[0],
                "name": r[1],
                "url": r[2],
                "latest_price": r[3],
                "latest_mrp": r[4],
                "verdict": _get_verdict(r[3], r[5], r[6]),
            }
        )

    return products
