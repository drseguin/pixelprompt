# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **pixelprompt**, a React application for testing Google's Gemini 2.5 Flash Image API (formerly called "Nano Banana") with image generation and editing capabilities:
- Two-panel layout: prompt on left, image/upload on right
- Direct file-to-image conversion (no server uploads required)
- Google Gemini API integration for image generation and editing
- Simple prompt-based image modification workflow
- Netlify-compatible deployment with secure environment variable configuration
- Comprehensive prompt library management with save/load functionality
- Local development optimized for security and reliability

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
├── public/
│   └── Prompts.json            # Default prompt library data
├── uploads/                     # File upload directory (Docker persistent)
├── server.js                    # Express backend server (minimal)
├── package.json                 # Dependencies and scripts
├── docker-compose.yml           # Docker Compose configuration
├── Dockerfile                   # Docker container definition
├── netlify.toml                 # Netlify deployment configuration
├── .env                        # Environment variables (local development)
├── DEVELOPMENT_RULES.md        # Comprehensive development standards
├── NETLIFY_CLOUD.md            # Netlify deployment guide
└── Shell scripts: start.sh, stop.sh, stlog.sh, dev.sh
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

# Start React development server with secure environment variable handling
./start.sh

# Alternative: Start React development server manually (may have env var issues)
npm start

# Build for production
npm run build

# Run tests
npm test
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

**⚠️ CRITICAL**: This project enforces strict development standards defined in `DEVELOPMENT_RULES.md`. Key rules:

### File Documentation Standards
1. **File Headers**: All source files require comprehensive JSDoc headers:
   - File overview and architectural role
   - Author: David Seguin
   - Version, license, and security considerations
   - Dependencies and performance notes
   - Key features and integration points

2. **Function Documentation**: All exported functions and complex internal functions require JSDoc:
   - Parameter validation rules and types
   - Return types and error conditions
   - Usage examples and security implications
   - Performance considerations for real-time processing

### Configuration Management Rules
3. **Settings Changes**: When modifying `config/settings.json`:
   - Update backend server handling of new options
   - Update UI components that reference config values
   - Document security implications for new settings
   - Test both frontend and backend integration
   - Update help content in UI for user-facing changes

### Code Quality Requirements
4. **Pre-commit Checklist**: Before any commit, verify:
   - File headers updated for all modified files
   - Function documentation complete for new/modified functions
   - Help content updated for UI changes
   - Configuration consistency across all related files
   - Error handling documented with user guidance
   - Security review complete for sensitive changes

## Application Workflow

### Simplified Image Processing Flow
1. **No Image**: User enters prompt → Generate new image via Gemini API
2. **Existing Image**: User enters prompt → Modify existing image via Gemini API
3. **File Upload**: User drops/uploads file → Convert to generatedImage → Ready for modification

### Core State Management
- **`generatedImage`**: Single state object containing current working image
- **`imageHistory`**: Array of previous images for undo functionality
- **`promptText`**: Current prompt input
- **`savedPrompts`**: Array of saved prompts with comprehensive metadata
- **`promptMetadata`**: Structured metadata for current prompt (category, subject, action, environment, art style, lighting)
- **`isApiReady`**: Boolean indicating API key configuration status
- **`showSavePromptDialog`**: Controls prompt save dialog visibility
- **`showPromptIdeasDialog`**: Controls prompt library dialog visibility
- **`searchTerm`** and **`filterCategory`**: For prompt library search and filtering
- **`showBestPractices`**: Responsive display of best practices panel
- **No complex file/session management required**

## API Integration

### Google Gemini API Integration
The application integrates with Google's Gemini 2.5 Flash Image API (formerly "Nano Banana"):
- **Model**: `gemini-2.5-flash-image-preview`
- **Service Module**: `src/services/nanoBananaApi.js` (maintains legacy name for compatibility)
- **Rate Limits**: 10 requests/minute, 100 requests/hour (configurable in Google Cloud Console)
- **Supported Formats**: JPEG, PNG, WebP, GIF
- **Max Images**: 3 per request for editing operations
- **Features**:
  - Generate images from text prompts
  - Edit existing images with prompt modifications
  - Convert uploaded files to base64 for API consumption
  - Client-side processing with no server-side storage

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
- Drag-and-drop file upload handling with visual feedback
- Integration with Gemini API service (nanoBananaApi)
- Undo/redo functionality for image history management
- Simple prompt-to-action workflow with real-time processing
- Comprehensive prompt library management:
  - Save prompts with structured metadata
  - Search and filter saved prompts
  - Load existing prompts with one-click
  - Responsive best practices panel
- API key configuration interface with multiple deployment options
- Copy-to-clipboard functionality for generated images

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
- **REACT_APP_GEMINI_API_KEY**: Google Gemini API key for React app (required for image generation/editing)
- **NODE_ENV**: Environment setting (development/production)
- **PORT**: Server port (default: 3001)

**Important**: React Create App sometimes has issues loading `.env` files. Use `./dev.sh` for reliable local development.

### Legacy Configuration: `config/settings.json`
Additional configuration areas:
- **UI Theme**: Orange color scheme, layout dimensions
- **Development**: Logging, CORS settings

### API Key Management
- **Primary**: React environment variable `REACT_APP_GEMINI_API_KEY` (for deployment platforms like Netlify)
- **Local Development**: Environment variable `REACT_APP_GEMINI_API_KEY` in `.env` file (use `./dev.sh` for reliable loading)
- **Security**: `.env` file should be excluded from version control
- All image processing happens client-side for security
- **Netlify**: Requires `netlify.toml` configuration to bypass secrets scanning for client-side API keys

