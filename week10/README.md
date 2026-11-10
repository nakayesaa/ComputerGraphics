# Praktikum 10 — Blender Materials, UV & Texturing

Hajendra Herlambang — 5025241101

Muhammad Abdul Rafi — NRP: -

Praktikum ini mengembangkan toolbox Praktikum 9 dengan penentuan seam, UV unwrap, checker test, penyamaan texel density, dan packing tanpa overlap. Material PBR menggunakan Principled BSDF dengan Base Color, Roughness, Metallic, Normal Map, dan Emission serta color space yang sesuai. Challenge meliputi multi-material, variasi roughness, metal dan cat, serta normal detail. Eksplorasi PBR memakai [Damaged Helmet dari Khronos](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/DamagedHelmet) dengan [atribusi dan lisensi terlampir](textures/helmet/LICENSE.md). File Blender, texture, dan screenshot proses tersedia di folder ini.

Untuk demo gabungan, buka [file Blender](P10_Kelompok_Toolbox.blend) dan pilih scene `00_DEMO_COMBINED`. Scene ini sudah aktif saat file dibuka; tekan F12 untuk render ulang.

**1. Asset sebelum UV**

Toolbox Praktikum 9 digunakan sebagai dasar. Geometry, scale, dan normal diperiksa sebelum unwrap.

![Asset sebelum UV](screenshots/01_before_uv.png)

**2. Penentuan seam**

Seam ditempatkan pada sudut panel, rim, dan bagian bawah untuk memisahkan bidang yang akan dibentangkan.

![Marked seams](screenshots/02_marked_seams.png)

**3. Unwrap awal**

Mesh dibentangkan menjadi UV island untuk badan, tutup, pengunci, handle, rib, dan kaki.

![Unwrap awal](screenshots/03_initial_unwrap.png)

**4. Checker test**

Checker dipakai untuk melihat stretching dan perbedaan ukuran tekstur. Skala island disetarakan agar ukuran checker konsisten.

![Checker test](screenshots/04_checker_test.png)

**5. UV layout akhir**

Island dipacking tanpa overlap. Texel density sekitar 58,23 px/unit dan jarak minimum antar-island sekitar 24,94 px pada texture 1K.

![UV layout akhir](screenshots/05_final_uv_layout.png)

**6. Node material PBR**

Base Color, Roughness, Metallic, Normal, dan Emission dihubungkan ke Principled BSDF. Base Color memakai sRGB; Roughness, Metallic, dan Normal memakai Non-Color.

![Principled BSDF node graph](screenshots/06_principled_graph.png)

**7. Base Color**

Map warna memberi warna cat dan scuff pada permukaan toolbox.

![Base Color](screenshots/07_base_color.png)

**8. Roughness**

Variasi roughness mengatur perbedaan kilap pada permukaan cat, metal, dan karet.

![Roughness](screenshots/07_roughness.png)

**9. Metallic**

Map Metallic membedakan cat dan karet sebagai non-metal dari bagian metal yang terekspos.

![Metallic](screenshots/07_metallic.png)

**10. Normal Map**

Texture normal dihubungkan melalui Normal Map node untuk menambah detail permukaan tanpa mengubah siluet.

![Normal Map](screenshots/08_normal_map.png)

**11. Emission**

Mask emission memberi aksen cyan pada indikator depan toolbox.

![Emission mask](screenshots/09_emission_mask.png)

**12. Hasil akhir toolbox**

Material cat, metal, karet, dan emission diperiksa pada hasil render. Challenge yang dikerjakan adalah multi-material, variasi roughness, metal dan cat, serta normal detail. Texture dipack di dalam file Blender agar tetap terbaca saat dipindahkan.

![Toolbox PBR final](screenshots/10_final_toolbox.png)

**13. Eksplorasi PBR — sebelum material**

Damaged Helmet ditampilkan dengan material polos sebagai pembanding.

![Helmet sebelum PBR](screenshots/11_helmet_before.png)

**14. Eksplorasi PBR — node material**

Map Base Color, Roughness, Metallic, Normal, Emission, dan AO dihubungkan ke material. Roughness diambil dari kanal G dan Metallic dari kanal B pada map gabungan asli.

![Node graph Helmet](screenshots/13_helmet_node_graph.png)

**15. Eksplorasi PBR — hasil akhir**

Setelah map diterapkan, warna, kilap metal, detail kerusakan, dan emission terlihat pada model dengan geometry yang sama.

![Helmet setelah PBR](screenshots/12_helmet_pbr.png)

**16. Scene gabungan untuk demo**

Toolbox dan helmet digabung dalam scene `00_DEMO_COMBINED`, dengan toolbox di kiri dan helmet di atas pedestal di kanan. Ground dan alas display menyatukan komposisi. Scene ini langsung aktif saat [file Blender](P10_Kelompok_Toolbox.blend) dibuka.

![Scene gabungan di Blender](screenshots/18_combined_scene_blender.png)

**17. Lighting**

Empat Area Light digunakan sebagai key, fill, rim hangat, dan edge dingin untuk memperjelas bentuk, bayangan, serta perbedaan material kedua model.

![Lighting scene gabungan](screenshots/20_combined_lighting.png)

**18. Camera**

Kamera perspektif 55 mm diarahkan ke tengah kedua model. Aperture f/10 menjaga keduanya tetap jelas dalam komposisi.

![Pengaturan kamera](screenshots/19_combined_camera.png)

**19. Render gabungan**

Hasil akhir dirender menggunakan Cycles, 128 samples, dan denoising pada resolusi 1920 × 1280. Kedua model menggunakan lighting dan kamera yang sama, dengan seluruh texture tetap dipack di file Blender. Tekan F12 untuk render ulang.

![Render final scene gabungan](screenshots/17_combined_scene_final.png)
