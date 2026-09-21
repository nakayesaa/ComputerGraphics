# Praktikum 03 — Interactive Transformation Playground

Aplikasi WebGL2 interaktif untuk mempelajari translation, rotation, scaling, dan perbedaan urutan komposisi Model Matrix 3×3 tanpa mengubah data vertex asli.

## Identitas

- Nama: Hajendra Herlambang
- NRP: 5025241101
- Mata kuliah: EF234504 — Grafika Komputer

## Fitur

- Object A dan Object B menggunakan kembali geometry serta vertex buffer yang sama.
- Object A dikontrol secara kontinu dengan state-based keyboard input dan `deltaTime`.
- Object B berotasi dan melakukan non-uniform scaling secara otomatis.
- Perbandingan `T · R · S` dan `R · T · S` ditampilkan bersamaan melalui objek aktif dan objek pembanding transparan.
- HUD menampilkan position, rotation, scale, dan transform order secara langsung.
- Sumbu X, sumbu Y, dan origin `(0, 0)` tampil pada viewport.

Fitur pilihan yang dikerjakan:

1. Reset transform dengan tombol `R`.
2. Tiga transform preset dengan tombol `1`, `2`, dan `3`.
3. Toggle transform order dengan tombol `T`.
4. Translation menggunakan mouse atau pointer dengan drag pada canvas.

## Kontrol

| Kontrol | Aksi |
| --- | --- |
| Arrow Keys | Translation Object A |
| `Q` / `E` | Rotation positif / negatif |
| `+` / `-` | Uniform scale naik / turun |
| `Z` / `X` | Scale X turun / naik |
| `C` / `V` | Scale Y turun / naik |
| `R` | Reset transform |
| `T` | Toggle `T · R · S` / `R · T · S` |
| `1` / `2` / `3` | Memilih transform preset |
| Drag pada canvas | Memindahkan Object A |

## Transform order

- `T · R · S`: scale diterapkan lebih dulu, lalu rotation, kemudian translation. Objek berotasi pada pusat lokal sebelum dipindahkan.
- `R · T · S`: scale diterapkan lebih dulu, kemudian translation, lalu rotation. Vektor translation ikut berotasi sehingga objek tampak mengorbit origin.

## Menjalankan aplikasi

Tidak ada dependency atau proses build. Jalankan local server dari folder ini:

```bash
python3 -m http.server 8000
```

Kemudian buka <http://localhost:8000> pada browser modern yang mendukung WebGL2.

## Tautan

- Repository: <https://github.com/nakayesaa/ComputerGraphics>
- Video demo: **Tambahkan link video demo di sini sebelum pengumpulan.**
