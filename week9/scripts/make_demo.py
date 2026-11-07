"""Create a captioned visual demo from unmodified Blender screenshots."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg, subprocess, tempfile

ROOT=Path(__file__).resolve().parents[1]
slides=[('final_closed_render', 'PRAKTIKUM 9 / HARD-SURFACE TOOLBOX', 'Hajendra Herlambang 5025241101 | Muhammad Abdul Rafi -'), ('01_primitive_blockout', '01 / PRIMITIVE DAN BLOCKOUT', 'Rekonstruksi proses: cube badan, tutup, grip, dan duplicate tiang. Scale numerik lalu Apply Scale.'), ('02_extrude_inset', '02 / INSET DAN EXTRUDE', 'Rekonstruksi dijalankan ulang: inset 0.12, extrude Z -1.82 menghasilkan rim dan rongga.'), ('03_loop_bevel', '03 / LOOP HORIZONTAL DAN BEVEL', 'Loop pada Z 0 melalui BMesh plane cut; bevel non-destruktif membulatkan tepi.'), ('04_modifier_mirror', '04 / CHALLENGE - MIRROR', 'Satu pengunci sumber dicerminkan pada X sehingga menghasilkan dua pengunci simetris.'), ('05_modifier_array', '05 / CHALLENGE - ARRAY', 'Lima rib samping melalui Array standar, constant offset pada Y, kemudian Bevel.'), ('06_modifier_solidify_bevel', '06 / CHALLENGE - SOLIDIFY', 'Body dan Lid: ketebalan sekitar 0.06, diikuti Bevel. Modifier tetap dapat diedit.'), ('07_topology_cleanup', '07 / TOPOLOGY DAN CLEANUP', '9 mesh: 0 duplicate vertex, 0 loose edge, 0 degenerate face. Seluruh scale bernilai 1.'), ('08_face_orientation', '08 / NORMAL INSPECTION', 'Biru = sisi depan, merah = belakang. Hasil modifier: 0 non-manifold edge; volume positif.'), ('09_outliner_parenting', '09 / OBJECT STRUCTURE', 'TOOLBOX terpisah dari STUDIO. Grip, tiang, dan tulisan menjadi child Lid_Hinged.'), ('10_animation_closed', '10 / ANIMASI - TERTUTUP', 'Frame 1: rotasi X tutup 0 derajat. Pivot berada pada engsel belakang.'), ('11_animation_open', '11 / ANIMASI - TERBUKA', 'Frame 41: rotasi X -90 derajat; handle mengikuti parenting. Frame 80 kembali tertutup.'), ('12_final_closed_in_blender', '12 / FINAL ASSET', 'Toolbox asli dipertahankan dan dirapikan; sumber awal disimpan di sources/.'), ('13_final_open_in_blender', '13 / SILUET TERBUKA', 'Bagian dalam, ketebalan, dan engsel diperiksa. File dibuka ulang dan tervalidasi.'), ('final_closed_render', 'SIAP UNTUK UV DAN MATERIAL', '3 challenge: Mirror, Array, Solidify. README, screenshot proses, dan file .blend tersedia.')]
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
title=ImageFont.truetype(font,35);body=ImageFont.truetype(font,21)
with tempfile.TemporaryDirectory(prefix='p09-demo-') as td:
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
        d.text((30,1005),'Demo visual berbasis screenshot Blender | Praktikum 9',font=ImageFont.truetype(font,16),fill='#8797a5')
        path=td/f'{i:02}.png';im.save(path)
        lines.extend([f"file '{path}'",'duration 6'])
    lines.append(f"file '{path}'")
    playlist=td/'slides.txt';playlist.write_text('\n'.join(lines)+'\n')
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',str(playlist),'-vf','fps=24','-c:v','libx264','-preset','fast','-tune','stillimage','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',str(ROOT/'P09_Demo_Visual.mp4')],check=True)
print('DEMO COMPLETE:',ROOT/'P09_Demo_Visual.mp4')
