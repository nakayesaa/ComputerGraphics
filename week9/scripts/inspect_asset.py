"""Inspect the original week 9 file without changing it."""
import bpy,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'sources/P09_Original.blend'))
report={'blender_version':bpy.app.version_string,'scenes':[], 'objects':[], 'text_blocks':{t.name:t.as_string() for t in bpy.data.texts}}
for s in bpy.data.scenes:
    report['scenes'].append({'name':s.name,'frame_start':s.frame_start,'frame_end':s.frame_end,'current_frame':s.frame_current,'camera':s.camera.name if s.camera else None})
for o in bpy.data.objects:
    mods=[]
    for m in o.modifiers:
        d={'name':m.name,'type':m.type,'viewport':m.show_viewport,'render':m.show_render}
        for k in ['width','segments','thickness','offset','use_axis','use_clip','relative_offset_displace','count']:
            if hasattr(m,k):
                v=getattr(m,k)
                try:v=list(v)
                except TypeError:pass
                d[k]=v
        if m.type=='NODES' and m.node_group:
            d['node_group']=m.node_group.name
            d['node_count']=len(m.node_group.nodes)
        mods.append(d)
    a=o.animation_data.action if o.animation_data else None
    keys=[]
    if a:
        for layer in a.layers:
            for strip in layer.strips:
                for slot in a.slots:
                    bag=strip.channelbag(slot)
                    if bag:
                        for fc in bag.fcurves:
                            keys.append({'path':fc.data_path,'index':fc.array_index,'keys':[list(k.co) for k in fc.keyframe_points]})
    report['objects'].append({'name':o.name,'type':o.type,'location':list(o.location),'rotation':list(o.rotation_euler),'scale':list(o.scale),'dimensions':list(o.dimensions),'parent':o.parent.name if o.parent else None,'vertices':len(o.data.vertices) if o.type=='MESH' else None,'faces':len(o.data.polygons) if o.type=='MESH' else None,'modifiers':mods,'materials':[m.name for m in o.data.materials] if hasattr(o.data,'materials') else [],'action':a.name if a else None,'animation':keys})
(ROOT/'docs/asset_audit.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print('AUDIT COMPLETE',flush=True)
