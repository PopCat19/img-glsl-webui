#!/usr/bin/env node

/**
 * Validation script for GLSL WebUI
 * Checks module structure, dependencies, and basic functionality
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = './src';
const REQUIRED_FILES = [
    'index.html',
    'css/styles.css',
    'js/main.js',
    'js/default-shaders.js',
    'js/webgl-utils.js',
    'js/shader-compiler.js',
    'js/image-handler.js',
    'js/ui-controls.js',
    'js/export-utils.js',
    'js/storage-manager.js'
];

const REQUIRED_FUNCTIONS = {
    'js/webgl-utils.js': [
        'createShader',
        'createProgram',
        'initBuffers',
        'createImageTexture'
    ],
    'js/shader-compiler.js': [
        'ShaderCompiler'
    ],
    'js/image-handler.js': [
        'ImageHandler'
    ],
    'js/ui-controls.js': [
        'UIControls'
    ],
    'js/export-utils.js': [
        'ExportUtils'
    ],
    'js/storage-manager.js': [
        'StorageManager'
    ],
    'js/main.js': [
        'GLSLWebUIApp'
    ]
};

let errors = 0;
let warnings = 0;

/**
 * Log error message
 */
function error(message) {
    console.error(`❌ ERROR: ${message}`);
    errors++;
}

/**
 * Log warning message
 */
function warn(message) {
    console.warn(`⚠️  WARNING: ${message}`);
    warnings++;
}

/**
 * Log info message
 */
function info(message) {
    console.log(`ℹ️  ${message}`);
}

/**
 * Log success message
 */
function success(message) {
    console.log(`✅ ${message}`);
}

/**
 * Check if file exists
 */
function fileExists(filePath) {
    return fs.existsSync(filePath);
}

/**
 * Read file content
 */
function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (err) {
        return null;
    }
}

/**
 * Validate file structure
 */
function validateFileStructure() {
    info('Checking file structure...');

    if (!fs.existsSync(SRC_DIR)) {
        error(`Source directory ${SRC_DIR} does not exist`);
        return;
    }

    REQUIRED_FILES.forEach(file => {
        const filePath = path.join(SRC_DIR, file);
        if (fileExists(filePath)) {
            success(`Found: ${file}`);
        } else {
            error(`Missing required file: ${file}`);
        }
    });
}

/**
 * Validate HTML structure
 */
function validateHTML() {
    info('Validating HTML structure...');

    const htmlPath = path.join(SRC_DIR, 'index.html');
    const content = readFile(htmlPath);

    if (!content) {
        error('Could not read index.html');
        return;
    }

    // Check for required elements
    const requiredElements = [
        'canvas',
        'shaderCode',
        'console',
        'canvasContainer',
        'fullscreenContainer'
    ];

    requiredElements.forEach(id => {
        if (content.includes(`id="${id}"`)) {
            success(`Found required element: ${id}`);
        } else {
            error(`Missing required element with id: ${id}`);
        }
    });

    // Check for script includes
    const requiredScripts = [
        'js/default-shaders.js',
        'js/webgl-utils.js',
        'js/shader-compiler.js',
        'js/image-handler.js',
        'js/ui-controls.js',
        'js/export-utils.js',
        'js/storage-manager.js',
        'js/main.js'
    ];

    requiredScripts.forEach(script => {
        if (content.includes(`src="${script}"`)) {
            success(`Found script include: ${script}`);
        } else {
            error(`Missing script include: ${script}`);
        }
    });

    // Check for CSS link
    if (content.includes('href="css/styles.css"')) {
        success('Found CSS link');
    } else {
        error('Missing CSS link');
    }
}

/**
 * Validate CSS structure
 */
function validateCSS() {
    info('Validating CSS structure...');

    const cssPath = path.join(SRC_DIR, 'css/styles.css');
    const content = readFile(cssPath);

    if (!content) {
        error('Could not read styles.css');
        return;
    }

    // Check for CSS variables
    if (content.includes(':root {')) {
        success('Found CSS variables definition');
    } else {
        warn('CSS variables not found - consider using CSS custom properties');
    }

    // Check for responsive design
    if (content.includes('@media')) {
        success('Found responsive design rules');
    } else {
        warn('No responsive design rules found');
    }

    // Check for key component styles
    const requiredStyles = [
        '.canvas-container',
        '.code-editor',
        '.console',
        '.save-slot',
        'button'
    ];

    requiredStyles.forEach(selector => {
        if (content.includes(selector)) {
            success(`Found style for: ${selector}`);
        } else {
            warn(`Missing style for: ${selector}`);
        }
    });
}

/**
 * Validate JavaScript modules
 */
function validateJavaScript() {
    info('Validating JavaScript modules...');

    Object.entries(REQUIRED_FUNCTIONS).forEach(([file, functions]) => {
        const filePath = path.join(SRC_DIR, file);
        const content = readFile(filePath);

        if (!content) {
            error(`Could not read ${file}`);
            return;
        }

        functions.forEach(funcName => {
            if (content.includes(funcName)) {
                success(`Found function/class: ${funcName} in ${file}`);
            } else {
                error(`Missing function/class: ${funcName} in ${file}`);
            }
        });

        // Check for proper module structure
        if (content.includes('// ====')) {
            success(`Proper module header found in ${file}`);
        } else {
            warn(`Consider adding module header to ${file}`);
        }
    });
}

