"""Preserve original toolbox and create an inspectable modeling reconstruction."""
import bpy,bmesh,json,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'sources/P09_Original.blend'))
final=bpy.context.scene;final.name='04_FINAL_TOOLBOX';final.frame_set(1)
def select(o):
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
names={'Body':'Body','FootRight':'Foot_Right','FrontMirror':'Front_Latches_Mirror','HandleGrip':'Handle_Grip','HandlePostLeft':'Handle_Post_Left','HandleRight':'Handle_Post_Right','LeftFoot':'Foot_Left','lID':'Lid_Hinged','Nakayesaa':'Signature_Nakayesaa','sideribs':'Side_Ribs_Array'}
cleanup=[]
for o in list(final.objects):
    o.name=names.get(o.name,o.name)
    if o.type!='MESH':continue
    select(o);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    bm=bmesh.new();bm.from_mesh(o.data);before=len(bm.verts)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    cleanup.append({'object':o.name,'duplicates_removed':before-len(bm.verts)})
    bm.to_mesh(o.data);bm.free()
    for m in o.modifiers:
        if m.type=='BEVEL':m.harden_normals=True
    o['role']='Original week 9 toolbox; scale applied, vertices merged at 1e-6, normals recalculated.'

# Replace the original Geometry Nodes Array asset with the native Array modifier.
# The count and total extent stay equivalent, while the challenge is inspectable.
rib=bpy.data.objects['Side_Ribs_Array']
target_extent=rib.dimensions.y
base_extent=max(v.co.y for v in rib.data.vertices)-min(v.co.y for v in rib.data.vertices)
for m in list(rib.modifiers):
    if m.type=='NODES':rib.modifiers.remove(m)
ar=rib.modifiers.new('Array - five repeated ribs','ARRAY');ar.count=5
ar.use_relative_offset=False;ar.use_constant_offset=True
ar.constant_offset_displace=(0,(target_extent-base_extent)/4,0)
select(rib);bpy.ops.object.modifier_move_up(modifier=ar.name)

asset=bpy.data.collections.new('TOOLBOX / modeled components');final.collection.children.link(asset)
for o in list(final.objects):
    for c in list(o.users_collection):c.objects.unlink(o)
    asset.objects.link(o)
for c in list(final.collection.children):
    if c!=asset and len(c.objects)==0:final.collection.children.unlink(c)

def cube(name,loc,scale,mat=None):
    bpy.ops.mesh.primitive_cube_add(size=2,location=loc)
    o=bpy.context.object;o.name=name;o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if mat:o.data.materials.append(mat)
    return o
def snapshot(name,objects):
    s=bpy.data.scenes.new(name)
    s['documentation']='Reconstruction executed now from primitives; not a historical screenshot of the original session.'
    for o in objects:
        c=o.copy();c.data=o.data.copy();s.collection.objects.link(c)
    return s

study=bpy.data.scenes.new('WORK_RECONSTRUCTION');bpy.context.window.scene=study
body=cube('Study_Body',(0,0,0),(2,1.44,1),bpy.data.materials['NavyPaint'])
lid=cube('Study_Lid',(0,0,1.075),(2,1.44,.075),bpy.data.materials['SfetyOrange'])
grip=cube('Study_Handle',(0,0,1.55),(1,.175,.11),bpy.data.materials['RubberBlack'])
post=cube('Study_Post_Left',(-.9,0,1.3),(.11,.175,.175),bpy.data.materials['Steel'])
other=post.copy();other.data=post.data.copy();other.name='Study_Post_Right_Duplicate';other.location.x=.9;study.collection.objects.link(other)
block=snapshot('01_BLOCKOUT_RECONSTRUCTION',list(study.objects))

# Real Inset + Extrude operators, producing a recessed cavity in the body.
select(body)
for p in body.data.polygons:p.select=p.normal.z>.9
bpy.context.tool_settings.mesh_select_mode=(False,False,True)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.inset(thickness=.12,depth=0)
bpy.ops.mesh.extrude_region_move(TRANSFORM_OT_translate={'value':(0,0,-1.82)})
bpy.ops.object.mode_set(mode='OBJECT')
# Real lid panel inset and shallow inward extrusion.
select(lid)
for p in lid.data.polygons:p.select=p.normal.z>.9
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.inset(thickness=.12,depth=0)
bpy.ops.mesh.extrude_region_move(TRANSFORM_OT_translate={'value':(0,0,-.035)})
bpy.ops.object.mode_set(mode='OBJECT')
ei=snapshot('02_EXTRUDE_INSET_RECONSTRUCTION',list(study.objects))
# Hide lid only in the process scene so the extruded cavity is clearly visible.
next(o for o in ei.objects if o.name.startswith('Study_Lid')).hide_viewport=True
next(o for o in ei.objects if o.name.startswith('Study_Lid')).hide_render=True

