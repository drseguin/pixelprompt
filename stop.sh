#!/bin/bash

# Pixel Prompt Application Stop Script
#
# Description: Stops the Pixel Prompt application and cleans up Docker resources
# Author: David Seguin
# Version: 1.0.0

set -e

echo "🛑 Stopping Pixel Prompt Application..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    exit 1
fi

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found in current directory"
    exit 1
fi

# Stop the containers
echo "🔧 Stopping containers..."
docker compose down

# Check if we should remove volumes (ask user)
echo ""
read -p "🗑️  Do you want to remove uploaded files and config? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 Removing volumes and data..."
    docker compose down -v

    # Remove local directories if they exist
    if [ -d "uploads" ]; then
        echo "📁 Removing uploads directory..."
        rm -rf uploads/*
        echo "uploads/" > uploads/.gitkeep
    fi

    echo "✅ Application stopped and data removed"
else
    echo "✅ Application stopped (data preserved)"
fi

# Optional: Remove unused Docker images
echo ""
read -p "🧹 Do you want to clean up unused Docker images? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔧 Cleaning up Docker images..."
    docker image prune -f
    echo "✅ Docker cleanup completed"
fi

echo ""
echo "🎯 Pixel Prompt application has been stopped"
echo ""
echo "🔍 Useful commands:"
echo "   Start app:    ./start.sh"
echo "   View logs:    ./stlog.sh"
echo "   Check status: docker compose ps"