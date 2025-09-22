#!/bin/bash

# Pixel Prompt Application Logs Viewer
#
# Description: Views real-time logs for the Pixel Prompt application
# Author: David Seguin
# Version: 1.0.0

set -e

echo "📋 Pixel Prompt Application Logs"
echo "================================="

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

# Check if the application is running
if ! docker compose ps | grep -q "pixelprompt-app"; then
    echo "❌ Error: Pixel Prompt application is not running"
    echo "💡 Start the application with: ./start.sh"
    exit 1
fi

# Function to display logs with timestamps
show_logs() {
    local follow_flag=""
    local lines_flag=""

    # Parse command line options
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--follow)
                follow_flag="-f"
                shift
                ;;
            -n|--lines)
                lines_flag="--tail $2"
                shift 2
                ;;
            -h|--help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  -f, --follow    Follow log output"
                echo "  -n, --lines N   Show last N lines"
                echo "  -h, --help      Show this help"
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                echo "Use -h for help"
                exit 1
                ;;
        esac
    done

    # Show application status
    echo "🔍 Application Status:"
    docker compose ps pixelprompt
    echo ""

    # Show logs
    echo "📊 Application Logs:"
    echo "-------------------"

    if [ -n "$follow_flag" ]; then
        echo "👀 Following logs (Press Ctrl+C to stop)..."
        echo ""
        docker compose logs $follow_flag $lines_flag pixelprompt
    else
        docker compose logs $lines_flag pixelprompt
        echo ""
        echo "💡 Use './stlog.sh -f' to follow logs in real-time"
        echo "💡 Use './stlog.sh -n 50' to show last 50 lines"
    fi
}

# Check for command line arguments
if [ $# -eq 0 ]; then
    # Default: show last 50 lines
    show_logs -n 50
else
    # Pass all arguments to show_logs function
    show_logs "$@"
fi