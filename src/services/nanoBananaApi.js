/**
 * Nano Banana API Service
 *
 * @file nanoBananaApi.js
 * @description Service module for Google's Nano Banana (Gemini 2.5 Flash Image) API integration
 * @author David Seguin
 * @version 1.0.0
 * @license MIT
 *
 * Architecture:
 * - Handles image generation from text prompts
 * - Supports image editing with uploaded images
 * - Manages API authentication and requests
 * - Processes base64 image responses
 *
 * Dependencies:
 * - @google/genai: Google GenAI SDK for Nano Banana API
 *
 * Performance Notes:
 * - Responses cached locally for undo functionality
 * - Large base64 images handled efficiently
 * - Error handling with detailed feedback
 *
 * Security Considerations:
 * - API key handled securely
 * - Input validation for prompts and images
 * - Safe base64 decoding
 */

import { GoogleGenAI } from '@google/genai';

class NanoBananaApiService {
  constructor() {
    this.client = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the API client with provided API key
   * @param {string} apiKey - Google AI API key
   * @throws {Error} If API key is invalid or initialization fails
   */
  initialize(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('Valid API key required for Nano Banana API');
    }

    try {
      this.client = new GoogleGenAI({
        apiKey: apiKey
      });
      this.isInitialized = true;
      console.log('Nano Banana API initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Nano Banana API:', error);
      throw new Error('Failed to initialize Nano Banana API');
    }
  }

  /**
   * Check if the service is properly initialized
   * @returns {boolean} True if initialized, false otherwise
   */
  isReady() {
    return this.isInitialized && this.client !== null;
  }

  /**
   * Generate an image from a text prompt
   * @param {string} prompt - Text description for image generation
   * @returns {Promise<{imageData: string, mimeType: string}>} Generated image data
   * @throws {Error} If generation fails or service not initialized
   */
  async generateImage(prompt) {
    if (!this.isReady()) {
      throw new Error('Nano Banana API not initialized. Call initialize() first.');
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Valid prompt required for image generation');
    }

    try {
      console.log('Generating image with prompt:', prompt);

      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: prompt.trim(),
      });

      // Extract image data from response
      const imageData = this.extractImageFromResponse(response);

      if (!imageData) {
        throw new Error('No image data received from API');
      }

      console.log('Image generated successfully');
      return imageData;

    } catch (error) {
      console.error('Image generation failed:', error);
      throw new Error(`Image generation failed: ${error.message}`);
    }
  }

  /**
   * Edit an existing image with a text prompt
   * @param {Array<string|{data: string, mimeType: string}>} images - Array of input images as base64 strings or objects
   * @param {string} prompt - Text description for image editing
   * @returns {Promise<{imageData: string, mimeType: string}>} Edited image data
   * @throws {Error} If editing fails or invalid inputs
   */
  async editImage(images, prompt) {
    if (!this.isReady()) {
      throw new Error('Nano Banana API not initialized. Call initialize() first.');
    }

    if (!Array.isArray(images) || images.length === 0) {
      throw new Error('At least one image required for editing');
    }

    if (images.length > 3) {
      throw new Error('Maximum 3 images supported for editing');
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Valid prompt required for image editing');
    }

    try {
      console.log(`[NanoBananaAPI] Editing ${images.length} image(s) with prompt:`, prompt);
      console.log('[NanoBananaAPI] Input images:', images.map(img => ({
        type: typeof img,
        hasData: !!(img?.data),
        hasMimeType: !!(img?.mimeType),
        dataLength: img?.data?.length || (typeof img === 'string' ? img.length : 0)
      })));

      // Prepare content with images and prompt for multimodal input
      const parts = [];

      // Add images to parts
      images.forEach((image, index) => {
        let imageData, mimeType;

        if (typeof image === 'string') {
          // Handle plain base64 string (from generated images)
          imageData = image;
          mimeType = 'image/png'; // Default MIME type for generated images
        } else if (image && image.data && image.mimeType) {
          // Handle image object with data and mimeType
          imageData = image.data;
          mimeType = image.mimeType;
        } else {
          throw new Error(`Invalid image data at index ${index}`);
        }

        console.log(`[NanoBananaAPI] Adding image ${index + 1}:`, { mimeType, dataLength: imageData.length });
        parts.push({
          inlineData: {
            data: imageData,
            mimeType: mimeType
          }
        });
      });

      // Add text prompt
      parts.push({
        text: prompt.trim()
      });

      console.log(`[NanoBananaAPI] Final parts structure:`, parts.map(part => ({
        hasInlineData: !!part.inlineData,
        hasText: !!part.text,
        text: part.text || '[IMAGE]'
      })));

      console.log('[NanoBananaAPI] Calling Gemini API...');
      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: [{
          parts: parts
        }],
      });
      console.log('[NanoBananaAPI] Gemini API response received');

      // Extract image data from response
      const imageData = this.extractImageFromResponse(response);

      if (!imageData) {
        throw new Error('No image data received from API');
      }

      console.log('Image editing completed successfully');
      return imageData;

    } catch (error) {
      console.error('Image editing failed:', error);
      throw new Error(`Image editing failed: ${error.message}`);
    }
  }

  /**
   * Extract image data from API response
   * @param {Object} response - API response object
   * @returns {Object|null} Extracted image data or null if not found
   * @private
   */
  extractImageFromResponse(response) {
    try {
      if (!response?.candidates?.[0]?.content?.parts) {
        console.error('Invalid response structure:', response);
        return null;
      }

      const parts = response.candidates[0].content.parts;

      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return {
            imageData: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'image/png'
          };
        }
      }

      console.error('No inline data found in response parts:', parts);
      return null;

    } catch (error) {
      console.error('Error extracting image from response:', error);
      return null;
    }
  }

  /**
   * Convert uploaded file to base64 for API consumption
   * @param {File} file - File object from upload
   * @returns {Promise<{data: string, mimeType: string}>} Base64 encoded image data
   * @throws {Error} If file conversion fails
   */
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        reject(new Error('Valid image file required'));
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        try {
          // Remove data URL prefix to get pure base64
          const base64Data = reader.result.split(',')[1];

          resolve({
            data: base64Data,
            mimeType: file.type
          });
        } catch (error) {
          reject(new Error('Failed to convert file to base64'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Convert image URL to base64 (for uploaded images from server)
   * @param {string} imageUrl - URL of the image to convert
   * @returns {Promise<{data: string, mimeType: string}>} Base64 encoded image data
   * @throws {Error} If URL conversion fails
   */
  async urlToBase64(imageUrl) {
    try {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          try {
            // Remove data URL prefix to get pure base64
            const base64Data = reader.result.split(',')[1];

            resolve({
              data: base64Data,
              mimeType: blob.type || 'image/png'
            });
          } catch (error) {
            reject(new Error('Failed to convert URL to base64'));
          }
        };

        reader.onerror = () => {
          reject(new Error('Failed to read blob'));
        };

        reader.readAsDataURL(blob);
      });

    } catch (error) {
      console.error('URL to base64 conversion failed:', error);
      throw new Error(`URL conversion failed: ${error.message}`);
    }
  }
}

// Export singleton instance
const nanoBananaApi = new NanoBananaApiService();
export default nanoBananaApi;