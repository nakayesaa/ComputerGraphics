import bpy
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'P09_Kelompok_Toolbox.blend'))
s=bpy.context.scene;s.frame_set(41)
s.camera.location=(7,-9,7)
s.camera.rotation_euler=(Vector((0,.2,1.25))-s.camera.location).to_track_quat('-Z','Y').to_euler()
s.camera.data.ortho_scale=8.5
bpy.context.view_layer.update()
points=[s.camera.matrix_world.inverted()@(o.matrix_world@Vector(c)) for o in s.objects if o.type in {'MESH','CURVE'} and not o.name.startswith('Studio_') for c in o.bound_box]
lo=Vector((min(p.x for p in points),min(p.y for p in points),0));hi=Vector((max(p.x for p in points),max(p.y for p in points),0))
s.camera.location+=s.camera.rotation_euler.to_quaternion()@((lo+hi)/2)
s.camera.data.ortho_scale=max(hi.x-lo.x,(hi.y-lo.y)*s.render.resolution_x/s.render.resolution_y)*1.13
s.render.filepath=str(ROOT/'screenshots/final_open_render.png')
bpy.ops.render.render(write_still=True)
