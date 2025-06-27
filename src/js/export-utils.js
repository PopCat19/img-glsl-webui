// ==================== EXPORT UTILITIES ====================

/**
 * Export utilities for saving images and animations
 */

class ExportUtils {
    constructor(logger) {
        this.log = logger || console.log;
    }

    /**
     * Exports the current canvas as an image
     * @param {HTMLCanvasElement} canvas - Canvas to export
     * @param {string} format - Export format ('png' or 'jpg')
     * @param {boolean} withAlpha - Include alpha channel (PNG only)
     * @param {string} filename - Custom filename (optional)
     */
    exportImage(canvas, format = 'png', withAlpha = false, filename = null) {
        if (!canvas) {
            this.log("No canvas to export!", "error");
            return;
        }

        try {
            let mimeType, extension, quality;

            switch (format.toLowerCase()) {
                case 'png':
                    mimeType = 'image/png';
                    extension = 'png';
                    quality = undefined; // PNG doesn't use quality
                    break;
                case 'jpg':
                case 'jpeg':
                    mimeType = 'image/jpeg';
                    extension = 'jpg';
                    quality = 0.95;
                    withAlpha = false; // JPEG doesn't support alpha
                    break;
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }

            // Create a temporary canvas if we need to handle alpha
            let exportCanvas = canvas;
            if (format === 'jpg' || !withAlpha) {
                exportCanvas = this.createOpaqueCanvas(canvas);
            }

            // Generate data URL
            const dataURL = exportCanvas.toDataURL(mimeType, quality);

            // Create download link
            const link = document.createElement('a');
            link.download = filename || `shader_export_${Date.now()}.${extension}`;
            link.href = dataURL;

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.log(`Image exported as ${format.toUpperCase()}: ${link.download}`);

            // Clean up temporary canvas
            if (exportCanvas !== canvas) {
                exportCanvas.remove();
            }

        } catch (error) {
            this.log(`Error exporting image: ${error.message}`, "error");
        }
    }

