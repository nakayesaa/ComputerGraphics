"""Run with Blender 5.2: blender --background --python scripts/build.py."""
import bpy, bmesh, math, json
import numpy as np
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
TEX = ROOT / 'textures'
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent / 'week9/P09_Kelompok_Toolbox.blend'))
scene = bpy.context.scene
scene.name = '05_TOOLBOX_FINAL'
scene.frame_set(4)
scene.animation_data_clear()
for o in scene.objects:
    o.animation_data_clear()
original = [o for o in scene.objects if o.type in {'MESH','CURVE'}]

def snapshot(name, objects):
    s = bpy.data.scenes.new(name)
    s.world = scene.world
    for o in objects:
        c = o.copy(); c.data = o.data.copy(); c.animation_data_clear()
        s.collection.objects.link(c)
        c.matrix_world = o.matrix_world.copy(); c.parent = None
    return s

before = snapshot('01_BEFORE_UV', original)
for o in before.objects:
    if o.type == 'MESH':
        for uv in list(o.data.uv_layers): o.data.uv_layers.remove(uv)

def active(o):
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True); bpy.context.view_layer.objects.active = o

# Preserve week 9 silhouette; resolve repeated geometry before unique UV packing.
for o in original:
    if o.type != 'MESH': continue
    print('PREP',o.name,flush=True)
    active(o)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for mod in list(o.modifiers):
        if mod.type not in {'BEVEL','WEIGHTED_NORMAL'}:
            bpy.ops.object.modifier_apply(modifier=mod.name)
    bm = bmesh.new(); bm.from_mesh(o.data)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    # Deliberate panel seams: hard corners + open boundary. No smart-project.
    for e in bm.edges:
        e.seam = len(e.link_faces) != 2 or e.calc_face_angle(0) > math.radians(35)
    bm.to_mesh(o.data); bm.free()
    o['seam_strategy'] = 'Separate planar panels at hard corners (>35 deg), rims and underside boundaries; bevel stays non-destructive.'
    for uv in list(o.data.uv_layers): o.data.uv_layers.remove(uv)

# Small front status plaque is an explicit emission-mask exercise.
def box(name, loc, scale):
    bpy.ops.mesh.primitive_cube_add(size=2, location=loc)
    o=bpy.context.object; o.name=name; o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    for e in o.data.edges: e.use_seam=True
    mod=o.modifiers.new('Soft machined edge','BEVEL'); mod.width=.015; mod.segments=3
    return o

badge=box('Status_Emission_Plaque',(0,-1.467,.32),(.52,.024,.105))
meshes=[o for o in scene.objects if o.type=='MESH']
seams=snapshot('02_MARKED_SEAMS',meshes)
print('UNWRAP',[(o.name,len(o.data.polygons)) for o in meshes],flush=True)
for o in meshes: o.select_set(True)
bpy.context.view_layer.objects.active=bpy.data.objects['Body']
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.unwrap(method='ANGLE_BASED',margin=.001)
bpy.ops.object.mode_set(mode='OBJECT')
print('INITIAL DONE',flush=True)
initial=snapshot('03_INITIAL_UNWRAP',meshes)
# Equal physical scale across every component, then pack globally into 0..1.
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.uv.select_all(action='SELECT'); bpy.ops.uv.average_islands_scale()
bpy.ops.uv.pack_islands(rotate=True,shape_method='AABB',margin_method='ADD',margin=16/1024)
bpy.ops.object.mode_set(mode='OBJECT')
print('PACK DONE',flush=True)
for o in meshes:
    o.data.uv_layers.active.name='UV_Main'
    o['uv_margin']='Packing ADD 0.015625; measured final gap in docs/validation.json'

