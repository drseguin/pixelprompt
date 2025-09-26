#!/bin/bash

# Pixel Prompt Application Startup Script
#
# Description: Starts the Pixel Prompt application using Docker Compose
# Author: David Seguin
# Version: 1.0.0

set -e

echo "🚀 Starting Pixel Prompt Application..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found in current directory"
    exit 1
fi

# Create necessary directories if they don't exist
echo "📁 Creating necessary directories..."
mkdir -p uploads config

# Ensure uploads directory has a .gitkeep file
if [ ! -f "uploads/.gitkeep" ]; then
    touch uploads/.gitkeep
fi

# Check if containers are already running
if docker compose ps | grep -q "pixelprompt-app.*Up"; then
    echo "🔄 Application is already running. Restarting..."
    docker compose down
    echo "⏳ Waiting for containers to stop..."
    sleep 3
fi

# Start the application with Docker Compose
echo "🔧 Building and starting containers..."
docker compose up -d --build

# Wait a moment for the container to start
echo "⏳ Waiting for application to start..."
sleep 5

# Check if the container is running
if docker compose ps | grep -q "pixelprompt-app.*Up"; then
    echo "✅ Pixel Prompt application started successfully!"
    echo ""
    echo "📊 Application Details:"
    echo "   URL: http://localhost:3001"
    echo "   Container: pixelprompt-app"
    echo "   Status: Running"
    echo ""
    echo "🔍 Useful commands:"
    echo "   View logs:    ./stlog.sh"
    echo "   Stop app:     ./stop.sh"
    echo "   Check status: docker compose ps"
    echo ""
    echo "🌐 Opening application in browser..."

    # Try to open the application in the default browser (macOS/Linux)
    if command -v open > /dev/null; then
        open http://localhost:3001
    elif command -v xdg-open > /dev/null; then
        xdg-open http://localhost:3001
    else
        echo "Please open http://localhost:3001 in your browser"
    fi
else
    echo "❌ Failed to start Pixel Prompt application"
    echo "🔍 Checking logs for errors..."
    docker compose logs
    exit 1
fi