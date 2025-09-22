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
    const timestampFolder = generateTimestampFolder();
    const uploadPath = path.join('uploads', timestampFolder);

    ensureDirectoryExists(uploadPath);

    // Store the upload path in request for later use
    req.uploadPath = uploadPath;
    req.timestampFolder = timestampFolder;

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Get existing files in the directory to determine next number
    const uploadDir = req.uploadPath;
    const existingFiles = fs.readdirSync(uploadDir);
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
      uploadFolder: req.timestampFolder
    }));

    console.log(`Uploaded ${uploadedFiles.length} files to ${req.timestampFolder}`);

    res.json({
      success: true,
      message: `Successfully uploaded ${uploadedFiles.length} files`,
      files: uploadedFiles,
      uploadFolder: req.timestampFolder
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', message: error.message });
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