# Praktikum 02 — WebGL Primitive Playground

Aplikasi WebGL2 untuk memahami hubungan vertex data, buffer, GLSL shader, attribute, shader program, dan draw call.

## Identitas

- Nama: Hajendra Herlambang
- NRP: 5025241101
- Mata kuliah: EF234504 — Grafika Komputer

## Fitur

- Tiga primitive: triangle, square, dan circle.
- Vertex color berbeda pada setiap vertex sehingga menghasilkan interpolasi warna.
- Tiga draw mode: `TRIANGLES`/`TRIANGLE_FAN`, `LINE_LOOP`, dan `POINTS`.
- Circle bergerak horizontal dan memantul secara otomatis.
- Triangle dapat dipindahkan dengan keyboard atau mouse.
- HUD menampilkan draw mode, status animasi, posisi triangle, dan posisi pointer.
- Canvas responsif terhadap perubahan ukuran viewport.

## Kontrol

| Kontrol | Aksi |
| --- | --- |
| Arrow Keys | Menggerakkan triangle secara kontinu |
| Klik canvas | Memindahkan triangle ke posisi pointer |
| `1` | Solid mode |
| `2` | Wireframe mode |
| `3` | Points mode |
| `Space` | Pause/resume animasi circle |
| `R` | Reset aplikasi |

## Alur WebGL2

1. Membuat WebGL2 context dengan `getContext("webgl2")`.
2. Menyiapkan vertex position dan vertex color.
3. Mengunggah data ke vertex buffer.
4. Menulis dan mengompilasi vertex serta fragment shader GLSL.
5. Menghubungkan shader menjadi shader program.
6. Menghubungkan buffer ke attribute `a_position` dan `a_color`.
7. Menggambar primitive menggunakan `gl.drawArrays()`.
8. Memperbarui posisi objek dan menggambar ulang melalui `requestAnimationFrame()`.

## Menjalankan aplikasi

Tidak ada dependency atau build step. Jalankan dari folder `week2`:

```bash
python3 -m http.server 8000
```

Kemudian buka <http://localhost:8000> pada browser yang mendukung WebGL2.

## Hasil pengujian

- WebGL2 context, shader compilation, dan program linking berhasil.
- Ketiga primitive tampil dengan vertex color.
- Solid, wireframe, dan points mode berhasil digunakan.
- Animasi, keyboard, mouse, reset, serta resize canvas berjalan tanpa error Console.

## Tautan

- Repository: <https://github.com/nakayesaa/ComputerGraphics>
