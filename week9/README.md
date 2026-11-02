# Praktikum 9 — Hard-Surface Toolbox

Asset toolbox industrial yang dibuat menggunakan Blender, dengan badan biru gelap, tutup oranye, handle, pengunci depan, rib samping, kaki karet, dan detail tulisan Nakayesaa.

## Berkas

- [File Blender](P09_Kelompok_Toolbox.blend)
- [Screenshot final](screenshots/final_toolbox.png)

![Final toolbox](screenshots/final_toolbox.png)

## Workflow modeling

Primitive awal berupa cube untuk badan dan komponen toolbox. Pembentukan menggunakan Object Mode dan Edit Mode, transform G/R/S, axis constraint, input numerik, serta Apply Scale.

- Extrude dan Inset: bingkai atas serta panel recessed pada tutup.
- Loop Cut: loop horizontal pada badan.
- Bevel: pembulatan tepi badan dan komponen.
- Duplicate: tiang handle dan kaki.
- Curve: detail tulisan tangan Nakayesaa dengan material metal sebagai efek visual goresan.

## Modifier dan challenge

- Mirror pada pengunci depan: challenge symmetric prop.
- Array pada rib samping: challenge repeated detail.
- Solidify untuk ketebalan panel/badan.
- Bevel untuk pembulatan tepi.

## Animasi

Tutup menggunakan pivot di sisi belakang dan keyframe rotasi. Handle dan tulisan mengikuti tutup melalui parenting. Frame 1 dan 80 tertutup; frame 40 terbuka.

## Cleanup

Workflow mencakup Merge by Distance, recalculate normals, pemeriksaan Face Orientation, silhouette, dan organisasi komponen pada Outliner. Pemeriksaan ulang berkas final sebelum pengumpulan tetap diperlukan.

## Kendala dan solusi

- Arah Loop Cut: memilih edge tegak sebagai acuan potongan horizontal.
- Pivot tutup: menempatkan 3D Cursor pada posisi engsel dan menggunakan Origin to 3D Cursor.
- Komponen mengikuti animasi: parenting ke tutup dengan Keep Transform.
- Material Preview gelap: menggunakan pencahayaan studio preview.

## Kelengkapan pengumpulan

Versi ini berisi model tersimpan dan screenshot final. Identitas kelompok beserta nama/NRP, screenshot perkembangan workflow, dan link video demo belum ditambahkan. Nama `Kelompok` pada file perlu disesuaikan dengan identitas kelompok sebelum pengumpulan.
