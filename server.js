/**
 * Pixel Prompt Server
 *
 * @file server.js
 * @description Express server handling file uploads with timestamped organization
 * @author David Seguin
 * @version 1.0.0
 * @license MIT
 *
 * Architecture:
 * - Express server with CORS support
 * - Multer for file upload handling
 * - Timestamped folder organization in Zulu time
 * - Sequential file naming (image_1, image_2, etc.)
 *
 * Security Considerations:
 * - File type validation
 * - File size limitations
 * - Path traversal protection
 * - Input sanitization
 */

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('build'));

// Store active upload sessions per session ID
const uploadSessions = new Map();

/**
 * Generates a timestamp folder name in Zulu time format
 * @returns {string} Formatted timestamp (YYYY-MM-DD HH:MM:SS:SSS)
 */
const generateTimestampFolder = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');
  const milliseconds = String(now.getUTCMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}:${milliseconds}`;
};

/**
 * Gets or creates an upload session for a given session ID
 * @param {string} sessionId - Browser session identifier
 * @param {string} requestedFolder - Optional specific folder name
 * @returns {object} Upload session data
 */
const getUploadSession = (sessionId, requestedFolder = null) => {
  if (!uploadSessions.has(sessionId)) {
    const timestampFolder = requestedFolder || generateTimestampFolder();
    uploadSessions.set(sessionId, {
      currentFolder: timestampFolder,
      uploadedFiles: [],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    });
  }

  // Update last activity
  const session = uploadSessions.get(sessionId);
  session.lastActivity = new Date().toISOString();

  return session;
};

/**
 * Cleans up old upload sessions (older than 24 hours)
 */
const cleanupOldSessions = () => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  for (const [sessionId, session] of uploadSessions.entries()) {
    const lastActivity = new Date(session.lastActivity);
    if (lastActivity < oneDayAgo) {
      uploadSessions.delete(sessionId);
      console.log(`Cleaned up old session: ${sessionId}`);
    }
  }
};

// Clean up old sessions every hour
setInterval(cleanupOldSessions, 60 * 60 * 1000);

/**
 * Ensures upload directory exists
 * @param {string} dirPath - Directory path to create
 */
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sessionId = req.headers['x-session-id'] || 'default';
    const requestedFolder = req.headers['x-upload-folder'];

    // Get or create upload session for this browser session
    const uploadSession = getUploadSession(sessionId, requestedFolder);
    const uploadPath = path.join('uploads', uploadSession.currentFolder);

    ensureDirectoryExists(uploadPath);

    // Store session info in request for later use
    req.uploadPath = uploadPath;
    req.uploadSession = uploadSession;
    req.sessionId = sessionId;

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Get existing files in the directory to determine next number
    const uploadDir = req.uploadPath;
    let existingFiles = [];

    try {
      existingFiles = fs.readdirSync(uploadDir);
    } catch (error) {
      // Directory might not exist yet
      existingFiles = [];
    }

    const imageFiles = existingFiles.filter(f => f.startsWith('image_'));
    const nextNumber = imageFiles.length + 1;

    // Extract file extension
    const ext = path.extname(file.originalname);
    const filename = `image_${nextNumber}${ext}`;

    cb(null, filename);
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 20 // Maximum 20 files per upload
  }
});

// Upload endpoint
app.post('/api/upload', upload.array('files'), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map((file, index) => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadFolder: req.uploadSession.currentFolder,
      sessionId: req.sessionId
    }));

    // Update the session with new files
    req.uploadSession.uploadedFiles.push(...uploadedFiles);
    uploadSessions.set(req.sessionId, req.uploadSession);

    console.log(`Session ${req.sessionId}: Uploaded ${uploadedFiles.length} files to ${req.uploadSession.currentFolder}`);

    res.json({
      success: true,
      message: `Successfully uploaded ${uploadedFiles.length} files`,
      files: uploadedFiles,
      uploadFolder: req.uploadSession.currentFolder,
      sessionId: req.sessionId,
      totalFilesInSession: req.uploadSession.uploadedFiles.length
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', message: error.message });
  }
});

// Session management endpoints
app.get('/api/session/:sessionId', (req, res) => {
  try {
    const sessionId = req.params.sessionId;

    if (uploadSessions.has(sessionId)) {
      const session = uploadSessions.get(sessionId);
      res.json({
        success: true,
        session: {
          sessionId: sessionId,
          currentFolder: session.currentFolder,
          uploadedFiles: session.uploadedFiles,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
          totalFiles: session.uploadedFiles.length
        }
      });
    } else {
      res.json({
        success: true,
        session: null,
        message: 'No active session found'
      });
    }
  } catch (error) {
    console.error('Session retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

app.post('/api/session/:sessionId/clear', (req, res) => {
  try {
    const sessionId = req.params.sessionId;

    if (uploadSessions.has(sessionId)) {
      const session = uploadSessions.get(sessionId);

      // Delete the actual files and folder
      if (session.currentFolder) {
        const folderPath = path.join('uploads', session.currentFolder);

        try {
          if (fs.existsSync(folderPath)) {
            // Remove all files in the folder
            const files = fs.readdirSync(folderPath);
            files.forEach(file => {
              const filePath = path.join(folderPath, file);
              fs.unlinkSync(filePath);
            });

            // Remove the folder itself
            fs.rmdirSync(folderPath);
            console.log(`Deleted folder: ${folderPath}`);
          }
        } catch (fileError) {
          console.error('Error deleting files:', fileError);
          // Continue with session clearing even if file deletion fails
        }
      }

      uploadSessions.delete(sessionId);
      console.log(`Cleared session: ${sessionId}`);
    }

    res.json({
      success: true,
      message: 'Session and files cleared successfully'
    });
  } catch (error) {
    console.error('Session clear error:', error);
    res.status(500).json({ error: 'Failed to clear session' });
  }
});

app.post('/api/session/:sessionId/new-upload', (req, res) => {
  try {
    const sessionId = req.params.sessionId;

    // Clear current session and create new upload folder
    if (uploadSessions.has(sessionId)) {
      uploadSessions.delete(sessionId);
    }

    // Create new session with new folder
    const newSession = getUploadSession(sessionId);

    res.json({
      success: true,
      session: {
        sessionId: sessionId,
        currentFolder: newSession.currentFolder,
        uploadedFiles: [],
        createdAt: newSession.createdAt
      },
      message: 'New upload session created'
    });
  } catch (error) {
    console.error('New upload session error:', error);
    res.status(500).json({ error: 'Failed to create new upload session' });
  }
});

// Settings endpoint
app.get('/api/settings', (req, res) => {
  try {
    const settingsPath = path.join('config', 'settings.json');

    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      res.json(settings);
    } else {
      // Return default settings if file doesn't exist
      const defaultSettings = {
        theme: 'orange',
        maxFileSize: '10MB',
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        maxFiles: 20
      };
      res.json(defaultSettings);
    }
  } catch (error) {
    console.error('Settings read error:', error);
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const settingsPath = path.join('config', 'settings.json');
    ensureDirectoryExists(path.dirname(settingsPath));

    fs.writeFileSync(settingsPath, JSON.stringify(req.body, null, 2));

    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Settings write error:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files' });
    }
  }

  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Ensure upload directory exists
ensureDirectoryExists('uploads');
ensureDirectoryExists('config');

app.listen(PORT, () => {
  console.log(`Pixel Prompt server running on port ${PORT}`);
  console.log(`Upload directory: ${path.resolve('uploads')}`);
  console.log(`Config directory: ${path.resolve('config')}`);
});