# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **pixelprompt**, a simplified React application for testing Google's Gemini 2.5 Flash Image API with image generation and editing capabilities:
- Two-panel layout: prompt on left, image/upload on right
- Direct file-to-image conversion (no server uploads)
- Google Gemini API integration for image generation and editing
- Simple prompt-based image modification workflow
- Docker containerization for easy deployment

## Architecture

### Core Structure
```
pixelprompt/
├── src/
│   ├── services/
│   │   ├── nanoBananaApi.js     # Google Gemini API integration service
│   │   └── promptAnalyzer.js    # AI-powered prompt analysis service
│   ├── utils/
│   │   └── session.js           # Browser session utilities (minimal usage)
│   ├── App.js                   # Main application component
│   ├── App.css                  # Application styles
│   ├── index.js                 # React entry point
│   └── index.css                # Global styles
├── config/
│   └── settings.json            # Application configuration
├── public/                      # Static assets
├── server.js                    # Express backend server (minimal)
├── package.json                 # Dependencies and scripts
└── Docker files + shell scripts
```

### Key Architectural Patterns
- **Simplified State Management**: Single `generatedImage` state for all images
- **Direct File Processing**: Uploaded files converted directly to base64 for display
- **API-First Workflow**: All image operations through Google Gemini API
- **No Server Storage**: Files processed in-browser, no server-side file management
- **Two-Panel UI**: Left panel for prompt input, right panel for image display/drop zone

## Common Development Commands

### Docker-based Development (Recommended)
```bash
# Start application (builds and runs containers)
./start.sh

# View real-time logs
./stlog.sh
./stlog.sh -f          # Follow logs in real-time
./stlog.sh -n 50       # Show last 50 lines

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
docker compose down -v  # Remove any persistent data
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

## Application Workflow

### Simplified Image Processing Flow
1. **No Image**: User enters prompt → Generate new image via Gemini API
2. **Existing Image**: User enters prompt → Modify existing image via Gemini API
3. **File Upload**: User drops/uploads file → Convert to generatedImage → Ready for modification

### Core State Management
- **`generatedImage`**: Single state object containing current working image
- **`imageHistory`**: Array of previous images for undo functionality
- **`promptText`**: Current prompt input
- **`savedPrompts`**: Array of saved prompts with metadata
- **`promptMetadata`**: Structured metadata for current prompt (category, subject, action, environment, art style, lighting)
- **`isApiReady`**: Boolean indicating API key configuration status
- **No complex file/session management required**

## API Integration

### Google Gemini API Integration
The application integrates with Google's Gemini 2.5 Flash Image API:
- **Model**: `gemini-2.5-flash-image-preview`
- **Service Module**: `src/services/nanoBananaApi.js`
- **Rate Limits**: 10 requests/minute, 100 requests/hour
- **Supported Formats**: JPEG, PNG, WebP, GIF
- **Max Images**: 3 per request for editing
- **Features**:
  - Generate images from text prompts
  - Edit existing images with prompts
  - Convert files/URLs to base64 for API consumption

### API Call Structure
```javascript
// Text-to-image generation
nanoBananaApi.generateImage(promptText)

// Image editing
nanoBananaApi.editImage([base64ImageData], promptText)

// File conversion
nanoBananaApi.fileToBase64(file)

// Prompt analysis
promptAnalyzer.analyzePrompt(promptText)
```

## Key Components

### Main App Component (`src/App.js`)
- Centralized state management for images and prompts
- Drag-and-drop file upload handling
- Integration with Gemini API service
- Undo/redo functionality for image history
- Simple prompt-to-action workflow
- Prompt library management with save/load functionality
- API key configuration interface

### Nano Banana API Service (`src/services/nanoBananaApi.js`)
- Google Gemini API client initialization and management
- Image generation from text prompts
- Image editing with multimodal inputs (images + text)
- Base64 conversion utilities for files and URLs
- Error handling and response processing

### Prompt Analyzer Service (`src/services/promptAnalyzer.js`)
- AI-powered prompt analysis using Google Gemini API
- Extracts structured metadata: Category, Subject, Action, Environment, Art Style, Lighting
- Provides fallback metadata generation for edge cases
- Integrates with existing nanoBananaApi service

### Minimal Backend (`server.js`)
- Serves React build files
- Settings API endpoints
- Minimal configuration (mainly for API key storage)
- No file upload or session management

## Configuration

### Environment Configuration: `.env`
Primary configuration method using environment variables:
- **GEMINI_API_KEY**: Google Gemini API key (required for image generation/editing)
- **NODE_ENV**: Environment setting (development/production)
- **PORT**: Server port (default: 3001)

### Legacy Configuration: `config/settings.json`
Additional configuration areas:
- **UI Theme**: Orange color scheme, layout dimensions
- **Development**: Logging, CORS settings

### API Key Management
- **Primary**: Environment variable `GEMINI_API_KEY` in `.env` file
- **Fallback**: Backend configuration endpoint for runtime key setting
- **Security**: `.env` file should be excluded from version control
- All image processing happens client-side for security

## Testing and Quality

### Running Tests
```bash
npm test                    # Run React test suite
npm test -- --coverage     # Run tests with coverage report
npm test -- --watchAll     # Run tests in watch mode
```

### Linting and Code Quality
The project uses Create React App's built-in ESLint configuration. Code should follow React best practices and JSDoc documentation standards.

### Docker Development Workflow
1. **Initial Setup**: Run `./start.sh` to build and start containers
2. **Development**: Use `./stlog.sh` to monitor real-time logs
3. **Testing Changes**: Rebuild with `docker compose up -d --build`
4. **Cleanup**: Run `./stop.sh` to stop containers

## UI Styling Standards

### Title Styling Requirements
- **Title Format**: "PixelPrompt" as one unified word
- **Color Scheme**: "Pixel" in black (#1d1d1f), "Prompt" in orange (#F19E39)
- **Font Consistency**: Both parts must use identical font properties (family, size, weight, letter-spacing)
- **Display**: Must appear inline as a single line, never wrapped
- **Implementation**: Use spans with forced inline styling and `!important` declarations to override any conflicting CSS

### Layout Architecture
- **Two-Panel Grid**: Left panel (prompt), right panel (image/upload)
- **Responsive Design**: Stacks vertically on mobile/tablet (max-width: 1024px)
- **Panel Styling**: White background, rounded corners, subtle shadows
- **Prompt Height**: Fixed to 5 lines using `calc(1.5em * 5 + 32px)`

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
- **Drop Zone**: `add_photo_alternate` icon in empty state
- **Loading**: `hourglass_empty` for generating state
- **Generated**: `flash_on` for ready state

### Icon Selection Guidelines
- Choose semantically appropriate icons from Material Symbols
- Maintain visual consistency across the application
- Use outlined style for consistency with theme
- Test icons at different display densities
- Ensure accessibility with proper alt text when needed

## Development Environment

### Dependencies
- **Frontend**: React 18, Create React App
- **Backend**: Express.js (minimal), CORS
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
- **Backend API**: Port 3001 (minimal endpoints)

## Security Considerations

- File type validation on frontend
- File size limitations to prevent abuse
- Input validation for all user data
- API key management for Google Gemini integration
- No file storage on server (client-side processing only)
- Secure base64 conversion and handling