try:
    from .database import get_connection
except ImportError:
    from db.database import get_connection

def insert_product(name, url):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO products (name, url) VALUES (?, ?)",
        (name, url)
    )

    product_id = cursor.lastrowid

    conn.commit()
    conn.close()

    return product_id


def insert_price(product_id, price, mrp):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO price_history (product_id, price, mrp) VALUES (?, ?, ?)",
        (product_id, price, mrp)
    )

    conn.commit()
    conn.close()