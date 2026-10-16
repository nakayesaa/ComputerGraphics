import {multiply, rotationX, rotationY, translation, perspective, lookAt} from './math3d.js';
import {cube} from './geometry.js';
import {program, texture} from './gl.js';
const $ = id => document.getElementById(id);
const canvas = $('canvas');
async function start() {
  const gl = canvas.getContext('webgl2');
  if (!gl) throw Error('WebGL2 tidak tersedia. Gunakan browser dengan hardware acceleration.');
  const shader = await program(gl);
  const textures = await Promise.all(['checker','grid'].map(name => texture(gl, name)));
  gl.useProgram(shader);
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  for (const [name, data] of Object.entries(cube())) {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    const attribute = gl.getAttribLocation(shader, `a_${name}`);
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute, name === 'uv' ? 2 : 3, gl.FLOAT, false, 0, 0);
  }
  const u = Object.fromEntries(['model','view','projection','light','camera','ambient','shininess','uv','mode','marker','texture'].map(name => [name, gl.getUniformLocation(shader, `u_${name}`)]));
  const defaults = () => ({mode:0, ambient:.2, shininess:32, light:[2.5,2.5,3], filter:0, wrap:0, texture:0, uv:2, moving:false, marker:true, paused:false, angle:.4, orbit:.9, height:.35, distance:8, phase:0});
  let state = defaults();
  const keys = new Set();
  const wraps = ['REPEAT','CLAMP_TO_EDGE','MIRRORED_REPEAT'];
  function hud() {
    for (const name of ['mode','ambient','shininess','texture','uv']) $(name).value = state[name];
    for (const name of ['moving','marker']) $(name).checked = state[name];
    $('light').textContent = state.light.map(n => n.toFixed(2)).join(' / ');
    $('filter').textContent = `${state.filter ? 'NEAREST' : 'LINEAR'} · F`;
    $('wrap').textContent = `${wraps[state.wrap]} · W`;
    $('uvValue').textContent = state.uv;
    $('pause').textContent = `${state.paused ? 'Resume' : 'Pause'} rotation · Space`;
    $('challenges').textContent = `Aktif: multiple textures${state.moving ? ', moving light' : ''}${state.marker ? ', light marker' : ''}.`;
  }
  function move(axis, amount) {
    state.moving = false;
    state.light[axis] = Math.max(-5, Math.min(5, state.light[axis] + amount));
  }
  for (const [axis, labels] of [['X',['J','L']],['Y',['K','I']],['Z',['O','U']]]) {
    labels.forEach((key, i) => {
      const button = document.createElement('button'); button.textContent = `${axis}${i ? '+' : '−'} ${key}`;
      button.setAttribute('aria-label', `Light ${axis} ${i ? 'plus' : 'minus'}`);
      button.onclick = () => move('XYZ'.indexOf(axis), i ? .25 : -.25);
      document.querySelector('.axes').append(button);
    });
  }
  const actions = {
    f:() => state.filter ^= 1, w:() => state.wrap = (state.wrap+1)%3,
    m:() => state.moving = !state.moving, t:() => state.texture ^= 1,
    ' ':() => state.paused = !state.paused,
    r:() => {state = defaults(); keys.clear();},
    '1':() => state.mode=1, '2':() => state.mode=2, '3':() => state.mode=3,
    '4':() => state.mode=4, '5':() => state.mode=0
  };
  for (const [id, action] of [['filter','f'],['wrap','w'],['pause',' '],['reset','r']]) $(id).onclick = actions[action];
  for (const name of ['mode','ambient','shininess','texture','uv']) $(name).addEventListener('input', e => state[name] = Number(e.target.value));
  for (const name of ['moving','marker']) $(name).onchange = e => state[name] = e.target.checked;
  window.addEventListener('keydown', e => {
    if (/INPUT|SELECT|BUTTON|TEXTAREA/.test(e.target.tagName)) return;
    const key = e.key.toLowerCase();
    if (actions[key] || 'jlikuo'.includes(key)) e.preventDefault();
    keys.add(key);
    if (!e.repeat) actions[key]?.();
  });
  window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => keys.clear());
  let pointer;
  canvas.onpointerdown = e => {pointer = [e.clientX,e.clientY]; canvas.setPointerCapture(e.pointerId); canvas.focus();};
  canvas.onpointermove = e => {
    if (!pointer) return;
    state.orbit += (e.clientX-pointer[0])*.008;
    state.height = Math.max(-1.3, Math.min(1.3,state.height+(e.clientY-pointer[1])*.008));
    pointer = [e.clientX,e.clientY];
  };
  canvas.onpointerup = canvas.onpointercancel = () => pointer = null;
  canvas.addEventListener('wheel', e => {e.preventDefault(); state.distance = Math.max(4, Math.min(14, state.distance+e.deltaY*.01));}, {passive:false});
  gl.enable(gl.DEPTH_TEST);
  gl.uniform1i(u.texture, 0);
  let previous = performance.now();
  function frame(now) {
    const dt = Math.min((now-previous)/1000,.05); previous = now;
    for (const [minus,plus,axis] of [['j','l',0],['k','i',1],['o','u',2]]) {
      const direction = Number(keys.has(plus))-Number(keys.has(minus));
      if (direction) move(axis,direction*dt*2);
    }
    if (!state.paused) state.angle += dt*.35;
    if (state.moving) {
      state.phase += dt*.6;
      state.light = [3*Math.cos(state.phase),2.5,3*Math.sin(state.phase)];
    }
    const ratio = Math.min(devicePixelRatio,2);
    const width = Math.round(canvas.clientWidth*ratio), height = Math.round(canvas.clientHeight*ratio);
    if (canvas.width !== width || canvas.height !== height) {canvas.width=width; canvas.height=height;}
    gl.viewport(0,0,width,height);
    gl.clearColor(.063,.063,.063,1); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const camera = [Math.sin(state.orbit)*Math.cos(state.height)*state.distance,Math.sin(state.height)*state.distance,Math.cos(state.orbit)*Math.cos(state.height)*state.distance];
    gl.uniformMatrix4fv(u.view,false,lookAt(camera,[0,0,0],[0,1,0]));
    gl.uniformMatrix4fv(u.projection,false,perspective(Math.PI/4,width/height,.1,100));
    gl.uniform3fv(u.camera,camera); gl.uniform3fv(u.light,state.light);
    gl.uniform1f(u.ambient,state.ambient); gl.uniform1f(u.shininess,state.shininess);
    gl.uniform1f(u.uv,state.uv); gl.uniform1i(u.mode,state.mode);
    gl.bindTexture(gl.TEXTURE_2D,textures[state.texture]);
    for (const parameter of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D,parameter,state.filter ? gl.NEAREST : gl.LINEAR);
    for (const parameter of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D,parameter,gl[wraps[state.wrap]]);
    gl.uniform1i(u.marker,0);
    gl.uniformMatrix4fv(u.model,false,multiply(rotationY(state.angle),rotationX(-.25)));
    gl.drawArrays(gl.TRIANGLES,0,36);
    if (state.marker) {
      const model = translation(...state.light);
      model[0]=model[5]=model[10]=.075;
      gl.uniformMatrix4fv(u.model,false,model); gl.uniform1i(u.marker,1);
      gl.drawArrays(gl.TRIANGLES,0,36);
    }
    hud(); requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
start().catch(error => {$('error').hidden=false; $('error').textContent=error.message; console.error(error);});
