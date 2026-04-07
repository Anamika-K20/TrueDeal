import os

import psycopg2


DEFAULT_DATABASE_URL = "postgresql://postgres:uHJNaIVkVbUPwIulDISSCoThuTMeUzkw@junction.proxy.rlwy.net:36519/railway"


def get_connection():
    database_url = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)
    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable is not set")

    return psycopg2.connect(database_url)