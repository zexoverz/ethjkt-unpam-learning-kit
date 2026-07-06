# Pull Feature Log

## 2026-07-06

Saya menambahkan fitur **pull / tarik gacha** di `hari-1/index.html`.

Yang sekarang bisa dilakukan:

- Tombol **TARIK 1x** melakukan satu kali random pull.
- Tombol **TARIK 10x** melakukan sepuluh kali random pull.
- Hasil terakhir muncul di kartu utama.
- Riwayat 12 hasil terakhir muncul di bawah tombol.
- Pity berjalan sampai 10 tarikan. Kalau belum dapat SSR, tarikan ke-10 pasti SSR.
- Counter total tarikan, jumlah SSR, dan progress pity ikut berubah otomatis.

Aturan rarity:

- SSR: 3% atau pasti saat pity mencapai 10.
- Epic: 7%.
- Rare: 20%.
- Common: sisanya.

Catatan kode:

- Data hadiah disimpan di object `hadiah` supaya mudah ditambah.
- Fungsi dibuat kecil-kecil supaya mudah dibaca: `rollSatu`, `tampilkan`, `tambahRiwayat`, dan `tarik`.
- Komentar hanya ditambahkan di bagian pity karena itu aturan penting di game.
