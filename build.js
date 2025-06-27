#!/usr/bin/env node

/**
 * Build script for GLSL WebUI
 * Combines all modular files back into a single HTML file for easy distribution
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = './src';
const OUTPUT_FILE = './dist/index.html';
const DIST_DIR = './dist';

/**
 * Read file content
 */
function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error.message);
        return '';
    }
}

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Minify CSS (basic)
 */
function minifyCSS(css) {
    return css
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/;\s*}/g, '}') // Remove last semicolon in blocks
        .replace(/{\s*/g, '{') // Remove space after {
        .replace(/}\s*/g, '}') // Remove space after }
        .trim();
}

/**
 * Minify JavaScript (basic)
 */
function minifyJS(js) {
    return js
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*$/gm, '') // Remove line comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/;\s*}/g, '}') // Clean up semicolons
        .trim();
}

/**
 * Build the single-file version
 */
function build() {
    console.log('🚀 Building GLSL WebUI single-file version...');

    // Ensure dist directory exists
    ensureDir(DIST_DIR);

    // Read source files
    const htmlTemplate = readFile(path.join(SRC_DIR, 'index.html'));
    const css = readFile(path.join(SRC_DIR, 'css/styles.css'));

    // Read JavaScript files in correct order
    const jsFiles = [
        'js/default-shaders.js',
        'js/webgl-utils.js',
        'js/shader-compiler.js',
        'js/image-handler.js',
        'js/ui-controls.js',
        'js/export-utils.js',
        'js/storage-manager.js',
        'js/main.js'
    ];

    let combinedJS = '';
    jsFiles.forEach(file => {
        const filePath = path.join(SRC_DIR, file);
        const content = readFile(filePath);
        if (content) {
            combinedJS += `\n// ===== ${file} =====\n`;
            combinedJS += content;
            combinedJS += '\n';
        }
    });

    // Process HTML template
    let html = htmlTemplate;

    // Replace CSS link with inline styles
    const cssLink = '<link rel="stylesheet" href="css/styles.css" />';
    const inlineCSS = `<style>\n${process.env.NODE_ENV === 'production' ? minifyCSS(css) : css}\n</style>`;
    html = html.replace(cssLink, inlineCSS);

    // Replace script tags with inline scripts
    const scriptTags = jsFiles.map(file =>
        `        <script src="${file}"></script>`
    ).join('\n');

    const inlineJS = `<script>\n${process.env.NODE_ENV === 'production' ? minifyJS(combinedJS) : combinedJS}\n</script>`;
    html = html.replace(scriptTags, inlineJS);

    // Add build information
    const buildInfo = `\n<!-- Built on ${new Date().toISOString()} -->`;
    html = html.replace('</html>', `${buildInfo}\n</html>`);

    // Write output file
    fs.writeFileSync(OUTPUT_FILE, html);

    // Get file sizes
    const originalSize = Buffer.byteLength(html, 'utf8');
    const sizeInKB = (originalSize / 1024).toFixed(2);

    console.log('✅ Build completed successfully!');
    console.log(`📁 Output: ${OUTPUT_FILE}`);
    console.log(`📊 Size: ${sizeInKB} KB`);
    console.log('');
    console.log('To test the built version:');
    console.log('  Open dist/index.html in your browser');
    console.log('');
}

/**
 * Development server with auto-rebuild
 */
function dev() {
    console.log('🔧 Starting development mode with auto-rebuild...');

    // Initial build
    build();

    // Watch for file changes
    const watchPaths = [
        path.join(SRC_DIR, 'index.html'),
        path.join(SRC_DIR, 'css'),
        path.join(SRC_DIR, 'js')
    ];

    watchPaths.forEach(watchPath => {
        fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
            if (filename && (filename.endsWith('.html') || filename.endsWith('.css') || filename.endsWith('.js'))) {
                console.log(`📝 File changed: ${filename}`);
                setTimeout(build, 100); // Debounce
            }
        });
    });

    console.log('👀 Watching for changes... Press Ctrl+C to stop');
}

/**
 * Clean build directory
 */
function clean() {
    console.log('🧹 Cleaning build directory...');
    if (fs.existsSync(DIST_DIR)) {
        fs.rmSync(DIST_DIR, { recursive: true, force: true });
    }
    console.log('✅ Clean completed');
}

/**
 * Copy additional assets
 */
function copyAssets() {
    console.log('📋 Copying additional assets...');

    // Copy shader files
    const shadersDir = path.join(SRC_DIR, 'shaders');
    const distShadersDir = path.join(DIST_DIR, 'shaders');

    if (fs.existsSync(shadersDir)) {
        ensureDir(distShadersDir);
        const shaderFiles = fs.readdirSync(shadersDir);
        shaderFiles.forEach(file => {
            if (file.endsWith('.glsl')) {
                const srcPath = path.join(shadersDir, file);
                const destPath = path.join(distShadersDir, file);
                fs.copyFileSync(srcPath, destPath);
                console.log(`  📄 Copied: ${file}`);
            }
        });
    }

    // Copy README and LICENSE
    const rootFiles = ['README.md', 'LICENSE'];
    rootFiles.forEach(file => {
        const srcPath = path.join('.', file);
        const destPath = path.join(DIST_DIR, file);
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`  📄 Copied: ${file}`);
        }
    });
}

/**
 * Main CLI handler
 */
function main() {
    const command = process.argv[2] || 'build';

    switch (command) {
        case 'build':
            clean();
            build();
            copyAssets();
            break;
        case 'dev':
            clean();
            build();
            copyAssets();
            dev();
            break;
        case 'clean':
            clean();
            break;
        case 'help':
            console.log('GLSL WebUI Build Tool');
            console.log('');
            console.log('Usage:');
            console.log('  node build.js [command]');
            console.log('');
            console.log('Commands:');
            console.log('  build    Build single-file version (default)');
            console.log('  dev      Build and watch for changes');
            console.log('  clean    Clean build directory');
            console.log('  help     Show this help message');
            console.log('');
            console.log('Environment variables:');
            console.log('  NODE_ENV=production    Enable minification');
            break;
        default:
            console.error(`Unknown command: ${command}`);
            console.log('Run "node build.js help" for usage information');
            process.exit(1);
    }
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
});

// Run the build
main();
