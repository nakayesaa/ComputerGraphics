# Praktikum 06 — Mini 3D Scene dengan Three.js (Monochrome Edition)

Aplikasi interactive 3D scene berbasis **Three.js** dan **Vite** dengan tema estetika **Monochrome (Black & White)**. Proyek ini menerapkan konsep scene graph, ragam geometry 3D, variasi material (PBR & Non-PBR), transformasi 3D, multi-source lighting, dynamic soft shadows, animation loop dengan delta time, responsive viewport rendering, top navigation bar terpadu yang ringkas, serta implementasi **seluruh 8 challenge** praktikum.

---

## 👥 Identitas Pengembang

- **Nama:** Hajendra Herlambang
- **NRP:** 5025241101
- **Kelas / Mata Kuliah:** EF234504 — Grafika Komputer (Praktikum 6)
- **Departemen:** Teknik Informatika, Fakultas FTEIC, Institut Teknologi Sepuluh Nopember

---

## 🏛️ Judul dan Deskripsi Scene

**Judul Scene:** *Monochrome Minimalist 3D Plaza*

**Deskripsi:**
Scene ini merepresentasikan studio pameran 3D interaktif berlatar belakang hitam murni (`#050505`) dengan pencahayaan monokromatis dan kabut atmosferik halus (`FogExp2`). Di atas lantai studio dan podium silinder, terdapat serangkaian objek geometris dengan ragam material Three.js dalam gradasi monokrom (silver, deep black, platinum white, slate gray, faceted graphite, dan cel-shaded white). 

Objek-objek ini memiliki animasi mengambang harmonik (*bobbing*) dan berputar (*continuous rotation*), bayangan lembut (*soft shadows*) yang bereaksi terhadap pergerakan rotasi matahari (*DirectionalLight orbit*), serta lampu aksen titik (*orbiting PointLight*). Seluruh kontrol navigasi telah disederhanakan dan diintegrasikan ke dalam **Top Navigation Bar**, menghilangkan panel samping yang padat sehingga kanvas 3D tampil bersih, luas, dan fokus.

---

## 📐 Daftar Geometry, Material, dan Light

### 1. Geometry yang Digunakan
Sesuai syarat minimal dan pengerjaan **Challenge Tambah Geometry**:

| Objek | Tipe Geometry Three.js | Parameter / Dimensi | Deskripsi |
| :--- | :--- | :--- | :--- |
| **Ground** | `PlaneGeometry(32, 32, 32, 32)` | 32×32 unit | Lantai studio hitam matte penerima bayangan |
| **Podium Disk** | `CylinderGeometry(5.2, 5.5, 0.25, 48)` | Radius 5.2/5.5, Tinggi 0.25 | Podium bertingkat panggung tengah |
| **Center Sphere** | `SphereGeometry(1.15, 64, 48)` | Radius 1.15, 64 segments | Bola krom mengkilap di tengah panggung |
| **Cube Box** | `BoxGeometry(1.6, 1.6, 1.6)` | 1.6×1.6×1.6 unit | Kubus hitam pekat dengan pantulan spekular |
| **Torus Knot** *(Challenge)* | `TorusKnotGeometry(0.75, 0.25, 128, 32)` | Radius 0.75, Tube 0.25 | Simpul platinum clearcoat reflektif tinggi |
| **Cylinder Column** *(Challenge)* | `CylinderGeometry(0.7, 0.7, 1.8, 36)` | Radius 0.7, Tinggi 1.8 | Pilar silinder abu-abu matte |
| **Cone Spire** *(Challenge)* | `ConeGeometry(0.9, 1.8, 32)` | Radius 0.9, Tinggi 1.8 | Kerucut putih bergaya kartun *cel-shaded* |
| **Dodecahedron** *(Challenge)* | `DodecahedronGeometry(0.95, 0)` | Radius 0.95, 12 sisi | Polihedron grafit faceted bergradasi |

### 2. Material yang Digunakan
Sesuai syarat dan pengerjaan **Challenge Material Gallery**:

| Material | Digunakan Pada | Karakteristik Visual Monokrom | Reaksi Terhadap Cahaya |
| :--- | :--- | :--- | :--- |
| `MeshStandardMaterial` | Ground, Podium, Sphere, Dodecahedron | PBR (*Physically Based Rendering*), roughness & metalness | Ya (Diffuse + PBR Specular) |
| `MeshPhysicalMaterial` | Torus Knot | Tingkat lanjut PBR dengan lapisan *clearcoat* platinum | Ya (Reflektif tinggi) |
| `MeshPhongMaterial` | Cube Box | Refleksi spekular putih mengkilap di atas bodi hitam | Ya (Specular highlight tajam) |
| `MeshLambertMaterial` | Cylinder Column | Refleksi diffuse matematis abu-abu slate tanpa specular | Ya (Kasar/matte alami) |
| `MeshToonMaterial` | Cone Spire | Gradasi kontras kartun monokrom (*cel-shaded*) | Ya (Step-based shading) |
| `MeshNormalMaterial` | Opsi Galeri Material | Warna vektor normal permukaan objek | Tidak terpengaruh cahaya luar |
| `MeshBasicMaterial` | Indikator Sun & Point Light | Putih solid unlit murni tanpa shading | Tidak (Independen) |

