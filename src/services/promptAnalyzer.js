/**
 * Prompt Analysis Service
 *
 * @file promptAnalyzer.js
 * @description AI-powered prompt analysis service for categorizing and extracting metadata from image generation prompts
 * @author David Seguin
 * @version 1.0.0
 * @license MIT
 *
 * Architecture:
 * - Uses Google Gemini API for intelligent prompt analysis
 * - Extracts structured metadata: Category, Subject, Action, Environment, Art Style, Lighting
 * - Provides fallback metadata generation for edge cases
 * - Integrates with existing nanoBananaApi service
 *
 * Security Considerations:
 * - Input validation for prompt text
 * - Secure API communication
 * - Rate limiting awareness
 */

import nanoBananaApi from './nanoBananaApi';

/**
 * AI-powered prompt analysis service
 */
class PromptAnalyzer {
  /**
   * Analyze a prompt and extract metadata using AI
   * @param {string} prompt - The image generation prompt to analyze
   * @returns {Promise<Object>} Metadata object with categorized fields
   */
  async analyzePrompt(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Invalid prompt provided for analysis');
    }

    const analysisPrompt = `Analyze this image generation prompt and extract the following metadata in JSON format:

"${prompt}"

Please provide a JSON response with these exact fields:
{
  "category": "Choose from: Portrait, Landscape, Abstract, Architecture, Animal, Product, Fantasy, Sci-Fi, Food, Vehicle, Other",
  "subject": "Main subject or focal point (2-4 words)",
  "action": "What is happening or the pose/activity (2-5 words)",
  "environment": "Location, setting, or background (2-4 words)",
  "artStyle": "Photography style, artistic technique, or camera used (3-6 words)",
  "lighting": "Lighting conditions or mood (2-4 words)"
}

Guidelines:
- Be concise and specific
- Use title case for proper nouns
- If something is not explicitly mentioned, infer from context
- For "category", choose the most appropriate from the list
- For "artStyle", include camera models, artistic styles, or techniques mentioned
- For "lighting", describe the quality, direction, or mood of light

Return only valid JSON, no additional text.`;

    try {
      // Use the existing Gemini API to analyze the prompt
      const result = await nanoBananaApi.generateText(analysisPrompt);

      if (!result || !result.text) {
        throw new Error('No analysis result received from AI');
      }

      // Parse the JSON response
      let metadata;
      try {
        // Clean the response - remove any markdown code blocks or extra text
        let cleanJson = result.text.trim();
        if (cleanJson.startsWith('```json')) {
          cleanJson = cleanJson.replace(/```json\s*/, '').replace(/```\s*$/, '');
        } else if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/```\s*/, '').replace(/```\s*$/, '');
        }

