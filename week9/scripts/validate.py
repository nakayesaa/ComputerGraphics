"""Reopen final Blender file and check mesh topology, modifiers and animation."""
import bpy,bmesh,json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'P09_Kelompok_Toolbox.blend'))
s=bpy.data.scenes['04_FINAL_TOOLBOX'];bpy.context.window.scene=s;s.frame_set(1)
deps=bpy.context.evaluated_depsgraph_get();rows=[]
for o in s.objects:
    if o.type!='MESH' or o.name.startswith('Studio_'):continue
    bm=bmesh.new();bm.from_mesh(o.data)
    doubles=len(bmesh.ops.find_doubles(bm,verts=list(bm.verts),dist=1e-6)['targetmap'])
    loose=sum(not e.link_faces for e in bm.edges)
    zero=sum(f.calc_area()<1e-10 for f in bm.faces)
    base_boundary=sum(e.is_boundary for e in bm.edges);bm.free()
    ev=o.evaluated_get(deps);me=ev.to_mesh();bm=bmesh.new();bm.from_mesh(me)
    row={'object':o.name,'scale':list(o.scale),'vertices':len(o.data.vertices),'faces':len(o.data.polygons),'duplicate_vertices':doubles,'loose_edges':loose,'degenerate_faces':zero,'base_boundary_edges':base_boundary,'evaluated_boundary_edges':sum(e.is_boundary for e in bm.edges),'evaluated_nonmanifold_edges':sum(not e.is_manifold for e in bm.edges),'signed_volume':bm.calc_volume(signed=True),'modifiers':[m.type for m in o.modifiers]}
    rows.append(row);bm.free();ev.to_mesh_clear()
study=[]
for sn in ['01_BLOCKOUT_RECONSTRUCTION','02_EXTRUDE_INSET_RECONSTRUCTION','03_LOOP_BEVEL_RECONSTRUCTION']:
    obj=next(o for o in bpy.data.scenes[sn].objects if o.name.startswith('Study_Body'))
    study.append({'scene':sn,'vertices':len(obj.data.vertices),'faces':len(obj.data.polygons)})
lid=bpy.data.objects['Lid_Hinged'];poses=[]
for frame in [1,41,80]:
    s.frame_set(frame);poses.append({'frame':frame,'rotation_x_degrees':math.degrees(lid.rotation_euler.x)})
report={'blender_version':bpy.app.version_string,'objects':rows,'reconstruction_stages':study,'lid_poses':poses,'children':[o.name for o in lid.children],'external_image_count':sum(im.source=='FILE' for im in bpy.data.images),'passed':False}
assert all(max(abs(v-1) for v in r['scale'])<1e-5 for r in rows)
assert all(r['duplicate_vertices']==r['loose_edges']==r['degenerate_faces']==0 for r in rows)
assert all(r['evaluated_nonmanifold_edges']==0 and r['signed_volume']>0 for r in rows)
assert {'MIRROR','ARRAY','SOLIDIFY','BEVEL'}<=set(m for r in rows for m in r['modifiers'])
assert study[0]['vertices']==8 and study[1]['vertices']==16 and study[2]['vertices']>16
assert abs(poses[0]['rotation_x_degrees'])<1e-4 and abs(poses[1]['rotation_x_degrees']+90)<1e-3 and abs(poses[2]['rotation_x_degrees'])<1e-4
assert {'Handle_Grip','Handle_Post_Left','Handle_Post_Right','Signature_Nakayesaa'}<=set(report['children'])
report['passed']=True
(ROOT/'docs/validation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print('WEEK9 VALIDATION PASS',json.dumps({'objects':len(rows),'study':study,'animation':poses}),flush=True)