def image_file(name, values, folder, color='Non-Color'):
    values=np.asarray(values,dtype=np.float32)
    if values.ndim==2: values=np.repeat(values[:,:,None],3,axis=2)
    h,w=values.shape[:2]
    rgba=np.ones((h,w,4),np.float32); rgba[:,:,:3]=values[:,:,:3]
    im=bpy.data.images.new(name,width=w,height=h,alpha=False)
    im.colorspace_settings.name=color
    im.pixels.foreach_set(rgba.ravel()); im.file_format='PNG'
    im.filepath_raw=str(folder/(name+'.png')); im.save()
    return im

N=1024
y,x=np.mgrid[0:N,0:N].astype(np.float32)/N
rng=np.random.default_rng(10)
grain=rng.random((N,N),dtype=np.float32)
wave=(np.sin(x*420)+np.sin(y*170+x*55))*.5
scratch=(np.sin(y*1700+x*9)>.998)&(grain>.7)
sets={}
for name,base,rough,metal in [('Navy',(0.045,.14,.22),.42,0),('Orange',(.92,.27,.035),.4,0),('Steel',(.49,.55,.59),.27,1),('Rubber',(.035,.045,.05),.79,0),('Status',(.015,.04,.055),.4,0)]:
    folder=TEX/'toolbox'
    variation=(grain-.5)*.045+wave*.012
    col=np.clip(np.array(base)[None,None,:]+variation[:,:,None],0,1)
    # Localised fine scuffs reveal conductive substrate only on painted material.
    wear=scratch.astype(np.float32) if name in {'Navy','Orange'} else np.zeros_like(x)
    col=col*(1-wear[:,:,None])+np.array([.55,.59,.62])*wear[:,:,None]
    rv=np.clip(rough+variation*2-wear*.17,.06,.95)
    mv=np.maximum(np.full_like(x,metal),wear)
    height=(grain-.5)*.00015+np.sin(y*1100)*(.00015 if name=='Steel' else .000035)
    dy,dx=np.gradient(height,1/N)
    norm=np.stack((-dx,-dy,np.ones_like(x)),axis=-1)
    norm/=np.linalg.norm(norm,axis=-1,keepdims=True)
    # Barcode-like pulse pattern is spatially varying, not uniform emission.
    em=np.zeros((N,N,3),np.float32)
    if name=='Status':
        mask=((np.floor(x*48)%3)!=0)&(y>.12)&(y<.88)
        em[mask]=[.04,.8,1.]
    sets[name]={k:image_file(name+'_'+k,v,folder,'sRGB' if k in {'BaseColor','Emission'} else 'Non-Color') for k,v in [('BaseColor',col),('Roughness',rv),('Metallic',mv),('Normal',norm*.5+.5),('Emission',em)]}

def material(name, maps, strength=0):
    mat=bpy.data.materials.new(name); mat.use_nodes=True
    nt=mat.node_tree; nt.nodes.clear()
    out=nt.nodes.new('ShaderNodeOutputMaterial'); out.location=(780,80)
    bs=nt.nodes.new('ShaderNodeBsdfPrincipled'); bs.location=(410,80); bs.width=280
    bs.inputs['Emission Strength'].default_value=strength
    uv=nt.nodes.new('ShaderNodeUVMap'); uv.uv_map='UV_Main'; uv.location=(-820,120)
    for i,(key,im) in enumerate(maps.items()):
        t=nt.nodes.new('ShaderNodeTexImage'); t.image=im; t.label=key+' | '+im.colorspace_settings.name
        t.location=(-540,470-i*290); t.width=250
        nt.links.new(uv.outputs['UV'],t.inputs['Vector'])
        if key=='Normal':
            n=nt.nodes.new('ShaderNodeNormalMap'); n.location=(80,-390); n.uv_map='UV_Main'
            n.inputs['Strength'].default_value=.28
            nt.links.new(t.outputs['Color'],n.inputs['Color']); nt.links.new(n.outputs['Normal'],bs.inputs['Normal'])
        elif key in {'BaseColor','Roughness','Metallic','Emission'}:
            nt.links.new(t.outputs['Color'],bs.inputs[{'BaseColor':'Base Color','Emission':'Emission Color'}.get(key,key)])
    nt.links.new(bs.outputs['BSDF'],out.inputs['Surface'])
    return mat

