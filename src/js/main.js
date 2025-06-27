// ==================== MAIN APPLICATION ====================

/**
 * Main GLSL Image Shader Application
 */

class GLSLWebUIApp {
    constructor() {
        // Initialize core modules
        this.setupLogger();
        this.initializeElements();
        this.initializeState();
        this.initializeModules();
        this.setupEventListeners();
        this.loadInitialShader();
    }

    /**
     * Setup logging functionality
     */
    setupLogger() {
        this.consoleEl = document.getElementById('console');
        this.log = (message, type = 'info') => {
            const timestamp = new Date().toLocaleTimeString();
            const formatted = `[${timestamp}] [${type.toUpperCase()}] ${message}`;

            console[type === 'error' ? 'error' : 'log'](message);
            if (this.consoleEl) {
                this.consoleEl.innerHTML += formatted + '\n';
                this.consoleEl.scrollTop = this.consoleEl.scrollHeight;
            }
        };
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.canvas = document.getElementById('canvas');
        this.fsCanvas = document.getElementById('fullscreenCanvas');
        this.canvasContainer = document.getElementById('canvasContainer');
        this.fsContainer = document.getElementById('fullscreenContainer');
        this.codeTextarea = document.getElementById('shaderCode');

        // Initialize WebGL contexts
        this.gl = this.canvas?.getContext('webgl');
        this.fsGl = null;

        if (!this.gl) {
            this.log('WebGL not supported!', 'error');
            return;
        }

        setupWebGLDefaults(this.gl);
        this.log('WebGL initialized successfully');
    }

    /**
     * Initialize application state
     */
    initializeState() {
        this.image = null;
        this.imageTexture = null;
        this.program = null;
        this.startTime = Date.now();
        this.pausedTime = null;
        this.animFrame = null;
        this.fsAnimFrame = null;
        this.buffers = null;
        this.timePaused = false;
        this.fsTimePaused = false;
        this.shaderActive = true;

        // Transform state
        this.rotation = 0;
        this.mirrorX = false;
        this.mirrorY = false;
        this.canvasState = { x: 0, y: 0, width: 0, height: 0 };
        this.zoomLevel = 1;
        this.bgColor = '#000000';
        this.useTransparent = true;
        this.useExportAlpha = false;

        // History state
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;
    }

    /**
     * Initialize modules
     */
    initializeModules() {
        this.shaderCompiler = new ShaderCompiler(this.gl, this.log);
        this.imageHandler = new ImageHandler(this.log);
        this.exportUtils = new ExportUtils(this.log);
        this.storageManager = new StorageManager(this.log);
        this.uiControls = new UIControls(this);

        // Initialize storage and buffers
        this.storageManager.init();
        this.buffers = initBuffers(this.gl);

        // Set up image handler callbacks
        this.imageHandler.onImageLoaded((image) => {
            this.onImageLoaded(image);
        });

        this.imageHandler.onImageUnloaded(() => {
            this.onImageUnloaded();
        });
    }

    /**
     * Setup additional event listeners
     */
    setupEventListeners() {
        // Shader compilation
        const updateShaderBtn = document.getElementById('updateShader');
        if (updateShaderBtn) {
            updateShaderBtn.addEventListener('click', () => {
                this.compileShader();
            });
        }

        // Toggle shader
        const toggleShaderBtn = document.getElementById('toggleShader');
        if (toggleShaderBtn) {
            toggleShaderBtn.addEventListener('click', () => {
                this.toggleShader();
            });
        }

        // Canvas settings
        const applyBgBtn = document.getElementById('applyBackground');
        if (applyBgBtn) {
            applyBgBtn.addEventListener('click', () => {
                const bgColorInput = document.getElementById('canvasBackground');
                this.setBackgroundColor(bgColorInput.value);
            });
        }

        const transparentCanvas = document.getElementById('transparentCanvas');
        if (transparentCanvas) {
            transparentCanvas.addEventListener('change', () => {
                this.setTransparentCanvas(transparentCanvas.checked);
            });
        }

        // Image unload
        const unloadImageBtn = document.getElementById('unloadImage');
        if (unloadImageBtn) {
            unloadImageBtn.addEventListener('click', () => {
                this.unloadImage();
            });
        }
    }

    /**
     * Load initial shader
     */
    loadInitialShader() {
        this.compileDefaultShader();
        this.startRendering();
    }

    /**
     * Compile the default shader
     */
    compileDefaultShader() {
        this.program = this.shaderCompiler.compileDefaultShader();
        if (this.program) {
            this.shaderCompiler.useProgram();
            this.log('Default shader compiled successfully');
        }
        this.render();
    }

