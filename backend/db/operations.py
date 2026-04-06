try:
    from .database import get_connection
except ImportError:
    from db.database import get_connection


def get_or_create_product(name, url):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM products WHERE url = %s", (url,))
    row = cursor.fetchone()

    if row:
        cursor.close()
        conn.close()
        return row["id"]

    cursor.execute(
        "INSERT INTO products (name, url) VALUES (%s, %s) RETURNING id",
        (name, url),
    )
    product_id = cursor.fetchone()["id"]
    conn.commit()
    cursor.close()
    conn.close()
    return product_id


def insert_price(product_id, price, mrp):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO price_history (product_id, price, mrp) VALUES (%s, %s, %s)",
        (product_id, price, mrp),
    )
    conn.commit()
    cursor.close()
    conn.close()


def get_price_history(product_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT price, mrp, timestamp FROM price_history WHERE product_id = %s ORDER BY timestamp DESC",
        (product_id,),
    )
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return [{"price": r["price"], "mrp": r["mrp"], "timestamp": str(r["timestamp"])} for r in rows]


def get_all_products():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, url FROM products ORDER BY id DESC")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return [{"id": r["id"], "name": r["name"], "url": r["url"]} for r in rows]
