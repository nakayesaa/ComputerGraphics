"use strict";

const canvas = document.querySelector("#glCanvas");
const canvasShell = document.querySelector("#canvasShell");
const gl = canvas.getContext("webgl2", { alpha: true, antialias: true });

const ui = {
  positionX: document.querySelector("#positionX"),
  positionY: document.querySelector("#positionY"),
  rotation: document.querySelector("#rotation"),
  scaleX: document.querySelector("#scaleX"),
  scaleY: document.querySelector("#scaleY"),
  order: document.querySelector("#orderValue"),
  orderDescription: document.querySelector("#orderDescription"),
  objectB: document.querySelector("#objectBStatus"),
  objectALabel: document.querySelector("#objectALabel"),
  compareLabel: document.querySelector("#compareLabel"),
  pointer: document.querySelector("#pointerStatus"),
  error: document.querySelector("#webglError")
};

if (!gl) {
  ui.error.hidden = false;
  throw new Error("WebGL2 tidak tersedia pada browser ini.");
}

if (!Matrix3.selfTest()) {
  throw new Error("Matrix3 self-test gagal.");
}

const vertexShaderSource = `#version 300 es
  in vec2 a_position;

  uniform mat3 u_model;
  uniform vec2 u_resolution;
  uniform float u_pointSize;

  void main() {
    vec2 world = (u_model * vec3(a_position, 1.0)).xy;
    vec2 clip = world / (u_resolution * 0.5);
    gl_Position = vec4(clip, 0.0, 1.0);
    gl_PointSize = u_pointSize;
  }
`;

const fragmentShaderSource = `#version 300 es
  precision mediump float;

  uniform vec4 u_color;
  uniform bool u_roundPoint;
  out vec4 outColor;

  void main() {
    if (u_roundPoint && distance(gl_PointCoord, vec2(0.5)) > 0.5) {
      discard;
    }
    outColor = u_color;
  }
`;

function createShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader gagal dikompilasi: ${message}`);
  }

  return shader;
}

function createProgram() {
  const program = gl.createProgram();
  gl.attachShader(program, createShader(gl.VERTEX_SHADER, vertexShaderSource));
  gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fragmentShaderSource));
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Program WebGL gagal ditautkan: ${gl.getProgramInfoLog(program)}`);
  }

  return program;
}

function createGeometry(vertices, usage = gl.STATIC_DRAW) {
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, usage);
  gl.enableVertexAttribArray(locations.position);
  gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);

  return { vao, buffer };
}

const program = createProgram();
const locations = {
  position: gl.getAttribLocation(program, "a_position"),
  model: gl.getUniformLocation(program, "u_model"),
  resolution: gl.getUniformLocation(program, "u_resolution"),
  color: gl.getUniformLocation(program, "u_color"),
  pointSize: gl.getUniformLocation(program, "u_pointSize"),
  roundPoint: gl.getUniformLocation(program, "u_roundPoint")
};

// Satu local-coordinate buffer ini dipakai ulang oleh Object A, pembanding, dan Object B.
const objectVertices = new Float32Array([
  -52, -28,  12, -28, -52,  28,
  -52,  28,  12, -28,  12,  28,
   12, -47,  62,   0,  12,  47
]);

const objectGeometry = createGeometry(objectVertices);
const axisGeometry = createGeometry(new Float32Array(10), gl.DYNAMIC_DRAW);

const COLORS = {
  objectA: [0.91, 0.435, 0.318, 1],
  comparison: [0.616, 0.804, 0.741, 0.27],
  objectB: [0.945, 0.776, 0.435, 1],
  axisX: [0.79, 0.84, 0.81, 0.36],
  axisY: [0.79, 0.84, 0.81, 0.25],
  origin: [0.91, 0.435, 0.318, 1]
};

const player = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
const autoObject = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
const pressedKeys = new Set();
let activeOrder = "TRS";
let dragging = false;
let initialized = false;
let viewportWidth = 1;
let viewportHeight = 1;
let lastFrame = performance.now();

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const radians = (degrees) => degrees * Math.PI / 180;
const degrees = (angle) => angle * 180 / Math.PI;

function resetTransform() {
  Object.assign(player, {
    x: -viewportWidth * 0.23,
    y: viewportHeight * 0.12,
    rotation: radians(8),
    scaleX: 1,
    scaleY: 1
  });
  activeOrder = "TRS";
  updateHud();
}

