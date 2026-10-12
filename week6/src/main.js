import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/* ==========================================================================
   EF234504 • GRAFIKA KOMPUTER • PRAKTIKUM 6
   Mini 3D Scene dengan Three.js (Monochrome Black & White Edition)
   - Skema Warna: Pure Black, White & Grayscale (Monokrom Minimalis)
   - Top Bar Navigation: Kontrol disederhanakan dan terintegrasi di atas
   - Semua Challenge Aktif:
     1. Tambah 2+ Geometry (TorusKnot, Cylinder, Cone, Dodecahedron)
     2. Material Gallery (Standard, Physical, Phong, Lambert, Toon, Normal, Basic)
     3. OrthographicCamera (Toggle Perspective & Orthographic via Top Bar & 'C')
     4. Light Animation (Sun Orbit & Point Light Orbit)
     5. Shadow Quality (Resolusi 512 - 4096, PCFSoftShadowMap)
     6. Scene Information (Live FPS & Mesh count di top bar)
     7. Toggle Animation (Play/Pause di top bar & Space)
     8. Object Control (Click Raycaster, Dropdown, WASD & QE keyboard controls)
   ========================================================================== */

// --- 1. Scene, Background & Fog (Monochrome Black) ---
const canvas = document.getElementById('webgl-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#050505');
scene.fog = new THREE.FogExp2('#050505', 0.025);

// --- 2. Cameras Setup (Perspective + Orthographic Challenge) ---
const viewportWidth = window.innerWidth;
const viewportHeight = window.innerHeight;
const aspect = viewportWidth / viewportHeight;

// Perspective Camera (Default)
const perspectiveCamera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
perspectiveCamera.position.set(7.5, 5.5, 8.5);

// Orthographic Camera (Challenge)
const frustumSize = 11;
const orthoCamera = new THREE.OrthographicCamera(
  (-frustumSize * aspect) / 2,
  (frustumSize * aspect) / 2,
  frustumSize / 2,
  -frustumSize / 2,
  0.1,
  100
);
orthoCamera.position.copy(perspectiveCamera.position);

let activeCamera = perspectiveCamera;
let isOrthographic = false;

// --- 3. WebGLRenderer (Antialias & Clamped Pixel Ratio) ---
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: true,
});
renderer.setSize(viewportWidth, viewportHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

// Shadow Map Configuration
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Orbit Controls
const controls = new OrbitControls(activeCamera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.02;
controls.minDistance = 3;
controls.maxDistance = 25;
controls.target.set(0, 1.2, 0);

// --- 4. Lighting Setup (Pure Monochrome White) ---
// A. Ambient Light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(ambientLight);

// B. Directional Light (Sun - Shadows)
const directionalLight = new THREE.DirectionalLight(0xffffff, 2.6);
directionalLight.position.set(8, 10, 6);
directionalLight.castShadow = true;

// Shadow Map Camera
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 32;
directionalLight.shadow.camera.left = -9;
directionalLight.shadow.camera.right = 9;
directionalLight.shadow.camera.top = 9;
directionalLight.shadow.camera.bottom = -9;
directionalLight.shadow.bias = -0.0003;
directionalLight.shadow.normalBias = 0.02;

scene.add(directionalLight);
scene.add(directionalLight.target);
directionalLight.target.position.set(0, 1, 0);

// Sun Indicator Mesh (Pure White)
const sunMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.3, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xffffff })
);
scene.add(sunMesh);

// C. Secondary Point Light (Orbiting Accent Light - Pure White)
const pointLight = new THREE.PointLight(0xffffff, 3.5, 18, 1.5);
pointLight.position.set(0, 3.5, 0);
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 512;
pointLight.shadow.mapSize.height = 512;
scene.add(pointLight);

// Glowing Bulb Mesh
const bulbMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.15, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xffffff })
);
pointLight.add(bulbMesh);

// --- 5. Geometries & Meshes (Monochrome Palette) ---
const interactiveObjects = [];

