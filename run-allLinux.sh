#!/bin/bash

set -e  # Exit if any command fails

echo "Starting DealsForYou Services in order..."

# Function to start a service
start_service () {
  SERVICE_NAME=$1
  SERVICE_PATH=$2

  echo "Starting $SERVICE_NAME..."
  cd "$SERVICE_PATH"

  npm run dev > "../../logs/${SERVICE_NAME}.log" 2>&1 &
  PID=$!

  echo "$SERVICE_NAME started with PID $PID"

  cd - > /dev/null

  sleep 5
}

# Create logs directory
mkdir -p logs

# Start services
start_service "scraper_service" "services/scraper_service"
start_service "deals_service" "services/deals_service"
start_service "user_domain_service" "services/user_domain_service"
start_service "recommendation_service" "services/recommendation_service"
start_service "analytics_service" "services/analytics_service"
start_service "api_gateway" "apps/api_gateway"
start_service "frontend" "apps/deals4you_frontend"

echo "-----------------------------------"
echo "All services started successfully!"
echo "Logs are available in ./logs"

# Wait for all background jobs
wait


# to run this script:
#chmod +x run-allLinux.sh
# ./run-allLinux.sh