function applyPreset(number) {
  const presets = {
    1: { x: -viewportWidth * 0.23, y: viewportHeight * 0.12, rotation: 0, scaleX: 1, scaleY: 1 },
    2: { x: viewportWidth * 0.24, y: viewportHeight * 0.04, rotation: radians(48), scaleX: 0.82, scaleY: 1.18 },
    3: { x: -viewportWidth * 0.1, y: -viewportHeight * 0.22, rotation: radians(-28), scaleX: 1.65, scaleY: 0.58 }
  };

  Object.assign(player, presets[number]);
  updateHud();
}

function toggleOrder() {
  activeOrder = activeOrder === "TRS" ? "RTS" : "TRS";
  updateHud();
}

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(bounds.width * pixelRatio));
  const height = Math.max(1, Math.round(bounds.height * pixelRatio));

  viewportWidth = bounds.width;
  viewportHeight = bounds.height;

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  }

  const halfWidth = viewportWidth / 2 - 24;
  const halfHeight = viewportHeight / 2 - 24;
  const axes = new Float32Array([
    -halfWidth, 0, halfWidth, 0,
    0, -halfHeight, 0, halfHeight,
    0, 0
  ]);

  gl.bindBuffer(gl.ARRAY_BUFFER, axisGeometry.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, axes, gl.DYNAMIC_DRAW);

  if (!initialized) {
    resetTransform();
    initialized = true;
  } else {
    keepPlayerInView();
  }
}

function keepPlayerInView() {
  const margin = 72;
  player.x = clamp(player.x, -viewportWidth / 2 + margin, viewportWidth / 2 - margin);
  player.y = clamp(player.y, -viewportHeight / 2 + margin, viewportHeight / 2 - margin);
}

function updatePlayer(deltaTime) {
  const horizontal = Number(pressedKeys.has("ArrowRight")) - Number(pressedKeys.has("ArrowLeft"));
  const vertical = Number(pressedKeys.has("ArrowUp")) - Number(pressedKeys.has("ArrowDown"));
  const diagonalFactor = horizontal && vertical ? Math.SQRT1_2 : 1;

  player.x += horizontal * 230 * diagonalFactor * deltaTime;
  player.y += vertical * 230 * diagonalFactor * deltaTime;
  player.rotation += (Number(pressedKeys.has("KeyQ")) - Number(pressedKeys.has("KeyE"))) * 1.75 * deltaTime;

  const uniformDirection = Number(pressedKeys.has("Equal") || pressedKeys.has("NumpadAdd"))
    - Number(pressedKeys.has("Minus") || pressedKeys.has("NumpadSubtract"));
  const xDirection = Number(pressedKeys.has("KeyX")) - Number(pressedKeys.has("KeyZ"));
  const yDirection = Number(pressedKeys.has("KeyV")) - Number(pressedKeys.has("KeyC"));

  player.scaleX *= Math.exp((uniformDirection + xDirection) * 0.95 * deltaTime);
  player.scaleY *= Math.exp((uniformDirection + yDirection) * 0.95 * deltaTime);
  player.scaleX = clamp(player.scaleX, 0.25, 2.4);
  player.scaleY = clamp(player.scaleY, 0.25, 2.4);

  if (Math.abs(player.rotation) > Math.PI) {
    player.rotation -= Math.sign(player.rotation) * Math.PI * 2;
  }

  keepPlayerInView();
}

function updateAutoObject(time) {
  autoObject.x = viewportWidth * 0.25;
  autoObject.y = -viewportHeight * 0.2;
  autoObject.rotation = time * 0.72;
  autoObject.scaleX = 0.9 + Math.sin(time * 1.7) * 0.2;
  autoObject.scaleY = 0.9 + Math.cos(time * 1.35) * 0.2;
}

function setColor(color) {
  gl.uniform4fv(locations.color, color);
}

function drawAxes() {
  gl.bindVertexArray(axisGeometry.vao);
  gl.uniformMatrix3fv(locations.model, false, Matrix3.identity());
  gl.uniform1f(locations.pointSize, 11);

  gl.uniform1i(locations.roundPoint, false);
  setColor(COLORS.axisX);
  gl.drawArrays(gl.LINES, 0, 2);
  setColor(COLORS.axisY);
  gl.drawArrays(gl.LINES, 2, 2);

  gl.uniform1i(locations.roundPoint, true);
  setColor(COLORS.origin);
  gl.drawArrays(gl.POINTS, 4, 1);
}

