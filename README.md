# Pixel Prompt

A React application designed for testing Google's Nano Banana with file upload and prompt functionality.

## Features

- **Drag & Drop File Upload**: Interactive drop zone supporting multiple image files
- **Timestamped Organization**: Files automatically organized in timestamped folders (YYYY-MM-DD HH:MM:SS:SSS in Zulu time)
- **Sequential File Naming**: Uploaded files renamed as image_1, image_2, etc.
- **Two-Panel Layout**: Upload zone on left, preview/generated content on right
- **Prompt Interface**: Text area for prompts below the upload zone
- **Orange Theme**: Appealing design with orange highlights
- **Docker Support**: Complete containerization for easy deployment
- **Settings Management**: Configurable via settings.json

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Ports 3001 available

### Running the Application

```bash
# Start the application
./start.sh

# View logs
./stlog.sh

# Stop the application
./stop.sh
```

The application will be available at `http://localhost:3001`

## Project Structure

```
pixelprompt/
├── src/
│   ├── components/
│   │   ├── FileDropZone.js     # Main upload component
│   │   └── FileDropZone.css    # Upload component styles
│   ├── App.js                  # Main application component
│   ├── App.css                 # Application styles
│   ├── index.js                # React entry point
│   └── index.css               # Global styles
├── config/
│   └── settings.json           # Application configuration
├── uploads/                    # File upload directory
├── public/
│   └── index.html              # HTML template
├── server.js                   # Express backend server
├── Dockerfile                  # Docker configuration
├── docker-compose.yml          # Docker Compose setup
└── Shell scripts:
    ├── start.sh                # Start application
    ├── stop.sh                 # Stop application
    └── stlog.sh                # View logs
```

## Configuration

The application can be configured via `config/settings.json`:

- Upload settings (file types, size limits)
- UI theme settings
- Security configurations
- Development options

## Development

### Local Development
```bash
# Install dependencies
npm install

# Start development server (requires backend running separately)
npm start

# Build for production
npm run build
```

### Backend Server
```bash
# Start backend server (port 3001)
node server.js
```

## File Upload Process

1. Files are uploaded via drag-and-drop or click-to-upload
2. Server creates timestamped folder in `uploads/` directory
3. Files are renamed sequentially (image_1.jpg, image_2.png, etc.)
4. Upload metadata is returned to the frontend
5. Files are displayed in the preview panel

## Docker Commands

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop and remove
docker-compose down

# Remove volumes (cleans upload data)
docker-compose down -v
```

## API Endpoints

- `POST /api/upload` - Upload multiple files
- `GET /api/settings` - Get application settings
- `POST /api/settings` - Update application settings

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - see LICENSE file for details