# Development Rules and Standards

This file defines mandatory rules that must be followed when making changes to the Real-Time Translation application codebase. These rules ensure consistency, maintainability, and professionalism across all code contributions.

## 🚨 MANDATORY RULES - ALWAYS ENFORCE

### 1. File Header Documentation
**RULE: Every source file must have a comprehensive JSDoc header**

When creating or modifying ANY `.js`, `.jsx`, `.ts`, `.tsx`, or similar files:

```javascript
/**
 * [Descriptive Title of File/Component]
 * 
 * @fileoverview [Detailed description of file purpose, key functionality, 
 * architectural role, and integration with other components. Explain the 'why'
 * not just the 'what'.]
 * 
 * @author David Seguin
 * @version 1.0.0
 * @since 2025
 * @license Professional - All Rights Reserved
 * 
 * Key Features:
 * - [List major capabilities and features]
 * - [Focus on what makes this file unique/important]
 * - [Include architectural significance]
 * - [Mention integration points]
 * 
 * Dependencies:
 * - [List major external dependencies]
 * - [Internal module dependencies]
 * - [API integrations]
 * 
 * Security Considerations:
 * - [Any security-relevant aspects]
 * - [Encryption, authentication, data handling]
 * - [Air-gapped environment considerations]
 * 
 * Performance Notes:
 * - [Real-time processing considerations]
 * - [Resource usage patterns]
 * - [Optimization strategies]
 */
```

**Triggers for Header Updates:**
- Creating new files
- Adding new major functionality (>50 lines)
- Changing core architectural patterns
- Modifying security-related code
- Adding new dependencies
- Changing API integrations

### 2. Function Documentation
**RULE: All exported functions and complex internal functions must have JSDoc**

```javascript
/**
 * Brief description of what the function does
 * 
 * @param {Type} paramName - Description including validation rules, constraints
 * @param {Object} options - Configuration object
 * @param {boolean} [options.optional] - Optional parameter with default behavior
 * @returns {Promise<Type>} Description of return value and possible states
 * @throws {Error} When specific error conditions occur
 * 
 * @example
 * const result = await functionName(data, { optional: true });
 * console.log(result.status);
 * 
 * @since 1.0.0
 * @security Handles sensitive data - ensure proper encryption
 * @performance Real-time processing - optimized for <10ms latency
 */
```

**Mandatory for:**
- All exported functions
- Event handlers
- API endpoints
- Audio processing functions
- LLM integration functions
- Configuration management functions
- Security-related functions

### 3. Inline Help Content Updates
**RULE: When modifying UI components, update corresponding help content**

**Files to check/update:**
- `src/data/helpContent.js` - Main help content repository
- Component-specific help props
- Tooltip content
- Settings descriptions

**Update triggers:**
- Adding new settings/options
- Changing behavior of existing features
- Modifying UI layouts that affect user interaction
- Adding accessibility features
- Changing performance characteristics
- Modifying security implications

**Help content must include:**
- Clear, non-technical explanation for end users
- Technical details for advanced users
- Best practice recommendations
- Performance implications
- Security considerations
- Accessibility impact
- Professional presentation context

### 4. Configuration Schema Updates
**RULE: Changes to configuration must update all related schemas and documentation**

**When modifying:**
- `config/defaults.json`
- Settings interfaces
- Configuration validation
- API endpoints for config

**Must also update:**
- `config/rtt_config.json` - User's actual configuration file
- `config/defaults.json` - Default configuration template
- Help content for new options
- JSDoc for configuration managers
- Validation schemas
- Default value documentation
- Migration scripts if needed

**CRITICAL: Always update BOTH config files when adding new settings:**
- Add to `defaults.json` for new installations
- Add to `rtt_config.json` for existing user configurations

#### Configuration Management Integration
**CRITICAL RULE: Configuration changes must ensure proper UI integration**

When any code changes affect settings in `rtt_config.json` or `defaults.json`, you must update `config_manager.js` and any other relevant codebase components to ensure that when the user clicks 'Apply' or 'Restore Defaults' in the settings menu, the new field is properly handled.

**Required updates for configuration changes:**
- Update configuration validation in `config_manager.js`
- Ensure proper handling in settings UI components
- Verify 'Apply' button functionality includes new fields
- Verify 'Restore Defaults' button properly resets new fields
- Test configuration persistence and loading
- Update any configuration-dependent services or components

### 5. Error Handling Documentation
**RULE: All error conditions must be documented with user guidance**

```javascript
/**
 * @throws {ValidationError} When input validation fails - user should check format
 * @throws {NetworkError} When API calls fail - user should verify connectivity
 * @throws {AuthenticationError} When API keys are invalid - user should update credentials
 */
```

### 6. Security Documentation Updates
**RULE: Any security-related changes must update security documentation**

**Security-sensitive areas:**
- API key management and environment variable handling
- Client-side API key exposure (Google Gemini)
- Domain restrictions and access controls
- Content Security Policy (CSP) configuration
- Security headers implementation
- Network communications and CORS
- User input validation and XSS prevention
- File upload and processing security

**Must document:**
- Security implications and threat mitigation
- Data protection measures and encryption
- Environment-specific security configurations
- Domain restriction setup in Google Cloud Console
- CSP policy justifications and allowed domains
- Security header configurations and purposes
- API key rotation procedures
- Deployment security checklist

## 📋 AUTOMATED CHECKS AND BEST PRACTICES

### Code Quality Standards
- **ESLint compliance** - Fix all linting errors
- **Type safety** - Add proper TypeScript types where applicable
- **Performance** - Document any performance impacts
- **Memory management** - Note memory usage patterns for real-time processing
- **Error boundaries** - Implement proper error handling for UI components
- **Code efficiency** - Always make the code compact and efficient