function drawObject(model, color) {
  gl.bindVertexArray(objectGeometry.vao);
  gl.uniformMatrix3fv(locations.model, false, model);
  gl.uniform1i(locations.roundPoint, false);
  setColor(color);
  gl.drawArrays(gl.TRIANGLES, 0, objectVertices.length / 2);
}

function positionLabel(element, model) {
  const point = Matrix3.transformPoint(model, 0, 0);
  element.style.left = `${clamp(viewportWidth / 2 + point.x, 42, viewportWidth - 42)}px`;
  element.style.top = `${clamp(viewportHeight / 2 - point.y, 16, viewportHeight - 76)}px`;
}

function drawScene() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);
  gl.uniform2f(locations.resolution, viewportWidth, viewportHeight);

  drawAxes();

  const alternateOrder = activeOrder === "TRS" ? "RTS" : "TRS";
  const alternateModel = Matrix3.compose(player, alternateOrder);
  const activeModel = Matrix3.compose(player, activeOrder);
  const autoModel = Matrix3.compose(autoObject, "TRS");

  drawObject(alternateModel, COLORS.comparison);
  drawObject(activeModel, COLORS.objectA);
  drawObject(autoModel, COLORS.objectB);

  positionLabel(ui.compareLabel, alternateModel);
  positionLabel(ui.objectALabel, activeModel);
}

function updateHud() {
  ui.positionX.textContent = player.x.toFixed(1);
  ui.positionY.textContent = player.y.toFixed(1);
  ui.rotation.textContent = `${degrees(player.rotation).toFixed(1)}°`;
  ui.scaleX.textContent = player.scaleX.toFixed(2);
  ui.scaleY.textContent = player.scaleY.toFixed(2);
  ui.order.textContent = activeOrder === "TRS" ? "T · R · S" : "R · T · S";
  ui.orderDescription.textContent = activeOrder === "TRS"
    ? "scale → rotate → translate"
    : "scale → translate → rotate";
  ui.objectB.textContent = `rotation ${degrees(autoObject.rotation % (Math.PI * 2)).toFixed(1)}° · scale ${autoObject.scaleX.toFixed(2)} × ${autoObject.scaleY.toFixed(2)}`;
}

function animate(now) {
  const deltaTime = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;

  if (!dragging) updatePlayer(deltaTime);
  updateAutoObject(now / 1000);
  updateHud();
  drawScene();
  requestAnimationFrame(animate);
}

function pointerToWorld(event) {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: event.clientX - bounds.left - bounds.width / 2,
    y: bounds.height / 2 - (event.clientY - bounds.top)
  };
}

function movePlayerToPointer(event) {
  Object.assign(player, pointerToWorld(event));
  keepPlayerInView();
  updateHud();
}

const controlledCodes = new Set([
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  "KeyQ", "KeyE", "Equal", "Minus", "NumpadAdd", "NumpadSubtract",
  "KeyZ", "KeyX", "KeyC", "KeyV", "KeyR", "KeyT", "Digit1", "Digit2", "Digit3"
]);

window.addEventListener("keydown", (event) => {
  if (!controlledCodes.has(event.code)) return;

  event.preventDefault();
  pressedKeys.add(event.code);

  if (event.repeat) return;
  if (event.code === "KeyR") resetTransform();
  if (event.code === "KeyT") toggleOrder();
  if (event.code.startsWith("Digit")) applyPreset(Number(event.code.at(-1)));
});

window.addEventListener("keyup", (event) => pressedKeys.delete(event.code));
window.addEventListener("blur", () => pressedKeys.clear());

canvas.addEventListener("pointerdown", (event) => {
  dragging = true;
  canvas.classList.add("is-dragging");
  canvas.setPointerCapture(event.pointerId);
  canvas.focus();
  movePlayerToPointer(event);
  ui.pointer.textContent = "Translation via pointer aktif";
});

canvas.addEventListener("pointermove", (event) => {
  if (dragging) movePlayerToPointer(event);
});

function endDrag(event) {
  dragging = false;
  canvas.classList.remove("is-dragging");
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  ui.pointer.textContent = "Drag canvas untuk translation";
}

canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.action === "reset") resetTransform();
    if (button.dataset.action === "order") toggleOrder();
    canvas.focus();
  });
});

document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    applyPreset(Number(button.dataset.preset));
    canvas.focus();
  });
});

gl.clearColor(0, 0, 0, 0);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
resizeCanvas();
new ResizeObserver(resizeCanvas).observe(canvasShell);
requestAnimationFrame(animate);
