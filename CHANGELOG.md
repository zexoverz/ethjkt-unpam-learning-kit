# Log Perubahan

## Pull feature gacha

- Tombol `PULL 1x` dan `PULL 10x` sekarang sudah jalan.
- Setiap pull memilih hadiah secara acak dari rarity `COMMON`, `RARE`, `EPIC`, atau `SSR`.
- Sistem pity dibuat supaya SSR pasti keluar maksimal setiap 10 pull.
- Hasil pull terakhir ditampilkan di panel kecil, jadi pull 10x bisa dilihat semua hasilnya.
- Riwayat pull terakhir tetap disimpan maksimal 12 item supaya tampilan tidak terlalu penuh.

## Pokemon gacha

- Gacha sekarang berubah menjadi mesin pull Pokemon.
- Data Pokemon diambil langsung dari PokeAPI saat tombol `PULL` ditekan.
- Gambar memakai sprite resmi dari PokeAPI, dengan fallback supaya tidak langsung rusak kalau satu jenis sprite kosong.
- Rarity tetap ada: `COMMON`, `RARE`, `EPIC`, dan `SSR`.
- Pity tetap jalan: kalau belum dapat SSR, pull ke-10 dipaksa menjadi SSR.
