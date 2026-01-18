import psycopg2
import os

# Connection details for local Supabase
DB_HOST = "127.0.0.1"
DB_PORT = "54322"
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASS = "postgres"

SQL_FILE = "setup_llm_logs.sql"

def main():
    try:
        print(f"Connecting to database at {DB_HOST}:{DB_PORT}...")
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        conn.autocommit = True
        cur = conn.cursor()
        print("Connected successfully.")

        print(f"Reading SQL file: {SQL_FILE}")
        with open(SQL_FILE, 'r') as f:
            sql_content = f.read()

        print("Executing SQL script...")
        cur.execute(sql_content)
        
        # Apply Migration
        MIGRATION_FILE = "update_llm_logs_conversation.sql"
        print(f"Reading Migration file: {MIGRATION_FILE}")
        with open(MIGRATION_FILE, 'r') as f:
            migration_content = f.read()
        
        print("Executing Migration script...")
        cur.execute(migration_content)
        
        print("SQL scripts executed successfully.")
        
        # Verification
        cur.execute("SELECT to_regclass('public.llm_logs');")
        res = cur.fetchone()
        if res and res[0] == 'llm_logs':
             print("VERIFICATION SUCCESS: Table 'llm_logs' exists.")
        else:
             print("VERIFICATION WARNING: Table 'llm_logs' may not have been created correctly (check schema).")

        cur.close()
        conn.close()

    except Exception as e:
        print(f"An error occurred: {e}")
        exit(1)

if __name__ == "__main__":
    main()
