# Log Hari 2 — Pasar Pagi (Security Review & Bug Bounty)

Peninjauan mendalam, eksploitasi, perbaikan, dan dokumentasi celah keamanan serta isu etika bisnis pada aplikasi simulasi fruit store "Pasar Pagi".

---

## 🚀 Pembaruan Hari 2: Security Review & Bug Bounty (Completed)

Hari ini kita melakukan audit keamanan penuh pada aplikasi Pasar Pagi, mendokumentasikan 8 celah/bug, dan memperbaiki seluruh temuan tersebut langsung pada akar masalah untuk menghasilkan aplikasi belanja yang aman, tangguh, dan etis.

### 🌟 Ringkasan Perbaikan
1. **Pencegahan Input Kuantitas NaN**: Menambahkan validasi `Number.isInteger()` dan pengecekan NaN pada event listener input kuantitas untuk menolak input kosong/huruf/desimal secara aman.
2. **Penegakan Stok Nyata & Batas Atas**: Mengganti stok palsu acak dengan properti stok riil pada katalog produk. Memastikan kuantitas manual dibatasi maksimal sesuai sisa stok produk fisik yang tersedia.
3. **Format Presisi Uang Konsisten**: Menyatukan semua rendering total desimal belanja menggunakan metode `.toFixed(2)` untuk menghilangkan artefak galat floating-point.
4. **Pencegahan Manipulasi Harga DOM**: Menghapus atribut `data-price` dari elemen HTML tombol tambah. Harga produk dibaca langsung dari data katalog internal berdasarkan ID produk resmi.
5. **Pencegahan Stored XSS**: Mengubah renderer catatan pembeli di sidebar keranjang dari `innerHTML` menjadi `textContent` untuk menetralkan input skrip berbahaya.
6. **Hardening Kupon Klien**: Menghapus plaintext kupon `"TEMANFARMER"` dari source code klien, menggantinya dengan verifikasi hash SHA-256 klien satu arah.
7. **Kejujuran Bisnis & Transparansi Biaya**: Menampilkan rincian lengkap biaya (Subtotal, Biaya penanganan operasional, Diskon, Total) sejak awal di sidebar secara transparan untuk mencegah drip pricing.

---

### 📂 Berkas yang Dimodifikasi
* **[main.js](file:///C:/Users/Dika%20Rahmat%20Fadillah/OneDrive/Kuliah/Adelya%20Revalina/ethjkt-unpam-learning-kit/hari-2/main.js)**: Rekayasa ulang seluruh mesin keranjang belanja, penegakan validasi, validasi kupon menggunakan hash SHA-256, penghapusan atribut `data-price`, perubahan rendering catatan pembeli ke `textContent`, perbaikan taktik stok acak ke stok riil, serta implementasi rincian biaya terpusat.
* **[index.html](file:///C:/Users/Dika%20Rahmat%20Fadillah/OneDrive/Kuliah/Adelya%20Revalina/ethjkt-unpam-learning-kit/hari-2/index.html)**: Penyesuaian layout sidebar untuk mengakomodasi baris rincian breakdown biaya yang dinamis, penyesuaian markup, dan perbaikan penargetan ID elemen DOM.
* **[style.css](file:///C:/Users/Dika%20Rahmat%20Fadillah/OneDrive/Kuliah/Adelya%20Revalina/ethjkt-unpam-learning-kit/hari-2/style.css)**: Penyesuaian style untuk rincian breakdown harga di sidebar dan modal agar konsisten secara visual.
* **[LAPORAN-TEMUAN.md](file:///C:/Users/Dika%20Rahmat%20Fadillah/OneDrive/Kuliah/Adelya%20Revalina/ethjkt-unpam-learning-kit/hari-2/LAPORAN-TEMUAN.md)**: Pembuatan dokumen laporan audit temuan celah keamanan lengkap dengan kategori, tingkat keparahan, langkah reproduksi, akar masalah, dan rekomendasi perbaikan.
* **[HASIL-PERBAIKAN.md](file:///C:/Users/Dika%20Rahmat%20Fadillah/OneDrive/Kuliah/Adelya%20Revalina/ethjkt-unpam-learning-kit/hari-2/HASIL-PERBAIKAN.md)**: Pembuatan dokumen ringkasan hasil perbaikan, file-file yang diubah, perbandingan sebelum vs sesudah, serta checklist pengujian verifikasi akhir.

---

### 🧪 Pengujian yang Dilakukan (Testing Performed)
* **Validasi Input Kuantitas**: Mengetik karakter kosong, huruf, desimal, dan nilai negatif pada kolom kuantitas belanjaan. Seluruh input tidak valid dibatalkan dan nilai kuantitas valid terakhir tetap aman dipertahankan.
* **Verifikasi XSS**: Memasukkan payload `<img src=x onerror="alert(1)">` pada kolom catatan pembeli. Input berhasil dirender secara aman sebagai string teks literal tanpa mengeksekusi skrip alert.
* **Pengujian Manipulasi Harga**: Mengubah data harga di console browser dan memastikan harga item belanjaan di keranjang tetap tersinkronisasi secara konsisten dengan harga katalog resmi.
* **Verifikasi Otentikasi Kupon**: Memasukkan kupon salah ditolak dengan pesan kesalahan, sedangkan kupon yang benar (`TEMANFARMER`) berhasil di-hash menggunakan SHA-256 dan mengaktifkan diskon 90% secara tepat.
