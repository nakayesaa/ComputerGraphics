import {
  degToRad,
  identity,
  multiply,
  translation,
  scale,
  rotationX,
  rotationY,
  rotationZ,
  perspective,
  lookAt,
  normalMatrix,
} from './math3d.js';

import { createCubeData, createLightMarkerData } from './geometry.js';
import { generateTextureCanvas, createGLTexture, updateTextureParams } from './texture.js';

/* ==========================================================================
   EF234504 • GRAFIKA KOMPUTER • PRAKTIKUM 5
   WebGL2 Textured & Lit Object Playground
   - Position, Normal, UV Buffers
   - Ambient, Diffuse, Specular (Phong / Blinn-Phong)
   - Light movement (J/L, I/K, U/O) & Moving light orbit
   - Filtering (LINEAR / NEAREST) & Wrapping (REPEAT / CLAMP / MIRROR)
   - Multiple Textures, Grayscale Shader, UV Scrolling, Light Marker
   ========================================================================== */

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2', { antialias: true });

if (!gl) {
  alert('WebGL2 tidak didukung pada browser Anda.');
  throw new Error('WebGL2 not supported');
}

// --- 1. Shaders Setup ---
const vsSource = `#version 300 es
in vec3 a_position;
in vec3 a_normal;
in vec2 a_uv;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform mat3 u_normalMatrix;

out vec3 v_fragPos;
out vec3 v_normal;
out vec2 v_uv;

void main() {
  vec4 worldPos = u_model * vec4(a_position, 1.0);
  v_fragPos = worldPos.xyz;
  v_normal = normalize(u_normalMatrix * a_normal);
  v_uv = a_uv;
  gl_Position = u_projection * u_view * worldPos;
}`;

const fsSource = `#version 300 es
precision highp float;

in vec3 v_fragPos;
in vec3 v_normal;
in vec2 v_uv;

uniform sampler2D u_texture;
uniform vec3 u_lightPos;
uniform vec3 u_viewPos;
uniform vec3 u_lightColor;
uniform float u_ambientStrength;
uniform float u_shininess;
uniform int u_lightMode; // 0: All, 1: Ambient, 2: Diffuse, 3: Specular, 4: Amb+Diff
uniform vec2 u_uvOffset;
uniform bool u_grayscale;

out vec4 fragColor;

void main() {
  vec2 uv = v_uv + u_uvOffset;
  vec4 texColor = texture(u_texture, uv);

  vec3 norm = normalize(v_normal);
  vec3 lightDir = normalize(u_lightPos - v_fragPos);
  vec3 viewDir = normalize(u_viewPos - v_fragPos);

  // 1. Ambient Component
  vec3 ambient = u_ambientStrength * u_lightColor;

  // 2. Diffuse Component
  float diff = max(dot(norm, lightDir), 0.0);
  vec3 diffuse = diff * u_lightColor;

  // 3. Specular Component (Blinn-Phong)
  vec3 halfwayDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(norm, halfwayDir), 0.0), u_shininess);
  if (diff <= 0.0) spec = 0.0;
  vec3 specular = spec * u_lightColor;

  vec3 result = vec3(0.0);
  if (u_lightMode == 1) {
    result = ambient * texColor.rgb;
  } else if (u_lightMode == 2) {
    result = diffuse * texColor.rgb;
  } else if (u_lightMode == 3) {
    result = specular;
  } else if (u_lightMode == 4) {
    result = (ambient + diffuse) * texColor.rgb;
  } else {
    // Mode 0: All Components
    result = (ambient + diffuse) * texColor.rgb + specular;
  }

  // Grayscale Shader Challenge
  if (u_grayscale) {
    float gray = dot(result, vec3(0.299, 0.587, 0.114));
    result = vec3(gray);
  }

  fragColor = vec4(result, 1.0);
}`;

// Light Marker Shader (Simple Unlit White)
const markerVs = `#version 300 es
in vec3 a_position;
uniform mat4 u_mvp;
void main() {
  gl_Position = u_mvp * vec4(a_position, 1.0);
}`;

