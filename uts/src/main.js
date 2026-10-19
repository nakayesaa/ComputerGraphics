import "./style.css";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { applyGate, fleetPosition, sectorAt } from "./rules.js";

const $ = (id) => document.getElementById(id);
const RUN_SPEED = 26;
const mint = 0x70f8da,
  orange = 0xff9463;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111923);
scene.fog = new THREE.FogExp2(0x19232e, 0.009);
const camera = new THREE.PerspectiveCamera(
  47,
  innerWidth / innerHeight,
  0.1,
  420,
);
const renderer = new THREE.WebGLRenderer({
  canvas: $("world"),
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.22;
// A generated environment map gives PBR metals visible reflections.
const pmrem = new THREE.PMREMGenerator(renderer);
const room = new RoomEnvironment();
const environmentMap = pmrem.fromScene(room, 0.04);
scene.environment = environmentMap.texture;
scene.environmentIntensity = 0.65;
room.dispose();
pmrem.dispose();
const composer = new EffectComposer(renderer);
composer.setPixelRatio(1);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  0.24,
  0.45,
  1.0,
);
composer.addPass(bloom);
composer.addPass(new OutputPass());
scene.add(new THREE.HemisphereLight(0xe1ecf4, 0x26303a, 2.6));
const sun = new THREE.DirectionalLight(0xf3f5f6, 3.4);
sun.position.set(-12, 25, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, {
  left: -22,
  right: 22,
  top: 22,
  bottom: -30,
  near: 0.5,
  far: 90,
});
sun.shadow.bias = -0.0006;
scene.add(sun);
const rim = new THREE.DirectionalLight(0xa6c4d4, 1.5);
rim.position.set(12, 5, -20);
scene.add(rim);
const warm = new THREE.PointLight(0xe8d9c8, 30, 45, 2);
warm.position.set(7, 5, -20);
scene.add(warm);
const pbr = (color, metalness = 0.5, roughness = 0.42) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness });
const glow = (color) =>
  new THREE.MeshBasicMaterial({ color, toneMapped: false });
const metal = pbr(0x38444f, 0.65, 0.45),
  dark = pbr(0x202c36, 0.55, 0.55),
  cyan = glow(mint),
  amber = glow(orange);
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
function box(parent, material, x, y, z, sx, sy, sz) {
  const m = new THREE.Mesh(boxGeo, material);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = !material.isMeshBasicMaterial;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
const environment = new THREE.Group();
scene.add(environment);
const deck = box(
  environment,
  pbr(0x26313b, 0.4, 0.65),
  0,
  -0.28,
  -64,
  21,
  0.5,
  180,
);
deck.receiveShadow = true;
const gridVertices = [];
for (let x = -10; x <= 10; x += 2) gridVertices.push(x, 0, -90, x, 0, 90);
for (let z = -90; z <= 90; z += 2) gridVertices.push(-10, 0, z, 10, 0, z);
const gridGeometry = new THREE.BufferGeometry();
gridGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(gridVertices, 3),
);
const grid = new THREE.LineSegments(
  gridGeometry,
  new THREE.LineBasicMaterial({
    color: 0x385475,
    transparent: true,
    opacity: 0.35,
  }),
);
grid.position.set(0, -0.017, -65);
environment.add(grid);
const markerMaterial = pbr(0x3e495e);
for (let i = 0; i < 50; i++) {
  const z = 12 - i * 4;
  for (const side of [-1, 1]) {
    box(environment, metal, side * 10.6, -0.12, z, 0.7, 0.4, 3.85);
    box(environment, cyan, side * 10.25, 0.13, z, 0.045, 0.035, 2);
    if (i % 3 === 0) {
      box(environment, dark, side * 11.8, -1, z, 1.6, 2.5, 2);
      box(environment, amber, side * 11.8, 0.3, z, 0.4, 0.05, 1);
    }
  }
  if (i % 2 === 0)
    box(environment, markerMaterial, 0, 0.001, z, 0.035, 0.009, 0.6);
}
// Procedural orbital backdrop: stars, distant planet, and orbital rings.
const starPositions = new Float32Array(1500 * 3);
for (let i = 0; i < 1500; i++) {
  starPositions[i * 3] = (Math.random() - 0.5) * 500;
  starPositions[i * 3 + 1] = Math.random() * 190 + 8;
  starPositions[i * 3 + 2] = (Math.random() - 0.75) * 430;
}
const starsGeo = new THREE.BufferGeometry();
starsGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
scene.add(
  new THREE.Points(
    starsGeo,
    new THREE.PointsMaterial({
      color: 0xa8bce9,
      size: 0.25,
      transparent: true,
      opacity: 0.7,
      fog: false,
    }),
  ),
);
const planet = new THREE.Mesh(
  new THREE.SphereGeometry(33, 48, 32),
  pbr(0x273b69, 0.2, 0.94),
);
planet.position.set(57, 30, -156);
planet.material.emissive.setHex(0x233d70);
planet.material.emissiveIntensity = 0.35;
planet.material.fog = false;
scene.add(planet);
const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(33.6, 48, 32),
  new THREE.MeshBasicMaterial({
    color: 0x7a86d6,
    transparent: true,
    opacity: 0.09,
    side: THREE.BackSide,
  }),
);
planet.add(atmosphere);
const ring = new THREE.Mesh(
  new THREE.RingGeometry(43, 43.25, 160),
  new THREE.MeshBasicMaterial({
    color: 0x879cca,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3,
  }),
);
ring.rotation.set(1.1, 0.3, 0.15);
planet.add(ring);
for (let i = 0; i < 12; i++) {
  const m = box(
    environment,
    dark,
    (-1) ** i * (22 + Math.random() * 24),
    -8 - Math.random() * 10,
    -20 - i * 15,
    4,
    20 + Math.random() * 25,
    5,
  );
  m.rotation.z = (Math.random() - 0.5) * 0.15;
}

