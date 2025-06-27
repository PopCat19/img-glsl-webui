# img-glsl-webui

A modular GLSL shader editor for images via WebGL. Apply real-time shader effects to images and export them as PNG/JPG or WebM animations.

## Features

- **Real-time GLSL shader editing** with live preview
- **Image support** via drag & drop, file upload, paste, or URL
- **5 shader save slots** for quick switching between effects
- **Image export** as PNG/JPG with optional transparency
- **Animation export** as WebM video
- **Transform controls** (rotation, mirroring, aspect ratio)
- **Responsive design** that works on desktop and mobile
- **Modular architecture** for easy development and maintenance
- **Single-file distribution** option for easy deployment

## Quick Start

### Option 1: Use the modular development version
1. Clone this repository
2. Open `src/index.html` in your browser
3. Start editing shaders and loading images!

### Option 2: Build a single-file version
1. Install Node.js (14+ required)
2. Run the build process:
   ```bash
   npm install
   npm run build
   ```
3. Open `dist/index.html` in your browser

### Option 3: Use development server
```bash
npm install
npm run serve-dev  # Serves the modular version
# or
npm run build && npm run serve  # Build and serve single-file version
```

## Architecture

The project is now modularized for better maintainability:

```
src/
├── index.html              # Main HTML structure
├── css/
│   └── styles.css         # All CSS styles
├── js/
│   ├── main.js            # Main application logic
│   ├── default-shaders.js # Default shader definitions
│   ├── webgl-utils.js     # WebGL utility functions
│   ├── shader-compiler.js # Shader compilation management
│   ├── image-handler.js   # Image loading and processing
│   ├── ui-controls.js     # UI event handlers
│   ├── export-utils.js    # Export functionality
│   └── storage-manager.js # Save slots and localStorage
└── shaders/
    └── cool-stuff.glsl    # Example shader effects
```

### Key Modules

- **Main App** (`main.js`): Coordinates all modules and manages application state
- **Shader Compiler** (`shader-compiler.js`): Handles GLSL compilation and error reporting
- **Image Handler** (`image-handler.js`): Manages image loading from files, URLs, and clipboard
- **UI Controls** (`ui-controls.js`): Handles all user interface interactions
- **Export Utils** (`export-utils.js`): Provides image and animation export functionality
- **Storage Manager** (`storage-manager.js`): Manages save slots and application persistence
- **WebGL Utils** (`webgl-utils.js`): Low-level WebGL operations and utilities

## Build System

The project includes a Node.js-based build system:

### Commands
- `npm run build` - Build single-file version for distribution
- `npm run dev` - Build and watch for changes during development
- `npm run clean` - Clean build artifacts
- `npm run serve` - Serve the built version locally
- `npm run serve-dev` - Serve the development version locally

### Production Build
```bash
NODE_ENV=production npm run build
```
This enables minification for smaller file sizes.

## Usage

### Loading Images
- **File Upload**: Click "Load Image" or drag & drop image files
- **URL Loading**: Enter image URL in the text field
- **Clipboard**: Paste images directly (Ctrl+V)

### Shader Development
1. Write GLSL fragment shader code in the editor
2. Click "Apply/Update Shader" to compile and apply
3. Use "Toggle Shader" to compare with/without effects
4. Save shaders to slots for quick access

### Save Slots
- **Left click**: Save to empty slot or load from filled slot
- **Right click**: Clear slot (with confirmation)
- **Mobile**: Tap to save/load, hold to clear

### Exporting
- **Images**: PNG (with alpha) or JPG format
- **Animations**: WebM video with customizable settings
- **Settings**: FPS, bitrate, duration, start time

### Keyboard Shortcuts
- `Space`: Pause/resume time
- `F`: Open fullscreen preview
- `Ctrl+R`: Recompile shader
- `Ctrl+Z`: Undo
- `Ctrl+Shift+Z`: Redo
- `Escape`: Exit fullscreen

## Shader Development

### Available Uniforms
```glsl
uniform sampler2D tex;  // Input image texture
uniform float time;     // Time in seconds since start
```

### Available Varyings
```glsl
varying vec2 v_texcoord; // Texture coordinates (0.0-1.0)
```

### Basic Shader Template
```glsl
precision mediump float;
varying vec2 v_texcoord;
uniform sampler2D tex;
uniform float time;

void main() {
    vec4 color = texture2D(tex, v_texcoord);
    
    // Apply your effects here
    // Example: Simple color inversion
    color.rgb = 1.0 - color.rgb;
    
    gl_FragColor = color;
}
```

### Example Effects
Check `src/shaders/cool-stuff.glsl` for advanced effects including:
- Chromatic aberration
- Bloom lighting
- VHS-style glitch effects
- Color temperature adjustment
- Scanlines and retro effects

## Browser Compatibility

- **Modern browsers** with WebGL support
- **Chrome/Edge**: Full feature support
- **Firefox**: Full feature support
- **Safari**: Most features (some export limitations)
- **Mobile browsers**: Touch-optimized interface

## Development

### Project Structure
The modular design makes it easy to:
- Add new features in isolated modules
- Maintain and debug specific functionality
- Extend export formats
- Add new shader effects
- Customize the UI

### Adding New Modules
1. Create your module in `src/js/`
2. Add it to the build order in `build.js`
3. Include it in `src/index.html`
4. Import/use it in `main.js`

### Debugging
- Open browser developer tools
- Check the console for WebGL and JavaScript errors
- Use the built-in application console for shader compilation errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes in the `src/` directory
4. Test with `npm run serve-dev`
5. Build and test the single-file version with `npm run build && npm run serve`
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Credits

Originally created with AI assistance (Claude 3.7), now modularized for better maintainability and development experience.

## Changelog

### v1.0.0 (Modular Rewrite)
- ✨ Complete modular architecture
- 🏗️ Node.js build system
- 📱 Improved mobile support
- 🎨 Enhanced UI controls
- 🚀 Better performance and maintainability
- 📦 Single-file distribution option
- 🔧 Development server support