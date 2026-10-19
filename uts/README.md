# VOIDFLEET — Space Fleet Multiplier

Project UTS **EF234504 · Grafika Komputer**. Mini game 3D browser: kendalikan skuadron, lipatgandakan kapal, lewati pertahanan orbital, dan hancurkan mothership.

![VOIDFLEET main scene](docs/screenshot.png)

## Anggota kelompok

Isi identitas asli sebelum pengumpulan. Maksimal dua mahasiswa.

| Nama                         | NRP   | Kontribusi aktual             |
| ---------------------------- | ----- | ----------------------------- |
| [Nama mahasiswa 1]           | [NRP] | [Isi sesuai pekerjaan aktual] |
| [Nama mahasiswa 2, bila ada] | [NRP] | [Isi sesuai pekerjaan aktual] |

## Menjalankan

Node.js 20.19+ dan npm diperlukan.

```sh
npm install
npm run dev
```

Buka URL yang ditampilkan Vite (default http://localhost:5173). `npm run build` membuat versi produksi pada `dist/`; `npm run preview` menyajikannya secara lokal. Gunakan server HTTP, jangan buka `index.html` melalui `file://`. Font memakai sistem lokal; seluruh asset 3D tersedia di repository.

```sh
npm test
```

Memeriksa aturan multiplier, batas jumlah kapal, kehilangan seluruh armada, posisi formasi, dan perpindahan sektor.

## Objective dan gameplay

Mulai dengan **8 kapal**. Armada bergerak otomatis melalui dua sektor awal. Pilih sisi gate: cyan kiri mengalikan armada, oranye kanan menambah kapal. Maksimal 60 kapal agar render dan formasi tetap terkontrol. Hindari asteroid (−5 kapal), benturan turret (−4), dan peluru musuh (−1, atau −2 saat boss). Armada menembak turret secara otomatis; klik objek untuk damage dan fokus target. Target asteroid juga bisa dihancurkan.

Pada jarak 560 unit, mothership muncul. Kekuatan tembakan otomatis bergantung jumlah kapal. Hindari volley boss sambil mengurangi health-nya. Pulse membersihkan ancaman dalam radius 21 unit dan peluru, serta memberi damage pada boss. Cooldown 7 detik. **Menang** saat health mothership habis; **kalah** saat jumlah kapal nol. Panel akhir menampilkan hasil dan tombol deploy ulang.

## Kontrol dan interaksi

| Kontrol                                | Fungsi                                            |
| -------------------------------------- | ------------------------------------------------- |
| A / D atau ← / →                       | Bergerak horizontal                               |
| Mouse / drag sentuh di arena           | Mengarahkan armada melalui ray–plane intersection |
| Klik / tap asteroid, turret, atau boss | Raycaster memilih target dan memberikan damage    |
| Space / tombol PULSE                   | Pulse shockwave                                   |
| P / Escape / tombol Pause              | Pause / resume                                    |
| Sound OFF / ON                         | Audio sintetis opsional                           |
| Deploy again                           | Reset seluruh state misi                          |

Game otomatis pause ketika tab/window kehilangan fokus. Pada perangkat sentuh, geser pada arena dan gunakan tombol pulse. Desktop direkomendasikan untuk demo.

## Implementasi grafika dan checklist

| Requirement                               | Implementasi / lokasi                                                                  |
| ----------------------------------------- | -------------------------------------------------------------------------------------- |
| JavaScript, Three.js, HTML, CSS           | `src/main.js`, `index.html`, `src/style.css`                                           |
| Main scene, camera, renderer, environment | PerspectiveCamera, WebGLRenderer, orbital runway, procedural stars/planet/fog          |
| ≥3 jenis objek                            | Interceptor, multiplier gate, asteroid, turret, mothership                             |
| Parent–child scene graph                  | Fleet group → ship GLTF → engine; mothership → hull/wings/core; turret → top → barrel  |
| GLTF/GLB                                  | `public/assets/vanguard.gltf` dimuat dengan GLTFLoader                                 |
| PBR                                       | MeshStandardMaterial dengan metalness dan roughness pada kapal, asteroid, deck, turret |
| ≥2 lights                                 | Hemisphere, dua Directional, satu Point light                                          |
| Shadows                                   | Kapal/objek cast shadow; deck receive shadow; PCFSoftShadowMap                         |
| ≥2 animasi                                | Formasi/engine kapal, asteroid berputar, turret tracking, gate berdenyut, boss hover   |
| ≥3 interaksi                              | Steer, click target, pulse, pilihan gate, pause/restart                                |
| Raycaster                                 | Klik mesh target dan ray–plane intersection untuk steering                             |
| VFX                                       | Bloom/emissive engine & gate, laser bolts, particles, pulse shockwave                  |
| HUD dan feedback                          | Fleet count, progress, sektor, gate feedback, boss HP, cooldown, debrief               |
| Objective dan win/lose/restart            | State ready/playing/paused/won/lost pada `src/main.js`                                 |

## Struktur dan keputusan teknis

- `src/main.js`: scene, pembuatan objek, input, VFX, update game, lifecycle UI.
- `src/rules.js`: aturan angka armada, formasi, sektor; diuji tanpa browser.
- `scripts/create-ship.py`: generator kapal GLTF orisinal. Jalankan `python3 scripts/create-ship.py` untuk regenerasi asset.
- `public/assets/vanguard.gltf`: model low-poly lokal dengan embedded buffer; tidak membutuhkan texture eksternal.

Challenge utama: menyeimbangkan jumlah kapal dan performa, menyelaraskan pointer dengan perspektif kamera, dan memastikan transisi gate → boss → debrief dapat di-reset. Jumlah kapal dibatasi 60, pixel ratio maksimal 1.25, simulasi memakai langkah maksimal 1/60 detik. Laju maju 26 unit/detik dan steering 18 unit/detik; 22 asteroid dan 16 turret. Arena statis memakai InstancedMesh, shadow map 1024², bloom pixel ratio 1, dan HUD diperbarui 10 kali/detik. Bloom menggunakan Three.js addons, tanpa engine game tambahan. Peluru visual memakai hit damage saat firing untuk auto attack; collision peluru musuh dihitung di arena. Collision armada memakai pusat formasi sebagai simplifikasi arcade.

## Asset Credits

- **Vanguard interceptor, arena, gate, asteroid, turret, mothership, planet, stars, VFX, UI, game logic**: dibuat untuk project ini. Kapal GLTF berasal dari generator lokal, bukan project game atau tutorial pihak ketiga.
- **Three.js + addons**: [threejs.org](https://threejs.org/), lisensi MIT; license disertakan oleh package npm.
- **Vite**: [vite.dev](https://vite.dev/), lisensi MIT; development/build tooling.
- Audio dibuat menggunakan Web Audio oscillator; tidak ada asset audio eksternal.

Implementasi awal dibantu AI (Codex). Tim perlu meninjau, mengembangkan, dan memahami kode serta mengikuti kebijakan penggunaan AI dari dosen. Isi kontribusi sesuai pekerjaan nyata, jangan mengklaim pekerjaan yang tidak dilakukan.

## Persiapan demo dan pengumpulan

1. Isi nama/NRP dan kontribusi aktual di atas.
2. Demo launch, steering, multiplier, raycast click target, pulse, shadow, dan VFX.
3. Tunjukkan phase mothership, win/lose, serta restart; jelaskan scene graph dan material/light.
4. Semua anggota ikut menjelaskan. Rekam video, lalu masukkan link di bawah.
5. Push source, asset, dan screenshot ke GitHub, pastikan repository dapat diakses.

**Video demo:** [Isi link]

**Repository GitHub:** [ComputerGraphics / uts](https://github.com/nakayesaa/ComputerGraphics/tree/gh-pages/uts)