const markerFs = `#version 300 es
precision highp float;
out vec4 fragColor;
void main() {
  fragColor = vec4(1.0, 1.0, 1.0, 1.0);
}`;

function createShader(type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

function createProgram(vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, createShader(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, createShader(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p));
  }
  return p;
}

const mainProgram = createProgram(vsSource, fsSource);
const markerProgram = createProgram(markerVs, markerFs);

// --- 2. Buffers & VAO Setup ---
const cubeData = createCubeData(2.0); // UV Scale 2.0 to showcase repeat/clamp/mirror

// Cube VAO
const cubeVAO = gl.createVertexArray();
gl.bindVertexArray(cubeVAO);

// Position Buffer
const posBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
gl.bufferData(gl.ARRAY_BUFFER, cubeData.positions, gl.STATIC_DRAW);
const posLoc = gl.getAttribLocation(mainProgram, 'a_position');
gl.enableVertexAttribArray(posLoc);
gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

// Normal Buffer
const normBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
gl.bufferData(gl.ARRAY_BUFFER, cubeData.normals, gl.STATIC_DRAW);
const normLoc = gl.getAttribLocation(mainProgram, 'a_normal');
gl.enableVertexAttribArray(normLoc);
gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 0, 0);

// UV Buffer
const uvBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
gl.bufferData(gl.ARRAY_BUFFER, cubeData.uvs, gl.STATIC_DRAW);
const uvLoc = gl.getAttribLocation(mainProgram, 'a_uv');
gl.enableVertexAttribArray(uvLoc);
gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

// Marker VAO
const markerData = createLightMarkerData(0.14);
const markerVAO = gl.createVertexArray();
gl.bindVertexArray(markerVAO);
const markerPosBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, markerPosBuffer);
gl.bufferData(gl.ARRAY_BUFFER, markerData.positions, gl.STATIC_DRAW);
const markerPosLoc = gl.getAttribLocation(markerProgram, 'a_position');
gl.enableVertexAttribArray(markerPosLoc);
gl.vertexAttribPointer(markerPosLoc, 3, gl.FLOAT, false, 0, 0);

gl.bindVertexArray(null);

// Uniform Locations
const uModelLoc = gl.getUniformLocation(mainProgram, 'u_model');
const uViewLoc = gl.getUniformLocation(mainProgram, 'u_view');
const uProjLoc = gl.getUniformLocation(mainProgram, 'u_projection');
const uNormMatLoc = gl.getUniformLocation(mainProgram, 'u_normalMatrix');
const uLightPosLoc = gl.getUniformLocation(mainProgram, 'u_lightPos');
const uViewPosLoc = gl.getUniformLocation(mainProgram, 'u_viewPos');
const uLightColorLoc = gl.getUniformLocation(mainProgram, 'u_lightColor');
const uAmbStrengthLoc = gl.getUniformLocation(mainProgram, 'u_ambientStrength');
const uShininessLoc = gl.getUniformLocation(mainProgram, 'u_shininess');
const uLightModeLoc = gl.getUniformLocation(mainProgram, 'u_lightMode');
const uUvOffsetLoc = gl.getUniformLocation(mainProgram, 'u_uvOffset');
const uGrayscaleLoc = gl.getUniformLocation(mainProgram, 'u_grayscale');
const uMarkerMvpLoc = gl.getUniformLocation(markerProgram, 'u_mvp');

// --- 3. Textures State & Cache ---
let currentTextureType = 'checker';
let isLinearFiltering = true;
let currentWrappingMode = 'REPEAT';

const textureCanvases = {
  checker: generateTextureCanvas('checker'),
  grid: generateTextureCanvas('grid'),
  brick: generateTextureCanvas('brick'),
  dots: generateTextureCanvas('dots'),
};

let activeGLTexture = createGLTexture(
  gl,
  textureCanvases[currentTextureType],
  isLinearFiltering,
  currentWrappingMode
);

