# Demo dan pengumpulan

## Urutan demonstrasi langsung di Blender (sekitar 3 menit)

1. Sebutkan identitas anggota. Buka `05_TOOLBOX_FINAL`, orbit toolbox, tunjukkan material cat, metal, karet, dan indikator cyan.
2. Pilih scene `01_BEFORE_UV`: jelaskan asset berasal dari Praktikum 9, lalu tunjukkan scale unit pada hasil persiapan.
3. Pilih `02_MARKED_SEAMS`, masuk Edit Mode dan deselect: jelaskan seam pada sudut panel, rim, underside, dan alasan memisahkan bidang besar.
4. Pilih `03_INITIAL_UNWRAP` pada workspace UV Editing. Jelaskan unwrap Angle Based dan perbedaan skala island awal.
5. Pilih `04_CHECKER_TEST`: tunjukkan checker pada badan, tutup, pengunci, dan rib. Jelaskan perbaikan melalui Apply Scale dan Average Islands Scale.
6. Kembali ke `05_TOOLBOX_FINAL`, Edit Mode, pilih semua mesh asset tanpa studio floor. Tunjukkan UV akhir, gap minimum 24.94 px, density 58.23 px/unit, serta 0 overlap dari `validation.json`.
7. Workspace Shading: pilih Body. Telusuri Base Color sRGB, Roughness/Metallic Non-Color, Normal Non-Color melalui Normal Map. Pilih Status plaque untuk emission strength 2.
8. Jelaskan empat challenge: multi-material, roughness variation, metal + paint, dan normal detail.
9. Bandingkan `06_HELMET_BEFORE` dengan `07_HELMET_PBR`. Tunjukkan node graph dan map MR asli: G roughness, B metallic. Sebutkan ctxwing/theblueturtle_ serta sumber Khronos dan lisensi di folder `sources/helmet`.
10. Akhiri dengan texture yang dipack dan path relatif, serta kesiapan lanjut Praktikum 11.

`P10_Demo_Visual.mp4` merupakan demo visual lokal berbasis screenshot editor Blender dan render, dengan caption. Untuk video live dengan suara, gunakan urutan di atas sambil merekam Blender. Unggah video ke layanan pilihan dan masukkan URL yang dapat diakses pada Classroom.

## Teks untuk Classroom

```text
Praktikum 10 — Industrial Toolbox / UV-Mapped PBR Asset

Anggota:
1. Hajendra Herlambang — 5025241101
2. Muhammad Abdul Rafi — NRP: -

Video demo: [isi URL video setelah diunggah]
Repository GitHub: https://github.com/nakayesaa/ComputerGraphics/tree/gh-pages/week10

Asset utama: pengembangan toolbox Praktikum 9.
Eksplorasi PBR: Damaged Helmet — ctxwing / theblueturtle_, sumber Khronos.
Challenge: multi-material surface, custom roughness variation,
metal + painted surface, dan normal detail.
```

URL repository di atas adalah target folder pada remote repository yang sudah dikonfigurasi. Pastikan commit folder week10 sudah dipush dan repository dapat diakses sebelum mengumpulkan. Identitas anggota kedua ditulis sesuai data yang diberikan, yaitu tanda `-` untuk NRP.
