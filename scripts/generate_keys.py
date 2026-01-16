import secrets
import jwt
import datetime

def generate_jwt(secret, role):
    payload = {
        "role": role,
        "iss": "supabase",
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=365*10)
    }
    return jwt.encode(payload, secret, algorithm="HS256")

def main():
    print("🔑 Generating Supabase Keys...")
    
    # Generate a strong random JWT secret
    jwt_secret = secrets.token_urlsafe(40)
    
    # Generate tokens based on the secret
    anon_key = generate_jwt(jwt_secret, "anon")
    service_key = generate_jwt(jwt_secret, "service_role")
    
    # Generate a random password for Postgres
    db_password = secrets.token_urlsafe(16)
    
    print("\n------------------------------------------------------------")
    print("Copy these values into your .env file:")
    print("------------------------------------------------------------")
    print(f"POSTGRES_PASSWORD={db_password}")
    print(f"JWT_SECRET={jwt_secret}")
    print(f"ANON_KEY={anon_key}")
    print(f"SERVICE_ROLE_KEY={service_key}")
    print("------------------------------------------------------------")

if __name__ == "__main__":
    main()
