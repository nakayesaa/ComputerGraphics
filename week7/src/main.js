import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {createStudio} from './scene.js';
import {interaction} from './interaction.js';
import './style.css';
const $=id=>document.getElementById(id);

async function start() {
  const canvas=$('canvas');
  const studio=createStudio(canvas);
  const {scene,renderer,camera,group,robot,objects,ring,environment}=studio;
  let mixer, action, playing=true;
  const clips=new Map();
  function materials(root) {
    const result=new Set();
    root?.traverse(node=>{if(node.isMesh) for(const mat of Array.isArray(node.material)?node.material:[node.material]) result.add(mat);});
    return [...result];
  }
  function syncSelection(object) {
    $('object').value=object?.uuid || '';
    $('selected').textContent=object?.name || 'Tidak ada';
    $('parent').textContent=object?.parent?.name || '—';
    const material=materials(object)[0];
    for(const key of ['roughness','metalness']) {
      $(key).disabled=!material;
      if(material) $(key).value=material[key];
      $(key+'Value').textContent=material?material[key].toFixed(2):'—';
    }
    $('materialNote').textContent=material?'MeshStandardMaterial · diterapkan pada semua mesh objek.':'Pilih objek untuk mengubah material.';
  }
  const input=interaction(canvas,camera,objects,syncSelection);
  function addOption(object) {const option=new Option(object.name,object.uuid);$('object').add(option);}
  objects.forEach(addOption); syncSelection(null);
  $('object').onchange=e=>input.select(objects.find(object=>object.uuid===e.target.value)||null);
  for(const key of ['roughness','metalness']) $(key).oninput=e=>{
    const value=Number(e.target.value);
    materials(input.selected).forEach(material=>material[key]=value);
    $(key+'Value').textContent=value.toFixed(2);
  };
  $('environment').onchange=e=>scene.environment=e.target.checked?environment.texture:null;
  $('reset').onclick=studio.resetView;
  function togglePlayback() {playing=!playing;$('play').textContent=`${playing?'Pause':'Play'} animation · Space`;}
  $('play').onclick=togglePlayback;
  window.addEventListener('keydown',e=>{
    if(/INPUT|SELECT|BUTTON/.test(e.target.tagName)) return;
    if(e.code==='Space'){e.preventDefault();if(!e.repeat)togglePlayback();}
    if(e.key==='Escape')input.select(null);
  });
  function playClip(name) {
    const clip=clips.get(name); if(!clip)return;
    const next=mixer.clipAction(clip);
    if(next===action)return;
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
    if(action)action.crossFadeTo(next,.25,false);
    action=next;
  }
  $('clip').onchange=e=>playClip(e.target.value);
  const position=new THREE.Vector3();
  const vector=v=>v.toArray().map(n=>n.toFixed(2)).join(' / ');
  const clock=new THREE.Clock();
  renderer.setAnimationLoop(()=>{
    const delta=Math.min(clock.getDelta(),.05);
    if(playing) {
      mixer?.update(delta);
      if($('group').checked)group.rotation.y+=delta*.35;
      if($('rotate').checked && input.selected)input.selected.rotation.y+=delta*.7;
    }
    scene.updateMatrixWorld(true);
    input.update();
    $('hover').textContent=input.hovered?.name || '—';
    $('hit').textContent=input.hovered?input.hitName:'—';
    const selected=input.selected;
    ring.visible=!!selected;
    if(selected) {
      selected.getWorldPosition(position);
      ring.position.set(position.x,.015,position.z);
      ring.scale.setScalar(selected===robot?1.35:1);
      $('local').textContent=vector(selected.position);
      $('world').textContent=vector(position);
    } else {$('local').textContent=$('world').textContent='—';}
    renderer.render(scene,camera);
  });
  try {
    const gltf=await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/RobotExpressive.glb`);
    let meshCount=0, nodeCount=0;
    gltf.scene.traverse(node=>{
      nodeCount++;
      if(!node.isMesh)return;
      meshCount++; node.castShadow=node.receiveShadow=true;
      // Independent grayscale materials retain skinning and morph target animation.
      const original=Array.isArray(node.material)?node.material:[node.material];
      const converted=original.map(material=>{
        const gray=material.color.r*.2126+material.color.g*.7152+material.color.b*.0722;
        return new THREE.MeshStandardMaterial({color:new THREE.Color().setScalar(Math.max(.18,gray)),roughness:.35,metalness:.65});
      });
      node.material=Array.isArray(node.material)?converted:converted[0];
    });
    gltf.scene.name='RobotExpressive';
    robot.add(gltf.scene);
    // Normalize the imported asset to 3.8 world units and place its feet on ground.
    const bounds=new THREE.Box3().setFromObject(gltf.scene);
    const size=bounds.getSize(new THREE.Vector3());
    const scale=3.8/size.y;
    gltf.scene.scale.setScalar(scale);
    gltf.scene.position.y=-bounds.min.y*scale;
    objects.unshift(robot); addOption(robot);
    mixer=new THREE.AnimationMixer(gltf.scene);
    $('clip').replaceChildren();
    gltf.animations.forEach(clip=>{clips.set(clip.name,clip);$('clip').add(new Option(clip.name,clip.name));});
    $('clip').disabled=!clips.size;
    const initial=clips.has('Idle')?'Idle':clips.keys().next().value;
    if(initial){$('clip').value=initial;playClip(initial);}
    $('status').textContent=`GLB loaded · ${meshCount} meshes · ${nodeCount} nodes · ${clips.size} animation clips`;
    input.select(robot);
  } catch(error) {
    $('status').textContent='Model GLB gagal dimuat. Periksa koneksi lalu muat ulang halaman.';
    $('status').classList.add('failed'); console.error(error);
  }
}
start().catch(error=>{$('status').textContent=`Studio gagal dimulai: ${error.message}`;$('status').classList.add('failed');console.error(error);});