    /**
     * Compile custom shader from textarea
     */
    compileShader() {
        const fragmentSource = this.codeTextarea?.value.trim();
        if (!fragmentSource) {
            this.log('Shader code is empty!', 'error');
            return;
        }

        const program = this.shaderCompiler.compileProgram(
            getDefaultVertexShader(),
            fragmentSource
        );

        if (program) {
            this.program = program;
            this.shaderCompiler.useProgram();
            this.resetTime();
            this.render();
            this.saveToHistory();
            this.updateUI();
        }
    }

    /**
     * Toggle shader on/off
     */
    toggleShader() {
        this.shaderActive = !this.shaderActive;
        if (this.shaderActive) {
            this.log('Shader enabled');
            this.compileShader();
        } else {
            this.log('Shader disabled');
            this.compileDefaultShader();
        }
        this.updateUI();
    }

    /**
     * Load image from file
     */
    async loadImageFromFile(file) {
        try {
            const image = await this.imageHandler.loadImageFromFile(file);
            this.updateUI();
        } catch (error) {
            this.log(`Failed to load image: ${error.message}`, 'error');
        }
    }

    /**
     * Load image from URL
     */
    async loadImageFromUrl(url) {
        try {
            const image = await this.imageHandler.loadImageFromUrl(url);
            this.updateUI();
        } catch (error) {
            this.log(`Failed to load image from URL: ${error.message}`, 'error');
        }
    }

    /**
     * Unload current image
     */
    unloadImage() {
        this.imageHandler.unloadImage();
        this.updateUI();
    }

    /**
     * Handle image loaded event
     */
    onImageLoaded(image) {
        this.image = image;
        this.canvas.width = image.width;
        this.canvas.height = image.height;

        // Update canvas state
        this.canvasState = {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height
        };

        // Create WebGL texture
        if (this.imageTexture) {
            this.gl.deleteTexture(this.imageTexture);
        }
        this.imageTexture = createImageTexture(this.gl, image);

        this.updateCanvasDisplay();
        this.render();
        this.saveToHistory();
    }

    /**
     * Handle image unloaded event
     */
    onImageUnloaded() {
        this.image = null;
        if (this.imageTexture) {
            this.gl.deleteTexture(this.imageTexture);
            this.imageTexture = null;
        }
        this.stopRendering();
    }

    /**
     * Set background color
     */
    setBackgroundColor(color) {
        this.bgColor = color;
        this.updateCanvasDisplay();
        this.render();
        this.log(`Background color set to ${color}`);
    }

    /**
     * Set transparent canvas mode
     */
    setTransparentCanvas(transparent) {
        this.useTransparent = transparent;
        this.canvasContainer.classList.toggle('transparent', transparent);
        this.updateCanvasDisplay();
        this.render();
        this.log(`Transparent canvas ${transparent ? 'enabled' : 'disabled'}`);
    }

    /**
     * Set zoom level
     */
    setZoom(zoom) {
        this.zoomLevel = Math.max(0.1, Math.min(5, zoom));
        this.updateCanvasDisplay();
        this.log(`Zoom set to ${this.zoomLevel}x`);
    }

    /**
     * Set rotation
     */
    setRotation(degrees) {
        this.rotation = degrees % 360;
        this.updateTransform();
        this.render();
        this.saveToHistory();
        this.log(`Rotation set to ${this.rotation}°`);
    }

    /**
     * Toggle X mirror
     */
    toggleMirrorX() {
        this.mirrorX = !this.mirrorX;
        this.updateTransform();
        this.render();
        this.saveToHistory();
        this.log(`Mirror X ${this.mirrorX ? 'enabled' : 'disabled'}`);
    }

    /**
     * Toggle Y mirror
     */
    toggleMirrorY() {
        this.mirrorY = !this.mirrorY;
        this.updateTransform();
        this.render();
        this.saveToHistory();
        this.log(`Mirror Y ${this.mirrorY ? 'enabled' : 'disabled'}`);
    }

    /**
     * Reset mirror settings
     */
    resetMirror() {
        this.mirrorX = false;
        this.mirrorY = false;
        this.updateTransform();
        this.render();
        this.saveToHistory();
        this.log('Mirror settings reset');
    }

