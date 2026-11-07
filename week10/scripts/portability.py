"""Open only the .blend in a temporary folder without its textures directory."""
import bpy, json, shutil, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='p10-relocated-',dir=ROOT) as td:
    moved=Path(td)/'P10_Kelompok_Toolbox.blend'
    shutil.copy2(ROOT/'P10_Kelompok_Toolbox.blend',moved)
    bpy.ops.wm.open_mainfile(filepath=str(moved))
    rows=[]
    for im in bpy.data.images:
        if im.source!='FILE':continue
        external=Path(bpy.path.abspath(im.filepath))
        assert im.packed_file, im.name
        assert im.size[0]>0 and im.size[1]>0, im.name
        assert len(im.pixels)==im.size[0]*im.size[1]*4, im.name
        rows.append({'image':im.name,'size':list(im.size),'packed':True,
                     'external_file_exists_after_move':external.is_file() if im.filepath else False})
    report={'passed':True,'test':'Only .blend copied into temporary directory, textures/ absent',
            'image_count':len(rows),'images':rows}
    (ROOT/'docs/portability.json').write_text(json.dumps(report,indent=2))
print('PORTABILITY PASS',len(rows),'images readable without external textures/',flush=True)