function reloadCurrentTexture() {
  if (activeGLTexture) gl.deleteTexture(activeGLTexture);
  activeGLTexture = createGLTexture(
    gl,
    textureCanvases[currentTextureType],
    isLinearFiltering,
    currentWrappingMode
  );
}

// --- 4. Interactive Parameters State ---
let lightPos = [2.2, 1.8, 2.0];
let lightColor = [1.0, 1.0, 1.0];
let ambientStrength = 0.2;
let shininess = 32.0;
let lightMode = 0; // 0: All, 1: Ambient, 2: Diffuse, 3: Specular, 4: Amb+Diff
let isLightOrbiting = true;
let isGrayscale = false;
let isUvScrolling = false;
let uvOffsetX = 0.0;
let uvOffsetY = 0.0;

// Cube rotation angles
let cubeRotX = degToRad(20);
let cubeRotY = degToRad(35);
let isAutoRotating = true;

// Camera: pull back so light marker always stays in view
const cameraPos = [0.0, 2.0, 6.0];
const cameraTarget = [0.0, 0.0, 0.0];
const cameraUp = [0.0, 1.0, 0.0];

// --- 5. UI Elements Binding ---
const selectLightingMode = document.getElementById('select-lighting-mode');
const btnToggleOrbit = document.getElementById('btn-toggle-orbit');
const btnToggleFilter = document.getElementById('btn-toggle-filter');
const labelFilter = document.getElementById('label-filter');
const selectWrappingMode = document.getElementById('select-wrapping-mode');
const selectTexture = document.getElementById('select-texture');
const selectAmbient = document.getElementById('select-ambient');
const selectShininess = document.getElementById('select-shininess');
const btnToggleGray = document.getElementById('btn-toggle-gray');
const btnToggleScroll = document.getElementById('btn-toggle-scroll');
const btnReset = document.getElementById('btn-reset');
const hudLightPos = document.getElementById('hud-light-pos');

function updateHUD() {
  if (hudLightPos) {
    hudLightPos.textContent = `L: ${lightPos[0].toFixed(1)}, ${lightPos[1].toFixed(1)}, ${lightPos[2].toFixed(1)}`;
  }
}

selectLightingMode.addEventListener('change', (e) => {
  lightMode = parseInt(e.target.value, 10);
});

btnToggleOrbit.addEventListener('click', () => {
  isLightOrbiting = !isLightOrbiting;
  btnToggleOrbit.classList.toggle('active', isLightOrbiting);
});

btnToggleFilter.addEventListener('click', () => {
  isLinearFiltering = !isLinearFiltering;
  labelFilter.textContent = isLinearFiltering ? 'LINEAR' : 'NEAREST';
  updateTextureParams(gl, activeGLTexture, isLinearFiltering, currentWrappingMode);
});

selectWrappingMode.addEventListener('change', (e) => {
  currentWrappingMode = e.target.value;
  updateTextureParams(gl, activeGLTexture, isLinearFiltering, currentWrappingMode);
});

selectTexture.addEventListener('change', (e) => {
  currentTextureType = e.target.value;
  reloadCurrentTexture();
});

selectAmbient.addEventListener('change', (e) => {
  ambientStrength = parseFloat(e.target.value);
});

selectShininess.addEventListener('change', (e) => {
  shininess = parseFloat(e.target.value);
});

btnToggleGray.addEventListener('click', () => {
  isGrayscale = !isGrayscale;
  btnToggleGray.classList.toggle('active', isGrayscale);
});

btnToggleScroll.addEventListener('click', () => {
  isUvScrolling = !isUvScrolling;
  btnToggleScroll.classList.toggle('active', isUvScrolling);
});

