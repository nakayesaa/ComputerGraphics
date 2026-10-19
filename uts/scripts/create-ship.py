"""Original flat-shaded spaceship, embedded-buffer glTF 2.0. No external assets."""
import json, struct, base64, math
from pathlib import Path
# Triangular faces deliberately define a small angular interceptor.
vertices=[(0,.16,-.9),(-.25,0,.35),(.25,0,.35),(0,.35,.05),(0,-.12,.2),(-.8,-.04,.55),(.8,-.04,.55),(-.19,.05,.6),(.19,.05,.6)]
faces=[(0,1,3),(0,3,2),(0,4,1),(0,2,4),(1,2,3),(1,4,2),(0,5,1),(0,2,6),(1,5,7),(2,8,6),(1,7,3),(2,3,8)]
pos=[];norm=[]
for face in faces:
 a,b,c=[vertices[i] for i in face]; u=[b[i]-a[i] for i in range(3)];v=[c[i]-a[i] for i in range(3)]
 n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];l=math.sqrt(sum(x*x for x in n));n=[x/l for x in n]
 for p in (a,b,c): pos.extend(p);norm.extend(n)
p=struct.pack('<'+'f'*len(pos),*pos);n=struct.pack('<'+'f'*len(norm),*norm);data=p+n
model={'asset':{'version':'2.0','generator':'VOIDFLEET original ship generator'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'mesh':0,'name':'Vanguard Interceptor'}],'meshes':[{'primitives':[{'attributes':{'POSITION':0,'NORMAL':1},'material':0}]}],'materials':[{'name':'Titanium ceramic','pbrMetallicRoughness':{'baseColorFactor':[.62,.75,.85,1],'metallicFactor':.65,'roughnessFactor':.32},'doubleSided':True}],'buffers':[{'uri':'data:application/octet-stream;base64,'+base64.b64encode(data).decode(),'byteLength':len(data)}],'bufferViews':[{'buffer':0,'byteOffset':0,'byteLength':len(p),'target':34962},{'buffer':0,'byteOffset':len(p),'byteLength':len(n),'target':34962}],'accessors':[{'bufferView':0,'componentType':5126,'count':len(pos)//3,'type':'VEC3','min':[-.8,-.12,-.9],'max':[.8,.35,.6]},{'bufferView':1,'componentType':5126,'count':len(norm)//3,'type':'VEC3'}]}
Path('public/assets/vanguard.gltf').write_text(json.dumps(model,separators=(',',':')))
