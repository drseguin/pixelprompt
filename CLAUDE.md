# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **pixelprompt**, a React application for testing Google's Nano Banana with file upload and prompt functionality featuring:
- Drag & drop file upload with timestamped organization
- Express.js backend with multer for file handling
- Session-based file management with browser localStorage
- Two-panel UI layout with orange theme
- Docker containerization for easy deployment
- Sequential file naming and thumbnail generation

## Architecture

### Core Structure
```
pixelprompt/
├── src/
│   ├── components/         # React components
│   │   ├── FileDropZone.js # Main upload component with drag-drop
│   │   └── FileDropZone.css
│   ├── utils/
│   │   └── session.js      # Browser session management
│   ├── App.js              # Main application component
│   ├── App.css             # Application styles
│   ├── index.js            # React entry point
│   └── index.css           # Global styles
├── config/
│   └── settings.json       # Application configuration
├── uploads/                # File upload directory (timestamped folders)
├── public/                 # Static assets
├── server.js               # Express backend server
├── package.json            # Dependencies and scripts
└── Docker files + shell scripts
```

### Key Architectural Patterns
- **Session-Based Organization**: Each browser session gets unique timestamped upload folders
- **Client-Server Separation**: React frontend + Express backend with REST API
- **File Management**: Multer handles uploads, files renamed sequentially (image_1, image_2, etc.)
- **Timestamped Storage**: Files organized in "YYYY-MM-DD HH:MM:SS:SSS" Zulu time folders
- **Session Persistence**: Browser localStorage maintains session across page reloads

## Common Development Commands

### Docker-based Development (Recommended)
```bash
# Start application (builds and runs containers)
./start.sh

# View real-time logs
./stlog.sh

# Stop application
./stop.sh
```

### Local Development
```bash
# Install dependencies
npm install

# Start React development server (frontend only)
npm start

# Build for production
npm run build

# Run tests
npm test

# Start backend server separately (port 3001)
node server.js
```

### Docker Commands
```bash
# Manual Docker operations
docker compose up -d --build
docker compose logs -f
docker compose down
docker compose down -v  # Remove uploaded files
```

## Development Rules (MANDATORY)

**⚠️ CRITICAL**: This project enforces strict development standards. See `DEVELOPMENT_RULES.md` for complete requirements.

### Key Requirements
1. **File Headers**: All source files must have comprehensive JSDoc headers including:
   - File overview and architectural role
   - Author: David Seguin
   - Version, license, and security considerations
   - Dependencies and performance notes

2. **Function Documentation**: All exported functions and complex internal functions require JSDoc with:
   - Parameter validation rules
   - Return types and error conditions
   - Examples and security implications

3. **Configuration Management**: When modifying `config/settings.json`:
   - Ensure backend server handles new configuration options
   - Update UI components that reference config values
   - Document security implications for new settings

## Configuration

### Main Configuration File: `config/settings.json`
Key configuration areas:
- **Upload Settings**: File types, size limits, max files, naming patterns
- **UI Theme**: Orange color scheme, layout dimensions
- **Security**: File validation, sanitization, upload rate limiting
- **Development**: Port, logging, CORS settings

### Session Management
- Browser sessions use cryptographically secure UUIDs
- Session data stored in localStorage with prefixed keys
- Server tracks active upload sessions per session ID
- Each session gets unique timestamped upload folder

## API Endpoints

```bash
# File Operations
POST /api/upload              # Upload files to session folder
GET  /api/settings            # Get application settings
POST /api/settings            # Update application settings

# Session Management
GET  /api/session/{sessionId}            # Get session data
POST /api/session/{sessionId}/new-upload # Start new upload session
POST /api/session/{sessionId}/clear      # Clear session and files
```

## File Upload Process

1. **Frontend**: User drops/selects files in FileDropZone component
2. **Session Check**: Get or create browser session ID (localStorage)
3. **Upload**: POST to `/api/upload` with session headers
4. **Server Processing**:
   - Create timestamped folder if needed
   - Rename files sequentially (image_1.jpg, image_2.png, etc.)
   - Store file metadata in session map
5. **Response**: Return file metadata and folder info
6. **UI Update**: Display thumbnails and file info

## Key Components

### FileDropZone (`src/components/FileDropZone.js`)
- Handles drag-and-drop and click-to-upload
- Generates thumbnails for image files
- Manages session-based file organization
- Integrates with session management utilities

### Session Management (`src/utils/session.js`)
- Browser session ID generation and persistence
- Session-specific data storage in localStorage
- Upload session state management

### Express Server (`server.js`)
- Multer configuration for file uploads
- Timestamped folder creation
- Session-based file organization
- Settings API endpoints

## Security Considerations

- File type validation on frontend and backend
- File size limitations to prevent abuse
- Sanitized file naming to prevent path traversal
- Session isolation between users
- Input validation for all user data
- No sensitive data stored in browser localStorage

## Development Environment

### Dependencies
- **Frontend**: React 18, Create React App
- **Backend**: Express.js, Multer, CORS
- **Development**: Docker, Docker Compose

### Browser Support
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Application runs on `http://localhost:3001` when started via Docker.