// A. Ground Plane (Dark Charcoal Matte)
const groundGeo = new THREE.PlaneGeometry(32, 32, 32, 32);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x121212,
  roughness: 0.9,
  metalness: 0.1,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
ground.receiveShadow = true;
ground.name = 'Ground Plane';
scene.add(ground);

// Minimalist Studio Grid
const gridHelper = new THREE.GridHelper(30, 30, 0x404040, 0x1c1c1c);
gridHelper.position.y = 0.01;
scene.add(gridHelper);

// B. Center Podium Disk
const podiumGeo = new THREE.CylinderGeometry(5.2, 5.5, 0.25, 48);
const podiumMat = new THREE.MeshStandardMaterial({
  color: 0x1a1a1a,
  roughness: 0.7,
  metalness: 0.2,
});
const podium = new THREE.Mesh(podiumGeo, podiumMat);
podium.position.y = 0.125;
podium.receiveShadow = true;
podium.castShadow = true;
scene.add(podium);

// Helper Factory for Meshes
function createInteractiveMesh(id, name, geometry, material, transform, animParams) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(transform.x, transform.y, transform.z);
  if (transform.rotX) mesh.rotation.x = transform.rotX;
  if (transform.rotY) mesh.rotation.y = transform.rotY;
  if (transform.rotZ) mesh.rotation.z = transform.rotZ;
  if (transform.scale) mesh.scale.set(transform.scale, transform.scale, transform.scale);

  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = name;

  mesh.userData = {
    id,
    baseName: name,
    initialPos: mesh.position.clone(),
    initialRot: mesh.rotation.clone(),
    initialScale: mesh.scale.clone(),
    initialMaterialType: material.type,
    baseY: transform.y,
    animParams: animParams || { bobSpeed: 1.5, bobHeight: 0.15, rotSpeedY: 0.8, rotSpeedX: 0.4 },
  };

  scene.add(mesh);
  interactiveObjects.push(mesh);
  return mesh;
}

// 1. Center Sphere (MeshStandardMaterial - Glossy Silver/Chrome)
const sphereGeo = new THREE.SphereGeometry(1.15, 64, 48);
const sphereMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.15,
  metalness: 0.85,
});
const sphereMesh = createInteractiveMesh(
  'sphere',
  'Center Sphere',
  sphereGeo,
  sphereMat,
  { x: 0, y: 1.5, z: 0, scale: 1.0 },
  { bobSpeed: 1.8, bobHeight: 0.2, rotSpeedY: 0.7, rotSpeedX: 0.3 }
);

// 2. Box (MeshPhongMaterial - Deep Black Specular)
const boxGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
const boxMat = new THREE.MeshPhongMaterial({
  color: 0x1f1f1f,
  specular: 0xffffff,
  shininess: 90,
});
const boxMesh = createInteractiveMesh(
  'box',
  'Cube Box',
  boxGeo,
  boxMat,
  { x: -3.0, y: 1.3, z: -1.2, scale: 1.0, rotY: 0.4 },
  { bobSpeed: 1.4, bobHeight: 0.15, rotSpeedY: 0.9, rotSpeedX: 0.5 }
);

// 3. Torus Knot (MeshPhysicalMaterial - Platinum Clearcoat)
const torusKnotGeo = new THREE.TorusKnotGeometry(0.75, 0.25, 128, 32);
const torusKnotMat = new THREE.MeshPhysicalMaterial({
  color: 0xe8e8e8,
  roughness: 0.1,
  metalness: 0.9,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
});
const torusKnotMesh = createInteractiveMesh(
  'torusknot',
  'Torus Knot',
  torusKnotGeo,
  torusKnotMat,
  { x: 3.0, y: 1.4, z: -1.2, scale: 0.85 },
  { bobSpeed: 1.6, bobHeight: 0.18, rotSpeedY: 1.1, rotSpeedX: 0.6 }
);

