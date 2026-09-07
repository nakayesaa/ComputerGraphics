const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");

const ui = {
  mouse: document.querySelector("#mousePosition"),
  score: document.querySelector("#score"),
  status: document.querySelector("#animationStatus")
};

const PLAYER_START = { x: 90, y: 320 };
const PLAYER_COLORS = ["#5b6ee1", "#ef7b72", "#34a88b", "#a66bd4"];
const MOVEMENT_KEYS = ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"];

const player = {
  ...PLAYER_START,
  width: 64,
  height: 64,
  speed: 260,
  colorIndex: 0
};

const ball = {
  x: 300,
  y: 120,
  radius: 28,
  velocityX: 125,
  velocityY: 92,
  color: "#ffb84d"
};

const pressedKeys = new Set();
let score = 0;
let isPaused = false;
let lastFrame = performance.now();

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function drawGrid() {
  ctx.beginPath();

  for (let x = 50; x < canvas.width; x += 50) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }

  for (let y = 50; y < canvas.height; y += 50) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }

  ctx.strokeStyle = "#eef1f6";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawLine() {
  ctx.beginPath();
  ctx.moveTo(70, 265);
  ctx.lineTo(830, 265);
  ctx.strokeStyle = "#9aa8be";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.stroke();
}

function drawTriangle() {
  ctx.beginPath();
  ctx.moveTo(720, 72);
  ctx.lineTo(650, 205);
  ctx.lineTo(790, 205);
  ctx.closePath();
  ctx.fillStyle = "#65c5ae";
  ctx.fill();
  ctx.strokeStyle = "#31947d";
  ctx.lineWidth = 4;
  ctx.stroke();
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = ball.color;
  ctx.fill();
  ctx.strokeStyle = "#e59a2a";
  ctx.lineWidth = 4;
  ctx.stroke();
}

function drawPlayer() {
  ctx.fillStyle = PLAYER_COLORS[player.colorIndex];
  ctx.fillRect(player.x, player.y, player.width, player.height);

  ctx.fillStyle = "#ffffffe6";
  ctx.fillRect(player.x + 14, player.y + 17, 9, 9);
  ctx.fillRect(player.x + 41, player.y + 17, 9, 9);
  ctx.fillRect(player.x + 17, player.y + 43, 30, 5);
}

function drawLabels() {
  ctx.fillStyle = "#718097";
  ctx.font = "600 15px system-ui, sans-serif";
  ctx.fillText("CIRCLE", ball.x - 25, Math.max(24, ball.y - 42));
  ctx.fillText("TRIANGLE", 682, 225);
  ctx.fillText("LINE", 70, 250);
  ctx.fillText("RECTANGLE", player.x - 2, player.y - 13);
}

function getDirection() {
  let x = Number(pressedKeys.has("arrowright") || pressedKeys.has("d"));
  let y = Number(pressedKeys.has("arrowdown") || pressedKeys.has("s"));

  x -= Number(pressedKeys.has("arrowleft") || pressedKeys.has("a"));
  y -= Number(pressedKeys.has("arrowup") || pressedKeys.has("w"));

  if (x && y) return { x: x * Math.SQRT1_2, y: y * Math.SQRT1_2 };
  return { x, y };
}

function updatePlayer(deltaTime) {
  const direction = getDirection();

  player.x += direction.x * player.speed * deltaTime;
  player.y += direction.y * player.speed * deltaTime;
  player.x = clamp(player.x, 0, canvas.width - player.width);
  player.y = clamp(player.y, 0, canvas.height - player.height);
}

function updateBall(deltaTime) {
  ball.x += ball.velocityX * deltaTime;
  ball.y += ball.velocityY * deltaTime;

  if (ball.x <= ball.radius || ball.x >= canvas.width - ball.radius) {
    ball.velocityX *= -1;
    ball.x = clamp(ball.x, ball.radius, canvas.width - ball.radius);
  }

  if (ball.y <= ball.radius || ball.y >= canvas.height - ball.radius) {
    ball.velocityY *= -1;
    ball.y = clamp(ball.y, ball.radius, canvas.height - ball.radius);
  }
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawLine();
  drawTriangle();
  drawBall();
  drawPlayer();
  drawLabels();
}

function animate(time) {
  const deltaTime = Math.min((time - lastFrame) / 1000, 0.05);
  lastFrame = time;

  if (!isPaused) {
    updatePlayer(deltaTime);
    updateBall(deltaTime);
  }

  drawScene();
  requestAnimationFrame(animate);
}

function getPointerPosition(event) {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
    y: (event.clientY - bounds.top) * (canvas.height / bounds.height)
  };
}

function handleSingleKeyAction(key) {
  if (key === "c") {
    player.colorIndex = (player.colorIndex + 1) % PLAYER_COLORS.length;
  }

  if (key === "r") {
    Object.assign(player, PLAYER_START);
  }

  if (key === " ") {
    isPaused = !isPaused;
    ui.status.textContent = isPaused ? "Dijeda" : "Berjalan";
  }
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  pressedKeys.add(key);

  if (MOVEMENT_KEYS.includes(key) || key === " ") event.preventDefault();
  if (!event.repeat) handleSingleKeyAction(key);
});

window.addEventListener("keyup", (event) => {
  pressedKeys.delete(event.key.toLowerCase());
});

window.addEventListener("blur", () => pressedKeys.clear());

canvas.addEventListener("pointermove", (event) => {
  const { x, y } = getPointerPosition(event);
  ui.mouse.textContent = `x: ${Math.round(x)}   y: ${Math.round(y)}`;
});

canvas.addEventListener("pointerleave", () => {
  ui.mouse.textContent = "x: —   y: —";
});

canvas.addEventListener("pointerdown", (event) => {
  const pointer = getPointerPosition(event);
  const hitBall = Math.hypot(pointer.x - ball.x, pointer.y - ball.y) <= ball.radius;

  if (!hitBall) return;

  score += 1;
  ui.score.textContent = score;
  ball.velocityX *= -1.06;
  ball.velocityY *= -1.06;
  ball.color = score % 2 ? "#f2789f" : "#ffb84d";
});

requestAnimationFrame(animate);
