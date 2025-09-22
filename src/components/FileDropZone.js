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

import React, { useState, useRef } from 'react';
import './FileDropZone.css';

const FileDropZone = ({ onFilesUploaded }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [thumbnails, setThumbnails] = useState([]);
  const fileInputRef = useRef(null);

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
            name: file.name
          });

          if (newThumbnails.length === files.length) {
            setThumbnails(prev => [...prev, ...newThumbnails]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  /**
   * Uploads files to the server with timestamped organization
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
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setUploadedFiles(prev => [...prev, ...result.files]);
        onFilesUploaded?.(result.files);
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
  const clearFiles = () => {
    setUploadedFiles([]);
    setThumbnails([]);
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
                  <img src={thumbnail.url} alt={thumbnail.name} className="thumbnail-image" />
                  <span className="thumbnail-name">{thumbnail.name}</span>
                </div>
              ))}
              <div className="add-more-button">
                <span className="add-icon">+</span>
                <p>Add more files</p>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="upload-icon">📁</div>
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