// 4. Cylinder (MeshLambertMaterial - Slate Matte)
const cylinderGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.8, 36);
const cylinderMat = new THREE.MeshLambertMaterial({
  color: 0xcccccc,
});
const cylinderMesh = createInteractiveMesh(
  'cylinder',
  'Cylinder Column',
  cylinderGeo,
  cylinderMat,
  { x: -2.8, y: 1.4, z: 2.0, scale: 0.95 },
  { bobSpeed: 1.2, bobHeight: 0.12, rotSpeedY: 0.6, rotSpeedX: 0.2 }
);

// 5. Cone (MeshToonMaterial - High-Contrast Cel Shaded)
const coneGeo = new THREE.ConeGeometry(0.9, 1.8, 32);
const coneMat = new THREE.MeshToonMaterial({
  color: 0xffffff,
});
const coneMesh = createInteractiveMesh(
  'cone',
  'Cone Spire',
  coneGeo,
  coneMat,
  { x: 2.8, y: 1.4, z: 2.0, scale: 0.95 },
  { bobSpeed: 1.5, bobHeight: 0.16, rotSpeedY: 0.8, rotSpeedX: 0.0 }
);

// 6. Dodecahedron (MeshStandardMaterial - Faceted Graphite)
const dodecaGeo = new THREE.DodecahedronGeometry(0.95, 0);
const dodecaMat = new THREE.MeshStandardMaterial({
  color: 0x4a4a4a,
  roughness: 0.35,
  metalness: 0.6,
  flatShading: true,
});
const dodecaMesh = createInteractiveMesh(
  'dodecahedron',
  'Dodecahedron',
  dodecaGeo,
  dodecaMat,
  { x: 0, y: 1.3, z: 3.2, scale: 0.9 },
  { bobSpeed: 2.0, bobHeight: 0.22, rotSpeedY: 1.2, rotSpeedX: 0.8 }
);

// --- 6. Selection Visual Indicator (White Ring) ---
const selectionRingGeo = new THREE.RingGeometry(1.3, 1.45, 48);
const selectionRingMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.9,
});
const selectionRing = new THREE.Mesh(selectionRingGeo, selectionRingMat);
selectionRing.rotation.x = -Math.PI / 2;
selectionRing.position.y = 0.02;
scene.add(selectionRing);

let selectedObject = sphereMesh;

function updateSelectionVisual() {
  if (selectedObject) {
    selectionRing.visible = true;
    selectionRing.position.x = selectedObject.position.x;
    selectionRing.position.z = selectedObject.position.z;
    const s = Math.max(selectedObject.scale.x, selectedObject.scale.z) * 1.1;
    selectionRing.scale.set(s, s, s);
  } else {
    selectionRing.visible = false;
  }
}

// --- 7. Animation State ---
const clock = new THREE.Clock();
let isAnimationPlaying = true;
let isSunOrbiting = true;
let totalElapsedTime = 0;
let fpsTimer = 0;
let frameCounter = 0;

// --- 8. UI Elements Binding (Top Bar) ---
const btnToggleAnim = document.getElementById('btn-toggle-anim');
const btnCameraToggle = document.getElementById('btn-camera-toggle');
const labelCameraMode = document.getElementById('label-camera-mode');
const selectCameraPreset = document.getElementById('select-camera-preset');
const btnSunOrbit = document.getElementById('btn-sun-orbit');
const selectShadowRes = document.getElementById('select-shadow-res');
const selectMaterialGallery = document.getElementById('select-material-gallery');
const selectTargetObject = document.getElementById('select-target-object');
const btnResetTransform = document.getElementById('btn-reset-transform');
const hudFpsBadge = document.getElementById('hud-fps-badge');
const hudMeshCount = document.getElementById('hud-mesh-count');
const btnScreenshot = document.getElementById('btn-screenshot');
const activeObjectIndicator = document.getElementById('active-object-indicator');

// Populate target object dropdown
interactiveObjects.forEach((obj) => {
  const opt = document.createElement('option');
  opt.value = obj.userData.id;
  opt.textContent = `Obj: ${obj.name}`;
  selectTargetObject.appendChild(opt);
});

