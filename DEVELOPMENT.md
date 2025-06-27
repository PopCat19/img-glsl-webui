# Development Guide

This document provides guidance for developers working on the GLSL WebUI project.

## Project Structure

```
img-glsl-webui/
├── src/                    # Source files (modular development)
│   ├── index.html         # Main HTML structure
│   ├── css/
│   │   └── styles.css     # All CSS styles
│   ├── js/                # JavaScript modules
│   │   ├── main.js        # Main application orchestrator
│   │   ├── default-shaders.js   # Shader templates and examples
│   │   ├── webgl-utils.js       # WebGL utility functions
│   │   ├── shader-compiler.js   # GLSL compilation and validation
│   │   ├── image-handler.js     # Image loading and processing
│   │   ├── ui-controls.js       # UI event handlers and interactions
│   │   ├── export-utils.js      # Export functionality (PNG/JPG/WebM)
│   │   └── storage-manager.js   # Save slots and localStorage
│   └── shaders/           # Example GLSL shader files
│       └── cool-stuff.glsl
├── dist/                  # Built single-file version
├── revisions/             # Legacy single-file versions
├── build.js               # Build system
├── package.json           # Node.js dependencies and scripts
└── README.md             # User documentation
```

## Architecture Overview

The application follows a modular architecture with clear separation of concerns:

### Core Modules

1. **Main Application (`main.js`)**
   - Orchestrates all other modules
   - Manages global application state
   - Handles WebGL context initialization
   - Coordinates rendering loop

2. **Shader Compiler (`shader-compiler.js`)**
   - GLSL shader compilation and linking
   - Error handling and reporting
   - Shader validation and preprocessing
   - Uniform and attribute management

3. **Image Handler (`image-handler.js`)**
   - File upload and drag-drop support
   - URL-based image loading
   - Clipboard paste functionality
   - Image validation and processing

4. **UI Controls (`ui-controls.js`)**
   - Event listener management
   - User interaction handling
   - Keyboard shortcuts
   - Mobile touch support

5. **Export Utils (`export-utils.js`)**
   - Image export (PNG/JPG)
   - Animation export (WebM)
   - Format conversion utilities
   - Download management

6. **Storage Manager (`storage-manager.js`)**
   - Save slot functionality
   - localStorage management
   - History and undo/redo
   - Settings persistence

7. **WebGL Utils (`webgl-utils.js`)**
   - Low-level WebGL operations
   - Buffer management
   - Texture creation and binding
   - Context setup and cleanup

## Development Workflow

