# 🎮 Discord Quest Assistant & Auto-Completer

[![JavaScript](https://img.shields.io/badge/Language-JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Discord](https://img.shields.io/badge/Discord-Client-5865F2?logo=discord&logoColor=white)](https://discord.com)

Tool otomatisasi dan asisten Discord Quests modern dengan antarmuka **Floating Glassmorphism UI**, sistem filtering cerdas, deteksi hadiah (Orbs, Avatar Decoration/Border, In-Game Items), serta spoofing aman langsung dari Developer Console Discord.

---

## ✨ Fitur Utama

- 🎨 **Floating Discord Dark Theme UI**: Antarmuka melayang yang responsif, bisa di-drag & drop, di-minimize, dan dilengkapi dengan console log mini.
- ⚡ **100% Otomatisasi Quest**:
  - 🎬 **Watch Video**: Mempercepat durasi video hanya dalam beberapa detik.
  - 🎮 **Play Game on Desktop**: Menyelesaikan quest game PC (15 menit) tanpa perlu mendownload atau menginstall gamenya.
  - 📺 **Stream on Desktop**: Menyelesaikan quest streaming layar ke teman secara otomatis.
- 🔍 **Sistem Filter & Live Search**:
  - **Live Search**: Cari quest berdasarkan nama game atau hadiah secara instan.
  - **Filter Status**: Tampilkan semua, hanya yang belum selesai (aktif), atau yang sudah selesai.
  - **Filter Metode**: Pisahkan antara quest **⚡ 100% Otomatis** dan **🎮 Mini-Game / Activity**.
  - **Filter Hadiah**: Filter khusus untuk **🔮 Orbs**, **🖼️ Avatar Border / Frame**, **🎮 In-Game Item**, atau **✨ Nitro**.
- 🏷️ **Deteksi Hadiah Otomatis**: Setiap kartu quest dilengkapi badge berwarna yang menunjukkan jumlah Orbs (misal: 700 Orbs), Avatar Decoration, Skin/Item game, atau hadiah lainnya.
- 🧩 **Arsitektur Modular**: Kode sumber tersusun rapi dalam folder `src/` dengan bundler mandiri tanpa dependensi eksternal (`npm run build`).

---

## 🚀 Panduan Instalasi & Penggunaan (Tutorial)

Kamu tidak perlu menginstall aplikasi tambahan apa pun di komputermu, cukup gunakan **Discord Desktop** resmi.

### Langkah 1: Buka Developer Console Discord
1. Buka aplikasi **Discord Desktop** di komputermu.
2. Tekan kombinasi tombol pada keyboard:
   - **Windows**: `Ctrl + Shift + I`
   - **Mac**: `Cmd + Option + I`
3. Jendela **DevTools** akan terbuka di sebelah kanan atau bawah. Klik pada tab **Console**.

> [!NOTE]
> Jika ini pertama kalinya kamu membuka Console Discord, Discord mungkin menampilkan peringatan `"Hold Up!"`. Ketikkan kata:
> ```text
> allow pasting
> ```
> lalu tekan **Enter** agar Discord mengizinkan kamu menempelkan (paste) script.

### Langkah 2: Salin & Jalankan Script
1. Buka file **[`skip_quest_dc.js`](skip_quest_dc.js)** di repository ini.
2. Salin (**Copy**) seluruh isi kode di dalam file tersebut.
3. Kembali ke Console Discord, tempel (**Paste**) kodenya di baris input paling bawah.
4. Tekan **Enter**.

### Langkah 3: Gunakan Quest Assistant
1. Jendela melayang **Quest Assistant** akan langsung muncul di pojok kanan atas Discord kamu.
2. Kamu bisa:
   - Menggunakan **Search Bar** untuk mencari quest tertentu.
   - Memilih filter hadiah (misal: hanya ingin melihat quest yang berhadiah **Orbs** atau **Border**).
   - Mengklik tombol **"▶ Selesaikan Otomatis"** untuk langsung memproses seluruh quest yang bertipe otomatis secara berurutan.
   - Atau mengklik tombol **"Start"** pada masing-masing kartu quest yang ingin kamu kerjakan satu per satu.

---

## 🕹️ Mengenai Quest Tipe Mini-Game / Activity (Contoh: Forgotten Island)

Sebagian quest terbaru di Discord bertipe **`ACHIEVEMENT_IN_ACTIVITY`** (seperti *Forgotten Island* mencari 5 bracelet charms):
1. Quest ini ditandai dengan badge **🎮 Mini-Game** di UI.
2. Masuklah ke salah satu **Voice Channel** (bisa di server pribadimu sendiri).
3. Klik tombol **Launch** pada quest tersebut di Discord dan klik **Authorize** pada pop-up Discord yang muncul.
4. Mainkan game singkatnya di Voice Channel selama 1–2 menit untuk menyelesaikan objektif.
5. Asisten akan otomatis mendeteksi item/charm yang kamu peroleh secara realtime (`1/5 ... 5/5`) dan menandainya selesai!

---

## 🛠️ Struktur Proyek (Source Code)

Proyek ini dibangun secara modular dan rapi agar mudah dikembangkan dan dimaintain:

```text
c:/DC/
├── dist/
│   └── skip_quest_dc.bundle.js   # Hasil bundle produksi
├── src/
│   ├── core/
│   │   ├── state.js              # State global & cleanup lifecycle
│   │   ├── stores.js             # Resolver internal store Discord (Quests, RunningGame, Flux, dll.)
│   │   └── webpack.js            # Extractor modul webpack dengan proteksi i18n
│   ├── tasks/
│   │   ├── activityTask.js       # Handler quest Activity & Achievement
│   │   ├── desktopPlayTask.js    # Handler spoofing game PC
│   │   ├── desktopStreamTask.js  # Handler spoofing stream layar
│   │   ├── taskRunner.js         # Pipeline antrean eksekusi quest
│   │   └── videoTask.js          # Handler spoofing video timestamp
│   ├── ui/
│   │   ├── dragDrop.js           # Kontrol drag & drop jendela melayang
│   │   ├── overlay.js            # Render UI, kartu quest, filter & search
│   │   └── styles.js             # CSS stylesheet tema Discord Dark
│   ├── utils/
│   │   └── parser.js             # Parser data quest & detektor hadiah
│   └── index.js                  # Entry point utama
├── build.js                      # Bundler zero-dependency
├── package.json
├── skip_quest_dc.js              # File single bundle siap pakai di Console
└── README.md
```

---

## 🔨 Membangun Ulang dari Source (Build)

Jika kamu melakukan modifikasi pada kode di folder `src/`, kamu dapat mem-bundle ulang dengan perintah:

```bash
# Menggunakan npm
npm run build

# Atau langsung menggunakan Node.js
node build.js
```

Bundler akan secara otomatis menggabungkan seluruh modul menjadi file single bundle di `skip_quest_dc.js` dan `dist/skip_quest_dc.bundle.js`.

---

## ⚖️ Disclaimer & Ketentuan

> [!WARNING]
> Tool ini dibuat untuk tujuan edukasi dan mempermudah eksplorasi fitur Discord Quests API. Penggunaan script otomatisasi pada client Discord merupakan pelanggaran terhadap Discord Terms of Service (ToS). Penulis tidak bertanggung jawab atas segala konsekuensi atau tindakan yang diambil oleh Discord terhadap akun Anda. Gunakan secara bijak dan bertanggung jawab.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi [MIT](LICENSE).
