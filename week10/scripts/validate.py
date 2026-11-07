"""Validate saved UV triangles, map wiring, packing and portability in Blender."""
import bpy, json, math
import numpy as np
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'P10_Kelompok_Toolbox.blend'))
s=bpy.data.scenes['05_TOOLBOX_FINAL']
objs=[o for o in s.objects if o.type=='MESH' and not o.name.startswith('Studio')]
tris=[];faces=[];density=[];anis=[];counts=[]
for o in objs:
    me=o.data;me.calc_loop_triangles();uv=me.uv_layers.active.data
    counts.append({'object':o.name,'faces':len(me.polygons),'seam_edges':sum(e.use_seam for e in me.edges),'scale':list(o.scale)})
    for p in me.polygons:
        coords=[list(uv[i].uv) for i in p.loop_indices]
        faces.append({'object':o.name,'face':p.index,'uv':coords})
    for t in me.loop_triangles:
        q=np.array([uv[i].uv[:] for i in t.loops],dtype=float)
        p=np.array([(o.matrix_world@me.vertices[i].co)[:] for i in t.vertices])
        a3=np.linalg.norm(np.cross(p[1]-p[0],p[2]-p[0]))/2
        au=abs(np.cross(q[1]-q[0],q[2]-q[0]))/2
        if a3>1e-12 and au>1e-12:
            density.append(math.sqrt(au/a3)*1024)
            e=p[1]-p[0];f=p[2]-p[0];el=np.linalg.norm(e)
            xx=np.array([[el,np.dot(e,f)/el],[0,np.linalg.norm(np.cross(e,f))/el]])
            transform=np.stack([q[1]-q[0],q[2]-q[0]],axis=1)@np.linalg.inv(xx)
            sv=np.linalg.svd(transform,compute_uv=False);anis.append(float(sv[0]/sv[1]))
            tris.append((o.name,t.polygon_index,q))

def overlap(a,b):
    # Strict separating-axis test excludes touching shared edges.
    for poly in (a,b):
        for i in range(3):
            edge=poly[(i+1)%3]-poly[i];axis=np.array([-edge[1],edge[0]])
            if np.linalg.norm(axis)<1e-12:continue
            axis/=np.linalg.norm(axis);pa=a@axis;pb=b@axis
            if min(pa.max(),pb.max())-max(pa.min(),pb.min())<=1e-7:return False
    return True

hits=[]
for i,(on,fi,a) in enumerate(tris):
    for pn,fj,b in tris[i+1:]:
        if on==pn and fi==fj:continue
        if np.any(a.max(axis=0)<=b.min(axis=0)+1e-8) or np.any(b.max(axis=0)<=a.min(axis=0)+1e-8):continue
        if overlap(a,b):hits.append([on,fi,pn,fj])
parent=list(range(len(faces)))
def find(a):
    while parent[a]!=a:a=parent[a]
    return a
for i,a in enumerate(faces):
    for j,b in enumerate(faces[:i]):
        if any(np.linalg.norm(np.array(x)-np.array(y))<1e-6 for x in a['uv'] for y in b['uv']):
            parent[find(i)]=find(j)
def point_distance(p,a,b):
    d=b-a;den=d@d
    return np.linalg.norm(p-(a+np.clip((p-a)@d/den,0,1)*d)) if den>1e-15 else np.linalg.norm(p-a)
gap=1.0
for i,a in enumerate(faces):
    av=np.array(a['uv'])
    for j,b in enumerate(faces[:i]):
        if find(i)==find(j):continue
        bv=np.array(b['uv'])
        if np.linalg.norm(np.maximum(np.maximum(av.min(0)-bv.max(0),bv.min(0)-av.max(0)),0))>gap:continue
        for k,x in enumerate(av):
            for l,y in enumerate(bv):
                gap=min(gap,point_distance(x,y,bv[(l+1)%len(bv)]),point_distance(y,x,av[(k+1)%len(av)]))
alluv=np.concatenate([t[2] for t in tris])
images=[]
for im in bpy.data.images:
    if im.source!='FILE':continue
    path=Path(bpy.path.abspath(im.filepath))
    # Imported orphan images can have original GLB internal identifiers; only used images matter.
    used=any(n.type=='TEX_IMAGE' and n.image==im for m in bpy.data.materials if m.use_nodes for n in m.node_tree.nodes)
    images.append({'name':im.name,'path':im.filepath,'packed':bool(im.packed_file),'external_exists':path.exists(),'used':used,'color_space':im.colorspace_settings.name})
report={'objects':counts,'uv_bounds':[alluv.min(axis=0).tolist(),alluv.max(axis=0).tolist()],
 'uv_islands':len({find(i) for i in range(len(faces))}),'minimum_island_gap_pixels_1024':float(gap*1024),
 'triangle_overlap_count':len(hits),'overlaps':hits,'texel_density_px_per_blender_unit':{'min':min(density),'max':max(density),'median':float(np.median(density))},
 'triangle_anisotropy':{'median':float(np.median(anis)),'max':max(anis)},'uv_triangle_area_sum':float(sum(abs(np.cross(t[2][1]-t[2][0],t[2][2]-t[2][0]))/2 for t in tris)),
 'images':images,'blender_version':bpy.app.version_string}
(ROOT/'docs/validation.json').write_text(json.dumps(report,indent=2))
(ROOT/'docs/uv_faces.json').write_text(json.dumps(faces))
assert not hits, f'UV overlap: {hits[:5]}'
assert alluv.min()>=-1e-5 and alluv.max()<=1.00001
assert all(max(abs(v-1) for v in row['scale'])<1e-5 for row in counts)
assert all(im['packed'] or im['external_exists'] for im in images if im['used'])
assert gap*1024>=16
for m in bpy.data.materials:
    if not (m.name.startswith('P10 /') or m.name.startswith('EXPLORATION /')):continue
    nt=m.node_tree
    for n in nt.nodes:
        if n.type!='TEX_IMAGE':continue
        key=n.label.split(' |')[0]
        assert n.image.colorspace_settings.name==('sRGB' if key in {'BaseColor','Emission'} else 'Non-Color')
    normal=next(n for n in nt.nodes if n.type=='NORMAL_MAP')
    assert normal.inputs['Color'].is_linked
    assert normal.outputs['Normal'].is_linked
print('VALIDATION PASS',json.dumps({k:v for k,v in report.items() if k not in {'images','objects'}}),flush=True)
