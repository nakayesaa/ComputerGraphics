import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createStudio(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.minDistance = 7; controls.maxDistance = 24;
  controls.maxPolarAngle = Math.PI / 2 - .03;
  // Native controls avoid a frame-dependent damping animation.
  function resetView() { camera.position.set(10, 7, 13); controls.target.set(0, 1.5, 0); controls.update(); }
  resetView();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x333333, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 3);
  key.position.set(-3, 9, 6); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, {left:-9,right:9,top:9,bottom:-9,near:.5,far:30});
  key.shadow.normalBias = .025;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 1.4);
  fill.position.set(5, 4, -4); scene.add(fill);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  room.dispose(); pmrem.dispose();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({color:0x171717,roughness:.9,metalness:0}));
  ground.name = 'Ground'; ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);
  const grid = new THREE.GridHelper(18, 18, 0x444444, 0x242424);
  grid.position.y = .006; scene.add(grid);
  const group = new THREE.Group(); group.name = 'StudioGroup'; scene.add(group);
  const objects = [];
  for (const [name, geometry, position, roughness, metalness] of [
    ['Chrome sphere', new THREE.SphereGeometry(.95,48,32),[2,1.2,-1.5],.16,.95],
    ['Matte knot', new THREE.TorusKnotGeometry(.62,.22,100,16),[2,1.25,1.7],.75,.1]
  ]) {
    const mesh = new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0xbcbcbc,roughness,metalness}));
    mesh.name=name; mesh.position.set(...position); mesh.castShadow=mesh.receiveShadow=true;
    group.add(mesh); objects.push(mesh);
  }
  const robot = new THREE.Group(); robot.name = 'RobotRoot'; robot.position.set(-2,0,0); group.add(robot);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.1,1.15,64),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}));
  ring.rotation.x = -Math.PI/2; ring.position.y=.015; ring.visible=false; scene.add(ring);
  function resize() {
    const {width,height} = canvas.getBoundingClientRect();
    renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(width,height,false);
    camera.aspect=width/height; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();
  return {scene,renderer,camera,controls,group,robot,objects,ring,environment,resetView};
}
