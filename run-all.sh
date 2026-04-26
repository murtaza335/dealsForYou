#!/bin/bash

echo "Starting DealsForYou Services in order..."

# 1. Scraper Service
echo "Starting scraper_service..."
cd services/scraper_service && npm run dev &
SCRAPER_PID=$!
cd ../../

sleep 5

# 2. Deals Service
echo "Starting deals_service..."
cd services/deals_service && npm run dev &
DEALS_PID=$!
cd ../../

sleep 5

# 3. User Service
echo "Starting user_domain_service..."
cd services/user_domain_service && npm run dev &
USER_PID=$!
cd ../../

sleep 5

# 4. Recommendation Service
echo "Starting recommendation_service..."
cd services/recommendation_service && npm run dev &
REC_PID=$!
cd ../../

sleep 5

# 5. Analytics Service
echo "Starting analytics_service..."
cd services/analytics_service && npm run dev &
ANALYTICS_PID=$!
cd ../../

sleep 5

# 6. API Gateway
echo "Starting api_gateway..."
cd apps/api_gateway && npm run dev &
API_PID=$!
cd ../../

sleep 5

# 7. Frontend
echo "Starting deals4you_frontend..."
cd apps/deals4you_frontend && npm run dev &
FE_PID=$!
cd ../../

echo "All services started successfully!"
echo "-----------------------------------"
echo "Scraper PID: $SCRAPER_PID"
echo "Deals PID: $DEALS_PID"
echo "User PID: $USER_PID"
echo "Recommendation PID: $REC_PID"
echo "Analytics PID: $ANALYTICS_PID"
echo "API Gateway PID: $API_PID"
echo "Frontend PID: $FE_PID"

wait



# Change the directory to the root of the project before running the script
# THEN RUN THIS IN THE TERMINAL    "bash run-all.sh"