/**
 * Pixel Prompt Main Application
 *
 * @file App.js
 * @description Main React application component with layout and state management
 * @author David Seguin
 * @version 1.0.0
 * @license MIT
 *
 * Architecture:
 * - Two-panel layout: file upload (left) and preview (right)
 * - Prompt text area below upload zone
 * - Settings integration with backend API
 * - Orange highlight theme implementation
 *
 * Security Considerations:
 * - Input validation for prompt text
 * - Secure file handling
 * - XSS prevention measures
 */

import React, { useState, useEffect } from 'react';
import FileDropZone from './components/FileDropZone';
import './App.css';

function App() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [promptText, setPromptText] = useState('');
  const [settings, setSettings] = useState(null);

  /**
   * Loads application settings from backend
   */
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const settingsData = await response.json();
          setSettings(settingsData);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  /**
   * Handles successful file uploads
   * @param {Array} files - Array of uploaded file objects
   */
  const handleFilesUploaded = (files) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };

  /**
   * Handles prompt text changes
   * @param {Event} e - Input change event
   */
  const handlePromptChange = (e) => {
    setPromptText(e.target.value);
  };

  /**
   * Clears all uploaded files
   */
  const clearFiles = () => {
    setUploadedFiles([]);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          <span className="pixel-text">Pixel</span>
          <span className="prompt-text">Prompt</span>
        </h1>
        <p className="app-subtitle">Google Nano Banana Testing Interface</p>
      </header>

      <main className="app-main">
        <div className="app-layout">
          {/* Left Panel - File Upload and Prompt */}
          <div className="left-panel">
            <section className="upload-section">
              <h2 className="section-title">Upload Images</h2>
              <FileDropZone onFilesUploaded={handleFilesUploaded} />
            </section>

            <section className="prompt-section">
              <h2 className="section-title">Prompt</h2>
              <textarea
                className="prompt-textarea"
                value={promptText}
                onChange={handlePromptChange}
                placeholder="Describe what you want to generate or edit..."
                rows={3}
              />
              <div className="prompt-actions">
                <button
                  className="generate-button"
                  disabled={!promptText.trim()}
                  type="button"
                >
                  Generate
                </button>
              </div>
            </section>
          </div>

          {/* Right Panel - Reserved for future use */}
          <div className="right-panel">
            <div className="empty-panel">
              <div className="empty-panel-content">
                <div className="empty-icon">⚡</div>
                <h3>Ready for Magic</h3>
                <p>Generated content will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>Pixel Prompt v1.0.0 | Ready for Google Nano Banana Testing</p>
      </footer>
    </div>
  );
}

export default App;