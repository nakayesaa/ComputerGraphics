const canvas = document.querySelector("#glCanvas");
const errorMessage = document.querySelector("#errorMessage");
const gl = canvas.getContext("webgl2", { antialias: true });

if (!gl) {
  errorMessage.hidden = false;
  errorMessage.textContent = "WebGL2 tidak tersedia. Gunakan browser modern dengan hardware acceleration aktif.";
  throw new Error("WebGL2 is not supported");
}

const vertexShaderSource = `#version 300 es
in vec2 a_position;
in vec3 a_color;
uniform vec2 u_offset;
uniform float u_aspect;
out vec3 v_color;

void main() {
  vec2 position = vec2(a_position.x / u_aspect, a_position.y) + u_offset;
  gl_Position = vec4(position, 0.0, 1.0);
  gl_PointSize = 9.0;
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

const program = createProgram();
const positionLocation = gl.getAttribLocation(program, "a_position");
const colorLocation = gl.getAttribLocation(program, "a_color");
const offsetLocation = gl.getUniformLocation(program, "u_offset");
const aspectLocation = gl.getUniformLocation(program, "u_aspect");

function createPrimitive(vertices, solidMode, outlineStart = 0, outlineCount = vertices.length / 5) {
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 20, 0);
  gl.enableVertexAttribArray(colorLocation);
  gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 20, 8);

  return { vao, count: vertices.length / 5, solidMode, outlineStart, outlineCount };
}

const triangle = createPrimitive([
   0.00,  0.24, 0.96, 0.32, 0.32,
  -0.22, -0.20, 0.28, 0.68, 0.96,
   0.22, -0.20, 0.36, 0.82, 0.58
], gl.TRIANGLES);

const square = createPrimitive([
  -0.20, -0.20, 0.95, 0.58, 0.20,
   0.20, -0.20, 0.94, 0.36, 0.42,
   0.20,  0.20, 0.58, 0.42, 0.90,
  -0.20,  0.20, 0.24, 0.70, 0.72
], gl.TRIANGLE_FAN);

function createCircle(segmentCount = 48) {
  const vertices = [];
  for (let index = 0; index < segmentCount; index += 1) {
    const angle = index / segmentCount * Math.PI * 2;
    const mix = index / segmentCount;
    vertices.push(
      Math.cos(angle) * 0.17,
      Math.sin(angle) * 0.17,
      0.30 + mix * 0.45,
      0.48,
      0.88 - mix * 0.30
    );
  }
  return createPrimitive(vertices, gl.TRIANGLE_FAN);
}

const circle = createCircle();

const defaults = {
  mode: "solid",
  paused: false,
  trianglePosition: [-0.48, 0.30],
  circlePosition: [-0.65, -0.42],
  circleVelocity: 0.46
};
const state = structuredClone(defaults);
const pressedKeys = new Set();

const ui = {
  mode: document.querySelector("#modeValue"),
  animation: document.querySelector("#animationValue"),
  triangle: document.querySelector("#triangleValue"),
  pointer: document.querySelector("#pointerValue")
};

function resizeCanvas() {
  const ratio = Math.min(devicePixelRatio, 2);
  const width = Math.round(canvas.clientWidth * ratio);
  const height = Math.round(canvas.clientHeight * ratio);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function drawPrimitive(primitive, offset) {
  gl.bindVertexArray(primitive.vao);
  gl.uniform2fv(offsetLocation, offset);

  if (state.mode === "solid") {
    gl.drawArrays(primitive.solidMode, 0, primitive.count);
  } else if (state.mode === "wireframe") {
    gl.drawArrays(gl.LINE_LOOP, primitive.outlineStart, primitive.outlineCount);
  } else {
    gl.drawArrays(gl.POINTS, primitive.outlineStart, primitive.outlineCount);
  }
}

function update(deltaTime) {
  const speed = 0.85 * deltaTime;
  if (pressedKeys.has("arrowleft")) state.trianglePosition[0] -= speed;
  if (pressedKeys.has("arrowright")) state.trianglePosition[0] += speed;
  if (pressedKeys.has("arrowup")) state.trianglePosition[1] += speed;
  if (pressedKeys.has("arrowdown")) state.trianglePosition[1] -= speed;

  state.trianglePosition[0] = Math.max(-0.88, Math.min(0.88, state.trianglePosition[0]));
  state.trianglePosition[1] = Math.max(-0.75, Math.min(0.75, state.trianglePosition[1]));

  if (!state.paused) {
    state.circlePosition[0] += state.circleVelocity * deltaTime;
    if (Math.abs(state.circlePosition[0]) >= 0.72) {
      state.circlePosition[0] = Math.sign(state.circlePosition[0]) * 0.72;
      state.circleVelocity *= -1;
    }
  }
}

function updateHud() {
  const modeNames = { solid: "Solid", wireframe: "Wireframe", points: "Points" };
  ui.mode.textContent = modeNames[state.mode];
  ui.animation.textContent = state.paused ? "Paused" : "Running";
  ui.triangle.textContent = state.trianglePosition.map((value) => value.toFixed(2)).join(", ");
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.mode);
  });
}

function render(time) {
  const deltaTime = Math.min((time - render.lastTime) / 1000, 0.05);
  render.lastTime = time;

  resizeCanvas();
  update(deltaTime);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.98, 0.98, 0.98, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);
  gl.uniform1f(aspectLocation, canvas.width / canvas.height);

  drawPrimitive(triangle, state.trianglePosition);
  drawPrimitive(square, [0.50, 0.32]);
  drawPrimitive(circle, state.circlePosition);
  updateHud();
  requestAnimationFrame(render);
}
render.lastTime = performance.now();

function setMode(mode) {
  if (["solid", "wireframe", "points"].includes(mode)) state.mode = mode;
}

function reset() {
  Object.assign(state, structuredClone(defaults));
  pressedKeys.clear();
}

function pointerToClipSpace(event) {
  const bounds = canvas.getBoundingClientRect();
  return [
    (event.clientX - bounds.left) / bounds.width * 2 - 1,
    1 - (event.clientY - bounds.top) / bounds.height * 2
  ];
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  pressedKeys.add(key);
  if (key.startsWith("arrow") || key === " ") event.preventDefault();
  if (event.repeat) return;
  if (key === "1") setMode("solid");
  if (key === "2") setMode("wireframe");
  if (key === "3") setMode("points");
  if (key === " ") state.paused = !state.paused;
  if (key === "r") reset();
});

window.addEventListener("keyup", (event) => pressedKeys.delete(event.key.toLowerCase()));
window.addEventListener("blur", () => pressedKeys.clear());

canvas.addEventListener("pointermove", (event) => {
  const [x, y] = pointerToClipSpace(event);
  ui.pointer.textContent = `${x.toFixed(2)}, ${y.toFixed(2)}`;
});

canvas.addEventListener("pointerleave", () => { ui.pointer.textContent = "—"; });
canvas.addEventListener("pointerdown", (event) => {
  const [x, y] = pointerToClipSpace(event);
  state.trianglePosition = [
    Math.max(-0.88, Math.min(0.88, x)),
    Math.max(-0.75, Math.min(0.75, y))
  ];
});

document.querySelector("#resetButton").addEventListener("click", reset);
document.querySelectorAll("[data-mode]").forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

requestAnimationFrame(render);