    /**
     * Apply aspect ratio
     */
    applyAspectRatio(width, height) {
        if (!this.image || width <= 0 || height <= 0) return;

        const aspectRatio = width / height;
        const imageAspect = this.image.width / this.image.height;

        if (aspectRatio > imageAspect) {
            // Fit to height
            this.canvasState.height = this.image.height;
            this.canvasState.width = this.image.height * aspectRatio;
        } else {
            // Fit to width
            this.canvasState.width = this.image.width;
            this.canvasState.height = this.image.width / aspectRatio;
        }

        this.canvas.width = this.canvasState.width;
        this.canvas.height = this.canvasState.height;
        this.updateCanvasDisplay();
        this.render();
        this.saveToHistory();
        this.log(`Applied aspect ratio ${width}:${height}`);
    }

    /**
     * Set canvas transform
     */
    setCanvasTransform(transform) {
        Object.assign(this.canvasState, transform);
        this.canvas.width = this.canvasState.width || this.canvas.width;
        this.canvas.height = this.canvasState.height || this.canvas.height;
        this.updateCanvasDisplay();
        this.render();
        this.saveToHistory();
    }

    /**
     * Reset canvas transform
     */
    resetCanvasTransform() {
        if (this.image) {
            this.canvasState = {
                x: 0,
                y: 0,
                width: this.image.width,
                height: this.image.height
            };
            this.canvas.width = this.image.width;
            this.canvas.height = this.image.height;
            this.updateCanvasDisplay();
            this.render();
            this.saveToHistory();
            this.log('Canvas transform reset');
        }
    }

    /**
     * Toggle pause/resume
     */
    togglePause() {
        this.timePaused = !this.timePaused;

        if (this.timePaused) {
            this.pausedTime = (Date.now() - this.startTime) / 1000.0;
        } else {
            this.pausedTime = null;
            this.startTime = Date.now();
        }

        this.updateUI();
        this.log(`Time ${this.timePaused ? 'paused' : 'resumed'}`);
    }

    /**
     * Toggle fullscreen pause
     */
    toggleFullscreenPause() {
        this.fsTimePaused = !this.fsTimePaused;

        if (this.fsGl) {
            if (this.fsAnimFrame) {
                cancelAnimationFrame(this.fsAnimFrame);
            }
            if (!this.fsTimePaused) {
                this.animateFullscreen();
            } else {
                this.renderFullscreen();
            }
        }

        this.updateUI();
    }

    /**
     * Reset time
     */
    resetTime() {
        this.startTime = Date.now();
        this.pausedTime = null;
        this.timePaused = false;
    }

