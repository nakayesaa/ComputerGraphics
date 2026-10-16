// Run: node --experimental-default-type=module week5/check.mjs
import assert from 'node:assert/strict';
import {cube} from './geometry.js';
import {multiply, rotationX, rotationY, lookAt} from './math3d.js';
const {position, normal, uv} = cube();
assert.equal(position.length, 36*3);
assert.equal(normal.length, position.length);
assert.equal(uv.length, 36*2);
for (let i=0;i<36;i+=3) {
  const a=position.slice(i*3,i*3+3), b=position.slice(i*3+3,i*3+6), c=position.slice(i*3+6,i*3+9);
  const ab=b.map((x,j)=>x-a[j]), ac=c.map((x,j)=>x-a[j]);
  const cross=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
  assert(cross.reduce((s,x,j)=>s+x*normal[i*3+j],0)>0,'face winding agrees with normal');
}
assert(uv.every(x=>x===0||x===1));
const rotation=multiply(rotationY(.6),rotationX(.4));
for (let i=0;i<3;i++) assert(Math.abs(Math.hypot(...rotation.slice(i*4,i*4+3))-1)<1e-6);
assert([...lookAt([0,0,8],[0,0,0],[0,1,0])].every(Number.isFinite));
console.log('PASS: cube buffers, outward normals, UVs, rotation and view matrices');
