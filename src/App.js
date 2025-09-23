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

import React, { useState, useEffect, useCallback } from 'react';
import FileDropZone from './components/FileDropZone';
import nanoBananaApi from './services/nanoBananaApi';
import './App.css';

function App() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [promptText, setPromptText] = useState('');
  const [, setSettings] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageHistory, setImageHistory] = useState([]);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isApiReady, setIsApiReady] = useState(false);

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

      // Priority: 1. Use current generated image, 2. Use uploaded files, 3. Generate from scratch
      if (generatedImage) {
        // Modify the current generated image
        console.log('Modifying current generated image with prompt');

        // Extract base64 data from the current generated image
        const base64Data = generatedImage.url.split(',')[1]; // Remove data URL prefix
        result = await nanoBananaApi.editImage([base64Data], promptText);

      } else if (uploadedFiles.length > 0) {
        // Image editing with the first uploaded file
        console.log('Editing first uploaded image with prompt');

        // Convert only the first uploaded file to base64
        const firstFile = uploadedFiles[0];
        try {
          const imageData = await nanoBananaApi.urlToBase64(`/uploads/${firstFile.uploadFolder}/${firstFile.filename}`);

          // Format the prompt to be more explicit about editing the provided image
          const editPrompt = `Modify this image: ${promptText}`;

          result = await nanoBananaApi.editImage([imageData], editPrompt);
        } catch (error) {
          console.error('Failed to convert first image:', error);
          throw new Error('Could not process the first uploaded image');
        }
      } else {
        // Text-to-image generation
        console.log('Generating image from text prompt');
        result = await nanoBananaApi.generateImage(promptText);
      }

      if (result) {
        // Save current image to history before updating
        if (generatedImage) {
          setImageHistory(prev => [...prev, generatedImage]);
        }

        // Create data URL for display
        const imageUrl = `data:${result.mimeType};base64,${result.imageData}`;
        setGeneratedImage({
          url: imageUrl,
          prompt: promptText,
          timestamp: new Date().toISOString(),
          isFromUpload: uploadedFiles.length > 0 && !generatedImage,
          isModification: !!generatedImage
        });

        console.log('Image generated successfully');
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
                      : (uploadedFiles.length > 0 ? 'Edit First Image' : 'Generate Image')
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
            </section>
          </div>

          {/* Right Panel - Generated Image Display */}
          <div className="right-panel">
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
                      ⬇️ Download
                    </button>
                    {(imageHistory.length > 0 || generatedImage) && (
                      <button
                        className="undo-button"
                        onClick={handleUndo}
                        type="button"
                      >
                        ↶ Undo
                      </button>
                    )}
                    <button
                      className="start-over-button"
                      onClick={handleStartOver}
                      type="button"
                    >
                      🔄 Start Over
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
                  <p className="prompt-used">Prompt: "{generatedImage.prompt}"</p>
                  <p className="generation-time">
                    Generated: {new Date(generatedImage.timestamp).toLocaleString()}
                  </p>
                  {generatedImage.isFromUpload && (
                    <p className="source-info">✨ Based on {uploadedFiles.length} uploaded image(s)</p>
                  )}
                  {generatedImage.isModification && (
                    <p className="source-info">🔄 Modified from previous image</p>
                  )}
                  <p className="next-prompt-info">💡 Next prompt will modify this image</p>
                </div>
              </div>
            ) : (
              <div className="empty-panel">
                <div className="empty-panel-content">
                  <div className="empty-icon">{isGenerating ? '⏳' : '⚡'}</div>
                  <h3>{isGenerating ? 'Generating...' : 'Ready for Magic'}</h3>
                  <p>
                    {isGenerating
                      ? 'Creating your image...'
                      : isApiReady
                        ? 'Generated content will appear here'
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
      </main>

      <footer className="app-footer">
        <p>Pixel Prompt v1.0.0 | Ready for Google Nano Banana Testing</p>
      </footer>
    </div>
  );
}

export default App;