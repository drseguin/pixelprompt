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

**⚠️ CRITICAL**: This project enforces strict development standards for consistent, maintainable code.

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
   - Test both frontend and backend integration

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

### Core File Operations
```bash
POST /api/upload              # Upload files to session folder
GET  /api/settings            # Get application settings
POST /api/settings            # Update application settings
```

### Session Management
```bash
GET  /api/session/{sessionId}            # Get session data
POST /api/session/{sessionId}/new-upload # Start new upload session
POST /api/session/{sessionId}/clear      # Clear session and files
```

### Google Nano Banana Integration
The application integrates with Google's Gemini API for image analysis:
- **Model**: `gemini-2.5-flash-image-preview`
- **Rate Limits**: 10 requests/minute, 100 requests/hour
- **Supported Formats**: JPEG, PNG, WebP, GIF
- **Max Images**: 3 per request

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
- **AI Integration**: Google Gemini API (@google/genai)
- **Development**: Docker, Docker Compose

### Browser Support
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Ports and URLs
- **Development**: `http://localhost:3000` (React dev server)
- **Production**: `http://localhost:3001` (Docker container)
- **Backend API**: Port 3001

## Testing and Quality

### Running Tests
```bash
npm test                    # Run React test suite
npm test -- --coverage     # Run tests with coverage report
```

### Linting and Code Quality
The project uses Create React App's built-in ESLint configuration. Code should follow React best practices and JSDoc documentation standards.

### Docker Development Workflow
1. **Initial Setup**: Run `./start.sh` to build and start containers
2. **Development**: Use `./stlog.sh` to monitor real-time logs
3. **Testing Changes**: Rebuild with `docker compose up -d --build`
4. **Cleanup**: Run `./stop.sh` to stop containers

## Icon Usage Standards

**MANDATORY**: All UI icons must use Google Material Icons with standardized configuration.

### Required Icon Source and Configuration
- **URL**: https://fonts.google.com/icons?selected=Material+Symbols+Outlined:sync:FILL@0;wght@400;GRAD@0;opsz@24&icon.size=24&icon.color=%23F19E39
- **Style**: Material Symbols Outlined
- **Configuration**: FILL@0;wght@400;GRAD@0;opsz@24
- **Size**: 24px base (scales with font-size)
- **Color**: #F19E39 (Orange theme color)

### Implementation Requirements
```css
.icon-class {
  color: #F19E39;
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}
```

```jsx
<span className="material-symbols-outlined icon-class">icon_name</span>
```

### Current Icon Usage
- **Upload/Folder**: `folder` icon in FileDropZone empty state
- **Add/Plus**: `add` icon for add-more-button
- **Loading**: `hourglass_empty` for generating state
- **Ready**: `flash_on` for ready state

### Icon Selection Guidelines
- Choose semantically appropriate icons from Material Symbols
- Maintain visual consistency across the application
- Use outlined style for consistency with theme
- Test icons at different display densities
- Ensure accessibility with proper alt text when needed