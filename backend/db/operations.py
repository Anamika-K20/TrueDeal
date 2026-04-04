try:
    from .database import get_connection
except ImportError:
    from db.database import get_connection


def get_or_create_product(name, url):
    """Return existing product_id if URL already tracked, else insert and return new id."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM products WHERE url = ?", (url,))
    row = cursor.fetchone()

    if row:
        conn.close()
        return row[0]

    cursor.execute("INSERT INTO products (name, url) VALUES (?, ?)", (name, url))
    product_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return product_id


def insert_price(product_id, price, mrp):
    """Insert a price snapshot for a product."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO price_history (product_id, price, mrp) VALUES (?, ?, ?)",
        (product_id, price, mrp),
    )
    conn.commit()
    conn.close()


def get_price_history(product_id):
    """Return all price snapshots for a product, newest first."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT price, mrp, timestamp FROM price_history WHERE product_id = ? ORDER BY timestamp DESC",
        (product_id,),
    )
    rows = cursor.fetchall()
    conn.close()
    return [{"price": r[0], "mrp": r[1], "timestamp": r[2]} for r in rows]


def get_all_products():
    """Return all tracked products."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, url FROM products ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "name": r[1], "url": r[2]} for r in rows]
