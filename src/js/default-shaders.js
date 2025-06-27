// ==================== DEFAULT SHADERS ====================

/**
 * Default vertex shader - handles positioning and texture coordinates
 */
const DEFAULT_VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec2 a_texcoord;
varying vec2 v_texcoord;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texcoord = a_texcoord;
}
`;

/**
 * Default fragment shader - simple passthrough
 */
const DEFAULT_FRAGMENT_SHADER = `
precision mediump float;
varying vec2 v_texcoord;
uniform sampler2D tex;
uniform float time;
void main() {
  vec4 color = texture2D(tex, v_texcoord);
  gl_FragColor = color;
}
`;

/**
 * Example effect shaders for demonstration
 */
const EXAMPLE_SHADERS = {
    'sepia': `
precision mediump float;
varying vec2 v_texcoord;
uniform sampler2D tex;
uniform float time;
void main() {
  vec4 color = texture2D(tex, v_texcoord);
  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  gl_FragColor = vec4(gray * vec3(1.2, 1.0, 0.8), color.a);
}
`,
    'invert': `
precision mediump float;
varying vec2 v_texcoord;
uniform sampler2D tex;
uniform float time;
void main() {
  vec4 color = texture2D(tex, v_texcoord);
  gl_FragColor = vec4(1.0 - color.rgb, color.a);
}
`,
    'wave': `
precision mediump float;
varying vec2 v_texcoord;
uniform sampler2D tex;
uniform float time;
void main() {
  vec2 uv = v_texcoord;
  uv.x += sin(uv.y * 10.0 + time * 2.0) * 0.02;
  vec4 color = texture2D(tex, uv);
  gl_FragColor = color;
}
`,
    'pixelate': `
precision mediump float;
varying vec2 v_texcoord;
uniform sampler2D tex;
uniform float time;
void main() {
  float pixelSize = 0.005;
  vec2 coord = floor(v_texcoord / pixelSize) * pixelSize;
  vec4 color = texture2D(tex, coord);
  gl_FragColor = color;
}
`,
    'vignette': `
precision mediump float;
varying vec2 v_texcoord;
uniform sampler2D tex;
uniform float time;
void main() {
  vec4 color = texture2D(tex, v_texcoord);
  vec2 center = vec2(0.5, 0.5);
  float dist = distance(v_texcoord, center);
  float vignette = smoothstep(0.7, 0.4, dist);
  gl_FragColor = vec4(color.rgb * vignette, color.a);
}
`
};

/**
 * Get the default fragment shader source
 */
function getDefaultFragmentShader() {
    return DEFAULT_FRAGMENT_SHADER;
}

/**
 * Get the default vertex shader source
 */
function getDefaultVertexShader() {
    return DEFAULT_VERTEX_SHADER;
}

/**
 * Get an example shader by name
 */
function getExampleShader(name) {
    return EXAMPLE_SHADERS[name] || DEFAULT_FRAGMENT_SHADER;
}

/**
 * Get list of available example shaders
 */
function getExampleShaderNames() {
    return Object.keys(EXAMPLE_SHADERS);
}
