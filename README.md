# 📦 Bendahara Barang Hilang (Lose & Found)

Aplikasi web sederhana untuk **bendahara** mencatat barang yang hilang, menemukannya kembali (Lost & Found), mencatat denda yang dibayar, serta memilih dan memantau hukuman. Dilengkapi grafik seberapa sering barang hilang per orang.

Data disimpan langsung di browser (localStorage) — tanpa server, tanpa database, bisa langsung dipakai secara offline.

## ✨ Fitur

- **📊 Dashboard** — statistik singkat (total barang, masih hilang, ditemukan, total denda), grafik frekuensi barang hilang per orang, grafik kategori, dan laporan terbaru.
- **🗂 Barang Hilang** — catat/edit/hapus laporan barang hilang (pemilik, barang, kategori, tanggal, lokasi, perkiraan harga, hukuman, deskripsi), pencarian, dan filter status.
- **🔍 Lost & Found** — cari barang yang masih hilang, lihat barang yang sudah ditemukan menunggu diambil, dan riwayat yang sudah diserahkan ke pemilik.
- **💰 Denda & Hukuman** — catat denda yang dibayar (dengan total otomatis), pilih hukuman untuk setiap kasus, tandai hukuman selesai/belum, dan kelola daftar pilihan hukuman sesuai kebutuhan.
- **📈 Grafik** — frekuensi barang hilang per orang, distribusi per kategori, dan denda terkumpul per bulan.
- **💾 Backup & Restore** — unduh data sebagai file JSON dan pulihkan kembali kapan saja.

## 🗃 Struktur File

| File          | Fungsi                                    |
|---------------|-------------------------------------------|
| `index.html`  | Struktur halaman (tab, form, tabel, modal) |
| `styles.css`  | Tampilan & tata letak                     |
| `app.js`      | Logika aplikasi, data, grafik             |
| `README.md`   | Dokumentasi ini                           |

## 🚀 Cara Menjalankan

1. Buka file `index.html` dengan browser apa saja (cukup klik dua kali), atau
2. Jalankan server statis sederhana (opsional):

   ```bash
   python -m http.server 8080
   ```
   lalu buka `http://localhost:8080`.

## 🧑🏽‍💻 Alur Kerja

1. **Catat** barang hilang pada tab *Barang Hilang*.
2. Jika barang **ditemukan**, tandai pada *Lost & Found* (masuk daftar menunggu diambil).
3. **Serahkan** barang ke pemilik setelah diambil.
4. Untuk kasus yang berakhir denda, catat **denda yang dibayar** dan pilih **hukuman** pada tab *Denda & Hukuman*, lalu tandai hukuman saat sudah selesai.
5. Pantau pola kehilangan lewat **grafik** di Dashboard & tab Grafik.

## 🛡 Catatan Data

Data tersimpan di **localStorage browser** oleh karena itu hanya tersedia di perangkat/browser yang sama. Gunakan tombol **Backup Data (JSON)** di bawah halaman untuk menyimpan cadangan dan **Pulihkan Data** jika pindah perangkat.