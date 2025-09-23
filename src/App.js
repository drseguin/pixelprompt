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

import React, { useState, useEffect, useCallback, useRef } from 'react';
import nanoBananaApi from './services/nanoBananaApi';
import './App.css';

function App() {
  const [promptText, setPromptText] = useState('');
  const [, setSettings] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageHistory, setImageHistory] = useState([]);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isApiReady, setIsApiReady] = useState(false);
  const fileInputRef = useRef(null);

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

          // Check if API key is already configured
          if (settingsData.nanoBanana?.apiKey) {
            setApiKeyInput(settingsData.nanoBanana.apiKey);
            initializeApi(settingsData.nanoBanana.apiKey);
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);


  /**
   * Handles prompt text changes
   * @param {Event} e - Input change event
   */
  const handlePromptChange = (e) => {
    setPromptText(e.target.value);
  };

  /**
   * Initialize Nano Banana API with API key
   * @param {string} apiKey - Google AI API key
   */
  const initializeApi = useCallback(async (apiKey) => {
    try {
      nanoBananaApi.initialize(apiKey);
      setIsApiReady(true);
      console.log('Nano Banana API ready');

      // Save the API key to backend settings for future use
      await saveApiKeyToSettings(apiKey);
    } catch (error) {
      console.error('Failed to initialize API:', error);
      setIsApiReady(false);
      alert('Failed to initialize Nano Banana API. Please check your API key.');
    }
  }, []);

  /**
   * Save API key to backend settings
   * @param {string} apiKey - The API key to save
   */
  const saveApiKeyToSettings = async (apiKey) => {
    try {
      // Get current settings
      const response = await fetch('/api/settings');
      let currentSettings = {};

      if (response.ok) {
        currentSettings = await response.json();
      }

      // Update the nanoBanana section with the new API key
      const updatedSettings = {
        ...currentSettings,
        nanoBanana: {
          ...currentSettings.nanoBanana,
          apiKey: apiKey
        }
      };

      // Save updated settings
      const saveResponse = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      });

      if (saveResponse.ok) {
        console.log('API key saved to settings');
        setSettings(updatedSettings);
      } else {
        console.warn('Failed to save API key to settings');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  };

  /**
   * Handle API key input and initialization
   * @param {Event} e - Input change event
   */
  const handleApiKeyChange = (e) => {
    setApiKeyInput(e.target.value);
  };

  /**
   * Save API key and initialize the service
   */
  const handleApiKeySubmit = async () => {
    if (apiKeyInput.trim()) {
      await initializeApi(apiKeyInput.trim());
    }
  };

  /**
   * Generate or edit image based on current state
   */
  const handleGenerate = async () => {
    if (!isApiReady) {
      alert('Please configure your API key first.');
      return;
    }

    if (!promptText.trim()) {
      alert('Please enter a prompt.');
      return;
    }

    setIsGenerating(true);

    try {
      let result;

      if (generatedImage) {
        // Modify the current generated image
        console.log('Modifying existing image with prompt');

        // Extract base64 data from the current generated image
        const base64Data = generatedImage.url.split(',')[1]; // Remove data URL prefix
        result = await nanoBananaApi.editImage([base64Data], promptText);
      } else {
        // Text-to-image generation
        console.log('Generating new image from text prompt');
        result = await nanoBananaApi.generateImage(promptText);
      }

      if (result) {
        // Save current image to history before updating
        if (generatedImage) {
          setImageHistory(prev => [...prev, generatedImage]);
        }

        // Build concatenated prompt history
        let fullPrompt;
        if (generatedImage && generatedImage.prompt) {
          // If modifying an existing image, append new prompt to previous prompt
          fullPrompt = `${generatedImage.prompt} → ${promptText}`;
        } else {
          // First generation
          fullPrompt = promptText;
        }

        // Create data URL for display
        const imageUrl = `data:${result.mimeType};base64,${result.imageData}`;
        setGeneratedImage({
          url: imageUrl,
          prompt: fullPrompt,
          timestamp: new Date().toISOString(),
          isModification: !!generatedImage
        });

        console.log('Image generated successfully');

        // Clear the prompt input after successful generation
        setPromptText('');
      }

    } catch (error) {
      console.error('Generation failed:', error);
      alert(`Failed to generate image: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Undo last image generation
   */
  const handleUndo = () => {
    if (imageHistory.length > 0) {
      const previousImage = imageHistory[imageHistory.length - 1];
      setGeneratedImage(previousImage);
      setImageHistory(prev => prev.slice(0, -1));
    } else {
      setGeneratedImage(null);
    }
  };

  /**
   * Clear generated image and start over
   */
  const handleStartOver = () => {
    setGeneratedImage(null);
    setImageHistory([]);
  };

  /**
   * Clear the prompt text area
   */
  const handleClearPrompt = () => {
    setPromptText('');
  };

  /**
   * Handle file upload and convert to generated image
   * @param {File} file - The uploaded image file
   */
  const handleFileUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }

    try {
      // Save current image to history if it exists
      if (generatedImage) {
        setImageHistory(prev => [...prev, generatedImage]);
      }

      // Convert file to base64 for display
      const imageData = await nanoBananaApi.fileToBase64(file);
      const imageUrl = `data:${imageData.mimeType};base64,${imageData.data}`;

      setGeneratedImage({
        url: imageUrl,
        prompt: `Uploaded: ${file.name}`,
        timestamp: new Date().toISOString(),
        isModification: false
      });

      console.log('File uploaded and set as generated image');
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file. Please try again.');
    }
  };

  /**
   * Handle drag and drop events
   */
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  /**
   * Download the generated image
   */
  const handleDownloadGenerated = () => {
    if (!generatedImage) return;

    // Create a filename based on the prompt and timestamp
    const timestamp = new Date(generatedImage.timestamp).toISOString().replace(/[:.]/g, '-');
    const promptSnippet = generatedImage.prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `generated_${promptSnippet}_${timestamp}.png`;

    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = generatedImage.url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          <span className="pixel-text">Pixel</span><span className="prompt-text">Prompt</span>
        </h1>
        <p className="app-subtitle">Spark Creativity, Pixel by Pixel</p>
      </header>

      <main className="app-main">
        {!isApiReady && (
          <div className="api-key-section">
            <label htmlFor="api-key" className="api-key-label">
              Google AI API Key:
            </label>
            <div className="api-key-input-group">
              <input
                id="api-key"
                type="password"
                className="api-key-input"
                value={apiKeyInput}
                onChange={handleApiKeyChange}
                placeholder="Enter your Google AI API key"
              />
              <button
                className="api-key-submit"
                onClick={handleApiKeySubmit}
                disabled={!apiKeyInput.trim()}
                type="button"
              >
                Set Key
              </button>
            </div>
            <p className="api-key-help">
              Get your API key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>
            </p>
          </div>
        )}

        <div className="app-layout">
          <div className="left-panel">
            <div className="prompt-section">
              <h2 className="section-title">Prompt</h2>
              <textarea
                className="prompt-textarea"
                value={promptText}
                onChange={handlePromptChange}
                placeholder={generatedImage
                  ? "Describe how to modify the current image..."
                  : "Describe what you want to generate..."}
                rows={5}
              />

              <div className="prompt-actions">
                <button
                  className="generate-button"
                  disabled={!promptText.trim() || !isApiReady || isGenerating}
                  onClick={handleGenerate}
                  type="button"
                >
                  {isGenerating
                    ? 'Generating...'
                    : generatedImage
                      ? 'Modify Image'
                      : 'Generate Image'
                  }
                </button>
                {promptText.trim() && (
                  <button
                    className="clear-prompt-button"
                    onClick={handleClearPrompt}
                    type="button"
                    title="Clear prompt"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="right-panel">
            <div className="image-section">
              {/* Image Display and Drop Zone */}
              {generatedImage ? (
              <div className="generated-image-container">
                <div className="generated-image-header">
                  <h3>Generated Image</h3>
                  <div className="image-actions">
                    <button
                      className="download-generated-button"
                      onClick={handleDownloadGenerated}
                      type="button"
                      title="Download generated image"
                    >
                      Download
                    </button>
                    {(imageHistory.length > 0 || generatedImage) && (
                      <button
                        className="undo-button"
                        onClick={handleUndo}
                        type="button"
                      >
                        Undo
                      </button>
                    )}
                    <button
                      className="start-over-button"
                      onClick={handleStartOver}
                      type="button"
                    >
                      Start Over
                    </button>
                  </div>
                </div>
                <div className="generated-image-wrapper">
                  <img
                    src={generatedImage.url}
                    alt="Generated content"
                    className="generated-image"
                  />
                </div>
                <div className="generated-image-info">
                  <div className="prompt-used">
                    <strong>Prompt{generatedImage.prompt.includes(' → ') ? ' History' : ''}:</strong>
                    <span className="prompt-text">"{generatedImage.prompt}"</span>
                  </div>
                  <p className="generation-time">
                    Generated: {new Date(generatedImage.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="drop-zone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onClick={handleClick}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <div className="drop-zone-content">
                  <div className="material-symbols-outlined drop-icon">
                    {isGenerating ? 'hourglass_empty' : 'add_photo_alternate'}
                  </div>
                  <h3>{isGenerating ? 'Generating...' : 'Drop Image or Generate'}</h3>
                  <p>
                    {isGenerating
                      ? 'Creating your image...'
                      : isApiReady
                        ? 'Drop an image to edit or enter a prompt to generate'
                        : 'Please configure your API key to get started'
                    }
                  </p>
                  {isGenerating && (
                    <div className="generating-spinner">
                      <div className="spinner"></div>
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>Pixel Prompt v1.0.0</p>
        <p>&copy; 2025 David Seguin Consulting Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;