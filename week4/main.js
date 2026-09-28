import {
  degToRad,
  lookAt,
  multiply,
  orthographic,
  perspective,
  rotationX,
  rotationY,
  translation
} from "./math3d.js";

const canvas = document.querySelector("#glCanvas");
const message = document.querySelector("#canvasMessage");
const gl = canvas.getContext("webgl2", { antialias: true });

if (!gl) {
  message.hidden = false;
  message.textContent = "WebGL2 tidak tersedia. Gunakan browser modern dengan hardware acceleration aktif.";
  throw new Error("WebGL2 is not supported");
}

const vertexShaderSource = `#version 300 es
in vec3 a_position;
in vec3 a_color;
uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
out vec3 v_color;

void main() {
  gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
  v_color = a_color;
}`;

const fragmentShaderSource = `#version 300 es
precision highp float;
in vec3 v_color;
out vec4 outColor;

void main() {
  outColor = vec4(v_color, 1.0);
}`;

function createShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

function createProgram() {
  const program = gl.createProgram();
  gl.attachShader(program, createShader(gl.VERTEX_SHADER, vertexShaderSource));
  gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fragmentShaderSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
  }
  return program;
}

// Six faces × two triangles × three vertices = 36 vertices.
const positions = new Float32Array([
  -1,-1, 1,  1,-1, 1,  1, 1, 1,  -1,-1, 1,  1, 1, 1, -1, 1, 1,
   1,-1,-1, -1,-1,-1, -1, 1,-1,   1,-1,-1, -1, 1,-1,  1, 1,-1,
  -1, 1, 1,  1, 1, 1,  1, 1,-1,  -1, 1, 1,  1, 1,-1, -1, 1,-1,
  -1,-1,-1,  1,-1,-1,  1,-1, 1,  -1,-1,-1,  1,-1, 1, -1,-1, 1,
   1,-1, 1,  1,-1,-1,  1, 1,-1,   1,-1, 1,  1, 1,-1,  1, 1, 1,
  -1,-1,-1, -1,-1, 1, -1, 1, 1,  -1,-1,-1, -1, 1, 1, -1, 1,-1
]);

const faceColors = [
  [0.35, 0.88, 0.76], [0.96, 0.45, 0.45], [0.38, 0.65, 0.98],
  [0.98, 0.74, 0.28], [0.72, 0.46, 0.95], [0.98, 0.53, 0.72]
];
const colors = new Float32Array(faceColors.flatMap((color) => Array(6).fill(color).flat()));

const program = createProgram();
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

function bindAttribute(name, data) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  const location = gl.getAttribLocation(program, name);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
}

bindAttribute("a_position", positions);
bindAttribute("a_color", colors);

const uniforms = {
  model: gl.getUniformLocation(program, "u_model"),
  view: gl.getUniformLocation(program, "u_view"),
  projection: gl.getUniformLocation(program, "u_projection")
};

const defaults = {
  camera: [0, 1.4, 9],
  target: [0, 0, 0],
  projection: "perspective",
  fov: 60,
  clipPreset: 0,
  depthTest: true,
  splitView: false,
  orbit: false,
  orbitAngle: 0
};

const state = structuredClone(defaults);
const clipPresets = [
  { near: 0.1, far: 100 },
  { near: 2.5, far: 30 },
  { near: 6, far: 12 }
];
const cubePositions = [[-2.8, 0, 0], [0, 0, -1.5], [2.8, 0, -3]];
const keys = new Set();

const ui = {
  camera: document.querySelector("#cameraValue"),
  target: document.querySelector("#targetValue"),
  projection: document.querySelector("#projectionValue"),
  fov: document.querySelector("#fovValue"),
  clip: document.querySelector("#clipValue"),
  depth: document.querySelector("#depthValue"),
  fovSlider: document.querySelector("#fovSlider"),
  fovOutput: document.querySelector("#fovOutput"),
  projectionButton: document.querySelector("#projectionButton"),
  splitButton: document.querySelector("#splitButton"),
  depthButton: document.querySelector("#depthButton"),
  orbitButton: document.querySelector("#orbitButton"),
  leftLabel: document.querySelector("#leftViewLabel"),
  rightLabel: document.querySelector("#rightViewLabel")
};

const formatVector = (vector) => vector.map((value) => value.toFixed(1)).join(", ");
const activeClip = () => clipPresets[state.clipPreset];

function updateHud() {
  const clip = activeClip();
  ui.camera.textContent = `(${formatVector(state.camera)})`;
  ui.target.textContent = `(${formatVector(state.target)})`;
  ui.projection.textContent = state.splitView ? "Split view" : state.projection;
  ui.fov.textContent = `${state.fov}°`;
  ui.clip.textContent = `${clip.near} / ${clip.far}`;
  ui.depth.textContent = state.depthTest ? "ON" : "OFF";
  ui.fovSlider.value = state.fov;
  ui.fovOutput.textContent = `${state.fov}°`;
  ui.depthButton.classList.toggle("active", state.depthTest);
  ui.splitButton.classList.toggle("active", state.splitView);
  ui.orbitButton.classList.toggle("active", state.orbit);
  ui.leftLabel.textContent = state.splitView ? "Perspective" : state.projection;
  ui.rightLabel.textContent = state.splitView ? "Orthographic" : "";
  document.querySelectorAll("[data-fov]").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.fov) === state.fov);
  });
}

