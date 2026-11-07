"""Foreground Blender screenshots, using actual editors and saved process scenes."""
import bpy,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'P10_Kelompok_Toolbox.blend'))
jobs=[('uv','01_BEFORE_UV','01_before_uv'),('seam','02_MARKED_SEAMS','02_marked_seams'),
      ('uv','03_INITIAL_UNWRAP','03_initial_unwrap'),('checker','04_CHECKER_TEST','04_checker_test'),
      ('uv','05_TOOLBOX_FINAL','05_final_uv_layout'),('nodes','05_TOOLBOX_FINAL','06_principled_graph'),
      ('map:BaseColor','05_TOOLBOX_FINAL','07_base_color'),('map:Roughness','05_TOOLBOX_FINAL','07_roughness'),
      ('map:Metallic','05_TOOLBOX_FINAL','07_metallic'),('map:Normal','05_TOOLBOX_FINAL','08_normal_map'),
      ('map:Emission','05_TOOLBOX_FINAL','09_emission_mask'),('helmet_nodes','07_HELMET_PBR','13_helmet_node_graph'),
      ('render:10_final_toolbox','05_TOOLBOX_FINAL','14_final_material_in_blender'),
      ('render:11_helmet_before','06_HELMET_BEFORE','15_helmet_before_in_blender'),
      ('render:12_helmet_pbr','07_HELMET_PBR','16_helmet_after_in_blender')]
idx=0;phase=0
if '--nodes-only' in sys.argv:
    jobs=[j for j in jobs if j[0] in {'nodes','helmet_nodes'}]

def override(area):
    return bpy.context.temp_override(window=bpy.context.window,area=area,region=next(r for r in area.regions if r.type=='WINDOW'))

def step():
    global idx,phase
    if idx>=len(jobs):
        (ROOT/'docs/capture_complete.txt').write_text('Captured actual Blender UI screenshots.\n')
        bpy.ops.wm.quit_blender();return None
    typ,sn,name=jobs[idx]
    if phase==0:
        if bpy.context.object and bpy.context.object.mode!='OBJECT':bpy.ops.object.mode_set(mode='OBJECT')
        win=bpy.context.window
        win.workspace=bpy.data.workspaces.get('UV Editing' if typ in {'uv','seam','checker'} else 'Layout') or win.workspace
        win.scene=bpy.data.scenes[sn]
        phase=1
        return 1.0
    if phase==1:
        win=bpy.context.window
        bpy.ops.object.select_all(action='DESELECT')
        candidates=[o for o in win.scene.objects if o.type=='MESH' and not o.name.startswith('Studio')]
        obj=next((o for o in candidates if o.name.split('.')[0]=='Body'),candidates[0])
        obj.select_set(True);bpy.context.view_layer.objects.active=obj
        screen=win.screen
        if typ in {'uv','seam','checker'}:
            for o in candidates:o.select_set(True)
            bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='DESELECT' if typ=='seam' else 'SELECT')
            for a in screen.areas:
                if a.type=='VIEW_3D':
                    r=a.spaces.active.region_3d
                    r.view_rotation=win.scene.camera.rotation_euler.to_quaternion()
                    r.view_location=(0,0,.25);r.view_distance=7;r.view_perspective='ORTHO'
                    a.spaces.active.shading.type='MATERIAL' if typ=='checker' else 'SOLID'
                    a.spaces.active.overlay.show_extras=False
                elif a.type=='IMAGE_EDITOR':
                    a.spaces.active.image=bpy.data.images.get('UV_Checker_2048') if typ=='checker' else None
                    with override(a):
                        try:bpy.ops.image.view_all(fit_view=True)
                        except RuntimeError:pass
        else:
            a=max(screen.areas,key=lambda a:a.width*a.height)
            if typ in {'nodes','helmet_nodes'}:
                a.type='NODE_EDITOR';a.ui_type='ShaderNodeTree';a.spaces.active.shader_type='OBJECT'
                a.spaces.active.show_region_ui=False
                with override(a):
                    bpy.ops.node.select_all(action='SELECT');bpy.ops.node.view_all()
            else:
                a.type='IMAGE_EDITOR'
                if typ.startswith('map:'):
                    key=typ.split(':')[1];prefix='Status' if key=='Emission' else 'Navy'
                    a.spaces.active.image=bpy.data.images[prefix+'_'+key]
                else:
                    a.spaces.active.image=bpy.data.images.load(str(ROOT/'screenshots'/(typ.split(':')[1]+'.png')),check_existing=True)
                with override(a):bpy.ops.image.view_all(fit_view=True)
        phase=2;return 10.0 if typ=='checker' else 3.0
    if phase==2:
        a=max(bpy.context.window.screen.areas,key=lambda a:a.width*a.height)
        if typ in {'nodes','helmet_nodes'}:
            with override(a):bpy.ops.node.view_all()
        phase=3;return 3.0
    bpy.ops.screen.screenshot(filepath=str(ROOT/'screenshots'/(name+'.png')))
    print('CAPTURED',name,flush=True)
    idx+=1;phase=0;return 1.0

bpy.app.timers.register(step,first_interval=5.0)