# Horizontal topology loop, then explicit bevel on the rim and panel edges.
select(body)
bm=bmesh.new();bm.from_mesh(body.data)
bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=1e-6,plane_co=(0,0,0),plane_no=(0,0,1),clear_inner=False,clear_outer=False)
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(body.data);bm.free()
for o in [body,lid]:
    mod=o.modifiers.new('Bevel - edge radius 0.04','BEVEL');mod.width=.04;mod.segments=3
loop=snapshot('03_LOOP_BEVEL_RECONSTRUCTION',list(study.objects))
next(o for o in loop.objects if o.name.startswith('Study_Lid')).hide_viewport=True
next(o for o in loop.objects if o.name.startswith('Study_Lid')).hide_render=True
bpy.context.window.scene=final;bpy.data.scenes.remove(study)

floor_mat=bpy.data.materials.new('Studio_Charcoal');floor_mat.diffuse_color=(.035,.045,.06,1);floor_mat.use_nodes=True
floor_mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.035,.045,.06,1)
floor_mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.7
def studio(s):
    col=bpy.data.collections.new('STUDIO / presentation only');s.collection.children.link(col)
    def add(name,data,loc):
        o=bpy.data.objects.new(name,data);col.objects.link(o);o.location=loc;return o
    target=Vector((0,0,.45))
    camera=add('Camera_Studio',bpy.data.cameras.new('Camera'),(6,-8,5.8))
    camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.type='ORTHO';camera.data.ortho_scale=7.2;s.camera=camera
    for name,loc,power,size,color in [('Key',(-3,-4,7),1000,5,(.8,.9,1)),('Rim',(4,3,5),1500,4,(1,.7,.42)),('Fill',(2,-5,2),450,3,(.6,.8,1))]:
        data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color
        o=add(name,data,loc);o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
    me=bpy.data.meshes.new('Floor');me.from_pydata([(-100,-100,-1.2),(100,-100,-1.2),(100,100,-1.2),(-100,100,-1.2)],[],[(0,1,2,3)])
    o=add('Studio_Floor',me,(0,0,0));o.data.materials.append(floor_mat)
    s.world=bpy.data.worlds.new('Studio World');s.world.use_nodes=True
    s.world.node_tree.nodes['Background'].inputs[0].default_value=(.16,.2,.27,1)
    s.world.node_tree.nodes['Background'].inputs[1].default_value=.35
    s.render.engine='CYCLES';s.cycles.samples=24;s.cycles.use_denoising=True
    s.render.resolution_x=1600;s.render.resolution_y=1200;s.render.resolution_percentage=100
    s.view_settings.view_transform='AgX'
for s in [final,block,ei,loop]:studio(s)
final['documentation']='Final original toolbox cleaned; historical source preserved under sources/.'
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_rotation=final.camera.rotation_euler.to_quaternion()
            area.spaces.active.region_3d.view_location=(0,0,.4)
            area.spaces.active.region_3d.view_distance=7
            area.spaces.active.region_3d.view_perspective='ORTHO'
            area.spaces.active.overlay.show_extras=False
            area.spaces.active.shading.type='MATERIAL'
select(bpy.data.objects['Body'])
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'P09_Kelompok_Toolbox.blend'))
(ROOT/'docs/cleanup.json').write_text(json.dumps(cleanup,indent=2)+'\n')
for frame,name in [(1,'final_closed_render'),(41,'final_open_render')]:
    if frame==41:
        final.camera.location=(7,-9,7)
        final.camera.rotation_euler=(Vector((0,.2,1.25))-final.camera.location).to_track_quat('-Z','Y').to_euler()
        final.camera.data.ortho_scale=8.5
    final.frame_set(frame)
    if frame==41:
        bpy.context.view_layer.update()
        points=[final.camera.matrix_world.inverted()@(o.matrix_world@Vector(c)) for o in final.objects if o.type in {'MESH','CURVE'} and not o.name.startswith('Studio_') for c in o.bound_box]
        lo=Vector((min(p.x for p in points),min(p.y for p in points),0));hi=Vector((max(p.x for p in points),max(p.y for p in points),0))
        final.camera.location+=final.camera.rotation_euler.to_quaternion()@((lo+hi)/2)
        final.camera.data.ortho_scale=max(hi.x-lo.x,(hi.y-lo.y)*final.render.resolution_x/final.render.resolution_y)*1.13
    final.render.filepath=str(ROOT/'screenshots'/(name+'.png'))
    bpy.ops.render.render(write_still=True,scene=final.name)
print('WEEK9 BUILD COMPLETE',flush=True)
