#!/bin/bash

# Pixel Prompt Application Start Script
#
# Description: Starts the React development server with secure environment variable handling
# Author: David Seguin
# Version: 2.0.0

set -e

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