# Netlify Cloud Deployment Guide for PixelPrompt

This guide provides detailed instructions for deploying PixelPrompt to Netlify, including environment variable configuration and deployment best practices.

## Overview

PixelPrompt has been refactored to work seamlessly with Netlify's cloud deployment platform. The application now prioritizes React environment variables (`REACT_APP_*`) over server-side environment variables, making it fully compatible with Netlify's static site hosting.

## Prerequisites

Before deploying to Netlify, ensure you have:

1. **Google Gemini API Key**: Required for image generation and editing functionality
2. **Netlify Account**: Free or paid account at [netlify.com](https://netlify.com)
3. **Git Repository**: Your PixelPrompt code should be in a Git repository (GitHub, GitLab, Bitbucket)

## Environment Variable Configuration

### Required Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `REACT_APP_GEMINI_API_KEY` | Google Gemini API key for image generation | ✅ Yes | `AIzaSyC...` |

### Setting Environment Variables in Netlify

#### Method 1: Netlify UI (Recommended)

1. **Access Site Settings**:
   - Go to your Netlify dashboard
   - Select your deployed site
   - Navigate to **Site settings** > **Environment variables**

2. **Add Environment Variables**:
   - Click **Add environment variable**
   - Key: `REACT_APP_GEMINI_API_KEY`
   - Value: Your Google Gemini API key
   - Scope: **Builds** (ensure it's available during build process)
   - Context: **All** (applies to production, preview, and branch deploys)

3. **Save and Deploy**:
   - Click **Save**
   - Trigger a new deploy to apply the environment variables

#### Method 2: Netlify CLI

```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Login to Netlify
netlify login

# Set environment variable
netlify env:set REACT_APP_GEMINI_API_KEY "your-api-key-here"

# Verify the variable was set
netlify env:list
```

#### Method 3: netlify.toml Configuration (Not Recommended for API Keys)

**⚠️ Warning**: Do not store sensitive API keys in `netlify.toml` as this file is typically committed to your repository.

```toml
# netlify.toml - Only for non-sensitive configuration
[build.environment]
  NODE_ENV = "production"
  # DO NOT add REACT_APP_GEMINI_API_KEY here
```

## Deployment Process

### Step 1: Prepare Your Repository

1. **Ensure Environment Variables are Set**:
   ```bash
   # Your local .env file should contain:
   REACT_APP_GEMINI_API_KEY=your-api-key-here
   ```

2. **Verify Build Process**:
   ```bash
   npm run build
   ```

3. **Test Production Build**:
   ```bash
   # Serve the build locally to test
   npx serve -s build
   ```

### Step 2: Deploy to Netlify

#### Option A: Git Integration (Recommended)

1. **Connect Repository**:
   - In Netlify dashboard, click **New site from Git**
   - Choose your Git provider (GitHub, GitLab, Bitbucket)
   - Select your PixelPrompt repository

2. **Configure Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `build`
   - Node version: `18` (specify in environment if needed)

3. **Set Environment Variables**:
   - Follow the environment variable configuration steps above
   - Add `REACT_APP_GEMINI_API_KEY` with your API key

4. **Deploy**:
   - Click **Deploy site**
   - Netlify will automatically build and deploy your site

#### Option B: Manual Deployment

1. **Build Locally**:
   ```bash
   # Ensure environment variable is set
   export REACT_APP_GEMINI_API_KEY="your-api-key-here"

   # Build the application
   npm run build
   ```

2. **Deploy Build Folder**:
   - Go to Netlify dashboard
   - Drag and drop the `build` folder to deploy
   - Or use Netlify CLI: `netlify deploy --prod --dir=build`

## Build Configuration

### Secure Netlify Build Settings

The new `netlify.toml` configuration provides enhanced security without bypassing Netlify's security scanning:

```toml
# netlify.toml - Secure Configuration
[build]
  command = "npm run build"
  publish = "build"
  timeout = 10

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"
  GENERATE_SOURCEMAP = "false"
  CI = "true"

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://generativelanguage.googleapis.com https://ai.google.dev; media-src 'self' data: blob:;"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Key Security Improvements:**
- **No secrets scanning bypass**: Removed all security bypass configurations
- **Content Security Policy**: Restricts allowed domains and prevents XSS
- **Security Headers**: Comprehensive protection against common attacks
- **Performance Optimizations**: Disabled source maps for production security

### Environment-Specific Configuration

The application automatically detects the deployment environment:

- **Netlify**: Uses `REACT_APP_GEMINI_API_KEY` from Netlify environment variables
- **Local Development**: Falls back to backend API and local `.env` file
- **Docker**: Uses local `.env` file configuration

## Security Considerations

### Enhanced API Key Security

1. **Never Commit API Keys**:
   - Add `.env` to `.gitignore`
   - Use Netlify's environment variable system exclusively for deployment
   - Rotate keys regularly and update in all environments
   - Never include API keys in `netlify.toml` or any committed files

2. **Environment Variable Security**:
   - Only `REACT_APP_*` prefixed variables are exposed to the browser
   - API keys with this prefix will be visible in the built application
   - This is acceptable for Google Gemini API keys as they're intended for client-side use
   - **Important**: Remove any secrets scanning bypass configurations

3. **Domain-Based Access Control** (Recommended):
   - Configure API key restrictions in Google Cloud Console
   - Limit usage to specific domains (your Netlify domain)
   - Set up usage quotas and monitoring
   - Enable request logging for security audit trails

4. **Content Security Policy**:
   - The new `netlify.toml` includes comprehensive CSP headers
   - Restricts connections to only Google Gemini API endpoints
   - Prevents XSS and other security vulnerabilities

5. **Security Headers**:
   - X-Frame-Options: DENY (prevents clickjacking)
   - X-Content-Type-Options: nosniff (prevents MIME sniffing)
   - X-XSS-Protection: enabled
   - Referrer-Policy: strict-origin-when-cross-origin

### Domain Restrictions

Configure your Google Gemini API key with domain restrictions:

1. Go to Google Cloud Console
2. Navigate to APIs & Services > Credentials
3. Edit your API key
4. Add your Netlify domain(s) to **HTTP referrers**:
   - `https://your-site-name.netlify.app/*`
   - `https://your-custom-domain.com/*`

## Troubleshooting

### Common Issues

#### 1. Environment Variable Not Found

**Error**: "Valid API key required for Nano Banana API"

**Solution**:
- Verify `REACT_APP_GEMINI_API_KEY` is set in Netlify
- Check that the variable name is exactly `REACT_APP_GEMINI_API_KEY`
- Trigger a new deploy after setting the variable

#### 2. Build Failures

**Error**: Build fails with missing dependencies

**Solution**:
```bash
# Ensure all dependencies are in package.json
npm install --save @google/genai
npm run build
```

#### 3. API Key Visible in Browser

**This is Expected**: React environment variables are embedded in the build and visible in the browser. This is normal for client-side API keys like Google Gemini.

#### 4. CORS Issues

**Error**: Cross-origin request blocked

**Solution**:
- Configure API key domain restrictions in Google Cloud Console
- Ensure your Netlify domain is allowed

### Debug Steps

1. **Check Environment Variables**:
   ```javascript
   // Add to your app temporarily for debugging
   console.log('API Key available:', !!process.env.REACT_APP_GEMINI_API_KEY);
   ```

2. **Verify Build Logs**:
   - Check Netlify build logs for environment variable issues
   - Look for build warnings or errors

3. **Test API Connection**:
   - Use browser developer tools to check network requests
   - Verify API responses and error messages

## Deployment Checklist

Before deploying to production:

- [ ] Google Gemini API key is valid and has sufficient quota
- [ ] Environment variable `REACT_APP_GEMINI_API_KEY` is set in Netlify
- [ ] Build process completes successfully locally
- [ ] API key domain restrictions are configured
- [ ] Custom domain (if applicable) is configured in Netlify
- [ ] SSL certificate is active
- [ ] Site is accessible and functional

## Performance Optimization

### Build Optimization

1. **Enable Build Plugins**:
   ```toml
   # netlify.toml
   [[plugins]]
     package = "@netlify/plugin-lighthouse"

   [[plugins]]
     package = "netlify-plugin-bundle-analyzer"
   ```

2. **Caching Strategy**:
   - Netlify automatically handles static asset caching
   - Configure cache headers for optimal performance

### Runtime Optimization

1. **Image Processing**: All image processing happens client-side, reducing server load
2. **API Caching**: Consider implementing request caching for repeated prompts
3. **Bundle Size**: Monitor and optimize JavaScript bundle size

## Monitoring and Analytics

### Netlify Analytics

Enable Netlify Analytics to monitor:
- Page views and unique visitors
- Performance metrics
- Geographic distribution
- Popular pages and features

### Google Gemini API Usage

Monitor your API usage in Google Cloud Console:
- Request counts and quotas
- Error rates and types
- Performance metrics
- Cost tracking

## Support and Resources

### Netlify Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Environment Variables Guide](https://docs.netlify.com/build/environment-variables/)
- [Build Configuration](https://docs.netlify.com/configure-builds/overview/)

### Google Gemini API Resources

- [Gemini API Documentation](https://ai.google.dev/docs)
- [API Key Management](https://cloud.google.com/docs/authentication/api-keys)
- [Usage and Quotas](https://cloud.google.com/apis/docs/capping-api-usage)

### PixelPrompt Support

For issues specific to PixelPrompt deployment:
1. Check this documentation first
2. Review the main `CLAUDE.md` file
3. Test locally with the same environment variables
4. Verify API key configuration and restrictions

---

**Last Updated**: September 2025
**Version**: 1.0.0
**Compatibility**: PixelPrompt v1.0.0+, Netlify (all plans)