// Batch static runway pieces into one draw per material instead of hundreds.
const batches = new Map();
for (const mesh of [...environment.children]) {
  if (!mesh.isMesh || mesh.geometry !== boxGeo) continue;
  if (!batches.has(mesh.material)) batches.set(mesh.material, []);
  batches.get(mesh.material).push(mesh);
}
for (const [material, meshes] of batches) {
  const batch = new THREE.InstancedMesh(boxGeo, material, meshes.length);
  meshes.forEach((mesh, index) => {
    mesh.updateMatrix();
    batch.setMatrixAt(index, mesh.matrix);
    environment.remove(mesh);
  });
  batch.castShadow = !material.isMeshBasicMaterial;
  batch.receiveShadow = true;
  environment.add(batch);
}

// Shared primitive geometry/materials live for the app; per-run assets are released.
const sharedMaterials = new Set([metal, dark, cyan, amber]);
function releaseObject(object) {
  scene.remove(object);
  object.traverse((child) => {
    if (child.geometry && child.geometry !== boxGeo) child.geometry.dispose();
    if (child.material && !sharedMaterials.has(child.material)) {
      child.material.map?.dispose();
      child.material.dispose();
    }
  });
}

const fleetGroup = new THREE.Group();
fleetGroup.position.set(0, 1.05, 6);
scene.add(fleetGroup);
let shipTemplate,
  ships = [],
  fleet = 8,
  state = "ready",
  distance = 0,
  targetX = 0,
  kills = 0,
  bossHP = 100,
  cooldown = 0,
  shotClock = 0,
  hudClock = 0,
  bossClock = 0,
  time = 0,
  toastUntil = 0,
  selected = null,
  audioEnabled = false,
  audio;
let obstacles = [],
  gates = [],
  effects = [],
  bolts = [],
  enemyShots = [],
  boss = null;
const raycaster = new THREE.Raycaster(),
  pointer = new THREE.Vector2(),
  groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1),
  hit = new THREE.Vector3();
