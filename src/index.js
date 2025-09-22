/**
 * Pixel Prompt Application Entry Point
 *
 * @file index.js
 * @description React application bootstrap and root rendering
 * @author David Seguin
 * @version 1.0.0
 * @license MIT
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);