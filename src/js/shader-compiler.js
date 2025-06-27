// ==================== SHADER COMPILER ====================

/**
 * Shader compilation and management module
 */

class ShaderCompiler {
    constructor(gl, logger) {
        this.gl = gl;
        this.log = logger || console.log;
        this.currentProgram = null;
        this.vertexShader = null;
        this.fragmentShader = null;
    }

    /**
     * Compiles a shader program from vertex and fragment shader sources
     * @param {string} vertexSource - Vertex shader source code
     * @param {string} fragmentSource - Fragment shader source code
     * @returns {WebGLProgram|null} Compiled program or null on failure
     */
    compileProgram(vertexSource, fragmentSource) {
        try {
            // Clean up previous shaders
            this.cleanup();

            // Create vertex shader
            this.vertexShader = createShader(this.gl, this.gl.VERTEX_SHADER, vertexSource);
            if (!this.vertexShader) {
                this.log('Failed to compile vertex shader', 'error');
                return null;
            }

            // Create fragment shader
            this.fragmentShader = createShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentSource);
            if (!this.fragmentShader) {
                this.log('Failed to compile fragment shader', 'error');
                return null;
            }

            // Create program
            this.currentProgram = createProgram(this.gl, this.vertexShader, this.fragmentShader);
            if (!this.currentProgram) {
                this.log('Failed to link shader program', 'error');
                return null;
            }

            this.log('Shader compiled successfully');
            return this.currentProgram;

        } catch (error) {
            this.log(`Shader compilation error: ${error.message}`, 'error');
            this.cleanup();
            return null;
        }
    }

    /**
     * Compiles the default shader (passthrough)
     * @returns {WebGLProgram|null} Compiled default program
     */
    compileDefaultShader() {
        return this.compileProgram(
            getDefaultVertexShader(),
            getDefaultFragmentShader()
        );
    }

    /**
     * Validates shader source code for common issues
     * @param {string} source - Shader source code
     * @returns {Object} Validation result with isValid flag and messages
     */
    validateShaderSource(source) {
        const result = {
            isValid: true,
            warnings: [],
            errors: []
        };

        // Check for required precision qualifier
        if (!source.includes('precision')) {
            result.warnings.push('Missing precision qualifier - consider adding "precision mediump float;"');
        }

        // Check for main function
        if (!source.includes('void main()')) {
            result.errors.push('Missing main() function');
            result.isValid = false;
        }

        // Check for gl_FragColor assignment
        if (!source.includes('gl_FragColor')) {
            result.warnings.push('No gl_FragColor assignment found - shader may not output color');
        }

        // Check for common typos
        const commonTypos = [
            { wrong: 'sampler2d', correct: 'sampler2D' },
            { wrong: 'Texture2D', correct: 'texture2D' },
            { wrong: 'vec2()', correct: 'vec2(0.0)' },
            { wrong: 'vec3()', correct: 'vec3(0.0)' },
            { wrong: 'vec4()', correct: 'vec4(0.0)' }
        ];

        commonTypos.forEach(typo => {
            if (source.includes(typo.wrong)) {
                result.warnings.push(`Possible typo: "${typo.wrong}" should be "${typo.correct}"`);
            }
        });

        return result;
    }

    /**
     * Gets the current active program
     * @returns {WebGLProgram|null} Current program
     */
    getCurrentProgram() {
        return this.currentProgram;
    }

    /**
     * Uses the current program
     */
    useProgram() {
        if (this.currentProgram) {
            this.gl.useProgram(this.currentProgram);
        }
    }

    /**
     * Gets uniform location from current program
     * @param {string} name - Uniform name
     * @returns {WebGLUniformLocation|null} Uniform location
     */
    getUniformLocation(name) {
        if (!this.currentProgram) return null;
        return this.gl.getUniformLocation(this.currentProgram, name);
    }

    /**
     * Gets attribute location from current program
     * @param {string} name - Attribute name
     * @returns {number} Attribute location
     */
    getAttributeLocation(name) {
        if (!this.currentProgram) return -1;
        return this.gl.getAttribLocation(this.currentProgram, name);
    }

    /**
     * Sets uniform values
     * @param {string} name - Uniform name
     * @param {*} value - Uniform value
     * @param {string} type - Uniform type (1f, 2f, 3f, 4f, 1i, etc.)
     */
    setUniform(name, value, type = '1f') {
        const location = this.getUniformLocation(name);
        if (location === null) return;

        switch (type) {
            case '1f':
                this.gl.uniform1f(location, value);
                break;
            case '2f':
                this.gl.uniform2f(location, value[0], value[1]);
                break;
            case '3f':
                this.gl.uniform3f(location, value[0], value[1], value[2]);
                break;
            case '4f':
                this.gl.uniform4f(location, value[0], value[1], value[2], value[3]);
                break;
            case '1i':
                this.gl.uniform1i(location, value);
                break;
            case 'matrix2fv':
                this.gl.uniformMatrix2fv(location, false, value);
                break;
            case 'matrix3fv':
                this.gl.uniformMatrix3fv(location, false, value);
                break;
            case 'matrix4fv':
                this.gl.uniformMatrix4fv(location, false, value);
                break;
            default:
                this.log(`Unknown uniform type: ${type}`, 'warning');
        }
    }

    /**
     * Preprocesses shader source code (basic macro support)
     * @param {string} source - Original shader source
     * @returns {string} Preprocessed shader source
     */
    preprocessShader(source) {
        let processed = source;

        // Simple macro replacement (very basic)
        const macros = {
            'PI': '3.14159265359',
            'TWO_PI': '6.28318530718',
            'HALF_PI': '1.57079632679'
        };

        Object.entries(macros).forEach(([macro, value]) => {
            const regex = new RegExp(`\\b${macro}\\b`, 'g');
            processed = processed.replace(regex, value);
        });

        return processed;
    }

    /**
     * Cleans up shader resources
     */
    cleanup() {
        if (this.vertexShader) {
            this.gl.deleteShader(this.vertexShader);
            this.vertexShader = null;
        }
        if (this.fragmentShader) {
            this.gl.deleteShader(this.fragmentShader);
            this.fragmentShader = null;
        }
        if (this.currentProgram) {
            this.gl.deleteProgram(this.currentProgram);
            this.currentProgram = null;
        }
    }

    /**
     * Recompiles the current shader (useful for hot-reloading)
     * @param {string} fragmentSource - New fragment shader source
     * @returns {boolean} Success status
     */
    recompile(fragmentSource) {
        const vertexSource = getDefaultVertexShader(); // Always use default vertex shader
        const program = this.compileProgram(vertexSource, fragmentSource);
        return program !== null;
    }
}

/**
 * Utility function to extract shader errors with line numbers
 * @param {string} errorLog - WebGL shader error log
 * @returns {Array} Array of error objects with line numbers and messages
 */
function parseShaderErrors(errorLog) {
    const errors = [];
    const lines = errorLog.split('\n');

    lines.forEach(line => {
        const match = line.match(/ERROR: (\d+):(\d+): (.+)/);
        if (match) {
            errors.push({
                line: parseInt(match[2]),
                column: parseInt(match[1]),
                message: match[3].trim()
            });
        }
    });

    return errors;
}

/**
 * Formats shader errors for display
 * @param {Array} errors - Array of error objects
 * @returns {string} Formatted error message
 */
function formatShaderErrors(errors) {
    if (errors.length === 0) return '';

    return errors.map(error =>
        `Line ${error.line}: ${error.message}`
    ).join('\n');
}
