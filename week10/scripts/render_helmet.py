import bpy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'P10_Kelompok_Toolbox.blend'))
for sn,name in [('06_HELMET_BEFORE','11_helmet_before'),('07_HELMET_PBR','12_helmet_pbr')]:
    s=bpy.data.scenes[sn];s.cycles.samples=24
    s.render.resolution_percentage=80
    s.render.filepath=str(ROOT/'screenshots'/(name+'.png'))
    bpy.ops.render.render(write_still=True,scene=sn)