### Testing Requirements
- **Unit tests** for new utility functions
- **Integration tests** for LLM provider changes
- **Manual testing** for UI changes
- **Performance testing** for audio processing modifications
- **Security testing** for authentication/encryption changes

### Documentation Maintenance
- **README updates** when adding new features or changing setup procedures
- **CLAUDE.md updates** when adding new development patterns or architectural changes
- **API documentation** for backend endpoint changes
- **Docker documentation** for deployment changes

### Version Control Standards
- **Atomic commits** - Each commit should represent one logical change
- **Clear commit messages** - Include what was changed and why
- **Branch naming** - Use descriptive names indicating feature/fix/refactor
- **Pull request templates** - Include checklist for all mandatory updates

## 🔍 PRE-COMMIT CHECKLIST

Before committing any changes, verify:

- [ ] **File headers updated** - All modified files have current, accurate headers
- [ ] **Function documentation complete** - New/modified functions have JSDoc
- [ ] **Help content updated** - UI changes have corresponding help updates
- [ ] **Configuration consistency** - Config changes propagated to all related files
- [ ] **Error handling documented** - New error conditions have user guidance
- [ ] **Security review complete** - Security implications documented
- [ ] **Performance impact assessed** - Real-time processing impacts noted
- [ ] **Tests passing** - All existing tests continue to pass
- [ ] **Linting clean** - No ESLint errors or warnings
- [ ] **Dependencies documented** - New dependencies added to headers/docs

## 🚀 ARCHITECTURE-SPECIFIC RULES

### Real-Time Audio Processing
- Document latency requirements and optimizations
- Note memory allocation patterns
- Specify buffer size considerations
- Include VAD sensitivity implications

### LLM Integration
- Document provider-specific behaviors
- Note fallback mechanisms
- Include rate limiting considerations
- Specify caching strategies

### Security and Encryption
- Always document key management changes
- Note air-gapped environment implications
- Include compliance considerations
- Specify data protection measures

### UI/UX Changes
- Update accessibility documentation
- Note Apple design system compliance
- Include responsive design considerations
- Update help tooltips and guidance
- **MANDATORY**: Use only Google Material Icons for all UI icons

### Icon Usage Standards
**RULE: All UI icons must use Google Material Icons with standardized configuration**

**Required Icon Source:**
- **URL**: https://fonts.google.com/icons?selected=Material+Symbols+Outlined:sync:FILL@0;wght@400;GRAD@0;opsz@24&icon.size=24&icon.color=%23F19E39
- **Style**: Material Symbols Outlined
- **Configuration**: FILL@0;wght@400;GRAD@0;opsz@24
- **Size**: 24px
- **Color**: #F19E39 (Orange theme color)

**Implementation Requirements:**
- Use consistent icon sizing (24px)
- Apply theme-appropriate colors (#F19E39 for primary actions)
- Maintain accessibility standards with proper alt text
- Include hover states and interactive feedback
- Document icon choices in component headers

**Icon Selection Guidelines:**
- Choose semantically appropriate icons
- Maintain visual consistency across the application
- Test icons at different display densities
- Ensure icons are recognizable at small sizes
- Follow established icon metaphors (download = down arrow, remove = X, etc.)

**Prohibited:**
- Custom SVG icons without justification
- Mixed icon libraries within the application
- Inconsistent sizing or styling
- Icons without accessibility considerations

### Secure Deployment Standards
**RULE: All deployments must follow secure configuration practices**

**Local Development Security:**
- Use `./dev.sh` script for reliable environment variable loading
- Never commit `.env` files or API keys to version control
- Validate API key format during startup
- Provide environment-specific error messages and setup instructions

**Netlify Deployment Security:**
- **NEVER** bypass Netlify's security scanning
- Use environment variables exclusively for API key configuration
- Implement comprehensive Content Security Policy (CSP)
- Configure security headers (X-Frame-Options, X-XSS-Protection, etc.)
- Disable source maps in production builds
- Use domain restrictions for API keys in Google Cloud Console

**Required Security Headers:**
```toml
Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://generativelanguage.googleapis.com https://ai.google.dev; media-src 'self' data: blob:;"
X-Frame-Options = "DENY"
X-Content-Type-Options = "nosniff"
X-XSS-Protection = "1; mode=block"
Referrer-Policy = "strict-origin-when-cross-origin"
Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

**API Key Security Checklist:**
- [ ] API key stored in environment variables only
- [ ] Domain restrictions configured in Google Cloud Console
- [ ] No secrets scanning bypass in netlify.toml
- [ ] Environment detection implemented in application
- [ ] User-friendly error messages for missing API keys
- [ ] API key format validation during initialization

## 🎯 QUALITY GATES

**Code cannot be merged without:**
1. Updated file headers reflecting changes
2. Complete function documentation for new/modified functions
3. Updated help content for user-facing changes
4. Passing all automated tests
5. Security review for sensitive changes
6. Performance impact assessment for real-time components

**Additional quality requirements:**
- Professional-grade documentation suitable for enterprise deployment
- Clear, actionable user guidance for all features
- Comprehensive error handling with user-friendly messages
- Consistent code style and architectural patterns
- Proper resource management for real-time processing

## 📚 EXTERNAL DOCUMENTATION REFERENCES

### AI/ML Integration
- **Gemini API Image Generation**: https://ai.google.dev/gemini-api/docs/image-generation
  - Use for implementing image generation features
  - Reference for API integration patterns
  - Security considerations for AI service integration

---

*This document is mandatory reading for all contributors. Failure to follow these rules will result in code review rejection and required rework.*