btnReset.addEventListener('click', () => {
  lightPos = [2.2, 1.8, 2.0];
  ambientStrength = 0.2;
  shininess = 32.0;
  lightMode = 0;
  isLightOrbiting = true;
  isGrayscale = false;
  isUvScrolling = false;
  uvOffsetX = 0.0;
  uvOffsetY = 0.0;
  cubeRotX = degToRad(20);
  cubeRotY = degToRad(35);
  isLinearFiltering = true;
  currentWrappingMode = 'REPEAT';
  currentTextureType = 'checker';

  selectLightingMode.value = '0';
  selectAmbient.value = '0.2';
  selectShininess.value = '32.0';
  selectWrappingMode.value = 'REPEAT';
  selectTexture.value = 'checker';
  btnToggleOrbit.classList.add('active');
  labelFilter.textContent = 'LINEAR';
  btnToggleGray.classList.remove('active');
  btnToggleScroll.classList.remove('active');
  reloadCurrentTexture();
  updateHUD();
});

// --- 6. Mouse Drag Interaction (Orbit Cube) ---
let isMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;

canvas.addEventListener('mousedown', (e) => {
  isMouseDown = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

window.addEventListener('mouseup', () => {
  isMouseDown = false;
});

canvas.addEventListener('mousemove', (e) => {
  if (!isMouseDown) return;
  const dx = e.clientX - lastMouseX;
  const dy = e.clientY - lastMouseY;
  cubeRotY += dx * 0.01;
  cubeRotX += dy * 0.01;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

// Touch support
canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    isMouseDown = true;
    lastMouseX = e.touches[0].clientX;
    lastMouseY = e.touches[0].clientY;
  }
});

canvas.addEventListener('touchmove', (e) => {
  if (!isMouseDown || e.touches.length !== 1) return;
  const dx = e.touches[0].clientX - lastMouseX;
  const dy = e.touches[0].clientY - lastMouseY;
  cubeRotY += dx * 0.01;
  cubeRotX += dy * 0.01;
  lastMouseX = e.touches[0].clientX;
  lastMouseY = e.touches[0].clientY;
});

window.addEventListener('touchend', () => {
  isMouseDown = false;
});

// --- 7. Keyboard Controls ---
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'SELECT') return;

  const step = e.shiftKey ? 0.4 : 0.2;

  switch (e.code) {
    // Light X: J (left) / L (right)
    case 'KeyJ':
      lightPos[0] -= step;
      isLightOrbiting = false;
      btnToggleOrbit.classList.remove('active');
      updateHUD();
      break;
    case 'KeyL':
      lightPos[0] += step;
      isLightOrbiting = false;
      btnToggleOrbit.classList.remove('active');
      updateHUD();
      break;

    // Light Y: I (up) / K (down)
    case 'KeyI':
      lightPos[1] += step;
      updateHUD();
      break;
    case 'KeyK':
      lightPos[1] = Math.max(0.2, lightPos[1] - step);
      updateHUD();
      break;

    // Light Z: U (near) / O (far)
    case 'KeyU':
      lightPos[2] -= step;
      isLightOrbiting = false;
      btnToggleOrbit.classList.remove('active');
      updateHUD();
      break;
    case 'KeyO':
      lightPos[2] += step;
      isLightOrbiting = false;
      btnToggleOrbit.classList.remove('active');
      updateHUD();
      break;

    // Lighting Modes: 1, 2, 3, 4, 0
    case 'Digit1':
      lightMode = 1; // Ambient
      selectLightingMode.value = '1';
      break;
    case 'Digit2':
      lightMode = 2; // Diffuse
      selectLightingMode.value = '2';
      break;
    case 'Digit3':
      lightMode = 3; // Specular
      selectLightingMode.value = '3';
      break;
    case 'Digit4':
      lightMode = 4; // Amb + Diff
      selectLightingMode.value = '4';
      break;
    case 'Digit5':
    case 'Digit0':
      lightMode = 0; // All
      selectLightingMode.value = '0';
      break;

    // Filtering Toggle: F
    case 'KeyF':
      btnToggleFilter.click();
      break;

    // Wrapping Toggle: W
    case 'KeyW':
      const wraps = ['REPEAT', 'CLAMP_TO_EDGE', 'MIRRORED_REPEAT'];
      const nextIdx = (wraps.indexOf(currentWrappingMode) + 1) % wraps.length;
      currentWrappingMode = wraps[nextIdx];
      selectWrappingMode.value = currentWrappingMode;
      updateTextureParams(gl, activeGLTexture, isLinearFiltering, currentWrappingMode);
      break;

    // Moving light orbit: M
    case 'KeyM':
      btnToggleOrbit.click();
      break;

    // Grayscale shader: G
    case 'KeyG':
      btnToggleGray.click();
      break;

    // Reset: R
    case 'KeyR':
      btnReset.click();
      break;
  }
});