## Prompt Library System

### Comprehensive Prompt Management
The application includes a sophisticated prompt library system:

- **Default Prompts**: Pre-loaded from `public/Prompts.json`
- **Custom Prompts**: User-created prompts saved in localStorage
- **Structured Metadata**: Each prompt includes:
  - Name and category
  - Subject, action, environment
  - Art style and lighting preferences
  - Usage statistics and creation timestamp

### Prompt Library Features
- **Search and Filter**: Real-time search with category filtering
- **Responsive Design**: Best practices panel adapts to screen size
- **One-Click Loading**: Instant prompt application with metadata
- **Export/Import**: Browser-based prompt data management
- **Analytics**: Track prompt usage and effectiveness

### Integration Points
- **Prompt Analyzer Service**: AI-powered metadata extraction
- **Local Storage**: Persistent prompt library across sessions
- **Mobile Responsive**: Collapsible best practices for small screens

## Deployment Options

### Netlify Deployment (Recommended for Static Hosting)
- Uses `REACT_APP_GEMINI_API_KEY` environment variable
- Fully static deployment, no server required
- Requires `netlify.toml` configuration to handle secrets scanning for client-side API keys
- See `NETLIFY_CLOUD.md` for complete deployment guide

### Docker Deployment (Local/Server)
- Uses shell scripts: `./start.sh`, `./stop.sh`, `./stlog.sh`
- Includes minimal Express backend for development
- Suitable for local development and server deployment

## Testing and Quality

### Running Tests
```bash
npm test                    # Run React test suite
npm test -- --coverage     # Run tests with coverage report
npm test -- --watchAll     # Run tests in watch mode
```

### Linting and Code Quality
The project uses Create React App's built-in ESLint configuration with comprehensive TypeScript ESLint rules. Code should follow React best practices and JSDoc documentation standards.

```bash
# ESLint is integrated into the build process - no separate command needed
# Linting errors will appear during npm start and npm run build
# Fix linting issues by following the error messages in the console
```

### Deployment
```bash
# Build for production deployment
npm run build

# Serve build locally for testing
npx serve -s build
```

For Netlify deployment, see `NETLIFY_CLOUD.md` for detailed instructions.

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
- **Mobile-Optimized Button Layout**: Icons below prompt use flexbox with wrapping for mobile-friendly side-by-side arrangement

### Responsive CSS Patterns
The application uses a mobile-first responsive design with specific breakpoints:
- **Desktop (default)**: Secondary buttons share horizontal space with `flex: 1`
- **Tablet (768px)**: Secondary buttons use `flex-basis: calc(50% - 4px)` with `min-width: 120px`
- **Mobile (480px)**: All secondary buttons stack vertically with `flex-basis: 100%`
- **Generate button**: Always full width with `flex-basis: 100%` across all breakpoints

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
- **Action Buttons**: `content_copy` (copy), `restart_alt` (start over), `lightbulb` (prompt ideas), `expand_more`/`expand_less` (collapsible sections)

### Icon Selection Guidelines
- Choose semantically appropriate icons from Material Symbols
- Maintain visual consistency across the application
- Use outlined style for consistency with theme
- Test icons at different display densities
- Ensure accessibility with proper alt text when needed

## Development Environment

### Dependencies
- **Frontend**: React 18, Create React App
- **Backend**: Express.js (minimal), CORS, Multer
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

## Related Documentation

### Essential Reading for Development
- **`DEVELOPMENT_RULES.md`**: Comprehensive mandatory development standards and coding rules
- **`NETLIFY_CLOUD.md`**: Complete guide for deploying to Netlify with environment configuration
- **`README.md`**: User-facing project description and quick start guide
- **`public/Prompts.json`**: Default prompt library structure and examples

### Key Integration Files
- **`config/settings.json`**: Application configuration schema
- **`.env`**: Local environment variables template
- **`netlify.toml`**: Netlify deployment configuration with secrets scanning settings
- **`docker-compose.yml`**: Container orchestration with volume mounting
- **Shell scripts**: `start.sh`, `stop.sh`, `stlog.sh`, `dev.sh` for development workflow management

## Common Issues and Solutions

### Environment Variable Loading
- **Problem**: "API Key Not Configured" error when running locally
- **Solution**: Use `./start.sh` instead of `npm start` for reliable environment variable loading
- **Root Cause**: React Create App sometimes fails to load `.env` files properly
- **Enhanced Fix**: Improved `start.sh` script with better error messages and API key validation

### Netlify Deployment Issues
- **Problem**: Netlify build fails with "secrets scanning detected secrets in build"
- **Solution**: **SECURE APPROACH** - Remove all secrets scanning bypass configurations
- **Environment Variable**: Must be named `REACT_APP_GEMINI_API_KEY` (not `GEMINI_API`)
- **New Configuration**: Enhanced `netlify.toml` with security headers and CSP
- **Security**: Use domain restrictions in Google Cloud Console instead of bypassing security

### Docker Port Conflicts
- **Problem**: "Address already in use" when starting Docker containers
- **Solution**: `./start.sh` automatically detects and restarts existing containers
- **Manual**: Use `docker compose down` then `./start.sh`

### API Key Security Best Practices
- **Client-Side Exposure**: Google Gemini API keys are designed for client-side use
- **Domain Restrictions**: Configure domain allowlists in Google Cloud Console
- **Environment Detection**: Application automatically detects deployment environment
- **User-Friendly Errors**: Context-aware setup instructions for different environments

**Note**: Always consult `DEVELOPMENT_RULES.md` before making code changes - it contains mandatory standards that override default practices.