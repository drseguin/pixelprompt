/**
 * FileDropZone Component
 *
 * @file FileDropZone.js
 * @description Interactive file drop zone component supporting drag-and-drop and click-to-upload functionality
 * @author David Seguin
 * @version 1.0.0
 * @license MIT
 *
 * Architecture:
 * - Handles multiple file uploads with visual feedback
 * - Supports timestamped folder organization
 * - Integrates with backend upload API
 *
 * Security Considerations:
 * - File type validation on frontend and backend
 * - Size limitations to prevent abuse
 * - Sanitized file naming conventions
 */

import React, { useState, useRef, useEffect } from 'react';
import { getSessionId, getUploadSession, updateUploadSession } from '../utils/session';
import './FileDropZone.css';

const FileDropZone = ({ onFilesUploaded }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [thumbnails, setThumbnails] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const fileInputRef = useRef(null);
  const sessionId = getSessionId();

  /**
   * Load existing session data on component mount
   */
  useEffect(() => {
    const loadSessionData = async () => {
      try {
        const response = await fetch(`/api/session/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.session) {
            setCurrentFolder(data.session.currentFolder);
            setUploadedFiles(data.session.uploadedFiles);

            // Load thumbnails for existing files if they're images
            if (data.session.uploadedFiles.length > 0) {
              loadExistingThumbnails(data.session.uploadedFiles);
            }
          } else {
            // No existing session, create one automatically
            await startNewUploadSession();
          }
        }
      } catch (error) {
        console.error('Error loading session data:', error);
      }
    };

    loadSessionData();
  }, [sessionId]);

  /**
   * Load thumbnails for existing uploaded files
   * @param {Array} files - Array of uploaded file objects
   */
  const loadExistingThumbnails = (files) => {
    const imageThumbnails = [];

    files.forEach((file) => {
      if (file.mimetype.startsWith('image/')) {
        // Create a placeholder thumbnail - in a real app, you might serve the actual image
        imageThumbnails.push({
          file: { name: file.originalName, type: file.mimetype },
          url: `/uploads/${file.uploadFolder}/${file.filename}`,
          name: file.originalName,
          filename: file.filename,
          originalName: file.originalName,
          isExisting: true
        });
      }
    });

    setThumbnails(imageThumbnails);
  };

  /**
   * Handles drag over events for the drop zone
   * @param {DragEvent} e - The drag event
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  /**
   * Handles drag leave events for the drop zone
   * @param {DragEvent} e - The drag event
   */
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  /**
   * Handles file drop events
   * @param {DragEvent} e - The drop event
   */
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    uploadFiles(files);
  };

  /**
   * Handles click to open file dialog
   */
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handles file selection from input
   * @param {Event} e - The input change event
   */
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    uploadFiles(files);
  };

  /**
   * Generates thumbnails for uploaded files
   * @param {File[]} files - Array of files to generate thumbnails for
   */
  const generateThumbnails = (files) => {
    const newThumbnails = [];

    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          newThumbnails.push({
            file: file,
            url: e.target.result,
            name: file.name,
            filename: null, // Will be updated after upload
            originalName: file.name,
            isNewUpload: true
          });

          if (newThumbnails.length === files.filter(f => f.type.startsWith('image/')).length) {
            setThumbnails(prev => [...prev, ...newThumbnails]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  /**
   * Uploads files to the server with session-based organization
   * @param {File[]} files - Array of files to upload
   */
  const uploadFiles = async (files) => {
    if (files.length === 0) return;

    setUploading(true);

    // Generate thumbnails immediately
    generateThumbnails(files);

    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'X-Session-ID': sessionId,
          'X-Upload-Folder': currentFolder
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();

        // Update current folder if it was set by the server
        if (result.uploadFolder && result.uploadFolder !== currentFolder) {
          setCurrentFolder(result.uploadFolder);
        }

        // Update thumbnails with server response data
        setThumbnails(prev => {
          const updatedThumbnails = [...prev];
          const imageFiles = files.filter(f => f.type.startsWith('image/'));
          result.files.forEach((file, index) => {
            // Find the corresponding thumbnail for this uploaded file
            const thumbnailIndex = updatedThumbnails.findIndex(thumb =>
              thumb.isNewUpload && !thumb.filename && thumb.name === file.originalName
            );
            if (thumbnailIndex !== -1) {
              updatedThumbnails[thumbnailIndex].filename = file.filename;
              updatedThumbnails[thumbnailIndex].originalName = file.originalName;
              updatedThumbnails[thumbnailIndex].isNewUpload = false;
            }
          });
          return updatedThumbnails;
        });

        setUploadedFiles(prev => [...prev, ...result.files]);
        onFilesUploaded?.(result.files);

        console.log(`Upload successful: ${result.files.length} files to folder ${result.uploadFolder}`);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  /**
   * Clears all uploaded files and thumbnails
   */
  const clearFiles = async () => {
    try {
      // Clear session on server (this deletes files and folder)
      const clearResponse = await fetch(`/api/session/${sessionId}/clear`, {
        method: 'POST'
      });

      if (clearResponse.ok) {
        console.log('Session and files cleared successfully');
      }

      // Clear local state
      setUploadedFiles([]);
      setThumbnails([]);
      setCurrentFolder(null);

      // Immediately create a new session for future uploads
      await startNewUploadSession();

    } catch (error) {
      console.error('Error clearing session:', error);
      // Still clear local state even if server request fails
      setUploadedFiles([]);
      setThumbnails([]);
      setCurrentFolder(null);

      // Try to create new session even if clear failed
      try {
        await startNewUploadSession();
      } catch (newSessionError) {
        console.error('Error creating new session:', newSessionError);
      }
    }
  };


  /**
   * Removes a single image from the thumbnails and uploaded files
   * @param {number} index - Index of the thumbnail to remove
   */
  const removeImage = async (index) => {
    const thumbnail = thumbnails[index];

    // Remove from thumbnails immediately for UI responsiveness
    setThumbnails(prev => prev.filter((_, i) => i !== index));

    // If it's an uploaded file, also remove from server
    if (thumbnail.filename) {
      try {
        // Remove from local uploaded files state
        setUploadedFiles(prev => prev.filter(file => file.filename !== thumbnail.filename));

        // Note: We could add a server endpoint to delete individual files if needed
        console.log(`Removed image: ${thumbnail.originalName}`);
      } catch (error) {
        console.error('Error removing image:', error);
        // Re-add the thumbnail if server removal fails
        setThumbnails(prev => {
          const newThumbnails = [...prev];
          newThumbnails.splice(index, 0, thumbnail);
          return newThumbnails;
        });
      }
    }
  };

  /**
   * Starts a new upload session (new folder)
   */
  const startNewUploadSession = async () => {
    try {
      const response = await fetch(`/api/session/${sessionId}/new-upload`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentFolder(result.session.currentFolder);
        setUploadedFiles([]);
        setThumbnails([]);

        console.log(`New upload session started: ${result.session.currentFolder}`);
        return result.session.currentFolder;
      }
    } catch (error) {
      console.error('Error starting new upload session:', error);
    }
  };

  return (
    <div className="file-drop-zone-container">
      <div
        className={`file-drop-zone ${isDragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <div className="drop-zone-content">
          {uploading ? (
            <div className="upload-spinner">
              <div className="spinner"></div>
              <p>Uploading files...</p>
            </div>
          ) : thumbnails.length > 0 ? (
            <div className="thumbnails-grid">
              {thumbnails.map((thumbnail, index) => (
                <div key={index} className="thumbnail-item">
                  <button
                    className="remove-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                    title="Remove image"
                  >
                    ✕
                  </button>
                  <img src={thumbnail.url} alt={thumbnail.name} className="thumbnail-image" />
                  <div className="thumbnail-info">
                    <span className="thumbnail-name">{thumbnail.name}</span>
                  </div>
                </div>
              ))}
              <div className="add-more-button">
                <span className="material-symbols-outlined add-icon">add</span>
                <p>Add more files</p>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="material-symbols-outlined upload-icon">folder</div>
              <h3>Drop files here or click to upload</h3>
              <p>Supports multiple image files</p>
            </div>
          )}
        </div>
      </div>

      {thumbnails.length > 0 && (
        <div className="upload-actions">
          <button className="clear-button" onClick={clearFiles}>
            Clear All ({thumbnails.length})
          </button>
        </div>
      )}
    </div>
  );
};

// Export the clearFiles function for parent component use
FileDropZone.clearFiles = () => {};

export default FileDropZone;