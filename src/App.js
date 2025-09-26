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

import React, { useState, useEffect, useRef } from 'react';
import nanoBananaApi from './services/nanoBananaApi';
import './App.css';

function App() {
  const [promptText, setPromptText] = useState('');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageHistory, setImageHistory] = useState([]);
  const [isApiReady, setIsApiReady] = useState(false);
  const fileInputRef = useRef(null);

  // Prompt library states
  const [showPromptIdeasDialog, setShowPromptIdeasDialog] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showBestPractices, setShowBestPractices] = useState(() => {
    // Check if screen is large enough to show best practices by default
    return window.innerWidth > 768;
  });

  /**
   * Initialize Nano Banana API with API key
   * @param {string} apiKey - Google AI API key
   */
  const initializeApi = (apiKey) => {
    try {
      nanoBananaApi.initialize(apiKey);
      setIsApiReady(true);
      console.log('Nano Banana API ready');
    } catch (error) {
      console.error('Failed to initialize API:', error);
      setIsApiReady(false);
      console.error('Failed to initialize Nano Banana API. Please check your API key configuration.');
    }
  };

  /**
   * Initialize API with environment variable
   */
  useEffect(() => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (apiKey) {
      initializeApi(apiKey);
    } else {
      console.error('No API key found. Please set REACT_APP_GEMINI_API_KEY environment variable.');
      setIsApiReady(false);
    }
  }, []); // Empty dependency array since we only want this to run once on mount

  /**
   * Handles prompt text changes
   * @param {Event} e - Input change event
   */
  const handlePromptChange = (e) => {
    setPromptText(e.target.value);
  };


  /**
   * Generate or edit image based on current state
   */
  const handleGenerate = async () => {
    if (!isApiReady) {
      alert('API key not configured. Please set REACT_APP_GEMINI_API_KEY environment variable.');
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
   * Toggle best practices section visibility
   */
  const toggleBestPractices = () => {
    setShowBestPractices(!showBestPractices);
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
   * Copy the current prompt text to clipboard
   */
  const handleCopyPrompt = async () => {
    if (!promptText.trim()) return;

    try {
      await navigator.clipboard.writeText(promptText);
      console.log('Prompt copied to clipboard');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = promptText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      console.log('Prompt copied to clipboard (fallback)');
    }
  };

  /**
   * Load saved prompts from backend
   */
  const loadSavedPrompts = async () => {
    try {
      const response = await fetch('/Prompts.json');
      if (response.ok) {
        const prompts = await response.json();
        setSavedPrompts(prompts);
      }
    } catch (error) {
      console.error('Failed to load saved prompts:', error);
      setSavedPrompts([]); // Set empty array as fallback
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

  // Handle screen resize to update best practices visibility
  useEffect(() => {
    const handleResize = () => {
      // Only update if currently collapsed on small screen or expanded on large screen
      // This prevents overriding user's manual toggle
      const isLargeScreen = window.innerWidth > 768;

      // Only auto-adjust if the current state matches what we'd expect for the previous screen size
      if (!showBestPractices && isLargeScreen) {
        // Screen became large and practices are collapsed - expand them
        setShowBestPractices(true);
      } else if (showBestPractices && !isLargeScreen) {
        // Screen became small and practices are expanded - collapse them
        setShowBestPractices(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showBestPractices]);


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
            <div className="api-key-error">
              <h3>API Key Not Configured</h3>
              <p>Please set the <code>REACT_APP_GEMINI_API_KEY</code> environment variable.</p>
              <p>
                Get your API key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>
              </p>
            </div>
          </div>
        )}

        <div className="app-layout">
          <div className="left-panel">
            <div className="prompt-section">
              <h2 className="section-title">Prompt</h2>
              <div className="prompt-textarea-container">
                <textarea
                  className="prompt-textarea"
                  value={promptText}
                  onChange={handlePromptChange}
                  placeholder={generatedImage
                    ? "Describe how to modify the current image..."
                    : "Describe what you want to generate..."}
                  rows={5}
                />
                {promptText.trim() && (
                  <button
                    className="copy-prompt-text-button"
                    onClick={handleCopyPrompt}
                    type="button"
                    title="Copy prompt to clipboard"
                  >
                    <span className="material-symbols-outlined">content_copy</span>
                  </button>
                )}
              </div>

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
                {/* Start Over Button - appears when image is generated */}
                {generatedImage && (
                  <button
                    className="start-over-button-inline"
                    onClick={handleStartOver}
                    type="button"
                  >
                    <span className="material-symbols-outlined">restart_alt</span>
                    Start Over
                  </button>
                )}
                <button
                  className="prompt-ideas-button"
                  onClick={handleShowPromptIdeas}
                  type="button"
                  title="Browse saved prompt ideas"
                >
                  <span className="material-symbols-outlined">lightbulb</span>
                  Prompt Ideas
                </button>
              </div>

              {/* Best Practices Section */}
              <div className="best-practices-section">
                <div className="best-practices-header" onClick={toggleBestPractices}>
                  <h3 className="best-practices-title">Best Practices for Better Images</h3>
                  <button
                    className="best-practices-toggle"
                    type="button"
                    title={showBestPractices ? "Hide best practices" : "Show best practices"}
                  >
                    <span className="material-symbols-outlined">
                      {showBestPractices ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                </div>

                {showBestPractices && (
                  <div className="best-practices-content">
                    <p className="best-practices-subtitle">Include these elements in your prompt:</p>

                    <div className="best-practices-list">
                      <div className="practice-item">
                        <span className="practice-label">Subject</span>
                        <span className="practice-example">- A young woman with freckles</span>
                      </div>
                      <div className="practice-item">
                        <span className="practice-label">Action</span>
                        <span className="practice-example">- smiling thoughtfully, sitting on a sunlit window seat</span>
                      </div>
                      <div className="practice-item">
                        <span className="practice-label">Environment</span>
                        <span className="practice-example">- in a cozy cafe</span>
                      </div>
                      <div className="practice-item">
                        <span className="practice-label">Art Style</span>
                        <span className="practice-example">- shot on a Canon 5D Mark IV Camera</span>
                      </div>
                      <div className="practice-item">
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
                      </div>
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
                </div>
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
                    <p>No prompt ideas available.</p>
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