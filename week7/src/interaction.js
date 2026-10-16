import * as THREE from 'three';

export function interaction(canvas, camera, objects, onSelection) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(2,2);
  let selected=null, hovered=null, hitName='—', down=null;
  function pick() {
    camera.updateMatrixWorld();
    for (const object of objects) object.updateWorldMatrix(true,true);
    raycaster.setFromCamera(pointer,camera);
    const hit = raycaster.intersectObjects(objects,true)[0];
    hitName = hit?.object.name || '—';
    if (!hit) return null;
    // A GLB mesh or bone hierarchy resolves to its selectable ancestor.
    let root=hit.object;
    while(root && !objects.includes(root)) root=root.parent;
    return root;
  }
  function setPointer(event) {
    const rect=canvas.getBoundingClientRect();
    pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
  }
  function select(object) {selected=object; onSelection(object);}
  canvas.addEventListener('pointermove',setPointer);
  canvas.addEventListener('pointerleave',()=>{pointer.set(2,2);});
  canvas.addEventListener('pointerdown',event=>{setPointer(event);down=[event.clientX,event.clientY];});
  canvas.addEventListener('pointerup',event=>{
    setPointer(event);
    if(down && Math.hypot(event.clientX-down[0],event.clientY-down[1])<5) select(pick());
    down=null;
  });
  canvas.addEventListener('pointercancel',()=>{down=null;});
  function update() {
    hovered=pick();
    canvas.style.cursor=hovered?'pointer':'grab';
    for(const root of objects) root.traverse(node=>{
      if(!node.isMesh) return;
      for(const material of Array.isArray(node.material)?node.material:[node.material]) {
        if(material.emissive) {material.emissive.setHex(0xffffff);material.emissiveIntensity=root === hovered ? .22 : root === selected ? .09 : 0;}
      }
    });
  }
  return {select,update,get selected(){return selected;},get hovered(){return hovered;},get hitName(){return hitName;}};
}