### Getting Started

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd img-glsl-webui
   npm install
   ```

2. **Development Mode**
   ```bash
   npm run serve-dev  # Serve modular version on localhost:8080
   ```

3. **Build and Test**
   ```bash
   npm run build      # Create single-file version
   npm run serve      # Serve built version
   ```

### Adding New Features

1. **Create New Module**
   - Add new `.js` file in `src/js/`
   - Follow existing module patterns
   - Export classes or functions as needed

2. **Update Build System**
   - Add module to `jsFiles` array in `build.js`
   - Ensure correct load order

3. **Integrate with Main App**
   - Import/instantiate in `main.js`
   - Add to application initialization

### Code Style Guidelines

1. **JavaScript**
   - Use ES6+ features (classes, arrow functions, etc.)
   - Prefer `const` and `let` over `var`
   - Use descriptive variable and function names
   - Add JSDoc comments for public methods

2. **Module Structure**
   ```javascript
   // ==================== MODULE NAME ====================
   
   /**
    * Module description
    */
   class ModuleName {
       constructor(dependencies) {
           // Initialize
       }
       
       /**
        * Method description
        * @param {type} param - Parameter description
        * @returns {type} Return description
        */
       methodName(param) {
           // Implementation
       }
   }
   ```

3. **Error Handling**
   - Always handle WebGL context loss
   - Provide meaningful error messages
   - Log errors to both console and UI
   - Graceful degradation when possible

## WebGL Development

### Shader Development

1. **Fragment Shader Structure**
   ```glsl
   precision mediump float;
   varying vec2 v_texcoord;
   uniform sampler2D tex;
   uniform float time;
   
   void main() {
       vec4 color = texture2D(tex, v_texcoord);
       // Apply effects
       gl_FragColor = color;
   }
   ```

2. **Available Uniforms**
   - `sampler2D tex` - Input image texture
   - `float time` - Time in seconds since start

3. **Best Practices**
   - Always specify precision
   - Handle edge cases in texture sampling
   - Use meaningful variable names
   - Comment complex calculations

### Performance Considerations

1. **Rendering Loop**
   - Only render when necessary
   - Use `requestAnimationFrame` for smooth animation
   - Clean up resources properly

2. **Memory Management**
   - Delete unused WebGL objects
   - Reuse buffers when possible
   - Monitor texture memory usage

3. **Mobile Optimization**
   - Test on various devices
   - Consider performance implications
   - Use appropriate precision qualifiers

## Testing

### Manual Testing Checklist

1. **Image Loading**
   - [ ] File upload works
   - [ ] Drag and drop functions
   - [ ] URL loading works
   - [ ] Clipboard paste works
   - [ ] Various image formats supported

2. **Shader Compilation**
   - [ ] Valid shaders compile
   - [ ] Error reporting for invalid shaders
   - [ ] Shader toggle works
   - [ ] Default shader loads

3. **Save Slots**
   - [ ] Save to empty slot
   - [ ] Load from filled slot
   - [ ] Clear slot (with confirmation)
   - [ ] Mobile touch/hold behavior

4. **Export Functionality**
   - [ ] PNG export with/without alpha
   - [ ] JPG export
   - [ ] WebM animation export
   - [ ] Custom export settings

5. **UI Interactions**
   - [ ] Responsive design on mobile
   - [ ] Keyboard shortcuts work
   - [ ] Number input dragging
   - [ ] Transform controls

6. **Browser Compatibility**
   - [ ] Chrome/Chromium
   - [ ] Firefox
   - [ ] Safari
   - [ ] Mobile browsers

### Build Testing

1. **Development Build**
   ```bash
   npm run serve-dev
   # Test all functionality
   ```

2. **Production Build**
   ```bash
   npm run build
   npm run serve
   # Verify single-file version works
   ```

3. **File Size Check**
   - Monitor build output size
   - Consider minification improvements
   - Check for unnecessary dependencies

## Common Issues and Solutions

### WebGL Context Issues

1. **Context Lost**
   ```javascript
   canvas.addEventListener('webglcontextlost', (event) => {
       event.preventDefault();
       // Stop rendering
   });
   
   canvas.addEventListener('webglcontextrestored', () => {
       // Reinitialize WebGL resources
   });
   ```

2. **Extension Support**
   ```javascript
   const ext = gl.getExtension('WEBGL_lose_context');
   if (!ext) {
       console.warn('WebGL extension not supported');
   }
   ```

### Shader Compilation Errors

1. **Parse Error Information**
   ```javascript
   function parseShaderErrors(errorLog) {
       const lines = errorLog.split('\n');
       return lines.map(line => {
           const match = line.match(/ERROR: (\d+):(\d+): (.+)/);
           if (match) {
               return {
                   line: parseInt(match[2]),
                   message: match[3]
               };
           }
       }).filter(Boolean);
   }
   ```

2. **Common Shader Issues**
   - Missing precision qualifiers
   - Undefined variables
   - Type mismatches
   - Missing main function

### Mobile Compatibility

1. **Touch Events**
   ```javascript
   element.addEventListener('touchstart', handler, { passive: false });
   element.addEventListener('touchmove', handler, { passive: false });
   element.addEventListener('touchend', handler);
   ```

2. **Viewport Considerations**
   - Test on various screen sizes
   - Consider device pixel ratio
   - Handle orientation changes

## Debugging

### Development Tools

1. **Browser DevTools**
   - Console for error messages
   - Network tab for resource loading
   - Performance tab for optimization

2. **WebGL Debugging**
   - Use WebGL Inspector extension
   - Check for WebGL errors after operations
   - Monitor texture and buffer usage

3. **Application Console**
   - Built-in logging system
   - Shader compilation errors
   - Performance metrics

### Common Debug Patterns

1. **Check WebGL State**
   ```javascript
   function checkGLError(gl, operation) {
       const error = gl.getError();
       if (error !== gl.NO_ERROR) {
           console.error(`WebGL error after ${operation}: ${error}`);
       }
   }
   ```

2. **Validate Shader Uniforms**
   ```javascript
   const location = gl.getUniformLocation(program, 'uniformName');
   if (location === null) {
       console.warn('Uniform not found:', 'uniformName');
   }
   ```

## Deployment

### Single-File Distribution

The build system creates a self-contained HTML file for easy distribution:

```bash
NODE_ENV=production npm run build
```

This creates `dist/index.html` with:
- Minified CSS and JavaScript
- All dependencies inlined
- Build timestamp
- Optimized file size

### GitHub Pages

The repository can be configured for GitHub Pages deployment:
1. Build the project
2. Commit `dist/` directory
3. Configure Pages to serve from `dist/`

### CDN Deployment

For CDN deployment:
1. Build with production settings
2. Upload `dist/index.html`
3. Configure CORS headers if needed
4. Test cross-origin image loading

## Contributing

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Make changes in `src/` directory
4. Test both development and built versions
5. Update documentation if needed
6. Submit pull request with clear description

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] New features are documented
- [ ] No breaking changes to existing API
- [ ] Build system updated if needed
- [ ] Manual testing completed
- [ ] Performance impact considered

## Future Improvements

### Potential Features

1. **Shader Library**
   - Community shader sharing
   - Categorized effect browser
   - Shader parameter controls

2. **Advanced Export**
   - Multiple image formats
   - Batch processing
   - Custom resolution export

3. **Development Tools**
   - Syntax highlighting
   - Auto-completion
   - Error highlighting
   - Live shader validation

4. **Performance**
   - WebGL 2.0 support
   - Compute shader integration
   - Multi-threading for export

### Technical Debt

1. **Code Organization**
   - Further module separation
   - Better TypeScript support
   - Unit test coverage

2. **Build System**
   - Webpack/Vite integration
   - Hot module replacement
   - Asset optimization

3. **Documentation**
   - API documentation
   - Shader authoring guide
   - Video tutorials