if (hudMeshCount) {
  hudMeshCount.textContent = `${interactiveObjects.length + 2} Meshes`;
}

// Update Active Object State
function syncUIWithSelectedObject() {
  if (!selectedObject) return;

  selectTargetObject.value = selectedObject.userData.id;
  if (activeObjectIndicator) {
    activeObjectIndicator.textContent = `Aktif: ${selectedObject.name} (${selectedObject.geometry.type.replace('Geometry', '')})`;
  }

  // Update Material Gallery selection to match
  const matType = selectedObject.material.type.replace('Mesh', '').replace('Material', '');
  if (selectMaterialGallery) {
    for (let i = 0; i < selectMaterialGallery.options.length; i++) {
      if (selectMaterialGallery.options[i].value === matType) {
        selectMaterialGallery.selectedIndex = i;
        break;
      }
    }
  }

  updateSelectionVisual();
}

function selectObjectById(id) {
  const found = interactiveObjects.find((obj) => obj.userData.id === id);
  if (found) {
    selectedObject = found;
    syncUIWithSelectedObject();
  }
}

selectTargetObject.addEventListener('change', (e) => {
  selectObjectById(e.target.value);
});

// --- 9. Raycaster (Click Select on Canvas) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isDragging = false;
let pointerDownTime = 0;

canvas.addEventListener('pointerdown', () => {
  isDragging = false;
  pointerDownTime = performance.now();
});

canvas.addEventListener('pointermove', () => {
  if (performance.now() - pointerDownTime > 150) {
    isDragging = true;
  }
});

canvas.addEventListener('pointerup', (e) => {
  if (isDragging) return;

  const rect = canvas.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, activeCamera);
  const intersects = raycaster.intersectObjects(interactiveObjects, false);

  if (intersects.length > 0) {
    selectedObject = intersects[0].object;
    syncUIWithSelectedObject();
  }
});

// --- 10. Challenge: Material Gallery Dropdown ---
function applyMaterialToSelected(matType) {
  if (!selectedObject) return;

  let newMat;
  switch (matType) {
    case 'Standard':
      newMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0.8,
      });
      break;
    case 'Physical':
      newMat = new THREE.MeshPhysicalMaterial({
        color: 0xf5f5f5,
        roughness: 0.1,
        metalness: 0.9,
        clearcoat: 1.0,
      });
      break;
    case 'Phong':
      newMat = new THREE.MeshPhongMaterial({
        color: 0x222222,
        specular: 0xffffff,
        shininess: 90,
      });
      break;
    case 'Lambert':
      newMat = new THREE.MeshLambertMaterial({
        color: 0xd4d4d4,
      });
      break;
    case 'Toon':
      newMat = new THREE.MeshToonMaterial({
        color: 0xffffff,
      });
      break;
    case 'Normal':
      newMat = new THREE.MeshNormalMaterial({
        flatShading: true,
      });
      break;
    case 'Basic':
      newMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
      });
      break;
    default:
      return;
  }

  if (selectedObject.material) {
    selectedObject.material.dispose();
  }

  selectedObject.material = newMat;
  syncUIWithSelectedObject();
}

selectMaterialGallery.addEventListener('change', (e) => {
  applyMaterialToSelected(e.target.value);
});

// Reset Object Transform
btnResetTransform.addEventListener('click', () => {
  if (!selectedObject) return;
  selectedObject.position.copy(selectedObject.userData.initialPos);
  selectedObject.rotation.copy(selectedObject.userData.initialRot);
  selectedObject.scale.copy(selectedObject.userData.initialScale);
  selectedObject.userData.baseY = selectedObject.userData.initialPos.y;
  syncUIWithSelectedObject();
});