function resizeCanvas() {
  const ratio = Math.min(devicePixelRatio, 2);
  const width = Math.round(canvas.clientWidth * ratio);
  const height = Math.round(canvas.clientHeight * ratio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function projectionMatrix(type, aspect) {
  const { near, far } = activeClip();
  if (type === "perspective") {
    return perspective(degToRad(state.fov), aspect, near, far);
  }
  const size = 4.8;
  return orthographic(-size * aspect, size * aspect, -size, size, near, far);
}

function drawViewport(x, width, type, time) {
  const height = canvas.height;
  gl.viewport(x, 0, width, height);
  gl.uniformMatrix4fv(uniforms.projection, false, projectionMatrix(type, width / height));
  gl.uniformMatrix4fv(uniforms.view, false, lookAt(state.camera, state.target, [0, 1, 0]));

  cubePositions.forEach(([xPosition, yPosition, zPosition], index) => {
    const rotation = multiply(rotationY(time * .00055 + index * .5), rotationX(time * .00032));
    const model = multiply(translation(xPosition, yPosition, zPosition), rotation);
    gl.uniformMatrix4fv(uniforms.model, false, model);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
  });
}

function updateCamera(deltaTime) {
  const speed = 4 * deltaTime;
  if (keys.has("arrowleft")) state.camera[0] -= speed;
  if (keys.has("arrowright")) state.camera[0] += speed;
  if (keys.has("arrowup")) state.camera[1] += speed;
  if (keys.has("arrowdown")) state.camera[1] -= speed;
  if (keys.has("w")) state.camera[2] -= speed;
  if (keys.has("s")) state.camera[2] += speed;
  if (keys.has("j")) state.target[0] -= speed;
  if (keys.has("l")) state.target[0] += speed;
  if (keys.has("i")) state.target[1] += speed;
  if (keys.has("k")) state.target[1] -= speed;

  if (keys.has("q")) state.orbitAngle -= deltaTime;
  if (keys.has("e")) state.orbitAngle += deltaTime;
  if (state.orbit) state.orbitAngle += deltaTime * .45;

  if (state.orbit || keys.has("q") || keys.has("e")) {
    const radius = Math.max(4, Math.hypot(state.camera[0] - state.target[0], state.camera[2] - state.target[2]));
    state.camera[0] = state.target[0] + Math.sin(state.orbitAngle) * radius;
    state.camera[2] = state.target[2] + Math.cos(state.orbitAngle) * radius;
  }
}

function render(time) {
  const deltaTime = Math.min((time - render.lastTime) / 1000, .05);
  render.lastTime = time;
  updateCamera(deltaTime);
  resizeCanvas();

  state.depthTest ? gl.enable(gl.DEPTH_TEST) : gl.disable(gl.DEPTH_TEST);
  gl.clearColor(.973, .98, .988, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(program);
  gl.bindVertexArray(vao);

  if (state.splitView) {
    const half = Math.floor(canvas.width / 2);
    drawViewport(0, half, "perspective", time);
    drawViewport(half, canvas.width - half, "orthographic", time);
  } else {
    drawViewport(0, canvas.width, state.projection, time);
  }

  updateHud();
  requestAnimationFrame(render);
}
render.lastTime = performance.now();

function toggleProjection() {
  state.projection = state.projection === "perspective" ? "orthographic" : "perspective";
}

function changeFov(amount) {
  state.fov = Math.max(25, Math.min(100, state.fov + amount));
}

function reset() {
  Object.assign(state, structuredClone(defaults));
}

function handleAction(key) {
  if (key === "p") toggleProjection();
  if (key === "[") changeFov(-5);
  if (key === "]") changeFov(5);
  if (key === "n") state.clipPreset = (state.clipPreset + 1) % clipPresets.length;
  if (key === "d") state.depthTest = !state.depthTest;
  if (key === "r") reset();
  if (key === "v") state.splitView = !state.splitView;
  if (key === "o") state.orbit = !state.orbit;
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keys.add(key);
  if (["arrowleft", "arrowright", "arrowup", "arrowdown", "[", "]"].includes(key)) event.preventDefault();
  if (!event.repeat) handleAction(key);
});

window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
window.addEventListener("blur", () => keys.clear());

document.querySelector("#resetButton").addEventListener("click", reset);
document.querySelector("#projectionButton").addEventListener("click", toggleProjection);
document.querySelector("#splitButton").addEventListener("click", () => { state.splitView = !state.splitView; });
document.querySelector("#clipButton").addEventListener("click", () => { state.clipPreset = (state.clipPreset + 1) % clipPresets.length; });
document.querySelector("#depthButton").addEventListener("click", () => { state.depthTest = !state.depthTest; });
document.querySelector("#orbitButton").addEventListener("click", () => { state.orbit = !state.orbit; });
ui.fovSlider.addEventListener("input", () => { state.fov = Number(ui.fovSlider.value); });
document.querySelectorAll("[data-fov]").forEach((button) => {
  button.addEventListener("click", () => { state.fov = Number(button.dataset.fov); });
});

updateHud();
requestAnimationFrame(render);
