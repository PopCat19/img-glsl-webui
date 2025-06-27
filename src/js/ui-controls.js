// ==================== UI CONTROLS ====================

/**
 * UI controls and event handlers module
 */

class UIControls {
    constructor(app) {
        this.app = app;
        this.isDragging = false;
        this.dragTargetInput = null;
        this.dragStartX = 0;
        this.dragStartValue = 0;
        this.dragStep = 0.1;
        this.dragSensitivity = 2;
        this.dragPixelsPerStep = 10;

        this.init();
    }

    /**
     * Initialize all UI controls and event listeners
     */
    init() {
        this.setupImageControls();
        this.setupShaderControls();
        this.setupCanvasControls();
        this.setupTransformControls();
        this.setupExportControls();
        this.setupDragAndDrop();
        this.setupKeyboardShortcuts();
        this.setupNumberInputDragging();
        this.setupFullscreenControls();
    }

    /**
     * Setup image loading controls
     */
    setupImageControls() {
        const loadImageBtn = document.getElementById('loadImage');
        const unloadImageBtn = document.getElementById('unloadImage');
        const imageInput = document.getElementById('imageInput');
        const externalImageUrl = document.getElementById('externalImageUrl');
        const loadImageByUrl = document.getElementById('loadImageByUrl');
        const clearExternalUrl = document.getElementById('clearExternalUrl');

        // Load image button
        loadImageBtn.addEventListener('click', () => {
            imageInput.click();
        });

        // Image file input
        imageInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.app.loadImageFromFile(e.target.files[0]);
            }
        });

        // Unload image button
        unloadImageBtn.addEventListener('click', () => {
            this.app.unloadImage();
        });

        // External URL input
        externalImageUrl.addEventListener('input', () => {
            const url = externalImageUrl.value.trim();
            const isValid = this.isValidImageUrl(url);

            loadImageByUrl.style.display = isValid ? 'inline-block' : 'none';
            clearExternalUrl.style.display = url ? 'inline-block' : 'none';
        });

        externalImageUrl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const url = externalImageUrl.value.trim();
                if (this.isValidImageUrl(url)) {
                    this.app.loadImageFromUrl(url);
                }
            }
        });

        // Load by URL button
        loadImageByUrl.addEventListener('click', () => {
            const url = externalImageUrl.value.trim();
            this.app.loadImageFromUrl(url);
        });

        // Clear URL button
        clearExternalUrl.addEventListener('click', () => {
            externalImageUrl.value = '';
            loadImageByUrl.style.display = 'none';
            clearExternalUrl.style.display = 'none';
        });
    }

    /**
     * Setup shader controls
     */
    setupShaderControls() {
        const updateShaderBtn = document.getElementById('updateShader');
        const toggleShaderBtn = document.getElementById('toggleShader');
        const loadShaderBtn = document.getElementById('loadShader');
        const shaderInput = document.getElementById('shaderInput');
        const pauseTimeBtn = document.getElementById('pauseTime');
        const undoBtn = document.getElementById('undoButton');
        const redoBtn = document.getElementById('redoButton');

        // Update shader
        updateShaderBtn.addEventListener('click', () => {
            this.app.compileShader();
        });

        // Toggle shader
        toggleShaderBtn.addEventListener('click', () => {
            this.app.toggleShader();
        });

        // Load shader file
        loadShaderBtn.addEventListener('click', () => {
            shaderInput.click();
        });

        shaderInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.loadShaderFile(e.target.files[0]);
            }
        });

        // Pause time
        pauseTimeBtn.addEventListener('click', () => {
            this.app.togglePause();
        });

        // History controls
        undoBtn.addEventListener('click', () => {
            this.app.undo();
        });

        redoBtn.addEventListener('click', () => {
            this.app.redo();
        });
    }

    /**
     * Setup canvas controls
     */
    setupCanvasControls() {
        const bgColorInput = document.getElementById('canvasBackground');
        const bgColorPreview = document.getElementById('bgColorPreview');
        const applyBgBtn = document.getElementById('applyBackground');
        const transparentCanvas = document.getElementById('transparentCanvas');
        const zoomInput = document.getElementById('zoomInput');
        const resetZoomBtn = document.getElementById('resetZoom');

        // Background color
        bgColorInput.addEventListener('input', () => {
            bgColorPreview.style.backgroundColor = bgColorInput.value;
        });

        applyBgBtn.addEventListener('click', () => {
            this.app.setBackgroundColor(bgColorInput.value);
        });

        // Transparent canvas
        transparentCanvas.addEventListener('change', () => {
            this.app.setTransparentCanvas(transparentCanvas.checked);
        });

        // Zoom controls
        zoomInput.addEventListener('input', () => {
            this.app.setZoom(parseFloat(zoomInput.value));
        });

        resetZoomBtn.addEventListener('click', () => {
            zoomInput.value = '1';
            this.app.setZoom(1);
        });
    }

    /**
     * Setup transform controls
     */
    setupTransformControls() {
        const canvasX = document.getElementById('canvasX');
        const canvasY = document.getElementById('canvasY');
        const canvasWidth = document.getElementById('canvasWidth');
        const canvasHeight = document.getElementById('canvasHeight');
        const resetCanvasBtn = document.getElementById('resetCanvas');

        const aspectW = document.getElementById('aspectW');
        const aspectH = document.getElementById('aspectH');
        const applyAspectBtn = document.getElementById('applyAspect');
        const resetAspectBtn = document.getElementById('resetAspect');

        const rotationPresets = document.querySelectorAll('.rotation-preset');
        const resetRotationBtn = document.getElementById('resetRotation');

        const mirrorXBtn = document.getElementById('mirrorX');
        const mirrorYBtn = document.getElementById('mirrorY');
        const resetMirrorBtn = document.getElementById('resetMirror');

        // Canvas position/size
        [canvasX, canvasY, canvasWidth, canvasHeight].forEach(input => {
            input.addEventListener('input', () => {
                this.updateCanvasTransform();
            });
        });

        resetCanvasBtn.addEventListener('click', () => {
            this.app.resetCanvasTransform();
        });

        // Aspect ratio
        applyAspectBtn.addEventListener('click', () => {
            const w = parseInt(aspectW.value);
            const h = parseInt(aspectH.value);
            if (w > 0 && h > 0) {
                this.app.applyAspectRatio(w, h);
            }
        });

        resetAspectBtn.addEventListener('click', () => {
            aspectW.value = '16';
            aspectH.value = '9';
        });

        // Rotation presets
        rotationPresets.forEach(btn => {
            btn.addEventListener('click', () => {
                const rotation = parseInt(btn.dataset.rotation);
                this.app.setRotation(rotation);
                this.updateRotationUI(rotation);
            });
        });

        resetRotationBtn.addEventListener('click', () => {
            this.app.setRotation(0);
            this.updateRotationUI(0);
        });

        // Mirror controls
        mirrorXBtn.addEventListener('click', () => {
            this.app.toggleMirrorX();
        });

        mirrorYBtn.addEventListener('click', () => {
            this.app.toggleMirrorY();
        });

        resetMirrorBtn.addEventListener('click', () => {
            this.app.resetMirror();
        });
    }

    /**
     * Setup export controls
     */
    setupExportControls() {
        const savePngBtn = document.getElementById('savePNG');
        const saveJpgBtn = document.getElementById('saveJPG');
        const exportMp4Btn = document.getElementById('exportMp4');
        const exportWithAlpha = document.getElementById('exportWithAlpha');
        const resetAllBtn = document.getElementById('resetAllParams');

        // Export image
        savePngBtn.addEventListener('click', () => {
            this.app.exportImage('png', exportWithAlpha.checked);
        });

        saveJpgBtn.addEventListener('click', () => {
            this.app.exportImage('jpg', false);
        });

        // Export animation
        exportMp4Btn.addEventListener('click', () => {
            this.exportAnimation();
        });

        // Reset all parameters
        resetAllBtn.addEventListener('click', () => {
            if (confirm('Reset all parameters to defaults?')) {
                this.app.resetAllParameters();
            }
        });
    }

    /**
     * Setup drag and drop functionality
     */
    setupDragAndDrop() {
        const canvasContainer = document.getElementById('canvasContainer');

        // Drag over
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            canvasContainer.classList.add('drag-over');
        });

        // Drag leave
        document.addEventListener('dragleave', (e) => {
            if (!document.elementFromPoint(e.clientX, e.clientY)) {
                canvasContainer.classList.remove('drag-over');
            }
        });

        // Drop
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            canvasContainer.classList.remove('drag-over');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.app.loadImageFromFile(files[0]);
            }
        });

        // Paste support
        document.addEventListener('paste', (e) => {
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    this.app.loadImageFromFile(file);
                    break;
                }
            }
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not in text input
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
                return;
            }

            switch (e.key) {
                case 'Escape':
                    if (document.getElementById('fullscreenContainer').style.display !== 'none') {
                        this.app.closeFullscreen();
                    }
                    break;
                case ' ':
                    e.preventDefault();
                    this.app.togglePause();
                    break;
                case 'f':
                case 'F':
                    this.app.openFullscreen();
                    break;
                case 'r':
                case 'R':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.app.compileShader();
                    }
                    break;
                case 'z':
                case 'Z':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.app.redo();
                        } else {
                            this.app.undo();
                        }
                    }
                    break;
            }
        });
    }

    /**
     * Setup number input dragging functionality
     */
    setupNumberInputDragging() {
        document.body.addEventListener('mousedown', (e) => {
            if (e.button === 1) { // Middle mouse button
                this.handleDragStart(e);
            }
        });

        document.body.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.handleDragStart(e, true);
            }
        }, { passive: true });

        // Prevent context menu on middle click for number inputs
        document.querySelectorAll('.var-row').forEach(row => {
            row.addEventListener('contextmenu', (e) => {
                if (e.button === 1) {
                    const input = this.findNumberInputForDrag(e.target);
                    if (input) {
                        e.preventDefault();
                    }
                }
            });
        });
    }

    /**
     * Setup fullscreen controls
     */
    setupFullscreenControls() {
        const fullscreenBtn = document.getElementById('fullscreenPreview');
        const exitFullscreenBtn = document.querySelector('.exit-fullscreen');
        const fullscreenPauseBtn = document.getElementById('fullscreenPauseTime');
        const fullscreenContainer = document.getElementById('fullscreenContainer');

        fullscreenBtn.addEventListener('click', () => {
            this.app.openFullscreen();
        });

        exitFullscreenBtn.addEventListener('click', () => {
            this.app.closeFullscreen();
        });

        fullscreenPauseBtn.addEventListener('click', () => {
            this.app.toggleFullscreenPause();
        });

        // Click outside to close
        fullscreenContainer.addEventListener('click', (e) => {
            if (e.target === fullscreenContainer) {
                this.app.closeFullscreen();
            }
        });
    }

    /**
     * Handle drag start for number inputs
     */
    handleDragStart(event, isTouch = false) {
        const input = this.findNumberInputForDrag(event.target);
        if (!input) return;

        this.isDragging = true;
        this.dragTargetInput = input;
        this.dragStartValue = parseFloat(input.value) || 0;
        this.dragStep = this.getDecimalPlaces(input.step || 0.1);

        if (isTouch) {
            this.dragStartX = event.touches[0].clientX;
            document.addEventListener('touchmove', this.handleDragMove.bind(this), { passive: false });
            document.addEventListener('touchend', this.handleDragEnd.bind(this));
            document.addEventListener('touchcancel', this.handleDragEnd.bind(this));
        } else {
            this.dragStartX = event.clientX;
            document.addEventListener('mousemove', this.handleDragMove.bind(this));
            document.addEventListener('mouseup', this.handleDragEnd.bind(this));
            document.addEventListener('mouseleave', this.handleDragEnd.bind(this));
            event.preventDefault();
        }

        document.body.style.cursor = 'ew-resize';
        this.dragTargetInput.closest('.var-row')?.classList.add('dragging');
    }

    /**
     * Handle drag move for number inputs
     */
    handleDragMove(event) {
        if (!this.isDragging || !this.dragTargetInput) return;

        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        const deltaX = clientX - this.dragStartX;
        const steps = Math.floor(deltaX / this.dragPixelsPerStep);
        const newValue = this.dragStartValue + (steps * this.dragStep);

        this.dragTargetInput.value = newValue.toFixed(this.getDecimalPlaces(this.dragStep));
        this.dragTargetInput.dispatchEvent(new Event('input', { bubbles: true }));

        if (event.touches) {
            event.preventDefault();
        }
    }

    /**
     * Handle drag end for number inputs
     */
    handleDragEnd() {
        if (!this.isDragging) return;

        this.isDragging = false;
        document.body.style.cursor = '';
        this.dragTargetInput?.closest('.var-row')?.classList.remove('dragging');

        // Remove event listeners
        document.removeEventListener('mousemove', this.handleDragMove);
        document.removeEventListener('mouseup', this.handleDragEnd);
        document.removeEventListener('mouseleave', this.handleDragEnd);
        document.removeEventListener('touchmove', this.handleDragMove);
        document.removeEventListener('touchend', this.handleDragEnd);
        document.removeEventListener('touchcancel', this.handleDragEnd);

        this.dragTargetInput = null;
    }

    /**
     * Find number input for drag operation
     */
    findNumberInputForDrag(target) {
        let element = target;
        while (element && element !== document.body) {
            if (element.type === 'number' || element.type === 'range') {
                return element;
            }
            element = element.parentElement;
        }
        return null;
    }

    /**
     * Get decimal places for a number
     */
    getDecimalPlaces(value) {
        const str = value.toString();
        const decimalIndex = str.indexOf('.');
        return decimalIndex === -1 ? 0 : str.length - decimalIndex - 1;
    }

    /**
     * Check if URL is a valid image URL
     */
    isValidImageUrl(url) {
        if (!url) return false;
        return /\.(jpeg|jpg|gif|png|webp|bmp|svg)(\?.*)?$/i.test(url) || url.startsWith('data:image/');
    }

    /**
     * Load shader file
     */
    loadShaderFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const shaderCode = document.getElementById('shaderCode');
            shaderCode.value = e.target.result;
            this.app.saveToHistory();
        };
        reader.readAsText(file);
    }

    /**
     * Update canvas transform from UI inputs
     */
    updateCanvasTransform() {
        const x = parseFloat(document.getElementById('canvasX').value) || 0;
        const y = parseFloat(document.getElementById('canvasY').value) || 0;
        const width = parseFloat(document.getElementById('canvasWidth').value) || 0;
        const height = parseFloat(document.getElementById('canvasHeight').value) || 0;

        this.app.setCanvasTransform({ x, y, width, height });
    }

    /**
     * Update rotation UI state
     */
    updateRotationUI(rotation) {
        document.querySelectorAll('.rotation-preset').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.rotation) === rotation);
        });
    }

    /**
     * Export animation with current settings
     */
    exportAnimation() {
        const fps = parseInt(document.getElementById('exportFps').value) || 30;
        const bitrate = parseInt(document.getElementById('exportBitrate').value) || 5;
        const duration = parseInt(document.getElementById('animationDuration').value) || 5;
        const startTime = parseInt(document.getElementById('exportStartTime').value) || 0;

        this.app.exportAnimation({
            fps,
            bitrate,
            duration,
            startTime
        });
    }

    /**
     * Update UI state based on current app state
     */
    updateUI(state) {
        // Update image buttons
        const loadImageBtn = document.getElementById('loadImage');
        const unloadImageBtn = document.getElementById('unloadImage');

        if (state.hasImage) {
            loadImageBtn.textContent = 'Load New Image';
            loadImageBtn.classList.remove('active');
            unloadImageBtn.style.display = 'inline-block';
        } else {
            loadImageBtn.textContent = 'Load Image';
            loadImageBtn.classList.add('active');
            unloadImageBtn.style.display = 'none';
        }

        // Update shader controls
        const toggleShaderBtn = document.getElementById('toggleShader');
        toggleShaderBtn.textContent = state.shaderActive ? 'Disable Shader' : 'Enable Shader';

        // Update pause button
        const pauseTimeBtn = document.getElementById('pauseTime');
        pauseTimeBtn.textContent = state.timePaused ? 'Resume Time' : 'Pause Time';
        pauseTimeBtn.classList.toggle('active', state.timePaused);

        // Update history buttons
        const undoBtn = document.getElementById('undoButton');
        const redoBtn = document.getElementById('redoButton');
        undoBtn.disabled = !state.canUndo;
        redoBtn.disabled = !state.canRedo;

        // Update canvas inputs
        if (state.canvasState) {
            document.getElementById('canvasX').value = state.canvasState.x;
            document.getElementById('canvasY').value = state.canvasState.y;
            document.getElementById('canvasWidth').value = state.canvasState.width;
            document.getElementById('canvasHeight').value = state.canvasState.height;
        }

        // Update zoom
        document.getElementById('zoomInput').value = state.zoomLevel || 1;

        // Update transform controls
        this.updateRotationUI(state.rotation || 0);

        const mirrorXBtn = document.getElementById('mirrorX');
        const mirrorYBtn = document.getElementById('mirrorY');
        mirrorXBtn.classList.toggle('active', state.mirrorX);
        mirrorYBtn.classList.toggle('active', state.mirrorY);
    }
}