const keys = new Set();
function sound(freq = 400, duration = 0.1) {
  if (!audioEnabled) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    const o = audio.createOscillator(),
      g = audio.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, audio.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      freq * 0.4,
      audio.currentTime + duration,
    );
    g.gain.setValueAtTime(0.035, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    o.connect(g);
    g.connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + duration);
  } catch {
    audioEnabled = false;
  }
}
function notify(text, color = "#8ff9dd") {
  $("toast").textContent = text;
  $("toast").style.color = color;
  $("toast").style.opacity = 1;
  toastUntil = time + 1.65;
}
function setFleet(n) {
  fleet = Math.max(0, Math.min(60, n));
  while (ships.length < fleet) {
    const ship = shipTemplate.clone(true);
    ship.scale.setScalar(0.65);
    ship.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
    const engine = box(ship, cyan, 0, 0.02, 0.55, 0.18, 0.1, 0.35);
    box(ship, cyan, 0, -0.01, 0.83, 0.1, 0.08, 0.3);
    ship.userData.engine = engine;
    fleetGroup.add(ship);
    ship.userData.formation = fleetPosition(ships.length);
    ships.push(ship);
  }
  while (ships.length > fleet) fleetGroup.remove(ships.pop());
  $("fleet").textContent = String(fleet).padStart(2, "0");
  if (fleet === 0 && state === "playing") finish(false);
}
function label(text, color) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 130px monospace";
  ctx.fillText(text, 256, 132);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const s = new THREE.Sprite(mat);
  s.scale.set(4.5, 2.25, 1);
  return s;
}
function gate(x, z, type, value) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const positive = type === "multiply";
  const material = positive ? cyan : amber;
  box(g, metal, -3.55, 2.5, 0, 0.22, 5, 0.4);
  box(g, metal, 3.55, 2.5, 0, 0.22, 5, 0.4);
  box(g, material, -3.4, 2.5, 0.1, 0.07, 4.9, 0.12);
  box(g, material, 3.4, 2.5, 0.1, 0.07, 4.9, 0.12);
  box(g, material, 0, 5, 0, 7, 0.08, 0.15);
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(6.8, 5),
    new THREE.MeshBasicMaterial({
      color: positive ? mint : orange,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.07,
      depthWrite: false,
    }),
  );
  plane.position.y = 2.5;
  g.add(plane);
  const text = label(
    type === "multiply" ? `×${value}` : `${value > 0 ? "+" : ""}${value}`,
    positive ? "#92ffe0" : "#ffa778",
  );
  text.position.set(0, 3, 0);
  g.add(text);
  box(g, material, 0, 0.05, 0, 7, 0.04, 0.55);
  g.userData = { type, value, plane };
  scene.add(g);
  gates.push(g);
  return g;
}
function asteroid(x, z, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 1.1, z);
  const m = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.1, 1),
    pbr(0x716a71, 0.35, 0.9),
  );
  m.scale.set(1, 0.9, 1.15);
  m.castShadow = true;
  m.receiveShadow = true;
  group.add(m);
  box(group, amber, 0.35, 0.58, -0.55, 0.4, 0.05, 0.6);
  group.scale.setScalar(scale);
  group.userData = {
    type: "asteroid",
    hp: 3,
    radius: 1.1 * scale,
    spin: Math.random() * 0.7 + 0.3,
  };
  scene.add(group);
  obstacles.push(group);
  return group;
}
function turret(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  box(g, metal, 0, 0.35, 0, 1.6, 0.7, 1.6);
  const top = box(g, pbr(0x8a5954), 0, 1, 0, 1.1, 0.7, 1.1);
  const barrel = box(top, metal, 0, 0.2, 0.9, 0.3, 0.3, 1.5);
  box(barrel, amber, 0, 0, 0.52, 0.33, 0.33, 0.08);
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(1.25, 0.025, 6, 48),
    amber,
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.1;
  g.add(halo);
  g.userData = {
    type: "turret",
    hp: 5,
    radius: 1.2,
    top,
    fire: 1 + Math.random(),
  };
  scene.add(g);
  obstacles.push(g);
  return g;
}
function makeBoss() {
  const g = new THREE.Group();
  g.position.set(0, 4, -52);
  box(g, metal, 0, 0, 0, 6, 1.4, 7);
  box(g, dark, 0, 0.8, 0, 3, 1, 4);
  box(g, amber, 0, 0.8, 3.1, 2.2, 0.22, 0.1);
  for (const side of [-1, 1]) {
    box(g, metal, side * 5, -0.4, 1, 5, 1, 4);
    box(g, amber, side * 5, -0.3, 3.1, 3, 0.15, 0.2);
    box(g, dark, side * 3.5, 0.4, -1, 1, 1.2, 5);
    box(g, cyan, side * 3.5, 0.4, -3.6, 0.5, 0.5, 0.15);
  }
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 12), amber);
  core.position.set(0, 0, 3.8);
  g.add(core);
  g.userData = { type: "boss", core };
  scene.add(g);
  return g;
}
function populate() {
  for (const z of [-30, -100, -180, -270, -360, -450]) {
    const i = Math.abs(z);
    gate(-4.3, z, "multiply", i === 100 || i === 360 ? 3 : 2);
    gate(4.3, z, "add", i === 180 || i === 450 ? 12 : 6);
  }
  // Stagger threats so each wave leaves a navigable lane.
  for (let i = 0; i < 22; i++) {
    asteroid([0, 5.8, -5.8, 2.6, -2.6][i % 5], -62 - i * 22, 1 + (i % 3) * 0.2);
  }
  for (let i = 0; i < 16; i++) {
    turret(i % 2 ? -6.5 : 6.5, -78 - i * 29);
  }
}
function burst(pos, color = mint, count = 30) {
  const positions = new Float32Array(count * 3),
    vel = [];
  for (let i = 0; i < count; i++) {
    positions.set([pos.x, pos.y, pos.z], i * 3);
    vel.push(
      new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        Math.random() * 7,
        (Math.random() - 0.5) * 8,
      ),
    );
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color,
    size: 0.13,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const points = new THREE.Points(geom, material);
  scene.add(points);
  effects.push({ obj: points, vel, life: 1, total: 1 });
}
function pulseEffect() {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.035, 6, 80),
    new THREE.MeshBasicMaterial({ color: mint, transparent: true, opacity: 1 }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.copy(fleetGroup.position);
  scene.add(ring);
  effects.push({ obj: ring, life: 0.65, total: 0.65, ring: true });
}
function destroy(obj) {
  burst(obj.position, obj.userData.type === "asteroid" ? orange : mint);
  releaseObject(obj);
  obstacles = obstacles.filter((o) => o !== obj);
  if (selected === obj) selected = null;
  kills++;
  sound(170, 0.18);
}
function damage(amount) {
  if (state !== "playing") return;
  burst(fleetGroup.position, orange, 18);
  setFleet(fleet - amount);
  if (fleet > 0) notify(`−${amount} SHIPS`, "#ff9f78");
  sound(100, 0.2);
}
function pulse() {
  if (state !== "playing" || cooldown > 0) return;
  cooldown = 7;
  pulseEffect();
  sound(650, 0.4);
  for (const o of [...obstacles])
    if (o.position.distanceTo(fleetGroup.position) < 21) destroy(o);
  for (const e of enemyShots) scene.remove(e.mesh);
  enemyShots = [];
  if (boss && boss.position.distanceTo(fleetGroup.position) < 65) {
    bossHP = Math.max(0, bossHP - 8);
    burst(boss.position, mint, 40);
  }
  notify("PULSE DISCHARGED");
}
const boltGeo = new THREE.BoxGeometry(0.07, 0.07, 1.5);
function fire(from, to, enemy = false) {
  const m = new THREE.Mesh(boltGeo, enemy ? amber : cyan);
  m.position.copy(from);
  const dir = to.clone().sub(from).normalize();
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
  scene.add(m);
  const b = { mesh: m, dir, life: enemy ? 4 : 0.65 };
  (enemy ? enemyShots : bolts).push(b);
}
function start() {
  for (const obj of [...obstacles, ...gates, ...(boss ? [boss] : [])])
    releaseObject(obj);
  for (const b of [...bolts, ...enemyShots]) scene.remove(b.mesh);
  for (const e of effects) {
    scene.remove(e.obj);
    disposeEffect(e);
  }
  obstacles = [];
  gates = [];
  bolts = [];
  enemyShots = [];
  effects = [];
  boss = null;
  distance = 0;
  targetX = 0;
  kills = 0;
  bossHP = 100;
  cooldown = 0;
  hudClock = 0.1;
  shotClock = 0;
  bossClock = 0;
  selected = null;
  fleetGroup.position.set(0, 1.05, 6);
  fleetGroup.rotation.set(0, 0, 0);
  state = "playing";
  if (innerWidth < 761) camera.position.set(0, 24, 35);
  setFleet(8);
  populate();
  $("briefing").classList.add("hidden");
  $("result").classList.add("hidden");
  $("pause-overlay").classList.add("hidden");
  $("boss-bar").classList.add("hidden");
  $("hud").classList.remove("hidden");
  $("pulse-hud").classList.remove("hidden");
  document.body.classList.add("playing");
  notify("Choose a multiplier gate");
  sound(700, 0.25);
}
function finish(win) {
  state = win ? "won" : "lost";
  $("result-label").textContent = win
    ? "OPERATION FIRST LIGHT / COMPLETE"
    : "MISSION DEBRIEF / SIGNAL LOST";
  $("result-title").textContent = win ? "Sector secured." : "Fleet lost.";
  $("result-copy").textContent = win
    ? "Mothership tumbang. Jalur orbital kembali aman. Nice flying, commander."
    : "Armada habis sebelum misi selesai. Pilih multiplier gate dan pakai pulse untuk bertahan.";
  $("result-fleet").textContent = fleet;
  $("result-kills").textContent = kills;
  $("result").classList.remove("hidden");
  sound(win ? 850 : 100, 0.6);
}
function pause() {
  if (state === "playing") {
    state = "paused";
    $("pause-overlay").classList.remove("hidden");
  } else if (state === "paused") {
    state = "playing";
    $("pause-overlay").classList.add("hidden");
  }
}
function disposeEffect(e) {
  e.obj.geometry.dispose();
  e.obj.material.dispose();
}
$("launch").onclick = start;
$("restart").onclick = start;
$("pause").onclick = pause;
$("resume").onclick = pause;
$("pulse").onclick = pulse;
$("sound").onclick = () => {
  audioEnabled = !audioEnabled;
  $("sound").textContent = audioEnabled ? "SOUND ON" : "SOUND OFF";
  if (audioEnabled) sound(500);
};
window.addEventListener("keydown", (e) => {
  if (
    [
      "Space",
      "ArrowLeft",
      "ArrowRight",
      "KeyA",
      "KeyD",
      "Escape",
      "KeyP",
    ].includes(e.code)
  ) {
    if (e.code === "Space" && state !== "playing") return;
    e.preventDefault();
    keys.add(e.code);
    if (e.code === "Space" && !e.repeat) pulse();
    if ((e.code === "Escape" || e.code === "KeyP") && !e.repeat) pause();
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
window.addEventListener("blur", () => {
  keys.clear();
  if (state === "playing") pause();
});
function pointerMove(e) {
  if (state !== "playing") return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    (-(e.clientY - rect.top) / rect.height) * 2 + 1,
  );
  raycaster.setFromCamera(pointer, camera);
  if (raycaster.ray.intersectPlane(groundPlane, hit))
    targetX = THREE.MathUtils.clamp(hit.x, -7.8, 7.8);
}
renderer.domElement.addEventListener("pointermove", pointerMove);
renderer.domElement.addEventListener("pointerdown", (e) => {
  if (state !== "playing") return;
  pointerMove(e);
  raycaster.setFromCamera(pointer, camera);
  const targets = [...obstacles, ...(boss ? [boss] : [])];
  const hits = raycaster.intersectObjects(targets, true);
  if (hits.length) {
    let o = hits[0].object;
    while (o.parent && !targets.includes(o)) o = o.parent;
    selected = o;
    if (o === boss) {
      bossHP = Math.max(0, bossHP - 1);
      burst(hits[0].point, mint, 8);
    } else {
      o.userData.hp -= 2;
      burst(hits[0].point, mint, 8);
      if (o.userData.hp <= 0) destroy(o);
    }
    sound(550);
  }
});
renderer.domElement.style.touchAction = "none";

function updateGame(dt) {
  distance += dt * RUN_SPEED;
  const left = keys.has("KeyA") || keys.has("ArrowLeft"),
    right = keys.has("KeyD") || keys.has("ArrowRight");
  if (left || right)
    targetX = THREE.MathUtils.clamp(
      targetX + (Number(right) - Number(left)) * dt * 18,
      -7.8,
      7.8,
    );
  fleetGroup.position.x = THREE.MathUtils.damp(
    fleetGroup.position.x,
    targetX,
    12,
    dt,
  );
  fleetGroup.rotation.z = THREE.MathUtils.damp(
    fleetGroup.rotation.z,
    (fleetGroup.position.x - targetX) * 0.08,
    8,
    dt,
  );
  cooldown = Math.max(0, cooldown - dt);
  hudClock += dt;
  if (hudClock >= 0.1) {
    hudClock = 0;
    $("pulse").querySelector("span").textContent =
      cooldown > 0 ? `RECHARGING ${cooldown.toFixed(1)}s` : "PULSE READY";
    $("pulse").style.opacity = cooldown > 0 ? 0.5 : 1;
    const sec = sectorAt(distance);
    $("sector").textContent =
      sec === 1
        ? "01 / MULTIPLIER CORRIDOR"
        : sec === 2
          ? "02 / DEFENSE LINE"
          : "03 / THE MOTHERSHIP";
    $("distance").textContent =
      `${Math.min(100, Math.floor((distance / 560) * 100))}%`;
    $("progress").style.width = `${Math.min(100, (distance / 560) * 100)}%`;
  }
  if (distance < 560) {
    for (const g of [...gates]) {
      g.position.z += RUN_SPEED * dt;
      g.userData.plane.material.opacity = 0.06 + Math.sin(time * 3) * 0.025;
      if (g.position.z >= 6 && !g.userData.passed) {
        g.userData.passed = true;
        if (Math.abs(g.position.x - fleetGroup.position.x) < 3.55) {
          const prev = fleet;
          setFleet(applyGate(fleet, g.userData.type, g.userData.value));
          notify(
            `${g.userData.type === "multiply" ? "×" + g.userData.value : "+" + g.userData.value}  /  +${fleet - prev} SHIPS`,
          );
          pulseEffect();
          sound(950, 0.15);
        }
      }
      if (g.position.z > 22) {
        releaseObject(g);
        gates = gates.filter((v) => v !== g);
      }
    }
    for (const o of [...obstacles]) {
      o.position.z += RUN_SPEED * dt;
      if (o.userData.type === "asteroid") {
        o.rotation.x += dt * o.userData.spin;
        o.rotation.y += dt * 0.3;
      } else {
        o.userData.top.lookAt(fleetGroup.position);
        o.userData.fire -= dt;
        if (o.userData.fire <= 0 && o.position.z > -65 && o.position.z < 3) {
          fire(
            o.position.clone().add(new THREE.Vector3(0, 1.2, 0)),
            fleetGroup.position.clone(),
            true,
          );
          o.userData.fire = 1.35;
        }
      }
      if (
        Math.abs(o.position.z - 6) < 1.5 &&
        Math.abs(o.position.x - fleetGroup.position.x) < o.userData.radius + 1
      ) {
        damage(o.userData.type === "asteroid" ? 5 : 4);
        releaseObject(o);
        obstacles = obstacles.filter((v) => v !== o);
      } else if (o.position.z > 23) {
        releaseObject(o);
        obstacles = obstacles.filter((v) => v !== o);
      }
    }
  } else {
    if (!boss) {
      boss = makeBoss();
      $("boss-bar").classList.remove("hidden");
      notify("WARNING / MOTHERSHIP INBOUND", "#ff9f78");
      for (const o of gates) releaseObject(o);
      gates = [];
      for (const o of obstacles) releaseObject(o);
      obstacles = [];
    }
    boss.position.z = THREE.MathUtils.damp(boss.position.z, -27, 1.5, dt);
    boss.position.x = Math.sin(time * 0.55) * 4.5;
    boss.position.y = 3.4 + Math.sin(time * 1.2) * 0.4;
    boss.rotation.z = Math.sin(time * 0.55) * 0.04;
    boss.userData.core.scale.setScalar(1 + Math.sin(time * 6) * 0.08);
    bossClock += dt;
    if (bossClock > 1.25) {
      bossClock = 0;
      for (const offset of [-2, 0, 2]) {
        const aim = fleetGroup.position.clone();
        aim.x += offset;
        fire(
          boss.position.clone().add(new THREE.Vector3(offset, 0, 4)),
          aim,
          true,
        );
      }
    }
    $("boss-health").style.width = `${bossHP}%`;
    $("boss-value").textContent = `${Math.ceil(bossHP)}%`;
    if (bossHP <= 0) {
      burst(boss.position, orange, 160);
      releaseObject(boss);
      boss = null;
      kills++;
      finish(true);
      return;
    }
  }
  if (state !== "playing") return;
  shotClock += dt;
  if (shotClock > 0.22) {
    shotClock = 0;
    let target = selected?.parent ? selected : boss;
    if (!target) {
      for (const obstacle of obstacles) {
        if (obstacle.userData.type !== "turret") continue;
        const z = obstacle.position.z;
        if (z > -55 && z < 2 && (!target || z > target.position.z))
          target = obstacle;
      }
    }
    if (target) {
      const to = target.position.clone();
      to.y += target === boss ? 0 : 1;
      for (let i = 0; i < Math.min(fleet, 7); i++) {
        const pos = ships[i].getWorldPosition(new THREE.Vector3());
        fire(pos, to);
      }
      if (target !== boss) target.userData.hp -= fleet * 0.16;
      if (target === boss) bossHP = Math.max(0, bossHP - fleet * 0.065);
      else if (target.userData.hp <= 0) destroy(target);
    }
  }
  for (let i = enemyShots.length - 1; i >= 0; i--) {
    const b = enemyShots[i];
    b.mesh.position.addScaledVector(b.dir, dt * 22);
    b.life -= dt;
    if (
      Math.abs(b.mesh.position.z - fleetGroup.position.z) < 1.2 &&
      Math.abs(b.mesh.position.x - fleetGroup.position.x) < 1.4
    ) {
      damage(boss ? 2 : 1);
      b.life = 0;
    }
    if (b.life <= 0) {
      scene.remove(b.mesh);
      enemyShots.splice(i, 1);
    }
  }
}
const cameraGoal = new THREE.Vector3();
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);
  if (state === "paused") {
    return;
  }
  time += dt;
  if (state === "playing") {
    const steps = Math.ceil(dt / (1 / 60));
    for (let i = 0; i < steps && state === "playing"; i++)
      updateGame(dt / steps);
  }
  for (let i = 0; i < ships.length; i++) {
    const p = ships[i].userData.formation;
    ships[i].position.set(p.x, Math.sin(time * 3 + i * 0.8) * 0.04, p.z);
    ships[i].userData.engine.scale.z = 0.3 + Math.sin(time * 25 + i) * 0.05;
  }
  const nextFov = innerWidth >= 761 ? 47 : 65;
  if (camera.fov !== nextFov) {
    camera.fov = nextFov;
    camera.updateProjectionMatrix();
  }
  if (state === "ready") {
    fleetGroup.position.set(0, 1.25, 6);
    fleetGroup.rotation.y = 0;
    fleetGroup.rotation.z = Math.sin(time * 0.6) * 0.025;
    camera.position.set(
      0,
      innerWidth < 761 ? 24 : 19,
      innerWidth < 761 ? 35 : 31,
    );
    camera.lookAt(0, 0, -13);
  } else {
    const cx = fleetGroup.position.x * 0.22;
    camera.position.lerp(
      cameraGoal.set(
        cx,
        innerWidth < 761 ? 24 : 17,
        innerWidth < 761 ? 35 : 27,
      ),
      Math.min(1, dt * 2),
    );
    camera.lookAt(cx, 0, -10);
  }
  for (let i = bolts.length - 1; i >= 0; i--) {
    const b = bolts[i];
    b.mesh.position.addScaledVector(b.dir, dt * 85);
    b.life -= dt;
    if (b.life <= 0) {
      scene.remove(b.mesh);
      bolts.splice(i, 1);
    }
  }
  for (let i = effects.length - 1; i >= 0; i--) {
    const e = effects[i];
    e.life -= dt;
    e.obj.material.opacity = Math.max(0, e.life / e.total);
    if (e.ring) e.obj.scale.setScalar(1 + (1 - e.life / e.total) * 22);
    else {
      const a = e.obj.geometry.attributes.position;
      for (let i = 0; i < e.vel.length; i++) {
        a.setXYZ(
          i,
          a.getX(i) + e.vel[i].x * dt,
          a.getY(i) + e.vel[i].y * dt,
          a.getZ(i) + e.vel[i].z * dt,
        );
        e.vel[i].y -= dt * 4;
      }
      a.needsUpdate = true;
    }
    if (e.life <= 0) {
      scene.remove(e.obj);
      disposeEffect(e);
      effects.splice(i, 1);
    }
  }
  grid.position.z = -65 + (state === "playing" ? distance % 2 : 0);
  if (time > toastUntil) $("toast").style.opacity = 0;
  composer.render();
}
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  if (state === "paused") composer.render();
});
new GLTFLoader().load(
  `${import.meta.env.BASE_URL}assets/vanguard.gltf`,
  (gltf) => {
    shipTemplate = gltf.scene;
    setFleet(8);
    gate(-4.3, -28, "multiply", 3);
    gate(4.3, -28, "add", 6);
    asteroid(0, -52, 1.5);
    turret(6, -67);
    $("launch").disabled = false;
    $("launch").firstElementChild.textContent = "Start game";
    $("load-status").textContent =
      "A / D to steer · Click to target · Space to pulse";
  },
  undefined,
  () => {
    $("load-status").textContent =
      "Ship asset gagal dimuat. Refresh halaman untuk mencoba lagi.";
  },
);
animate();