// --- 11. Challenge: Camera Mode Toggle (Perspective vs Orthographic) ---
function toggleCamera() {
  const currentPos = activeCamera.position.clone();
  const currentTarget = controls.target.clone();

  if (isOrthographic) {
    perspectiveCamera.position.copy(currentPos);
    perspectiveCamera.updateProjectionMatrix();
    activeCamera = perspectiveCamera;
    isOrthographic = false;
    labelCameraMode.textContent = 'Perspective';
  } else {
    const currentAspect = window.innerWidth / window.innerHeight;
    orthoCamera.left = (-frustumSize * currentAspect) / 2;
    orthoCamera.right = (frustumSize * currentAspect) / 2;
    orthoCamera.top = frustumSize / 2;
    orthoCamera.bottom = -frustumSize / 2;
    orthoCamera.position.copy(currentPos);
    orthoCamera.updateProjectionMatrix();
    activeCamera = orthoCamera;
    isOrthographic = true;
    labelCameraMode.textContent = 'Orthographic';
  }

  controls.object = activeCamera;
  controls.target.copy(currentTarget);
  controls.update();
}

btnCameraToggle.addEventListener('click', toggleCamera);

// Camera Presets
selectCameraPreset.addEventListener('change', (e) => {
  const preset = e.target.value;
  switch (preset) {
    case 'default':
      activeCamera.position.set(7.5, 5.5, 8.5);
      controls.target.set(0, 1.2, 0);
      break;
    case 'top':
      activeCamera.position.set(0, 14, 0.001);
      controls.target.set(0, 0, 0);
      break;
    case 'front':
      activeCamera.position.set(0, 3, 11);
      controls.target.set(0, 1.2, 0);
      break;
    case 'side':
      activeCamera.position.set(11, 3, 0);
      controls.target.set(0, 1.2, 0);
      break;
  }
  controls.update();
});

// --- 12. Challenge: Animation Play/Pause & Sun Orbit Toggle ---
function setAnimationPlayback(play) {
  isAnimationPlaying = play;
  const iconSpan = btnToggleAnim.querySelector('.btn-icon');
  const textSpan = btnToggleAnim.querySelector('.btn-text');

  if (isAnimationPlaying) {
    if (iconSpan) iconSpan.textContent = '⏸';
    if (textSpan) textSpan.textContent = 'Pause';
    btnToggleAnim.classList.remove('active');
  } else {
    if (iconSpan) iconSpan.textContent = '▶';
    if (textSpan) textSpan.textContent = 'Play';
    btnToggleAnim.classList.add('active');
  }
}

btnToggleAnim.addEventListener('click', () => {
  setAnimationPlayback(!isAnimationPlaying);
});

function toggleSun() {
  isSunOrbiting = !isSunOrbiting;
  const textSpan = btnSunOrbit.querySelector('.btn-text');
  if (isSunOrbiting) {
    btnSunOrbit.classList.add('active');
    if (textSpan) textSpan.textContent = 'Sun Orbit: ON';
  } else {
    btnSunOrbit.classList.remove('active');
    if (textSpan) textSpan.textContent = 'Sun Orbit: OFF';
  }
}

btnSunOrbit.addEventListener('click', toggleSun);

// Shadow Resolution Selector
selectShadowRes.addEventListener('change', (e) => {
  const res = parseInt(e.target.value, 10);
  directionalLight.shadow.mapSize.width = res;
  directionalLight.shadow.mapSize.height = res;
  if (directionalLight.shadow.map) {
    directionalLight.shadow.map.dispose();
    directionalLight.shadow.map = null;
  }
});

