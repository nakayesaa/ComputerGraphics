"""Capture real Blender editors, including newly executed reconstruction stages."""
import bpy,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'P09_Kelompok_Toolbox.blend'))
jobs=[
 ('01_BLOCKOUT_RECONSTRUCTION','Study_Body','object',1,'01_primitive_blockout'),
 ('02_EXTRUDE_INSET_RECONSTRUCTION','Study_Body','edit',1,'02_extrude_inset'),
 ('03_LOOP_BEVEL_RECONSTRUCTION','Study_Body','edit',1,'03_loop_bevel'),
 ('04_FINAL_TOOLBOX','Front_Latches_Mirror','modifier',1,'04_modifier_mirror'),
 ('04_FINAL_TOOLBOX','Side_Ribs_Array','modifier',1,'05_modifier_array'),
 ('04_FINAL_TOOLBOX','Body','modifier',41,'06_modifier_solidify_bevel'),
 ('04_FINAL_TOOLBOX','Body','edit',41,'07_topology_cleanup'),
 ('04_FINAL_TOOLBOX','Body','normals',41,'08_face_orientation'),
 ('04_FINAL_TOOLBOX','Lid_Hinged','object',41,'09_outliner_parenting'),
 ('04_FINAL_TOOLBOX','Lid_Hinged','object',1,'10_animation_closed'),
 ('04_FINAL_TOOLBOX','Lid_Hinged','object',41,'11_animation_open'),
 ('04_FINAL_TOOLBOX','Body','render:final_closed_render',1,'12_final_closed_in_blender'),
 ('04_FINAL_TOOLBOX','Body','render:final_open_render',41,'13_final_open_in_blender'),
]
idx=0;phase=0
if '--final-open-only' in sys.argv:jobs=[j for j in jobs if j[-1]=='13_final_open_in_blender']
def override(a):
    return bpy.context.temp_override(window=bpy.context.window,area=a,region=next(r for r in a.regions if r.type=='WINDOW'))
def step():
    global idx,phase
    if idx==len(jobs):
        (ROOT/'docs/capture_complete.txt').write_text('All screenshots captured from Blender UI.\n')
        bpy.ops.wm.quit_blender();return None
    sn,prefix,mode,frame,name=jobs[idx]
    if phase==0:
        if bpy.context.object and bpy.context.object.mode!='OBJECT':bpy.ops.object.mode_set(mode='OBJECT')
        win=bpy.context.window;win.workspace=bpy.data.workspaces['Layout'];win.scene=bpy.data.scenes[sn]
        win.scene.frame_set(frame);phase=1;return 1.0
    if phase==1:
        s=bpy.context.scene
        for o in s.objects:
            if o.type in {'CAMERA','LIGHT'} or o.name.startswith('Studio_'):o.hide_set(True)
            elif sn not in {'04_FINAL_TOOLBOX','01_BLOCKOUT_RECONSTRUCTION'}:o.hide_set(not o.name.startswith(prefix))
        bpy.ops.object.select_all(action='DESELECT')
        obj=next(o for o in s.objects if o.name.startswith(prefix));obj.hide_set(False);obj.select_set(True);bpy.context.view_layer.objects.active=obj
        screen=bpy.context.window.screen;a=max(screen.areas,key=lambda a:a.width*a.height)
        if mode.startswith('render:'):
            a.type='IMAGE_EDITOR';a.spaces.active.image=bpy.data.images.load(str(ROOT/'screenshots'/(mode.split(':')[1]+'.png')),check_existing=True)
        else:
            a.type='VIEW_3D';sp=a.spaces.active;sp.shading.type='SOLID';sp.shading.color_type='MATERIAL'
            sp.overlay.show_extras=False;sp.overlay.show_face_orientation=mode=='normals'
            sp.overlay.show_relationship_lines=prefix=='Lid_Hinged'
            sp.region_3d.view_rotation=s.camera.rotation_euler.to_quaternion()
            sp.region_3d.view_location=(0,0,1.15 if frame==41 else .5);sp.region_3d.view_distance=9 if frame==41 else 7.7;sp.region_3d.view_perspective='ORTHO'
            sp.show_region_ui=prefix=='Lid_Hinged'
            if mode=='edit':
                bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='DESELECT')
                bpy.context.tool_settings.mesh_select_mode=(False,True,False)
            if mode=='normals':
                theme=bpy.context.preferences.themes[0].view_3d
                if hasattr(theme,'face_front'):theme.face_front=(.05,.18,1,.65)
                if hasattr(theme,'face_back'):theme.face_back=(1,.02,.02,.8)
        phase=2;return 2.0
    if phase==2:
        a=max(bpy.context.window.screen.areas,key=lambda a:a.width*a.height)
        for p in bpy.context.window.screen.areas:
            if p.type=='PROPERTIES':
                try:p.spaces.active.context='MODIFIER' if mode=='modifier' else 'OBJECT'
                except TypeError:pass
        if a.type=='IMAGE_EDITOR':
            with override(a):bpy.ops.image.view_all(fit_view=True)
        phase=3;return 2.0
    bpy.ops.screen.screenshot(filepath=str(ROOT/'screenshots'/(name+'.png')))
    print('CAPTURED',name,flush=True);idx+=1;phase=0;return 1.0
bpy.app.timers.register(step,first_interval=5.0)
