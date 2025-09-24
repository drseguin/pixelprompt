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
import promptAnalyzer from './services/promptAnalyzer';
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

  // Prompt library states
  const [showSavePromptDialog, setShowSavePromptDialog] = useState(false);
  const [showPromptIdeasDialog, setShowPromptIdeasDialog] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [promptMetadata, setPromptMetadata] = useState({
    name: '',
    category: '',
    subject: '',
    action: '',
    environment: '',
    artStyle: '',
    lighting: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

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

      // Save the API key to .env file for future use
      await saveApiKeyToSettings(apiKey);
    } catch (error) {
      console.error('Failed to initialize API:', error);
      setIsApiReady(false);
      alert('Failed to initialize Nano Banana API. Please check your API key.');
    }
  }, []);

  /**
   * Save API key to .env file
   * @param {string} apiKey - The API key to save
   */
  const saveApiKeyToSettings = async (apiKey) => {
    try {
      // Save API key to .env file via new endpoint
      const response = await fetch('/api/env/apikey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });

      if (response.ok) {
        console.log('API key saved to .env file');

        // Update settings state to reflect the change (nanoBanana.apiKey will be populated from env)
        const settingsResponse = await fetch('/api/settings');
        if (settingsResponse.ok) {
          const updatedSettings = await settingsResponse.json();
          setSettings(updatedSettings);
        }
      } else {
        const errorData = await response.json();
        console.warn('Failed to save API key:', errorData.error);
        throw new Error(errorData.error || 'Failed to save API key');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      throw error;
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

  /**
   * Copy the example prompt to clipboard
   */
  const handleCopyExamplePrompt = async () => {
    const examplePrompt = "A young woman with freckles smiling thoughtfully, sitting on a sunlit window seat in a cozy cafe, shot on a Canon 5D Mark IV Camera, soft natural light, warm and inviting";

    try {
      await navigator.clipboard.writeText(examplePrompt);
      // Show temporary feedback (could add a toast notification here)
      console.log('Example prompt copied to clipboard');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = examplePrompt;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      console.log('Example prompt copied to clipboard (fallback)');
    }
  };

  /**
   * Load saved prompts from backend
   */
  const loadSavedPrompts = async () => {
    try {
      const response = await fetch('/api/prompts');
      if (response.ok) {
        const prompts = await response.json();
        setSavedPrompts(prompts);
      }
    } catch (error) {
      console.error('Failed to load saved prompts:', error);
    }
  };

  /**
   * Save current prompt to library
   */
  const handleSavePrompt = async () => {
    if (!generatedImage || !generatedImage.prompt) {
      alert('No prompt to save. Generate an image first.');
      return;
    }

    try {
      // Analyze the prompt to generate metadata
      const analyzedMetadata = await promptAnalyzer.analyzePrompt(generatedImage.prompt);

      // Set metadata and show dialog
      setPromptMetadata({
        name: `Generated ${new Date().toLocaleDateString()}`,
        ...analyzedMetadata
      });
      setShowSavePromptDialog(true);
    } catch (error) {
      console.error('Failed to analyze prompt:', error);
      // Set fallback metadata
      setPromptMetadata({
        name: `Generated ${new Date().toLocaleDateString()}`,
        category: 'Other',
        subject: 'General Image',
        action: 'Static Pose',
        environment: 'Neutral Background',
        artStyle: 'Digital Photography',
        lighting: 'Natural Light'
      });
      setShowSavePromptDialog(true);
    }
  };

  /**
   * Save prompt with metadata to backend
   */
  const handleSavePromptSubmit = async () => {
    try {
      const promptData = {
        id: Date.now().toString(),
        name: promptMetadata.name,
        prompt: generatedImage.prompt,
        category: promptMetadata.category,
        subject: promptMetadata.subject,
        action: promptMetadata.action,
        environment: promptMetadata.environment,
        artStyle: promptMetadata.artStyle,
        lighting: promptMetadata.lighting,
        createdAt: new Date().toISOString()
      };

      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptData),
      });

      if (response.ok) {
        console.log('Prompt saved successfully');
        setShowSavePromptDialog(false);
        loadSavedPrompts(); // Refresh the list
      } else {
        throw new Error('Failed to save prompt');
      }
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert('Failed to save prompt. Please try again.');
    }
  };

  /**
   * Load prompt ideas dialog
   */
  const handleShowPromptIdeas = async () => {
    await loadSavedPrompts();
    setShowPromptIdeasDialog(true);
  };

  /**
   * Use selected prompt from library
   */
  const handleUsePrompt = (prompt) => {
    setPromptText(prompt.prompt);
    setShowPromptIdeasDialog(false);
  };

  /**
   * Filter prompts based on search and category
   */
  const getFilteredPrompts = () => {
    return savedPrompts.filter(prompt => {
      const matchesSearch = !searchTerm ||
        prompt.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.subject.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = filterCategory === 'all' || prompt.category === filterCategory;

      return matchesSearch && matchesCategory;
    });
  };

  // Load saved prompts on mount
  useEffect(() => {
    loadSavedPrompts();
  }, []);


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
                  className="prompt-ideas-button"
                  onClick={handleShowPromptIdeas}
                  type="button"
                  title="Browse saved prompt ideas"
                >
                  <span className="material-symbols-outlined">lightbulb</span>
                  Prompt Ideas
                </button>
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

              {/* Best Practices Section */}
              <div className="best-practices-section">
                <h3 className="best-practices-title">Best Practices for Better Images</h3>
                <p className="best-practices-subtitle">Include these elements in your prompt:</p>

                <div className="best-practices-list">
                  <div className="practice-item">
                    <span className="practice-number">1)</span>
                    <span className="practice-label">Subject</span>
                    <span className="practice-example">- A young woman with freckles</span>
                  </div>
                  <div className="practice-item">
                    <span className="practice-number">2)</span>
                    <span className="practice-label">Action</span>
                    <span className="practice-example">- smiling thoughtfully, sitting on a sunlit window seat</span>
                  </div>
                  <div className="practice-item">
                    <span className="practice-number">3)</span>
                    <span className="practice-label">Environment</span>
                    <span className="practice-example">- in a cozy cafe</span>
                  </div>
                  <div className="practice-item">
                    <span className="practice-number">4)</span>
                    <span className="practice-label">Art Style</span>
                    <span className="practice-example">- shot on a Canon 5D Mark IV Camera</span>
                  </div>
                  <div className="practice-item">
                    <span className="practice-number">5)</span>
                    <span className="practice-label">Lighting</span>
                    <span className="practice-example">- soft natural light, warm and inviting</span>
                  </div>
                </div>

                <div className="example-prompt-section">
                  <h4 className="example-prompt-title">Complete Example:</h4>
                  <div className="example-prompt-container">
                    <p className="example-prompt-text">
                      "A young woman with freckles smiling thoughtfully, sitting on a sunlit window seat in a cozy cafe, shot on a Canon 5D Mark IV Camera, soft natural light, warm and inviting"
                    </p>
                    <button
                      className="copy-prompt-button"
                      onClick={handleCopyExamplePrompt}
                      type="button"
                      title="Copy example prompt"
                    >
                      <span className="material-symbols-outlined">content_copy</span>
                      Copy
                    </button>
                  </div>
                </div>
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
                  <div className="prompt-actions-bottom">
                    <button
                      className="save-prompt-button"
                      onClick={handleSavePrompt}
                      type="button"
                      title="Save this prompt to your library"
                    >
                      <span className="material-symbols-outlined">bookmark_add</span>
                      Save Prompt
                    </button>
                  </div>
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

      {/* Save Prompt Dialog */}
      {showSavePromptDialog && (
        <div className="dialog-overlay" onClick={() => setShowSavePromptDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>Save Prompt to Library</h3>
              <button
                className="dialog-close"
                onClick={() => setShowSavePromptDialog(false)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="dialog-content">
              <p className="dialog-subtitle">AI has analyzed your prompt and suggested metadata. Feel free to edit:</p>

              <div className="form-group">
                <label htmlFor="prompt-name">Prompt Name:</label>
                <input
                  id="prompt-name"
                  type="text"
                  value={promptMetadata.name}
                  onChange={(e) => setPromptMetadata({...promptMetadata, name: e.target.value})}
                  placeholder="Enter a name for this prompt"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="prompt-category">Category:</label>
                  <select
                    id="prompt-category"
                    value={promptMetadata.category}
                    onChange={(e) => setPromptMetadata({...promptMetadata, category: e.target.value})}
                  >
                    <option value="Portrait">Portrait</option>
                    <option value="Landscape">Landscape</option>
                    <option value="Abstract">Abstract</option>
                    <option value="Architecture">Architecture</option>
                    <option value="Animal">Animal</option>
                    <option value="Product">Product</option>
                    <option value="Fantasy">Fantasy</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Food">Food</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="prompt-subject">Subject:</label>
                  <input
                    id="prompt-subject"
                    type="text"
                    value={promptMetadata.subject}
                    onChange={(e) => setPromptMetadata({...promptMetadata, subject: e.target.value})}
                    placeholder="Main subject"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="prompt-action">Action:</label>
                  <input
                    id="prompt-action"
                    type="text"
                    value={promptMetadata.action}
                    onChange={(e) => setPromptMetadata({...promptMetadata, action: e.target.value})}
                    placeholder="Action or pose"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="prompt-environment">Environment:</label>
                  <input
                    id="prompt-environment"
                    type="text"
                    value={promptMetadata.environment}
                    onChange={(e) => setPromptMetadata({...promptMetadata, environment: e.target.value})}
                    placeholder="Setting or location"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="prompt-artstyle">Art Style:</label>
                  <input
                    id="prompt-artstyle"
                    type="text"
                    value={promptMetadata.artStyle}
                    onChange={(e) => setPromptMetadata({...promptMetadata, artStyle: e.target.value})}
                    placeholder="Photography or art style"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="prompt-lighting">Lighting:</label>
                  <input
                    id="prompt-lighting"
                    type="text"
                    value={promptMetadata.lighting}
                    onChange={(e) => setPromptMetadata({...promptMetadata, lighting: e.target.value})}
                    placeholder="Lighting conditions"
                  />
                </div>
              </div>

              <div className="prompt-preview">
                <strong>Original Prompt:</strong>
                <p>"{generatedImage?.prompt}"</p>
              </div>
            </div>
            <div className="dialog-actions">
              <button
                className="dialog-button secondary"
                onClick={() => setShowSavePromptDialog(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="dialog-button primary"
                onClick={handleSavePromptSubmit}
                type="button"
                disabled={!promptMetadata.name.trim()}
              >
                Save Prompt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Ideas Dialog */}
      {showPromptIdeasDialog && (
        <div className="dialog-overlay" onClick={() => setShowPromptIdeasDialog(false)}>
          <div className="dialog large" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>Prompt Ideas Library</h3>
              <button
                className="dialog-close"
                onClick={() => setShowPromptIdeasDialog(false)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="dialog-content">
              <div className="prompt-filters">
                <div className="filter-row">
                  <div className="search-group">
                    <span className="material-symbols-outlined">search</span>
                    <input
                      type="text"
                      placeholder="Search prompts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="category-filter"
                  >
                    <option value="all">All Categories</option>
                    <option value="Portrait">Portrait</option>
                    <option value="Landscape">Landscape</option>
                    <option value="Abstract">Abstract</option>
                    <option value="Architecture">Architecture</option>
                    <option value="Animal">Animal</option>
                    <option value="Product">Product</option>
                    <option value="Fantasy">Fantasy</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Food">Food</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="prompts-grid">
                {getFilteredPrompts().length === 0 ? (
                  <div className="no-prompts">
                    <span className="material-symbols-outlined">bookmark_border</span>
                    <p>No saved prompts found.</p>
                    <p>Generate some images and save their prompts to build your library!</p>
                  </div>
                ) : (
                  getFilteredPrompts().map((prompt) => (
                    <div key={prompt.id} className="prompt-card">
                      <div className="prompt-card-header">
                        <h4>{prompt.name}</h4>
                        <span className="prompt-category">{prompt.category}</span>
                      </div>
                      <div className="prompt-card-body">
                        <p className="prompt-text">"{prompt.prompt}"</p>
                        <div className="prompt-metadata">
                          <div className="metadata-item">
                            <span className="metadata-label">Subject:</span>
                            <span>{prompt.subject}</span>
                          </div>
                          <div className="metadata-item">
                            <span className="metadata-label">Action:</span>
                            <span>{prompt.action}</span>
                          </div>
                          <div className="metadata-item">
                            <span className="metadata-label">Environment:</span>
                            <span>{prompt.environment}</span>
                          </div>
                          <div className="metadata-item">
                            <span className="metadata-label">Art Style:</span>
                            <span>{prompt.artStyle}</span>
                          </div>
                          <div className="metadata-item">
                            <span className="metadata-label">Lighting:</span>
                            <span>{prompt.lighting}</span>
                          </div>
                        </div>
                      </div>
                      <div className="prompt-card-actions">
                        <button
                          className="use-prompt-button"
                          onClick={() => handleUsePrompt(prompt)}
                          type="button"
                        >
                          <span className="material-symbols-outlined">play_arrow</span>
                          Use This Prompt
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;