// --- 8. Resize Handler ---
function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  }
}

window.addEventListener('resize', resize);
resize();
updateHUD();

// --- 9. Render Loop ---
let lastTime = performance.now();
let orbitAngle = 0;

function render(now) {
  requestAnimationFrame(render);

  const delta = (now - lastTime) * 0.001;
  lastTime = now;

  resize();

  // Moving light orbit
  if (isLightOrbiting) {
    orbitAngle += delta * 0.8;
    const radius = 2.4;
    lightPos[0] = Math.cos(orbitAngle) * radius;
    lightPos[1] = 1.6 + Math.sin(orbitAngle * 1.5) * 0.4;
    lightPos[2] = Math.sin(orbitAngle) * radius;
    updateHUD();
  }

  // UV scrolling animation
  if (isUvScrolling) {
    uvOffsetX = (uvOffsetX + delta * 0.25) % 1.0;
    uvOffsetY = (uvOffsetY + delta * 0.25) % 1.0;
  } else {
    uvOffsetX = 0.0;
    uvOffsetY = 0.0;
  }

  // Slow continuous rotation when not dragging
  if (isAutoRotating && !isMouseDown) {
    cubeRotY += delta * 0.3;
  }

  // WebGL Render Setup
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.04, 0.04, 0.04, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Matrices
  const aspect = canvas.width / canvas.height;
  const projMatrix = perspective(degToRad(55), aspect, 0.1, 100.0);
  const viewMatrix = lookAt(cameraPos, cameraTarget, cameraUp);

  // Cube Model Matrix: Translation * RotY * RotX * Scale
  let modelMatrix = identity();
  modelMatrix = multiply(modelMatrix, rotationY(cubeRotY));
  modelMatrix = multiply(modelMatrix, rotationX(cubeRotX));
  const normMat = normalMatrix(modelMatrix);

  // --- Render Cube ---
  gl.useProgram(mainProgram);
  gl.bindVertexArray(cubeVAO);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, activeGLTexture);
  gl.uniform1i(gl.getUniformLocation(mainProgram, 'u_texture'), 0);

  gl.uniformMatrix4fv(uModelLoc, false, modelMatrix);
  gl.uniformMatrix4fv(uViewLoc, false, viewMatrix);
  gl.uniformMatrix4fv(uProjLoc, false, projMatrix);
  gl.uniformMatrix3fv(uNormMatLoc, false, normMat);

  gl.uniform3fv(uLightPosLoc, lightPos);
  gl.uniform3fv(uViewPosLoc, cameraPos);
  gl.uniform3fv(uLightColorLoc, lightColor);
  gl.uniform1f(uAmbStrengthLoc, ambientStrength);
  gl.uniform1f(uShininessLoc, shininess);
  gl.uniform1i(uLightModeLoc, lightMode);
  gl.uniform2f(uUvOffsetLoc, uvOffsetX, uvOffsetY);
  gl.uniform1i(uGrayscaleLoc, isGrayscale ? 1 : 0);

  gl.drawArrays(gl.TRIANGLES, 0, cubeData.vertexCount);

  // --- Render Light Marker (Small Glowing Cube at Light Position) ---
  gl.useProgram(markerProgram);
  gl.bindVertexArray(markerVAO);

  let markerModel = translation(lightPos[0], lightPos[1], lightPos[2]);
  let markerMVP = multiply(projMatrix, multiply(viewMatrix, markerModel));
  gl.uniformMatrix4fv(uMarkerMvpLoc, false, markerMVP);

  gl.drawArrays(gl.TRIANGLES, 0, markerData.vertexCount);

  gl.bindVertexArray(null);
}

requestAnimationFrame(render);