> 💡 **Material Gallery:** Setiap objek yang dipilih dapat diganti tipe materialnya langsung melalui dropdown **Mat** di Top Navigation Bar.

### 3. Lighting (Pencahayaan)

1. **AmbientLight:**
   - Warna: `#ffffff`
   - Intensitas default: `0.55`
   - Fungsi: Memberikan pencahayaan dasar merata ke seluruh sudut scene agar bayangan tetap memiliki detail.
2. **DirectionalLight (Matahari / Key Light):**
   - Warna: `#ffffff` (putih murni)
   - Intensitas default: `2.6`
   - Posisi default: `(8, 10, 6)`, Target: `(0, 1, 0)`
   - Fungsi: Sumber cahaya utama yang menghasilkan bayangan dinamis tajam dan lembut.
3. **PointLight (Accent Light):**
   - Warna: `#ffffff`
   - Intensitas: `3.5`, Distance: `18`, Decay: `1.5`
   - Posisi: Mengorbit melingkar pada ketinggian 2.5–3.3 unit dengan mesh bohlam putih menyala.

---

## 🌑 Konfigurasi Shadow (Bayangan)

- **Renderer Shadow Map:**
  - `renderer.shadowMap.enabled = true`
  - Algoritma: `THREE.PCFSoftShadowMap` (menghasilkan tepi bayangan halus realistis tanpa gerigi).
- **DirectionalLight Shadows:**
  - `directionalLight.castShadow = true`
  - Resolusi Shadow Map: Default `2048 × 2048` (dapat dipilih: 512, 1024, 2048, atau 4096).
  - Shadow Camera Frustum: Orthographic bounded box (`left: -9`, `right: 9`, `top: 9`, `bottom: -9`, `near: 0.5`, `far: 32`).
  - Bias Tuning: `shadow.bias = -0.0003` dan `shadow.normalBias = 0.02` (mencegah *shadow acne* dan *peter panning*).
- **Casting & Receiving Objects:**
  - `castShadow = true`: Seluruh mesh objek (Sphere, Box, Torus Knot, Cylinder, Cone, Dodecahedron, dan Podium).
  - `receiveShadow = true`: Lantai (`Ground Plane`), Podium, dan seluruh objek interaktif.

---

## 🎬 Animasi

Animasi dijalankan menggunakan loop `requestAnimationFrame(animate)` dengan delta time dari `THREE.Clock`:

1. **Continuous Rotation:**
   - Objek berputar kontinu mengelilingi sumbu Y: `obj.rotation.y += speed * delta`.
2. **Harmonic Floating (Bobbing):**
   - Posisi vertikal objek berosilasi secara halus menggunakan fungsi sinus: `obj.position.y = baseY + Math.sin(time * speed) * height`.
3. **Orbiting Sun (Light Animation):**
   - Posisi `DirectionalLight` mengitari panggung pada radius 10 unit secara otomatis:
     \(x = \cos(\text{time} \times 0.45) \times 10\)
     \(z = \sin(\text{time} \times 0.45) \times 10\)
   - Pergerakan ini menghasilkan pergeseran bayangan dinamis di lantai hitam.
4. **Orbiting Point Light:**
   - Lampu aksen putih mengorbit pada radius 4.2 unit dengan osilasi ketinggian sinusoidal.

---

## 🏆 Challenge yang Dikerjakan (Semua 8 Challenge)

Proyek ini mengimplementasikan **seluruh 8 challenge** secara lengkap:

1. **Tambah 2 Geometry (Bahkan +4 Geometry):**
   - Ditambahkan `TorusKnotGeometry`, `CylinderGeometry`, `ConeGeometry`, dan `DodecahedronGeometry`. Total ada 7 bentuk 3D unik.
2. **Material Gallery:**
   - Galeri material monokrom interaktif langsung dari Top Bar (Standard, Physical, Phong, Lambert, Toon, Normal, Basic).
3. **OrthographicCamera:**
   - Tombol toggle dan shortcut <kbd>C</kbd> untuk berpindah antara `PerspectiveCamera` dan `OrthographicCamera`, disertai dropdown preset sudut pandang (*Default*, *Top*, *Front*, *Side*).
4. **Light Animation:**
   - Animasi orbit matahari (`DirectionalLight`) otomatis yang dapat dinyalakan/dimatikan melalui tombol **Sun Orbit** di Top Bar atau shortcut keyboard <kbd>L</kbd>.
