#!/bin/bash

# Load environment variables if present
if [ -f .env ]; then
  export $(cat .env | xargs)
fi

echo "🚀 Starting Deployment..."

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found!"
  echo "👉 Please copy .env.example to .env and fill in the values."
  echo "💡 You can use scripts/generate_gw_keys.py to generate keys."
  exit 1
fi

# Create volume directories if they don't exist
mkdir -p docker/volumes/db
mkdir -p docker/volumes/storage

echo "📦 Building and Starting Containers..."
docker-compose up -d --build --remove-orphans

echo "✅ Deployment Complete!"
echo "----------------------------------------"
echo "🌍 Frontend: http://localhost:3000"
echo "🔌 Supabase API: http://localhost:54321"
echo "🛠  Supabase Studio: http://localhost:54324"
echo "----------------------------------------"
