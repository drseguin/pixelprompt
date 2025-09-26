#!/bin/bash

# Pixel Prompt Application Start Script
#
# Description: Starts the React development server with secure environment variable handling
# Author: David Seguin
# Version: 2.0.0

# set -e removed to prevent early exit on command failures

echo "🚀 Starting Pixel Prompt Application..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Load environment variables from .env file
if [ -f ".env" ]; then
    echo "📄 Loading environment variables from .env..."
    # Use a more robust method to load environment variables
    set -a
    source .env
    set +a
else
    echo "⚠️  Warning: .env file not found"
fi

# Check if API key is set
if [ -z "$REACT_APP_GEMINI_API_KEY" ]; then
    echo "❌ Error: REACT_APP_GEMINI_API_KEY not found"
    echo ""
    echo "To fix this issue:"
    echo "1. Create a .env file in the project root"
    echo "2. Add your API key: REACT_APP_GEMINI_API_KEY=your_api_key_here"
    echo "3. Get your API key from: https://aistudio.google.com/app/apikey"
    echo ""
    echo "Example .env file content:"
    echo "REACT_APP_GEMINI_API_KEY=AIzaSy..."
    echo "NODE_ENV=development"
    echo "PORT=3001"
    exit 1
fi

# Validate API key format (basic check)
if [[ ! "$REACT_APP_GEMINI_API_KEY" =~ ^AIza[0-9A-Za-z_-]{35}$ ]]; then
    echo "⚠️  Warning: API key format appears invalid"
    echo "Google API keys should start with 'AIza' and be 39 characters long"
    echo "Current key: ${REACT_APP_GEMINI_API_KEY:0:10}..."
fi

echo "✅ API key loaded successfully"
echo "🔐 API key: ${REACT_APP_GEMINI_API_KEY:0:10}...${REACT_APP_GEMINI_API_KEY: -4}"

# Check if port 3000 is already in use
echo "🔍 Checking port 3000..."
PORT_CHECK=$(lsof -ti:3000 2>/dev/null)

if [ ! -z "$PORT_CHECK" ]; then
    echo ""
    echo "⚠️  Something is already running on port 3000. Probably:"

    # Get process details - handle multiple PIDs (macOS compatible)
    for pid in $PORT_CHECK; do
        PROCESS_INFO=$(ps -p $pid 2>/dev/null | tail -n +2)
        if [ ! -z "$PROCESS_INFO" ]; then
            echo "  $PROCESS_INFO"
        else
            echo "  Process ID: $pid (process details unavailable)"
        fi
    done
    echo "  in $(pwd)"
    echo ""

    # Prompt user for action
    echo "What would you like to do?"
    echo "  1) Kill the existing process and use port 3000"
    echo "  2) Run on another port instead"
    echo "  3) Cancel"
    echo ""
    printf "Enter your choice (1/2/3): "
    read choice

    case "$choice" in
        1)
            echo ""
            echo "🔪 Killing existing process(es) on port 3000..."

            # Kill all processes using port 3000
            KILLED_COUNT=0
            for pid in $PORT_CHECK; do
                echo "  Killing PID: $pid"
                if kill $pid 2>/dev/null; then
                    KILLED_COUNT=$((KILLED_COUNT + 1))
                    echo "    ✅ PID $pid killed successfully"
                else
                    echo "    ⚠️  Failed to kill PID $pid, trying force kill..."
                    if kill -9 $pid 2>/dev/null; then
                        KILLED_COUNT=$((KILLED_COUNT + 1))
                        echo "    ✅ PID $pid force killed"
                    else
                        echo "    ❌ Failed to kill PID $pid"
                    fi
                fi
            done

            # Wait for ports to be freed
            echo "  Waiting for port to be freed..."
            sleep 3

            # Check if port is now free
            REMAINING_PROCESSES=$(lsof -ti:3000)
            if [ ! -z "$REMAINING_PROCESSES" ]; then
                echo "⚠️  Port 3000 still occupied by processes: $REMAINING_PROCESSES"
                echo "You may need to manually run:"
                echo "   sudo kill -9 $REMAINING_PROCESSES"
                echo "   or"
                echo "   pkill -f \"react-scripts start\""
                exit 1
            else
                echo "✅ Port 3000 is now free!"
                echo ""
                echo "🌐 Starting React development server on port 3000..."
                echo ""
                echo "📊 Development Details:"
                echo "   URL: http://localhost:3000"
                echo "   Mode: Development"
                echo "   Hot Reload: Enabled"
                echo "   Environment: Local Development"
                echo ""

                # Start on port 3000
                REACT_APP_GEMINI_API_KEY="$REACT_APP_GEMINI_API_KEY" PORT=3000 npm start
            fi
            ;;
        2)
            # Find next available port starting from 3001
            NEXT_PORT=3001
            while [ ! -z "$(lsof -ti:$NEXT_PORT)" ]; do
                NEXT_PORT=$((NEXT_PORT + 1))
            done

            echo ""
            echo "🌐 Starting React development server on port $NEXT_PORT..."
            echo ""
            echo "📊 Development Details:"
            echo "   URL: http://localhost:$NEXT_PORT"
            echo "   Mode: Development"
            echo "   Hot Reload: Enabled"
            echo "   Environment: Local Development"
            echo ""

            # Start with the new port
            REACT_APP_GEMINI_API_KEY="$REACT_APP_GEMINI_API_KEY" PORT=$NEXT_PORT npm start
            ;;
        3|*)
            echo ""
            echo "❌ Cancelled. The existing process is still running on port 3000."
            echo ""
            echo "To manually kill it later, run:"
            echo "   kill $PORT_CHECK"
            echo ""
            echo "Or to kill all node processes:"
            echo "   pkill -f \"react-scripts start\""
            exit 1
            ;;
    esac
else
    echo "🌐 Starting React development server on port 3000..."
    echo ""
    echo "📊 Development Details:"
    echo "   URL: http://localhost:3000"
    echo "   Mode: Development"
    echo "   Hot Reload: Enabled"
    echo "   Environment: Local Development"
    echo ""

    # Start the React development server with explicit environment variable
    REACT_APP_GEMINI_API_KEY="$REACT_APP_GEMINI_API_KEY" PORT=3000 npm start
fi