#!/bin/bash

# Pixel Prompt Local Development Script
#
# Description: Starts the React development server with proper environment variables
# Author: David Seguin
# Version: 1.0.0

set -e

echo "🚀 Starting Pixel Prompt in Development Mode..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Load API key from .env file
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | grep REACT_APP_GEMINI_API_KEY | xargs)
fi

# Check if API key is set
if [ -z "$REACT_APP_GEMINI_API_KEY" ]; then
    echo "❌ Error: REACT_APP_GEMINI_API_KEY not found in .env file"
    echo "Please ensure your .env file contains:"
    echo "REACT_APP_GEMINI_API_KEY=your_api_key_here"
    exit 1
fi

echo "✅ API key loaded from .env file"
echo "🌐 Starting React development server on port 3000..."
echo ""
echo "📊 Development Details:"
echo "   URL: http://localhost:3000"
echo "   Mode: Development"
echo "   Hot Reload: Enabled"
echo ""

# Start the React development server with the environment variable
PORT=3000 npm start