        metadata = JSON.parse(cleanJson);
      } catch (parseError) {
        console.warn('Failed to parse AI analysis response, using fallback:', parseError);
        metadata = this.generateFallbackMetadata(prompt);
      }

      // Validate and sanitize the metadata
      return this.validateMetadata(metadata);

    } catch (error) {
      console.warn('AI analysis failed, using fallback metadata:', error);
      return this.generateFallbackMetadata(prompt);
    }
  }

  /**
   * Generate fallback metadata when AI analysis fails
   * @param {string} prompt - The original prompt
   * @returns {Object} Basic metadata extracted using keyword matching
   */
  generateFallbackMetadata(prompt) {
    const lowerPrompt = prompt.toLowerCase();

    // Simple keyword-based categorization
    const categories = {
      'Portrait': ['person', 'woman', 'man', 'face', 'portrait', 'headshot', 'selfie'],
      'Landscape': ['landscape', 'mountain', 'forest', 'ocean', 'beach', 'valley', 'horizon'],
      'Architecture': ['building', 'house', 'church', 'bridge', 'tower', 'architecture'],
      'Animal': ['cat', 'dog', 'bird', 'animal', 'pet', 'wildlife', 'horse', 'lion'],
      'Fantasy': ['dragon', 'fairy', 'magic', 'fantasy', 'wizard', 'medieval', 'mythical'],
      'Sci-Fi': ['robot', 'spaceship', 'alien', 'future', 'cyberpunk', 'sci-fi', 'space'],
      'Food': ['food', 'meal', 'cooking', 'restaurant', 'kitchen', 'recipe', 'delicious'],
      'Vehicle': ['car', 'truck', 'motorcycle', 'boat', 'plane', 'vehicle', 'transport']
    };

    let category = 'Other';
    for (const [cat, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerPrompt.includes(keyword))) {
        category = cat;
        break;
      }
    }

    // Extract first few words as potential subject
    const words = prompt.split(' ').slice(0, 4).join(' ');
    const subject = words.charAt(0).toUpperCase() + words.slice(1);

    return {
      category,
      subject: subject || 'General Image',
      action: this.extractAction(prompt),
      environment: this.extractEnvironment(prompt),
      artStyle: this.extractArtStyle(prompt),
      lighting: this.extractLighting(prompt)
    };
  }

  /**
   * Extract action keywords from prompt
   * @param {string} prompt - The prompt text
   * @returns {string} Detected action or default
   */
  extractAction(prompt) {
    const actionWords = ['sitting', 'standing', 'walking', 'running', 'smiling', 'looking', 'holding', 'dancing', 'flying', 'swimming'];
    const lowerPrompt = prompt.toLowerCase();

    for (const action of actionWords) {
      if (lowerPrompt.includes(action)) {
        return action.charAt(0).toUpperCase() + action.slice(1);
      }
    }

    return 'Static Pose';
  }

  /**
   * Extract environment keywords from prompt
   * @param {string} prompt - The prompt text
   * @returns {string} Detected environment or default
   */
  extractEnvironment(prompt) {
    const environments = ['studio', 'outdoor', 'indoor', 'cafe', 'park', 'street', 'home', 'office', 'beach', 'forest'];
    const lowerPrompt = prompt.toLowerCase();

    for (const env of environments) {
      if (lowerPrompt.includes(env)) {
        return env.charAt(0).toUpperCase() + env.slice(1);
      }
    }

    return 'Neutral Background';
  }

  /**
   * Extract art style keywords from prompt
   * @param {string} prompt - The prompt text
   * @returns {string} Detected art style or default
   */
  extractArtStyle(prompt) {
    const styles = ['canon', 'nikon', 'sony', 'photograph', 'painting', 'digital art', 'sketch', 'watercolor', 'oil painting'];
    const lowerPrompt = prompt.toLowerCase();

    for (const style of styles) {
      if (lowerPrompt.includes(style)) {
        return style.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }
    }

    return 'Digital Photography';
  }

  /**
   * Extract lighting keywords from prompt
   * @param {string} prompt - The prompt text
   * @returns {string} Detected lighting or default
   */
  extractLighting(prompt) {
    const lighting = ['natural light', 'soft light', 'dramatic', 'bright', 'dark', 'warm', 'cool', 'golden hour', 'studio lighting'];
    const lowerPrompt = prompt.toLowerCase();

    for (const light of lighting) {
      if (lowerPrompt.includes(light)) {
        return light.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }
    }

    return 'Natural Light';
  }

  /**
   * Validate and sanitize metadata fields
   * @param {Object} metadata - Raw metadata from AI analysis
   * @returns {Object} Validated metadata
   */
  validateMetadata(metadata) {
    const validCategories = [
      'Portrait', 'Landscape', 'Abstract', 'Architecture', 'Animal',
      'Product', 'Fantasy', 'Sci-Fi', 'Food', 'Vehicle', 'Other'
    ];

    // Ensure all required fields exist and are reasonable
    const validated = {
      category: validCategories.includes(metadata.category) ? metadata.category : 'Other',
      subject: this.sanitizeField(metadata.subject) || 'General Image',
      action: this.sanitizeField(metadata.action) || 'Static Pose',
      environment: this.sanitizeField(metadata.environment) || 'Neutral Background',
      artStyle: this.sanitizeField(metadata.artStyle) || 'Digital Photography',
      lighting: this.sanitizeField(metadata.lighting) || 'Natural Light'
    };

    return validated;
  }

  /**
   * Sanitize individual metadata fields
   * @param {string} field - Field value to sanitize
   * @returns {string} Sanitized field value
   */
  sanitizeField(field) {
    if (!field || typeof field !== 'string') {
      return '';
    }

    // Trim, limit length, and capitalize
    return field.trim().slice(0, 50).replace(/^\w/, c => c.toUpperCase());
  }
}

// Export singleton instance
const promptAnalyzer = new PromptAnalyzer();
export default promptAnalyzer;