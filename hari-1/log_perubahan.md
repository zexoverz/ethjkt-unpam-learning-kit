# Log Perubahan Hari-1

Nama: Syahrul Efendi

## Ringkasan

File awal `hari-1/index.html` hanya berisi tampilan HTML/CSS dan komentar TODO untuk logic gacha. Perubahan utama yang dilakukan adalah menyelesaikan logic JavaScript, mengganti data hadiah dari emoji statis menjadi data Digimon dari API, menambahkan preload gambar, skeleton loading, animasi gacha, dan reveal kartu dengan modal.

## Perubahan Utama

1. Menyelesaikan logic gacha:
   - Menambahkan object `hadiah` untuk rarity `ssr`, `epic`, `rare`, dan `common`.
   - Menambahkan state `pity`, `total`, dan `ssrCount`.
   - Menambahkan fungsi `pilihAcak()`, `rollSatu()`, `tampilkan()`, dan `tambahRiwayat()`.
   - Menyambungkan tombol `TARIK 1x` dan `TARIK 10x`.

2. Menggunakan Digimon API:
   - Endpoint: `https://digimon-api.vercel.app/api/digimon`
   - Data yang dipakai: `name`, `img`, dan `level`.
   - API hanya dipanggil satu kali saat halaman dibuka.

3. Mapping rarity dari level Digimon:
   - `Mega` / `Ultimate` -> `SSR`
   - `Champion` / `Armor` -> `EPIC`
   - `Rookie` -> `RARE`
   - `In Training`, `Fresh`, dan lainnya -> `COMMON`

4. Optimasi gambar:
   - Gambar tidak langsung dimuat saat hasil gacha muncul.
   - Setelah data API diterima, app memilih maksimal 12 kandidat per rarity.
   - Semua gambar kandidat dipreload lebih dulu menggunakan object `Image()`.
   - Tombol tarik baru aktif setelah preload selesai.
   - Jika API gagal, app memakai fallback data lokal.

5. Skeleton loading:
   - Saat API dan preload masih berjalan, card utama tampil sebagai skeleton.
   - Tombol `TARIK 1x` dan `TARIK 10x` disabled dan tampil dalam state loading.
   - Setelah siap, card menampilkan teks `Coba keberuntungan kamu`.

6. Animasi gacha:
   - Saat tombol tarik ditekan, card utama masuk state `charging`.
   - Ditambahkan animasi shake ringan dan efek cahaya menyapu sebelum hasil muncul.

7. Reveal kartu model modal:
   - Hasil gacha tidak lagi langsung muncul di card utama.
   - Hasil muncul sebagai modal/overlay di tengah layar.
   - Kartu hasil dibuat lebih besar dan bergaya trading card:
     - Bagian atas untuk gambar Digimon.
     - Bagian bawah untuk nama dan rarity.
   - Reveal memakai animasi flip ke depan.

8. Flow `TARIK 10x`:
   - Tidak menampilkan semua hasil sekaligus.
   - Hasil ditampilkan satu per satu.
   - Tombol modal berubah menjadi `Lanjut` sampai kartu ke-10.
   - Pada kartu terakhir, tombol berubah menjadi `Selesai`.
   - Counter progress ditampilkan dalam format `1 / 10`, `2 / 10`, dan seterusnya.
   - Stats, pity, SSR count, dan riwayat update saat masing-masing kartu direveal.

## Teknik yang Dipakai

- `fetch()` untuk mengambil data dari Digimon API.
- `async/await` untuk mengatur proses load data dan preload gambar.
- `new Image()` untuk preload gambar sebelum tombol gacha aktif.
- `classList` dan `className` untuk mengatur state UI: loading, idle, charging, reveal.
- `offsetWidth` untuk reset animasi CSS agar efek flip bisa berjalan ulang setiap kartu baru.
- `setTimeout` berbasis Promise untuk memberi jeda animasi sebelum reveal.
- DOM manipulation untuk update card, modal, stats, pity bar, dan riwayat.

## File yang Diubah

- `hari-1/index.html`

## File yang Ditambahkan

- `log_perubahan.md`
