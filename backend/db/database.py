import os
import psycopg2
from psycopg2.extras import RealDictCursor


def get_connection():
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable is not set")
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)