/**
 * Validate WebGL shader templates
 */
function validateShaders() {
    info('Validating shader templates...');

    const mainPath = path.join(SRC_DIR, 'js/main.js');
    const defaultShadersPath = path.join(SRC_DIR, 'js/default-shaders.js');

    const mainContent = readFile(mainPath);
    const shadersContent = readFile(defaultShadersPath);

    if (shadersContent) {
        if (shadersContent.includes('DEFAULT_VERTEX_SHADER')) {
            success('Found default vertex shader');
        } else {
            error('Missing default vertex shader');
        }

        if (shadersContent.includes('DEFAULT_FRAGMENT_SHADER')) {
            success('Found default fragment shader');
        } else {
            error('Missing default fragment shader');
        }
    }

    // Check for shader script tags in HTML
    const htmlPath = path.join(SRC_DIR, 'index.html');
    const htmlContent = readFile(htmlPath);

    if (htmlContent) {
        if (htmlContent.includes('x-shader/x-vertex')) {
            success('Found vertex shader script tag');
        } else {
            warn('Consider adding vertex shader script tag for fallback');
        }

        if (htmlContent.includes('x-shader/x-fragment')) {
            success('Found fragment shader script tag');
        } else {
            warn('Consider adding fragment shader script tag for fallback');
        }
    }
}

/**
 * Validate build system
 */
function validateBuildSystem() {
    info('Validating build system...');

    if (fileExists('./build.js')) {
        success('Found build.js');
    } else {
        error('Missing build.js');
    }

    if (fileExists('./package.json')) {
        success('Found package.json');

        const packageContent = readFile('./package.json');
        if (packageContent) {
            try {
                const pkg = JSON.parse(packageContent);

                if (pkg.scripts && pkg.scripts.build) {
                    success('Found build script');
                } else {
                    error('Missing build script in package.json');
                }

                if (pkg.scripts && pkg.scripts.dev) {
                    success('Found dev script');
                } else {
                    warn('Missing dev script in package.json');
                }
            } catch (err) {
                error('Invalid package.json format');
            }
        }
    } else {
        error('Missing package.json');
    }
}

/**
 * Validate example shaders
 */
function validateExampleShaders() {
    info('Validating example shaders...');

    const shadersDir = path.join(SRC_DIR, 'shaders');

    if (fs.existsSync(shadersDir)) {
        success('Found shaders directory');

        const shaderFiles = fs.readdirSync(shadersDir);
        const glslFiles = shaderFiles.filter(file => file.endsWith('.glsl'));

        if (glslFiles.length > 0) {
            success(`Found ${glslFiles.length} GLSL shader files`);

            glslFiles.forEach(file => {
                const content = readFile(path.join(shadersDir, file));
                if (content) {
                    if (content.includes('precision')) {
                        success(`Shader ${file} has precision qualifier`);
                    } else {
                        warn(`Shader ${file} missing precision qualifier`);
                    }

                    if (content.includes('void main()')) {
                        success(`Shader ${file} has main function`);
                    } else {
                        error(`Shader ${file} missing main function`);
                    }
                }
            });
        } else {
            warn('No GLSL shader files found in shaders directory');
        }
    } else {
        warn('Shaders directory not found');
    }
}

/**
 * Check for potential issues
 */
function checkPotentialIssues() {
    info('Checking for potential issues...');

    // Check for console.log statements that should be removed in production
    REQUIRED_FILES.filter(file => file.endsWith('.js')).forEach(file => {
        const filePath = path.join(SRC_DIR, file);
        const content = readFile(filePath);

        if (content && content.includes('console.log(')) {
            warn(`Found console.log statements in ${file} - consider removing for production`);
        }
    });

    // Check for TODO comments
    REQUIRED_FILES.forEach(file => {
        const filePath = path.join(SRC_DIR, file);
        const content = readFile(filePath);

        if (content) {
            const todoCount = (content.match(/TODO|FIXME|HACK/gi) || []).length;
            if (todoCount > 0) {
                warn(`Found ${todoCount} TODO/FIXME/HACK comments in ${file}`);
            }
        }
    });
}

/**
 * Main validation function
 */
function main() {
    console.log('🔍 GLSL WebUI Validation Report\n');
    console.log('=' .repeat(50));

    validateFileStructure();
    console.log('');

    validateHTML();
    console.log('');

    validateCSS();
    console.log('');

    validateJavaScript();
    console.log('');

    validateShaders();
    console.log('');

    validateBuildSystem();
    console.log('');

    validateExampleShaders();
    console.log('');

    checkPotentialIssues();
    console.log('');

    // Summary
    console.log('=' .repeat(50));
    console.log('📊 VALIDATION SUMMARY');
    console.log('=' .repeat(50));

    if (errors === 0 && warnings === 0) {
        console.log('🎉 All validations passed! Project structure is correct.');
    } else {
        if (errors > 0) {
            console.log(`❌ ${errors} error(s) found - these must be fixed`);
        }
        if (warnings > 0) {
            console.log(`⚠️  ${warnings} warning(s) found - consider addressing these`);
        }
    }

    console.log('');

    if (errors === 0) {
        console.log('✅ Project is ready for development and building');
        process.exit(0);
    } else {
        console.log('❌ Please fix the errors before proceeding');
        process.exit(1);
    }
}

// Run validation
main();
