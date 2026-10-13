# Praktikum 05 — WebGL2 Textured & Lit Object Playground

WebGL2 scene dengan kubus 3D bertekstur menggunakan pencahayaan Phong (Ambient + Diffuse + Specular). Texture sampling via UV buffer, kontrol cahaya interaktif, dan empat challenge tambahan.

---

## Identitas

- **Nama:** Hajendra Herlambang
- **NRP:** 5025241101
- **Mata Kuliah:** EF234504 — Grafika Komputer (Praktikum 5)

---

## Deskripsi Scene

Kubus 3D dengan 36 vertex (6 sisi × 2 segitiga). Setiap vertex memiliki Position Buffer, Normal Buffer, dan UV Buffer. Pencahayaan Phong Blinn dihitung seluruhnya di fragment shader dengan posisi kamera sebagai input specular. Light marker (kubus putih kecil) bergerak mengikuti posisi cahaya.

---

## Cara Menjalankan

Tidak ada build step. Jalankan static HTTP server dari folder `week5/`:

```bash
python -m http.server 8000
```

Lalu buka `http://localhost:8000` pada browser yang mendukung WebGL2.

---

## Kontrol

| Shortcut | Aksi |
| :--- | :--- |
| `J` / `L` | Light X (kiri / kanan) |
| `I` / `K` | Light Y (atas / bawah) |
| `U` / `O` | Light Z (dekat / jauh) |
| `1` | Ambient Only |
| `2` | Diffuse Only |
| `3` | Specular Only |
| `4` | Ambient + Diffuse |
| `0` / `5` | All Components (Full Phong) |
| `F` | Toggle Filter: LINEAR / NEAREST |
| `W` | Cycle Wrap: REPEAT → CLAMP → MIRROR |
| `M` | Toggle Moving Light Orbit |
| `G` | Toggle Grayscale Shader |
| `R` | Reset semua parameter |
| Drag Mouse | Rotasi kubus |

---

## Texture & Lighting Parameter

**Texture (Procedural, generated via Canvas 2D API):**
- `Checker` — Papan catur monokrom 8×8
- `Grid` — Tech grid dengan cincin lingkaran
- `Brick` — Pola batu bata abu-abu
- `Dots` — Halftone dot matrix

**UV Scale:** 2.0 (1 tile terulang 2× per sisi → demonstrasi wrapping jelas)

**Lighting:**
- **Ambient:** `ambientStrength × lightColor`
- **Diffuse:** `max(dot(N, L), 0) × lightColor`
- **Specular (Blinn-Phong):** `pow(max(dot(N, H), 0), shininess) × lightColor`
  - `H = normalize(lightDir + viewDir)` — bergantung posisi kamera

---

## Hasil Eksperimen

### Ambient Strength

| Nilai | Pengamatan |
| :--- | :--- |
| `0.0` | Sisi gelap sepenuhnya hitam; tanpa fill light |
| `0.2` | Sisi gelap masih tampak detail textur |
| `0.5` | Scene terasa "flat", gradasi shadow berkurang |

### Shininess

| Nilai | Pengamatan |
| :--- | :--- |
| `4` | Highlight specular sangat lebar, hampir seperti diffuse |
| `32` | Highlight sedang, tampak realistis matte-metallic |
| `128` | Highlight sangat kecil dan tajam, kesan permukaan sangat licin |

### Filtering

| Mode | Pengamatan |
| :--- | :--- |
| `LINEAR` | Texture halus (bilinear interpolation), tepi kotak checker tidak jagged |
| `NEAREST` | Texture pikselasi, tepi kotak sangat tajam dan kasar saat didekatkan |

### Wrapping

| Mode | Pengamatan |
| :--- | :--- |
| `REPEAT` | Texture tile berulang di luar range [0,1]; pola terlihat menerus |
| `CLAMP_TO_EDGE` | Pixel tepi texture diregangkan; tidak ada perulangan |
| `MIRRORED_REPEAT` | Setiap tile dicerminkan; pola terasa simetris dan halus |

### Lighting Mode

| Mode | Pengamatan |
| :--- | :--- |
| `Ambient` | Warna datar merata, tidak bergantung posisi cahaya |
| `Diffuse` | Volume / bentuk 3D terlihat; highlight berubah saat cahaya bergerak |
| `Specular` | Hanya highlight putih kecil; bergantung posisi kamera |
| `All` | Kombinasi ketiganya; tampak paling realistis |

---

## Challenge yang Dikerjakan

1. **Moving Light Otomatis (Challenge: Moving light)** — Toggle `Moving` di top bar atau shortcut `M`. Cahaya mengorbit mengelilingi kubus secara sinusoidal (radius 2.4, dengan variasi Y), sehingga shadow dan highlight berubah dinamis.
2. **Multiple Textures (Challenge: Multiple textures)** — Empat texture procedural yang dapat diganti real-time via dropdown `Tex`: Checker, Tech Grid, Brick, Dots. Semuanya dibuat via Canvas 2D API tanpa file eksternal.
3. **Grayscale Shader (Challenge: Grayscale shader)** — Toggle `Mono`. Mengkonversi output warna menjadi grayscale di fragment shader menggunakan luminance: `gray = dot(color, vec3(0.299, 0.587, 0.114))`.
4. **UV Scrolling (Challenge: UV scrolling)** — Toggle `Scroll`. Offset UV diperbarui setiap frame (`+0.25/s`) sehingga texture tampak bergerak / mengalir di atas permukaan kubus.
5. **Light Position Marker (Challenge: Light position marker)** — Kubus putih kecil (unlit) dirender tepat di posisi `lightPos` sebagai visual indicator cahaya.

---

## Struktur File

```
week5/
├── index.html       # UI: top nav, HUD, bottom shortcuts
├── style.css        # Monochrome B&W theme
├── main.js          # WebGL2 core: shaders, VAO, render loop
├── math3d.js        # Matrix math: perspective, lookAt, normalMatrix
├── geometry.js      # Cube geometry (position, normal, UV) & light marker
├── texture.js       # Procedural texture generator + GL texture utils
├── screenshot.png   # Screenshot hasil render
└── README.md
```

---

## Kendala & Solusi

1. **Shadow Acne pada specular di sisi belakang kubus:** Ditangani dengan mengalikan `spec` dengan `0.0` jika `diff <= 0.0` — sisi yang tidak terkena diffuse tidak mendapat specular.
2. **Texture wrapping tidak update saat ganti mode:** `gl.generateMipmap()` harus dipanggil setiap kali parameter wrapping diubah karena WebGL2 tidak secara otomatis mengupdate mipmap setelah `texParameteri`.
3. **Light marker muncul sebagian di luar frame:** Diperbaiki dengan mendorong kamera lebih jauh (`z = 6.0`) dan memperkecil radius orbit menjadi 2.4.

---

## Screenshot

![Screenshot](./screenshot.png)

---

## Tautan

- **Live Demo:** [https://nakayesaa.github.io/ComputerGraphics/week5/](https://nakayesaa.github.io/ComputerGraphics/week5/)
- **Repository:** [https://github.com/nakayesaa/ComputerGraphics](https://github.com/nakayesaa/ComputerGraphics)
- **Video Demo:** *(tambahkan sebelum pengumpulan)*