    /**
     * Update transform
     */
    updateTransform() {
        if (!this.buffers || !this.image) return;

        const texCoords = getTransformedTexCoords(
            this.rotation,
            this.mirrorX,
            this.mirrorY
        );

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.texCoord);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW);
    }

    /**
     * Update canvas display
     */
    updateCanvasDisplay() {
        if (!this.canvas) return;

        this.canvas.style.transform = `scale(${this.zoomLevel})`;
        this.canvas.style.backgroundColor = this.useTransparent ? 'transparent' : this.bgColor;

        if (this.gl) {
            resizeCanvas(this.gl, this.canvas, this.canvas.width, this.canvas.height);
        }
    }

    /**
     * Start rendering loop
     */
    startRendering() {
        if (this.animFrame) {
            cancelAnimationFrame(this.animFrame);
        }
        this.animate();
    }

    /**
     * Stop rendering loop
     */
    stopRendering() {
        if (this.animFrame) {
            cancelAnimationFrame(this.animFrame);
            this.animFrame = null;
        }
    }

    /**
     * Animation loop
     */
    animate() {
        this.render();
        this.animFrame = requestAnimationFrame(() => this.animate());
    }

    /**
     * Render frame
     */
    render() {
        if (!this.gl || !this.program || !this.buffers) return;

        const currentTime = this.timePaused ?
            this.pausedTime :
            (Date.now() - this.startTime) / 1000.0;

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.shaderCompiler.useProgram();

        // Set uniforms
        this.shaderCompiler.setUniform('time', currentTime, '1f');

        if (this.imageTexture) {
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.imageTexture);
            this.shaderCompiler.setUniform('tex', 0, '1i');
        }

        // Set attributes
        const posLocation = this.shaderCompiler.getAttributeLocation('a_position');
        const texLocation = this.shaderCompiler.getAttributeLocation('a_texcoord');

        if (posLocation >= 0) {
            bindAttribute(this.gl, this.buffers.position, posLocation, 2);
        }
        if (texLocation >= 0) {
            bindAttribute(this.gl, this.buffers.texCoord, texLocation, 2);
        }

        renderQuad(this.gl);
    }

    /**
     * Open fullscreen preview
     */
    openFullscreen() {
        if (!this.image) return;

        this.fsContainer.style.display = 'flex';
        this.fsTimePaused = false;

        this.fsCanvas.width = this.canvas.width;
        this.fsCanvas.height = this.canvas.height;

        if (!this.fsGl) {
            this.fsGl = this.fsCanvas.getContext('webgl');
            if (!this.fsGl) {
                this.log('Failed to initialize fullscreen WebGL context', 'error');
                return;
            }
            setupWebGLDefaults(this.fsGl);
        }

        this.setupFullscreenCanvas();
        this.animateFullscreen();
    }

    /**
     * Close fullscreen preview
     */
    closeFullscreen() {
        this.fsContainer.style.display = 'none';
        if (this.fsAnimFrame) {
            cancelAnimationFrame(this.fsAnimFrame);
            this.fsAnimFrame = null;
        }
    }

    /**
     * Setup fullscreen canvas
     */
    setupFullscreenCanvas() {
        // Implementation similar to main canvas setup
        // This is simplified - full implementation would mirror main canvas setup
    }

    /**
     * Animate fullscreen
     */
    animateFullscreen() {
        if (!this.fsTimePaused) {
            this.renderFullscreen();
            this.fsAnimFrame = requestAnimationFrame(() => this.animateFullscreen());
        }
    }

    /**
     * Render fullscreen
     */
    renderFullscreen() {
        // Implementation similar to main render
        // This is simplified - full implementation would mirror main render
    }

    /**
     * Export image
     */
    exportImage(format, withAlpha = false) {
        this.exportUtils.exportImage(this.canvas, format, withAlpha);
    }

    /**
     * Export animation
     */
    exportAnimation(options) {
        this.exportUtils.exportAnimation(this.canvas, {
            ...options,
            renderCallback: (time) => {
                // Update time and render frame
                this.pausedTime = time;
                this.render();
            }
        });
    }

    /**
     * Save to history
     */
    saveToHistory() {
        const state = {
            shaderCode: this.codeTextarea?.value || '',
            rotation: this.rotation,
            mirrorX: this.mirrorX,
            mirrorY: this.mirrorY,
            canvasState: { ...this.canvasState },
            zoomLevel: this.zoomLevel,
            bgColor: this.bgColor,
            useTransparent: this.useTransparent
        };

        this.history.push(state);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        this.historyIndex = this.history.length - 1;
        this.updateUI();
    }

    /**
     * Undo last action
     */
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.applyHistoryState(this.history[this.historyIndex]);
            this.log('Undo performed');
        }
    }

    /**
     * Redo last undone action
     */
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.applyHistoryState(this.history[this.historyIndex]);
            this.log('Redo performed');
        }
    }

    /**
     * Apply history state
     */
    applyHistoryState(state) {
        if (this.codeTextarea) {
            this.codeTextarea.value = state.shaderCode;
        }
        this.rotation = state.rotation;
        this.mirrorX = state.mirrorX;
        this.mirrorY = state.mirrorY;
        this.canvasState = { ...state.canvasState };
        this.zoomLevel = state.zoomLevel;
        this.bgColor = state.bgColor;
        this.useTransparent = state.useTransparent;

        this.updateTransform();
        this.updateCanvasDisplay();
        this.compileShader();
        this.updateUI();
    }

    /**
     * Reset all parameters
     */
    resetAllParameters() {
        this.rotation = 0;
        this.mirrorX = false;
        this.mirrorY = false;
        this.zoomLevel = 1;
        this.bgColor = '#000000';
        this.useTransparent = true;

        if (this.image) {
            this.canvasState = {
                x: 0,
                y: 0,
                width: this.image.width,
                height: this.image.height
            };
        }

        this.updateTransform();
        this.updateCanvasDisplay();
        this.render();
        this.saveToHistory();
        this.updateUI();
        this.log('All parameters reset to defaults');
    }

    /**
     * Update UI state
     */
    updateUI() {
        const state = {
            hasImage: !!this.image,
            shaderActive: this.shaderActive,
            timePaused: this.timePaused,
            canUndo: this.historyIndex > 0,
            canRedo: this.historyIndex < this.history.length - 1,
            canvasState: this.canvasState,
            zoomLevel: this.zoomLevel,
            rotation: this.rotation,
            mirrorX: this.mirrorX,
            mirrorY: this.mirrorY
        };

        if (this.uiControls) {
            this.uiControls.updateUI(state);
        }
    }
}

// ==================== INITIALIZATION ====================

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.glslApp = new GLSLWebUIApp();
});
