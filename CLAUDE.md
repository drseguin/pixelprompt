# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **pixelprompt**, a Real-Time Translation application codebase featuring:
- Real-time audio processing with low-latency requirements (<10ms)
- LLM integration for translation services
- Secure, air-gapped environment support
- Professional-grade UI following Apple design system
- Comprehensive configuration management
- Enterprise deployment capabilities

## Architecture

### Core Structure
```
src/
├── assets/          # Static assets and resources
├── components/      # React components with professional UI
config/              # Configuration files (currently empty)
public/              # Public assets
uploads/             # File upload handling
```

### Key Architectural Patterns
- **Real-time Processing**: Audio processing components optimized for minimal latency
- **LLM Provider Integration**: Modular design supporting multiple translation providers
- **Security-First**: Encryption, authentication, and air-gapped environment considerations
- **Configuration-Driven**: Centralized configuration with schema validation
- **Professional UI**: Apple design system compliance with accessibility features

## Development Rules (MANDATORY)

**⚠️ CRITICAL**: This project enforces strict development standards. See `DEVELOPMENT_RULES.md` for complete requirements.

### Key Requirements
1. **File Headers**: All source files must have comprehensive JSDoc headers including:
   - File overview and architectural role
   - Author: David Seguin
   - Version, license, and security considerations
   - Dependencies and performance notes

2. **Function Documentation**: All exported functions and complex internal functions require JSDoc with:
   - Parameter validation rules
   - Return types and error conditions
   - Examples and performance notes
   - Security implications

3. **Configuration Management**: When modifying configuration:
   - Update both `config/defaults.json` and `config/rtt_config.json`
   - Update help content in `src/data/helpContent.js`
   - Ensure proper UI integration with 'Apply' and 'Restore Defaults' functionality
   - Update validation schemas

## Configuration Files

**Important**: No package.json found - this appears to be an early-stage project or may use alternative dependency management.

### Key Configuration Areas
- **Real-time Audio**: Buffer sizes, VAD sensitivity, latency optimization
- **LLM Integration**: Provider configurations, API keys, fallback mechanisms
- **Security**: Encryption settings, authentication, air-gapped environment
- **UI/UX**: Accessibility settings, Apple design system compliance

## Documentation Requirements

### Help Content Updates
When modifying UI components, update:
- `src/data/helpContent.js` - Main help repository
- Component-specific help props and tooltips
- Settings descriptions with technical and user-friendly explanations

### Security Documentation
Document security implications for:
- API key management
- Encryption/decryption
- Audio data handling
- Network communications
- User input validation

## Quality Standards

### Pre-Commit Checklist
- [ ] File headers updated with current, accurate information
- [ ] Function documentation complete for new/modified functions
- [ ] Help content updated for UI changes
- [ ] Configuration consistency across all related files
- [ ] Error handling documented with user guidance
- [ ] Security review complete
- [ ] Performance impact assessed for real-time components

### Code Quality
- Professional-grade documentation suitable for enterprise deployment
- Clear, actionable user guidance for all features
- Comprehensive error handling with user-friendly messages
- Consistent architectural patterns
- Proper resource management for real-time processing

## Specialized Considerations

### Real-Time Audio Processing
- Document latency requirements and optimizations
- Note memory allocation patterns and buffer considerations
- Include VAD sensitivity implications

### LLM Integration
- Document provider-specific behaviors and fallback mechanisms
- Note rate limiting and caching strategies

### Enterprise Deployment
- Air-gapped environment considerations
- Compliance requirements
- Professional presentation context
- Security and data protection measures