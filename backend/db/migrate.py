"""
Run this once to add image_url column and remove bad Myntra entries.
Usage: python migrate.py
"""
try:
    from .database import get_connection
except ImportError:
    from db.database import get_connection


def migrate():
    conn = get_connection()
    cursor = conn.cursor()

    # Add image_url column if it doesn't exist
    cursor.execute("""
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS image_url TEXT
    """)

    # Remove bad Myntra entries (those with myntra.com URLs that have no price history)
    cursor.execute("""
        DELETE FROM price_history
        WHERE product_id IN (
            SELECT id FROM products WHERE url LIKE '%myntra.com%'
        )
    """)
    cursor.execute("""
        DELETE FROM products WHERE url LIKE '%myntra.com%'
    """)

    conn.commit()
    cursor.close()
    conn.close()
    print("Migration complete: image_url column added, bad Myntra entries removed.")


if __name__ == "__main__":
    migrate()
