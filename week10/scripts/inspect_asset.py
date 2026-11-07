import bpy, json
bpy.ops.wm.open_mainfile(filepath='C:/grafkom/week9/P09_Kelompok_Toolbox.blend')
out=[]
for o in bpy.data.objects:
    out.append(dict(name=o.name,type=o.type,location=list(o.location),rotation=list(o.rotation_euler),scale=list(o.scale),parent=o.parent.name if o.parent else None,modifiers=[(m.name,m.type) for m in o.modifiers],verts=len(o.data.vertices) if o.type=='MESH' else 0,faces=len(o.data.polygons) if o.type=='MESH' else 0))
open('C:/grafkom/week10/docs/original_geometry.json','w').write(json.dumps(out,indent=2))
