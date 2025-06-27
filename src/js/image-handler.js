// ==================== IMAGE HANDLER ====================

/**
 * Image loading and processing module
 */

class ImageHandler {
    constructor(logger) {
        this.log = logger || console.log;
        this.currentImage = null;
        this.imageCallbacks = [];
    }

    /**
     * Loads an image from a file
     * @param {File} file - Image file to load
     * @returns {Promise<HTMLImageElement>} Promise that resolves with loaded image
     */
    loadImageFromFile(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.match("image.*")) {
                const error = "Selected file is not an image";
                this.log(error, "error");
                reject(new Error(error));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.currentImage = img;
                    this.log(`Image loaded: ${file.name} (${img.width}x${img.height})`);
                    this.notifyImageLoaded(img);
                    resolve(img);
                };
                img.onerror = () => {
                    const error = "Failed to load image";
                    this.log(error, "error");
                    reject(new Error(error));
                };
                img.src = e.target.result;
            };
            reader.onerror = () => {
                const error = "Failed to read file";
                this.log(error, "error");
                reject(new Error(error));
            };
            reader.readAsDataURL(file);
        });
    }

    /**
     * Loads an image from a URL
     * @param {string} url - Image URL to load
     * @returns {Promise<HTMLImageElement>} Promise that resolves with loaded image
     */
    loadImageFromUrl(url) {
        return new Promise((resolve, reject) => {
            if (!url || !url.trim()) {
                const error = "Image URL is empty";
                this.log(error, "error");
                reject(new Error(error));
                return;
            }

            const img = new Image();
            img.crossOrigin = "anonymous"; // Enable CORS for external images
            img.onload = () => {
                this.currentImage = img;
                this.log(`Image loaded from URL: ${url} (${img.width}x${img.height})`);
                this.notifyImageLoaded(img);
                resolve(img);
            };
            img.onerror = () => {
                const error = `Failed to load image from URL: ${url}`;
                this.log(error, "error");
                reject(new Error(error));
            };
            img.src = url;
        });
    }

    /**
     * Loads an image from clipboard data
     * @param {DataTransfer} dataTransfer - Clipboard or drag data
     * @returns {Promise<HTMLImageElement>} Promise that resolves with loaded image
     */
    loadImageFromClipboard(dataTransfer) {
        return new Promise((resolve, reject) => {
            const items = dataTransfer.items;
            let imageFile = null;

            // Look for image files
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.match("image.*")) {
                    imageFile = items[i].getAsFile();
                    break;
                }
            }

            if (!imageFile) {
                // Check for URLs
                const urlData = dataTransfer.getData('text/uri-list') || dataTransfer.getData('text/plain');
                if (urlData && this.isImageUrl(urlData)) {
                    this.loadImageFromUrl(urlData)
                        .then(resolve)
                        .catch(reject);
                    return;
                }

                const error = "No image found in clipboard data";
                this.log(error, "error");
                reject(new Error(error));
                return;
            }

            this.loadImageFromFile(imageFile)
                .then(resolve)
                .catch(reject);
        });
    }

    /**
     * Checks if a URL appears to be an image
     * @param {string} url - URL to check
     * @returns {boolean} True if URL appears to be an image
     */
    isImageUrl(url) {
        const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i;
        return imageExtensions.test(url) || url.includes('data:image/');
    }

    /**
     * Gets the currently loaded image
     * @returns {HTMLImageElement|null} Current image or null
     */
    getCurrentImage() {
        return this.currentImage;
    }

    /**
     * Unloads the current image
     */
    unloadImage() {
        if (this.currentImage) {
            this.currentImage = null;
            this.log("Image unloaded");
            this.notifyImageUnloaded();
        }
    }

    /**
     * Gets image dimensions
     * @returns {Object|null} Object with width and height, or null if no image
     */
    getImageDimensions() {
        if (!this.currentImage) return null;
        return {
            width: this.currentImage.width,
            height: this.currentImage.height
        };
    }

    /**
     * Registers a callback for image load events
     * @param {Function} callback - Callback function that receives the loaded image
     */
    onImageLoaded(callback) {
        this.imageCallbacks.push(callback);
    }

    /**
     * Registers a callback for image unload events
     * @param {Function} callback - Callback function
     */
    onImageUnloaded(callback) {
        this.unloadCallbacks = this.unloadCallbacks || [];
        this.unloadCallbacks.push(callback);
    }

    /**
     * Notifies all registered callbacks of image load
     * @param {HTMLImageElement} image - Loaded image
     */
    notifyImageLoaded(image) {
        this.imageCallbacks.forEach(callback => {
            try {
                callback(image);
            } catch (error) {
                console.error('Error in image load callback:', error);
            }
        });
    }

    /**
     * Notifies all registered callbacks of image unload
     */
    notifyImageUnloaded() {
        if (this.unloadCallbacks) {
            this.unloadCallbacks.forEach(callback => {
                try {
                    callback();
                } catch (error) {
                    console.error('Error in image unload callback:', error);
                }
            });
        }
    }

    /**
     * Validates image file
     * @param {File} file - File to validate
     * @returns {Object} Validation result
     */
    validateImageFile(file) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };

        // Check file type
        if (!file.type.match("image.*")) {
            result.isValid = false;
            result.errors.push("File is not an image");
        }

        // Check file size (warn if > 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            result.warnings.push(`Large file size: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
        }

        // Check supported formats
        const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
        if (!supportedTypes.includes(file.type)) {
            result.warnings.push(`Uncommon image format: ${file.type}`);
        }

        return result;
    }

    /**
     * Creates a canvas from the current image
     * @returns {HTMLCanvasElement|null} Canvas with image drawn, or null if no image
     */
    toCanvas() {
        if (!this.currentImage) return null;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = this.currentImage.width;
        canvas.height = this.currentImage.height;

        ctx.drawImage(this.currentImage, 0, 0);

        return canvas;
    }

    /**
     * Creates a data URL from the current image
     * @param {string} format - Image format (image/png, image/jpeg, etc.)
     * @param {number} quality - Image quality (0-1, for JPEG)
     * @returns {string|null} Data URL or null if no image
     */
    toDataURL(format = 'image/png', quality = 1.0) {
        const canvas = this.toCanvas();
        if (!canvas) return null;

        return canvas.toDataURL(format, quality);
    }
}

/**
 * Utility functions for image handling
 */

/**
 * Creates an image element from a data URL
 * @param {string} dataUrl - Data URL
 * @returns {Promise<HTMLImageElement>} Promise that resolves with image element
 */
function createImageFromDataUrl(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to create image from data URL'));
        img.src = dataUrl;
    });
}

/**
 * Resizes an image while maintaining aspect ratio
 * @param {HTMLImageElement} image - Source image
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @returns {HTMLCanvasElement} Canvas with resized image
 */
function resizeImage(image, maxWidth, maxHeight) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Calculate new dimensions
    let { width, height } = image;
    const aspectRatio = width / height;

    if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
    }

    if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
    }

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(image, 0, 0, width, height);
    return canvas;
}

/**
 * Gets the dominant color from an image
 * @param {HTMLImageElement} image - Source image
 * @param {number} sampleSize - Number of pixels to sample
 * @returns {Array} RGB color array
 */
function getDominantColor(image, sampleSize = 100) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let r = 0, g = 0, b = 0;
    let count = 0;

    // Sample pixels evenly across the image
    const step = Math.floor(data.length / (sampleSize * 4));

    for (let i = 0; i < data.length; i += step * 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
    }

    return [
        Math.round(r / count),
        Math.round(g / count),
        Math.round(b / count)
    ];
}
