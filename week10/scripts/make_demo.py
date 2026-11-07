"""Create a captioned visual demo from unmodified Blender screenshots."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg, subprocess, tempfile

ROOT=Path(__file__).resolve().parents[1]
slides=[
 ('10_final_toolbox','PRAKTIKUM 10 / INDUSTRIAL TOOLBOX','Hajendra Herlambang 5025241101  |  Muhammad Abdul Rafi -'),
 ('01_before_uv','01 / ASSET PRAKTIKUM 9','Geometry dicek, Apply Scale, normal dihitung ulang sebelum UV.'),
 ('02_marked_seams','02 / MARKED SEAMS','Seam pada sudut panel, rim, dan underside; penandaan diotomatisasi dengan bpy.'),
 ('03_initial_unwrap','03 / INITIAL UNWRAP','Angle Based Unwrap. Ukuran island antar-komponen belum disetarakan.'),
 ('04_checker_test','04 / CHECKER TEST','Average Islands Scale: checker konsisten pada badan, tutup, pengunci, dan rib.'),
 ('05_final_uv_layout','05 / FINAL UV LAYOUT','110 island | 0 overlap | 58.23 px/unit | gap minimum 24.94 px pada 1K.'),
 ('06_principled_graph','06 / PRINCIPLED BSDF','UV map -> Image Texture -> Principled BSDF. Normal melalui Normal Map node.'),
 ('07_base_color','07 / BASE COLOR','sRGB. Cat biru merupakan non-metal; scuff kecil menampakkan substrat metal.'),
 ('07_roughness','08 / ROUGHNESS','Non-Color. Variasi butiran dan guratan mengubah ketajaman highlight.'),
 ('07_metallic','09 / METALLIC','Non-Color. Nilai 0 untuk cat/karet; nilai 1 untuk metal dan scuff terbuka.'),
 ('08_normal_map','10 / NORMAL DETAIL','Non-Color -> Normal Map (Tangent) -> Principled Normal; strength 0.28.'),
 ('09_emission_mask','11 / EMISSION','Map emission berpola pada status plaque cyan, strength 2.'),
 ('14_final_material_in_blender','12 / FINAL MATERIAL','Challenge: multi-material, roughness variation, metal + paint, dan normal detail.'),
 ('15_helmet_before_in_blender','13 / EKSPLORASI - SEBELUM','Damaged Helmet: material abu-abu tanpa texture, geometry dan studio tetap sama.'),
 ('13_helmet_node_graph','14 / EKSPLORASI - NODE GRAPH','Base Color sRGB; MR: G=Roughness, B=Metallic. Normal Non-Color; AO dan Emission.'),
 ('16_helmet_after_in_blender','15 / EKSPLORASI - SESUDAH','Sumber Khronos. ctxwing (CC BY 4.0), versi awal theblueturtle_ (CC BY-NC 4.0).'),
 ('10_final_toolbox','SIAP UNTUK PRAKTIKUM 11','Texture dipack di .blend dan tersedia pada textures/. README memuat hasil validasi.'),
]
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
title=ImageFont.truetype(font,35);body=ImageFont.truetype(font,21)
with tempfile.TemporaryDirectory(prefix='p10-demo-') as td:
    td=Path(td);lines=[]
    for i,(name,heading,caption) in enumerate(slides):
        src=ROOT/'screenshots'/(name+'.png')
        if not src.exists():raise FileNotFoundError(src)
        im=Image.new('RGB',(1600,1040),'#101820');d=ImageDraw.Draw(im)
        d.text((30,21),heading,font=title,fill='#fafafa')
        d.rectangle((30,77,1570,80),fill='#f08c30')
        shot=Image.open(src).convert('RGB');shot.thumbnail((1540,850))
        im.paste(shot,((1600-shot.width)//2,95+(850-shot.height)//2))
        d.text((30,970),caption,font=body,fill='#dce8ef')
        d.text((30,1005),'Demo visual berbasis screenshot Blender | Praktikum 10',font=ImageFont.truetype(font,16),fill='#8797a5')
        path=td/f'{i:02}.png';im.save(path)
        lines.extend([f"file '{path}'",'duration 6'])
    lines.append(f"file '{path}'")
    playlist=td/'slides.txt';playlist.write_text('\n'.join(lines)+'\n')
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',str(playlist),'-vf','fps=24','-c:v','libx264','-preset','fast','-tune','stillimage','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',str(ROOT/'P10_Demo_Visual.mp4')],check=True)
print('DEMO COMPLETE:',ROOT/'P10_Demo_Visual.mp4')