5. **Shadow Quality:**
   - Dropdown pengatur resolusi shadow map langsung di Top Bar (512, 1024, 2048, 4096).
6. **Scene Information:**
   - Indikator ringkas di Top Bar menampilkan FPS real-time dan total mesh aktif, serta indikator objek yang sedang dipilih di Bottom Bar.
7. **Toggle Animation:**
   - Tombol **Pause / Play** di Top Bar dan shortcut <kbd>Space</kbd> untuk menghentikan / melanjutkan seluruh animasi.
8. **Object Control:**
   - **Raycasting:** Klik langsung objek pada canvas 3D untuk memilihnya (ditandai dengan cincin seleksi putih di lantai).
   - **Keyboard Control:**
     - <kbd>W</kbd> / <kbd>S</kbd>: Geser objek sepanjang sumbu Z.
     - <kbd>A</kbd> / <kbd>D</kbd>: Geser objek sepanjang sumbu X.
     - <kbd>Q</kbd> / <kbd>E</kbd>: Naik / turunkan objek sepanjang sumbu Y.
     - <kbd>R</kbd>: Reset transformasi objek kembali ke posisi awal.
   - **Dropdown Selector & Reset:** Memilih target objek dan tombol **Reset** langsung di Top Bar.

---

## 🎮 Kontrol Navigasi & Shortcut Keyboard

| Kontrol | Perangkat | Deskripsi |
| :--- | :--- | :--- |
| **Orbit Kamera** | Mouse Klik Kiri + Drag | Memutar sudut pandang kamera mengelilingi pusat scene |
| **Pan Kamera** | Mouse Klik Kanan + Drag | Menggeser posisi pandangan kamera |
| **Zoom Kamera** | Scroll Wheel Mouse | Memperbesar / memperkecil tampilan |
| **Pilih Objek** | Mouse Klik Kiri Objek | Menyeleksi objek di viewport menggunakan Raycaster |
| <kbd>Space</kbd> | Keyboard / Top Bar | Toggle Play / Pause seluruh animasi |
| <kbd>C</kbd> | Keyboard / Top Bar | Toggle kamera antara Perspective dan Orthographic |
| <kbd>L</kbd> | Keyboard / Top Bar | Toggle animasi orbit matahari (Directional Light) |
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> | Keyboard | Menggerakkan objek terpilih di bidang horizontal (X & Z) |
| <kbd>Q</kbd> <kbd>E</kbd> | Keyboard | Menggerakkan objek terpilih naik/turun (sumbu Y) |
| <kbd>R</kbd> | Keyboard / Top Bar | Mereset transformasi objek terpilih |

---

## 🚀 Cara Menjalankan Project

### Prasyarat
- [Node.js](https://nodejs.org/) (versi 18+) dan `npm`.

### Langkah Menjalankan:
1. Masuk ke folder `week6`:
   ```bash
   cd week6
   ```
2. Pasang dependencies:
   ```bash
   npm install
   ```
3. Jalankan server lokal:
   ```bash
   npm run dev
   ```
4. Buka tautan lokal pada browser:
   ```
   http://localhost:5173
   ```

---

## 🛠️ Catatan Debugging Singkat

1. **Shadow Acne & Peter Panning pada Mesh:**
   - *Solusi:* Menerapkan kombinasi `shadow.bias = -0.0003` dan `shadow.normalBias = 0.02`. Properti `normalBias` meratakan bias di sepanjang vektor normal kurva tanpa membuat bayangan terlepas dari objek.
2. **Kesesuaian Rasio Orthographic Camera:**
   - *Solusi:* Batas frustum dihitung proporsional `(-frustumSize * aspect / 2)` pada lebar dan disinkronkan saat `onWindowResize()` sehingga bentuk objek tidak terdistorsi saat berganti kamera.
3. **Raycaster Anti-Conflict dengan OrbitControls Drag:**
   - *Solusi:* Mencegah salah klik objek saat memutar kamera dengan memverifikasi pointer holding time (`pointerDownTime < 150ms`).
4. **Pembersihan Alokasi Material Saat Diganti:**
   - *Solusi:* Memanggil `selectedObject.material.dispose()` sebelum memasang instance material baru dari galeri agar VRAM tetap bersih.

---

## 📸 Screenshot Hasil & Video Demo

- **Screenshot:** Tersedia pada berkas `screenshot.png` di folder ini (atau tekan tombol **Capture** di Top Bar).
- **Link Live Demo (GitHub Pages):** [https://nakayesaa.github.io/ComputerGraphics/week6/](https://nakayesaa.github.io/ComputerGraphics/week6/)
- **Link Video Demo:** *(Tambahkan tautan video demo sebelum pengumpulan)*
- **Link Repository GitHub:** [https://github.com/nakayesaa/ComputerGraphics](https://github.com/nakayesaa/ComputerGraphics)
