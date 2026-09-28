# Praktikum 04 — Rotating 3D Cube Camera Playground

Aplikasi WebGL2 untuk mengeksplorasi Model, View, dan Projection Matrix melalui tiga cube 3D yang berputar.

## Identitas

- Nama: Hajendra Herlambang
- NRP: 5025241101
- Mata kuliah: EF234504 — Grafika Komputer

## Fitur utama

- Cube berwarna per sisi menggunakan 36 vertex dengan posisi `vec3`.
- Model Matrix 4×4 untuk rotasi otomatis setiap cube.
- Kamera `position`, `target`, dan `up` dengan View Matrix `lookAt`.
- Perspective dan orthographic projection dengan aspect ratio responsif.
- FOV slider, preset FOV, tiga preset near/far plane, dan depth test ON/OFF.
- HUD real-time dan reset seluruh state.
- Depth buffer dibersihkan pada setiap frame.

## Challenge yang dibuat

1. **Orbit camera:** tombol `O` untuk orbit otomatis serta `Q`/`E` untuk orbit manual.
2. **Kontrol tinggi kamera:** Arrow Up/Down mengubah posisi Y kamera.
3. **Kontrol target kamera:** `I`, `J`, `K`, `L` menggeser target kamera.
4. **Split view dua proyeksi:** tombol `V` menampilkan perspective dan orthographic berdampingan.
5. **Tiga cube pada depth berbeda:** cube berada pada tiga nilai Z berbeda.
6. **Preset FOV:** tombol UI untuk 35°, 60°, dan 90°.

## Kontrol

| Kontrol | Aksi |
| --- | --- |
| Arrow Left / Right | Kamera X |
| Arrow Up / Down | Kamera Y |
| `W` / `S` | Kamera Z |
| `P` | Ganti perspective / orthographic |
| `[` / `]` | Kurangi / tambah FOV |
| `N` | Ganti preset near/far |
| `D` | Depth test ON/OFF |
| `R` | Reset seluruh state |
| `O` | Auto orbit ON/OFF |
| `Q` / `E` | Orbit manual |
| `I` `J` `K` `L` | Geser target kamera |
| `V` | Split view ON/OFF |

## Projection dan preset

- Perspective memakai FOV aktif dan aspect ratio viewport.
- Orthographic mempertahankan proporsi berdasarkan aspect ratio viewport.
- Preset FOV: **35°**, **60°**, dan **90°**.
- Preset clipping plane: **0.1/100**, **2.5/30**, dan **6/12**.

## Menjalankan aplikasi

Tidak ada dependency atau build step. Dari folder `week4`, jalankan:

```bash
python3 -m http.server 8000
```

Kemudian buka <http://localhost:8000> pada browser yang mendukung WebGL2.

## Hasil pengujian

- Shader WebGL2 berhasil dikompilasi dan program berhasil di-link.
- Kamera bergerak kontinu dengan state-based keyboard input.
- Projection, FOV, clipping preset, depth test, orbit, target, dan split view memperbarui HUD.
- Resize canvas mempertahankan aspect ratio projection.
- Console tidak menunjukkan error pada penggunaan normal.

## Tautan

- Repository: <https://github.com/nakayesaa/ComputerGraphics>
- Video demo: **Tambahkan link video demo sebelum pengumpulan.**
