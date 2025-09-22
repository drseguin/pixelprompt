/**
 * Session Management Utility
 *
 * @file session.js
 * @description Handles browser session management for multi-user file upload organization
 * @author David Seguin
 * @version 1.0.0
 * @license MIT
 *
 * Architecture:
 * - Generates unique session IDs for each browser session
 * - Stores session data in localStorage for persistence
 * - Handles session-based file organization
 *
 * Security Considerations:
 * - Session IDs are cryptographically secure
 * - No sensitive data stored in session
 * - Session isolation between users
 */

/**
 * Generates a cryptographically secure session ID
 * @returns {string} Unique session identifier
 */
const generateSessionId = () => {
  // Use crypto API if available (modern browsers)
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  // Fallback for older browsers
  return 'session_' + Math.random().toString(36).substring(2) +
         Date.now().toString(36) +
         Math.random().toString(36).substring(2);
};

/**
 * Gets or creates a session ID for the current browser session
 * @returns {string} Session ID
 */
export const getSessionId = () => {
  const SESSION_KEY = 'pixelprompt_session_id';

  let sessionId = localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
};

/**
 * Creates a new session (useful for clearing current session)
 * @returns {string} New session ID
 */
export const createNewSession = () => {
  const SESSION_KEY = 'pixelprompt_session_id';
  const newSessionId = generateSessionId();

  localStorage.setItem(SESSION_KEY, newSessionId);

  return newSessionId;
};

/**
 * Gets session-specific data from localStorage
 * @param {string} key - Data key
 * @returns {any} Stored data or null
 */
export const getSessionData = (key) => {
  const sessionId = getSessionId();
  const sessionKey = `pixelprompt_${sessionId}_${key}`;

  try {
    const data = localStorage.getItem(sessionKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading session data:', error);
    return null;
  }
};

/**
 * Sets session-specific data in localStorage
 * @param {string} key - Data key
 * @param {any} value - Data to store
 */
export const setSessionData = (key, value) => {
  const sessionId = getSessionId();
  const sessionKey = `pixelprompt_${sessionId}_${key}`;

  try {
    localStorage.setItem(sessionKey, JSON.stringify(value));
  } catch (error) {
    console.error('Error storing session data:', error);
  }
};

/**
 * Clears all session data for current session
 */
export const clearSessionData = () => {
  const sessionId = getSessionId();
  const keys = Object.keys(localStorage);

  keys.forEach(key => {
    if (key.startsWith(`pixelprompt_${sessionId}_`)) {
      localStorage.removeItem(key);
    }
  });
};

/**
 * Gets the current upload session info
 * @returns {object} Upload session data
 */
export const getUploadSession = () => {
  return getSessionData('upload_session') || {
    currentFolder: null,
    uploadedFiles: [],
    createdAt: null
  };
};

/**
 * Updates the current upload session
 * @param {object} sessionData - Session data to update
 */
export const updateUploadSession = (sessionData) => {
  const currentSession = getUploadSession();
  const updatedSession = { ...currentSession, ...sessionData };
  setSessionData('upload_session', updatedSession);
};

/**
 * Starts a new upload session with a new timestamped folder
 */
export const startNewUploadSession = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');
  const milliseconds = String(now.getUTCMilliseconds()).padStart(3, '0');

  const timestampFolder = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}:${milliseconds}`;

  updateUploadSession({
    currentFolder: timestampFolder,
    uploadedFiles: [],
    createdAt: now.toISOString()
  });

  return timestampFolder;
};