    /**
     * Exports an animation as WebM video
     * @param {HTMLCanvasElement} canvas - Canvas to record
     * @param {Object} options - Export options
     */
    async exportAnimation(canvas, options = {}) {
        const {
            duration = 5,
            fps = 30,
            startTime = 0,
            bitrate = 5,
            filename = null,
            onProgress = null,
            renderCallback = null
        } = options;

        if (!canvas) {
            this.log("No canvas to export!", "error");
            return;
        }

        try {
            // Check MediaRecorder support
            if (!MediaRecorder.isTypeSupported('video/webm')) {
                throw new Error('WebM recording not supported in this browser');
            }

            this.log(`Starting animation export: ${duration * fps} frames at ${fps} fps, starting at ${startTime}s...`);

            // Set up MediaRecorder
            const stream = canvas.captureStream(fps);
            const recorder = new MediaRecorder(stream, {
                mimeType: 'video/webm',
                videoBitsPerSecond: bitrate * 1000000
            });

            // Promise to handle recording completion
            const recordingPromise = new Promise((resolve, reject) => {
                const chunks = [];

                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        chunks.push(e.data);
                    }
                };

                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'video/webm' });
                    resolve(blob);
                };

                recorder.onerror = (e) => {
                    reject(new Error(`Recording error: ${e.error}`));
                };

                // Start recording
                recorder.start();
            });

            // Render frames for animation
            const totalFrames = Math.floor(duration * fps);
            const frameInterval = 1 / fps;

            for (let frame = 0; frame < totalFrames; frame++) {
                const currentTime = startTime + (frame * frameInterval);

                // Call render callback if provided
                if (renderCallback) {
                    renderCallback(currentTime);
                }

                // Update progress
                if (onProgress) {
                    onProgress(frame / totalFrames);
                }

                // Wait for frame interval
                await this.sleep(1000 / fps);
            }

            // Stop recording
            recorder.stop();

            // Wait for recording to complete
            const blob = await recordingPromise;

            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename || `shader_animation_${Date.now()}.webm`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.log(`Animation exported as WebM: ${link.download}`);

            // Clean up
            setTimeout(() => URL.revokeObjectURL(url), 1000);

        } catch (error) {
            this.log(`Error exporting animation: ${error.message}`, "error");
            throw error;
        }
    }

    /**
     * Creates an opaque version of a canvas (removes transparency)
     * @param {HTMLCanvasElement} sourceCanvas - Source canvas
     * @param {string} backgroundColor - Background color for transparent areas
     * @returns {HTMLCanvasElement} New canvas without transparency
     */
    createOpaqueCanvas(sourceCanvas, backgroundColor = '#000000') {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        tempCanvas.width = sourceCanvas.width;
        tempCanvas.height = sourceCanvas.height;

        // Fill with background color
        tempCtx.fillStyle = backgroundColor;
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Draw the source canvas on top
        tempCtx.drawImage(sourceCanvas, 0, 0);

        return tempCanvas;
    }

    /**
     * Utility function to create a delay
     * @param {number} ms - Milliseconds to wait
     * @returns {Promise} Promise that resolves after the delay
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generates a filename with timestamp
     * @param {string} prefix - Filename prefix
     * @param {string} extension - File extension
     * @returns {string} Generated filename
     */
    generateFilename(prefix = 'export', extension = 'png') {
        const timestamp = new Date().toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .split('.')[0];
        return `${prefix}_${timestamp}.${extension}`;
    }

    /**
     * Converts canvas to different image formats
     * @param {HTMLCanvasElement} canvas - Source canvas
     * @param {string} format - Target format
     * @param {number} quality - Image quality (0-1)
     * @returns {Promise<Blob>} Promise that resolves with the converted blob
     */
    async convertCanvas(canvas, format = 'png', quality = 0.95) {
        return new Promise((resolve, reject) => {
            let mimeType;

            switch (format.toLowerCase()) {
                case 'png':
                    mimeType = 'image/png';
                    break;
                case 'jpg':
                case 'jpeg':
                    mimeType = 'image/jpeg';
                    break;
                case 'webp':
                    mimeType = 'image/webp';
                    break;
                default:
                    reject(new Error(`Unsupported format: ${format}`));
                    return;
            }

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to convert canvas to blob'));
                }
            }, mimeType, quality);
        });
    }

    /**
     * Batch export multiple frames as images
     * @param {HTMLCanvasElement} canvas - Canvas to export
     * @param {Object} options - Export options
     */
    async exportFrameSequence(canvas, options = {}) {
        const {
            duration = 5,
            fps = 30,
            startTime = 0,
            format = 'png',
            withAlpha = false,
            filenamePrefix = 'frame',
            onProgress = null,
            renderCallback = null
        } = options;

        if (!canvas) {
            this.log("No canvas to export!", "error");
            return;
        }

        try {
            const totalFrames = Math.floor(duration * fps);
            const frameInterval = 1 / fps;
            const frames = [];

            this.log(`Exporting ${totalFrames} frames as image sequence...`);

            for (let frame = 0; frame < totalFrames; frame++) {
                const currentTime = startTime + (frame * frameInterval);

                // Call render callback if provided
                if (renderCallback) {
                    renderCallback(currentTime);
                }

                // Export current frame
                const frameNumber = frame.toString().padStart(6, '0');
                const filename = `${filenamePrefix}_${frameNumber}.${format}`;

                // Convert to blob
                const blob = await this.convertCanvas(canvas, format);

                frames.push({
                    filename,
                    blob,
                    url: URL.createObjectURL(blob)
                });

                // Update progress
                if (onProgress) {
                    onProgress(frame / totalFrames);
                }
            }

            // Create and download a ZIP file with all frames
            if (typeof JSZip !== 'undefined') {
                await this.downloadFramesAsZip(frames, `${filenamePrefix}_sequence.zip`);
            } else {
                // Download frames individually if JSZip is not available
                for (const frame of frames) {
                    this.downloadBlob(frame.blob, frame.filename);
                    await this.sleep(100); // Small delay between downloads
                }
            }

            this.log(`Frame sequence export complete: ${totalFrames} frames`);

            // Clean up URLs
            frames.forEach(frame => URL.revokeObjectURL(frame.url));

        } catch (error) {
            this.log(`Error exporting frame sequence: ${error.message}`, "error");
            throw error;
        }
    }

    /**
     * Downloads a blob as a file
     * @param {Blob} blob - Blob to download
     * @param {string} filename - Filename for download
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    /**
     * Downloads multiple frames as a ZIP file (requires JSZip library)
     * @param {Array} frames - Array of frame objects
     * @param {string} zipFilename - ZIP filename
     */
    async downloadFramesAsZip(frames, zipFilename) {
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip library is required for ZIP export');
        }

        const zip = new JSZip();

        // Add all frames to ZIP
        for (const frame of frames) {
            zip.file(frame.filename, frame.blob);
        }

        // Generate ZIP file
        const zipBlob = await zip.generateAsync({ type: 'blob' });

        // Download ZIP
        this.downloadBlob(zipBlob, zipFilename);
    }

    /**
     * Gets the supported export formats for the current browser
     * @returns {Array} Array of supported format objects
     */
    getSupportedFormats() {
        const canvas = document.createElement('canvas');
        const formats = [];

        // Test PNG support (should always be supported)
        try {
            canvas.toDataURL('image/png');
            formats.push({ format: 'png', name: 'PNG', hasAlpha: true });
        } catch (e) {
            // PNG not supported (very unlikely)
        }

        // Test JPEG support
        try {
            canvas.toDataURL('image/jpeg');
            formats.push({ format: 'jpg', name: 'JPEG', hasAlpha: false });
        } catch (e) {
            // JPEG not supported
        }

        // Test WebP support
        try {
            canvas.toDataURL('image/webp');
            formats.push({ format: 'webp', name: 'WebP', hasAlpha: true });
        } catch (e) {
            // WebP not supported
        }

        // Test WebM video support
        if (MediaRecorder.isTypeSupported('video/webm')) {
            formats.push({ format: 'webm', name: 'WebM Video', hasAlpha: false });
        }

        return formats;
    }
}
