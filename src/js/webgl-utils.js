// ==================== WEBGL UTILITIES ====================

/**
 * WebGL utility functions for shader compilation, program creation, and buffer management
 */

/**
 * Creates and compiles a shader
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {number} type - Shader type (VERTEX_SHADER or FRAGMENT_SHADER)
 * @param {string} source - Shader source code
 * @returns {WebGLShader|null} Compiled shader or null on failure
 */
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        console.error('Error compiling shader:', error);
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

/**
 * Creates and links a WebGL program
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {WebGLShader} vertexShader - Compiled vertex shader
 * @param {WebGLShader} fragmentShader - Compiled fragment shader
 * @returns {WebGLProgram|null} Linked program or null on failure
 */
function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const error = gl.getProgramInfoLog(program);
        console.error('Error linking program:', error);
        gl.deleteProgram(program);
        return null;
    }

    return program;
}

/**
 * Initializes WebGL buffers for full-screen quad rendering
 * @param {WebGLRenderingContext} gl - WebGL context
 * @returns {Object} Object containing position and texture coordinate buffers
 */
function initBuffers(gl) {
    // Position buffer (full-screen quad)
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW
    );

    // Texture coordinate buffer
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]),
        gl.STATIC_DRAW
    );

    return {
        position: posBuffer,
        texCoord: texCoordBuffer
    };
}

/**
 * Creates a WebGL texture from an image element
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {HTMLImageElement} image - Image element
 * @returns {WebGLTexture} Created texture
 */
function createImageTexture(gl, image) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Upload image to texture
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image
    );

    return texture;
}

/**
 * Gets transformed texture coordinates based on rotation and mirroring
 * @param {number} rotation - Rotation angle in degrees
 * @param {boolean} mirrorX - Whether to mirror horizontally
 * @param {boolean} mirrorY - Whether to mirror vertically
 * @returns {Float32Array} Array of texture coordinates
 */
function getTransformedTexCoords(rotation, mirrorX, mirrorY) {
    let texCoords;

    // Apply rotation
    switch (rotation % 360) {
        case 0:
            texCoords = [0, 1, 1, 1, 0, 0, 1, 0];
            break;
        case 90:
            texCoords = [0, 0, 0, 1, 1, 0, 1, 1];
            break;
        case 180:
            texCoords = [1, 0, 0, 0, 1, 1, 0, 1];
            break;
        case 270:
            texCoords = [1, 1, 1, 0, 0, 1, 0, 0];
            break;
        default:
            texCoords = [0, 1, 1, 1, 0, 0, 1, 0];
    }

    // Apply mirroring
    if (mirrorX) {
        for (let i = 0; i < texCoords.length; i += 2) {
            texCoords[i] = 1 - texCoords[i];
        }
    }
    if (mirrorY) {
        for (let i = 1; i < texCoords.length; i += 2) {
            texCoords[i] = 1 - texCoords[i];
        }
    }

    return new Float32Array(texCoords);
}

/**
 * Binds attribute to buffer
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {WebGLBuffer} buffer - Buffer to bind
 * @param {number} attributeLocation - Attribute location
 * @param {number} size - Number of components per vertex attribute
 */
function bindAttribute(gl, buffer, attributeLocation, size) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(attributeLocation);
    gl.vertexAttribPointer(attributeLocation, size, gl.FLOAT, false, 0, 0);
}

/**
 * Sets up WebGL context with default settings
 * @param {WebGLRenderingContext} gl - WebGL context
 */
function setupWebGLDefaults(gl) {
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

/**
 * Renders a full-screen quad with the current program
 * @param {WebGLRenderingContext} gl - WebGL context
 */
function renderQuad(gl) {
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

/**
 * Checks for WebGL errors and logs them
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {string} operation - Description of the operation being checked
 */
function checkGLError(gl, operation) {
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
        console.error(`WebGL error after ${operation}: ${error}`);
        return false;
    }
    return true;
}

/**
 * Resizes WebGL viewport and canvas
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {number} width - New width
 * @param {number} height - New height
 */
function resizeCanvas(gl, canvas, width, height) {
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
}

/**
 * Cleans up WebGL resources
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {Object} resources - Object containing WebGL resources to clean up
 */
function cleanupWebGLResources(gl, resources) {
    if (resources.program) {
        gl.deleteProgram(resources.program);
    }
    if (resources.vertexShader) {
        gl.deleteShader(resources.vertexShader);
    }
    if (resources.fragmentShader) {
        gl.deleteShader(resources.fragmentShader);
    }
    if (resources.texture) {
        gl.deleteTexture(resources.texture);
    }
    if (resources.posBuffer) {
        gl.deleteBuffer(resources.posBuffer);
    }
    if (resources.texCoordBuffer) {
        gl.deleteBuffer(resources.texCoordBuffer);
    }
}
