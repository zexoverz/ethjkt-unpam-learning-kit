# Laporan Perubahan Hari 2

## Ringkasan

File `index.html`, `main.js`, dan `style.css` pada folder `hari-2` sudah dibaca dan dirapikan. Fokus perubahan adalah membuat kode lebih aman, lebih jelas, lebih aksesibel, dan lebih jujur kepada pengguna, terutama pada bagian keranjang, modal checkout, tombol hapus, dan biaya penanganan.

## Temuan dan Perbaikan

### 1. Dependency Ikon Tidak Perlu

- Masalah: `index.html` memuat Font Awesome dari CDN hanya untuk ikon sederhana.
- Risiko: Halaman bergantung pada resource eksternal yang sebenarnya tidak wajib.
- Perbaikan: Link CDN Font Awesome dihapus, lalu tampilan keranjang diganti memakai elemen teks sederhana.

### 2. Tombol Hapus Bukan Tombol Asli

- Masalah: Tombol hapus sebelumnya menggunakan elemen ikon `<i>` yang diberi atribut `role="button"`.
- Risiko: Kurang ramah keyboard dan screen reader dibanding tombol HTML asli.
- Perbaikan: Elemen hapus diubah menjadi `<button type="button">Hapus</button>` dengan `aria-label`.

### 3. Nama ID Total Tidak Sesuai Konteks

- Masalah: Elemen total di sidebar memakai id `modal-total-price`, padahal elemen itu bukan bagian dari modal.
- Risiko: Membingungkan saat kode dibaca dan berpotensi salah selector saat dikembangkan.
- Perbaikan: Id diganti menjadi `cart-total-price`, lalu selector di `main.js` disesuaikan.

### 4. Format Uang Tidak Konsisten

- Masalah: Biaya dan total sebelumnya bisa ditampilkan sebagai angka mentah atau dengan format yang tidak seragam.
- Risiko: Pengguna sulit membaca nilai uang secara konsisten.
- Perbaikan: Tampilan biaya dan total sekarang memakai helper `money()` sehingga formatnya selalu seperti `$0.30`.

### 5. Biaya Penanganan Kurang Transparan

- Masalah: Biaya penanganan muncul di total, tetapi penjelasannya belum cukup jelas.
- Risiko: Pengguna bisa merasa ada biaya tambahan yang muncul diam-diam.
- Perbaikan: Label diubah menjadi `Biaya penanganan tetap`, lalu ditambahkan keterangan:
  `Biaya $0.30 hanya ditambahkan saat keranjang berisi untuk packing dan pemrosesan pesanan.`

### 6. Modal Checkout Kurang Lengkap Secara Aksesibilitas

- Masalah: Modal belum memiliki atribut dialog yang lengkap.
- Risiko: Screen reader tidak mendapat konteks yang cukup saat modal terbuka.
- Perbaikan: Modal diberi `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`, dan state `aria-hidden`.

### 7. Modal Tidak Bisa Ditutup Dengan Keyboard

- Masalah: Modal hanya bisa ditutup lewat tombol atau klik overlay.
- Risiko: Pengguna keyboard kurang nyaman memakai halaman.
- Perbaikan: Ditambahkan event `keydown` agar tombol `Escape` bisa menutup modal.

### 8. Input Kupon Belum Punya Label Eksplisit

- Masalah: Input kupon hanya mengandalkan placeholder.
- Risiko: Placeholder bukan pengganti label dan kurang baik untuk aksesibilitas.
- Perbaikan: Ditambahkan label tersembunyi `.sr-only` untuk input kupon.

### 9. Catatan Pengguna Perlu Batas Panjang

- Masalah: Textarea catatan tidak memiliki batas panjang.
- Risiko: Input terlalu panjang bisa mengganggu tampilan keranjang dan modal.
- Perbaikan: Ditambahkan `maxlength="200"` dan `rows="3"`.

## File yang Diubah

- `hari-2/index.html`
- `hari-2/main.js`
- `hari-2/style.css`

## Verifikasi

- Pemeriksaan sintaks JavaScript dilakukan dengan:

```bash
node --check main.js
```

- Hasil: lolos tanpa error.

## Kesimpulan

Kode sebelumnya sudah berjalan, tetapi masih ada beberapa bagian yang kurang jelas dan kurang rapi untuk pengguna maupun pembaca kode. Setelah perubahan, halaman lebih transparan soal biaya, lebih konsisten dalam format uang, lebih mudah diaudit, dan lebih ramah aksesibilitas.