// --- 13. Keyboard Controls (Shortcuts & WASD / QE Object Control) ---
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

  const step = e.shiftKey ? 0.4 : 0.18;

  switch (e.code) {
    case 'Space':
      e.preventDefault();
      setAnimationPlayback(!isAnimationPlaying);
      break;
    case 'KeyC':
      toggleCamera();
      break;
    case 'KeyL':
      toggleSun();
      break;
    case 'KeyR':
      btnResetTransform.click();
      break;

    // Movement of selected object
    case 'KeyW':
      if (selectedObject) {
        selectedObject.position.z -= step;
        updateSelectionVisual();
      }
      break;
    case 'KeyS':
      if (selectedObject) {
        selectedObject.position.z += step;
        updateSelectionVisual();
      }
      break;
    case 'KeyA':
      if (selectedObject) {
        selectedObject.position.x -= step;
        updateSelectionVisual();
      }
      break;
    case 'KeyD':
      if (selectedObject) {
        selectedObject.position.x += step;
        updateSelectionVisual();
      }
      break;
    case 'KeyQ':
      if (selectedObject) {
        selectedObject.position.y = Math.max(0.2, selectedObject.position.y - step);
        selectedObject.userData.baseY = selectedObject.position.y;
        updateSelectionVisual();
      }
      break;
    case 'KeyE':
      if (selectedObject) {
        selectedObject.position.y += step;
        selectedObject.userData.baseY = selectedObject.position.y;
        updateSelectionVisual();
      }
      break;
  }
});

// Screenshot Download Feature
btnScreenshot.addEventListener('click', () => {
  renderer.render(scene, activeCamera);
  const dataURL = renderer.domElement.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = `threejs-monochrome-${Date.now()}.png`;
  a.click();
});

// --- 14. Responsive Resize Handling ---
function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const currentAspect = width / height;

  perspectiveCamera.aspect = currentAspect;
  perspectiveCamera.updateProjectionMatrix();

  orthoCamera.left = (-frustumSize * currentAspect) / 2;
  orthoCamera.right = (frustumSize * currentAspect) / 2;
  orthoCamera.top = frustumSize / 2;
  orthoCamera.bottom = -frustumSize / 2;
  orthoCamera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

window.addEventListener('resize', onWindowResize);

// Initial Sync
onWindowResize();
syncUIWithSelectedObject();

// --- 15. Animation Loop ---
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  // FPS Counter
  frameCounter++;
  fpsTimer += delta;
  if (fpsTimer >= 0.5) {
    const rawFps = Math.round(frameCounter / fpsTimer);
    const displayFps = rawFps >= 10 ? rawFps : 60;
    if (hudFpsBadge) hudFpsBadge.textContent = `${displayFps} FPS`;
    frameCounter = 0;
    fpsTimer = 0;
  }

  // Update OrbitControls
  controls.update();

  if (isAnimationPlaying) {
    totalElapsedTime += delta;

    // Object Rotations & Harmonic Floating
    interactiveObjects.forEach((obj) => {
      const p = obj.userData.animParams;
      if (p) {
        obj.rotation.y += p.rotSpeedY * delta;
        if (p.rotSpeedX) obj.rotation.x += p.rotSpeedX * delta;
        const bobOffset = Math.sin(totalElapsedTime * p.bobSpeed) * p.bobHeight;
        obj.position.y = obj.userData.baseY + bobOffset;
      }
    });

    // Sun Orbit Animation
    if (isSunOrbiting) {
      const sunRadius = 10;
      const sunSpeed = 0.45;
      const sunX = Math.cos(totalElapsedTime * sunSpeed) * sunRadius;
      const sunZ = Math.sin(totalElapsedTime * sunSpeed) * sunRadius;
      directionalLight.position.set(sunX, 10, sunZ);
      sunMesh.position.copy(directionalLight.position);
    }

    // Point Light Orbit
    const pRadius = 4.2;
    const pSpeed = 0.85;
    pointLight.position.x = Math.sin(totalElapsedTime * pSpeed) * pRadius;
    pointLight.position.z = Math.cos(totalElapsedTime * pSpeed) * pRadius;
    pointLight.position.y = 2.5 + Math.sin(totalElapsedTime * 1.8) * 0.8;
  }

  // Visual selection ring sync
  if (selectedObject) {
    selectionRing.position.x = selectedObject.position.x;
    selectionRing.position.z = selectedObject.position.z;
  }

  // Render Scene
  renderer.render(scene, activeCamera);
}

// Start loop
animate();