mats={name:material('P10 / '+name+' / UV PBR',maps,2 if name=='Status' else 0) for name,maps in sets.items()}
for o in meshes:
    old=o.data.materials[0].name if o.data.materials else ''
    key='Status' if o==badge else 'Navy' if old=='NavyPaint' else 'Orange' if old=='SfetyOrange' else 'Rubber' if old=='RubberBlack' else 'Steel'
    o.data.materials.clear(); o.data.materials.append(mats[key])

checker=bpy.data.images.new('UV_Checker_2048',width=2048,height=2048)
checker.generated_type='COLOR_GRID'; checker.filepath_raw=str(TEX/'toolbox/UV_Checker_2048.png'); checker.file_format='PNG';checker.save()
cm=bpy.data.materials.new('Diagnostic / UV Checker');cm.use_nodes=True
ct=cm.node_tree.nodes.new('ShaderNodeTexImage');ct.image=checker
cm.node_tree.links.new(ct.outputs['Color'],cm.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
check=snapshot('04_CHECKER_TEST',meshes)
for o in check.objects: o.data.materials.clear();o.data.materials.append(cm)

# Imported legal PBR example, maps exported from the original GLB.
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.import_scene.gltf(filepath=str(ROOT/'sources/helmet/DamagedHelmet.glb'))
helmet_objects=list(bpy.context.selected_objects)
helmet=next(o for o in helmet_objects if o.type=='MESH')
helmet.name='DamagedHelmet / ctxwing + theblueturtle_'
helmet.data.uv_layers.active.name='UV_Main'
hm=helmet.data.materials[0]
nodes=list(hm.node_tree.nodes)
imnodes=[n for n in nodes if n.type=='TEX_IMAGE']
# glTF importer node labels expose texture semantics through links, not filenames.
images=[]
for n in imnodes:
    if n.image not in images: images.append(n.image)
print('HELMET IMAGES',[(im.name,im.size[:]) for im in images])
# GLB image order is authoritative: base, MR, emission, AO, normal.
import struct
raw=(ROOT/'sources/helmet/DamagedHelmet.glb').read_bytes();jn=struct.unpack_from('<I',raw,12)[0]
g=json.loads(raw[20:20+jn]);start=20+jn+8
maps={}
for idx,key in enumerate(['BaseColor','MetallicRoughness','Emission','AO','Normal']):
    bv=g['bufferViews'][g['images'][idx]['bufferView']];a=start+bv.get('byteOffset',0)
    f=TEX/'helmet'/(key+'.jpg');f.write_bytes(raw[a:a+bv['byteLength']])
    im=bpy.data.images.load(str(f),check_existing=False)
    im.colorspace_settings.name='sRGB' if key in {'BaseColor','Emission'} else 'Non-Color'
    maps[key]=im
mr=maps.pop('MetallicRoughness');w,h=mr.size
px=np.array(mr.pixels[:],np.float32).reshape(h,w,4)
for key,chan in [('Roughness',1),('Metallic',2)]:maps[key]=image_file('Helmet_'+key,px[:,:,chan],TEX/'helmet')
ao=maps.pop('AO')
hmat=material('EXPLORATION / Damaged Helmet / PBR', {k:maps[k] for k in ['BaseColor','Roughness','Metallic','Normal','Emission']},1)
# AO multiplies base color and remains labelled in node graph.
nt=hmat.node_tree;bs=next(n for n in nt.nodes if n.type=='BSDF_PRINCIPLED')
base=next(n for n in nt.nodes if n.type=='TEX_IMAGE' and n.image==maps['BaseColor'])
an=nt.nodes.new('ShaderNodeTexImage');an.image=ao;an.label='AO | Non-Color';an.location=(-540,780);an.width=250
uv=next(n for n in nt.nodes if n.type=='UVMAP');nt.links.new(uv.outputs[0],an.inputs['Vector'])
mix=nt.nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;mix.location=(70,370);mix.label='Optional baked occlusion'
nt.links.new(base.outputs['Color'],mix.inputs[1]);nt.links.new(an.outputs['Color'],mix.inputs[2]);nt.links.new(mix.outputs[0],bs.inputs['Base Color'])
helmet.data.materials.clear();helmet.data.materials.append(hmat)
hs=bpy.data.scenes.new('07_HELMET_PBR')
for o in helmet_objects:
    for c in list(o.users_collection):c.objects.unlink(o)
    hs.collection.objects.link(o)
hb=snapshot('06_HELMET_BEFORE',helmet_objects)
neutral=bpy.data.materials.new('Exploration / untextured baseline');neutral.diffuse_color=(.35,.35,.35,1);neutral.use_nodes=True
for o in hb.objects:
    if o.type=='MESH':o.data.materials.clear();o.data.materials.append(neutral)

def studio(s, target, distance, ground):
    s.render.engine='CYCLES';s.cycles.samples=32;s.cycles.use_denoising=True
    s.render.resolution_x=1600;s.render.resolution_y=1200;s.render.resolution_percentage=100
    s.world=bpy.data.worlds.new(s.name+' / studio');s.world.use_nodes=True
    s.world.node_tree.nodes['Background'].inputs[0].default_value=(.16,.2,.26,1)
    s.world.node_tree.nodes['Background'].inputs[1].default_value=.4
    def link_obj(name,data,loc):
        o=bpy.data.objects.new(name,data);s.collection.objects.link(o);o.location=loc;return o
    cam=link_obj('Camera',bpy.data.cameras.new('Camera'),Vector(target)+Vector((distance,-distance*1.3,distance*.85)))
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.type='ORTHO';cam.data.ortho_scale=distance*1.45;s.camera=cam
    for name,offset,power,size,color in [('Key',(-3,-4,7),1500,5,(.79,.89,1)),('Warm rim',(4,2,5),2000,4,(1,.69,.4)),('Front fill',(1,-5,2),650,3,(.5,.8,1))]:
        data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color
        o=link_obj(name,data,Vector(target)+Vector(offset));o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
    mesh=bpy.data.meshes.new('Studio floor');mesh.from_pydata([(-200,-200,ground),(200,-200,ground),(200,200,ground),(-200,200,ground)],[],[(0,1,2,3)])
    floor=link_obj('Studio floor (presentation only)',mesh,(0,0,0))
    fm=bpy.data.materials.get('Studio charcoal') or bpy.data.materials.new('Studio charcoal');fm.diffuse_color=(.035,.045,.063,1);fm.use_nodes=True
    fm.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.035,.045,.063,1)
    fm.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.7
    floor.data.materials.append(fm)
    s.view_settings.view_transform='AgX'

for s in [scene,before,seams,initial,check]:studio(s,(0,0,.3),5.5,-1.2)
for s in [hs,hb]:studio(s,(0,0,0),3.4,-1.05)

# Save before expensive rendering so a render interruption never loses the asset.
bpy.context.window.scene=scene
active(bpy.data.objects['Body'])
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_perspective='CAMERA'
            area.spaces.active.shading.type='MATERIAL'
            area.spaces.active.overlay.show_extras=False
for im in bpy.data.images:
    if im.source=='FILE' and im.filepath and not im.packed_file:
        try:im.pack()
        except RuntimeError:pass
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'P10_Kelompok_Toolbox.blend'))
bpy.ops.file.make_paths_relative()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'P10_Kelompok_Toolbox.blend'))
for s,name in [(scene,'10_final_toolbox'),(check,'04_checker_render'),(before,'01_before_uv_render'),(hb,'11_helmet_before'),(hs,'12_helmet_pbr')]:
    s.render.filepath=str(ROOT/'screenshots'/(name+'.png'))
    bpy.ops.render.render(write_still=True,scene=s.name)
print('BUILD COMPLETE')
