try:
    from .database import get_connection
except ImportError:
    from db.database import get_connection


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT,
        url TEXT UNIQUE
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS price_history (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id),
        price INTEGER,
        mrp INTEGER,
        timestamp TIMESTAMPTZ DEFAULT NOW()
    )
    """)

    conn.commit()
    cursor.close()
    conn.close()


if __name__ == "__main__":
    init_db()
