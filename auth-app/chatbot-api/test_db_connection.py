import psycopg2
import os

NEON_DATABASE_URL = "postgresql://neondb_owner:npg_Nn8L2GcyvThs@ep-green-frost-ahv1g9z5-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def test_db_connection():
    try:
        conn = psycopg2.connect(NEON_DATABASE_URL)
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        print("Database connection successful!")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Database connection failed: {e}")

if __name__ == "__main__":
    test_db_connection()
