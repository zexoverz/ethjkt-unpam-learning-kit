# Log Perubahan Project Gacha ETHJKT

File yang diubah:

```text
hari-1/index.html
```

Tujuan perubahan:

```text
Membuat sistem gacha berjalan dengan JavaScript tanpa library.
```

---

## Riwayat Perubahan

### 1. Menambahkan logika gacha utama

Perubahan dilakukan di bagian `<script>` pada file `hari-1/index.html`.

Yang ditambahkan:

- Object `hadiah` untuk menyimpan daftar hadiah.
- Variabel `pity`, `total`, dan `ssrCount`.
- Fungsi `pilihAcak()` untuk memilih hadiah random.
- Fungsi `rollSatu()` untuk menjalankan algoritma gacha.
- Fungsi `tampilkan()` untuk mengubah tampilan kartu dan statistik.
- Fungsi `tambahRiwayat()` untuk menampilkan riwayat hasil gacha.
- Event tombol `TARIK 1x` dan `TARIK 10x`.

Penjelasan:

```text
Awalnya file HTML hanya punya tampilan, tetapi belum punya logika.
Setelah perubahan ini, tombol gacha sudah bisa diklik dan menghasilkan hadiah random.
```

### 2. Menambahkan sistem peluang rarity

Sistem peluang dibuat dengan `Math.random()`.

Aturan peluang:

```text
SSR    : 3%
EPIC   : 7%
RARE   : 20%
COMMON : 70%
```

Penjelasan:

```text
Program membuat angka acak dari 0 sampai kurang dari 1.
Semakin kecil angka random, semakin besar kemungkinan mendapat rarity tinggi.
```

Contoh:

```js
if (acak < 0.03) {
  kelas = "ssr";
}
```

Artinya:

```text
Jika angka random kurang dari 0.03, hasilnya SSR.
0.03 sama dengan sekitar 3%.
```

### 3. Menambahkan sistem pity SSR

Sistem pity dibuat agar pemain mendapat jaminan SSR.

Aturannya:

```text
Jika pity mencapai 10, hasil berikutnya menjadi SSR.
Setelah mendapat SSR, pity kembali ke 0.
```

Penjelasan:

```text
Tanpa pity, pemain bisa saja sangat lama tidak mendapat SSR karena bergantung random.
Dengan pity, project ini memberi batas maksimal 10 tarikan untuk mendapat SSR.
```

### 4. Mengganti emoji hadiah menjadi ekspresi dan avatar

Data emoji hadiah diganti dari simbol umum menjadi emoji ekspresi/avatar.

Contoh perubahan:

```text
SSR    -> avatar raja, penyihir, wajah bintang
EPIC   -> coder, wajah keren, wajah semangat
RARE   -> nerd, senyum menang, berpikir
COMMON -> senyum biasa, gugup, datar, menangis
```

Penjelasan:

```text
Perubahan ini hanya memengaruhi tampilan hadiah.
Algoritma random, peluang rarity, dan sistem pity tidak berubah.
```

### 5. Mengganti nama hadiah agar sesuai dengan ekspresi

Nama hadiah juga disesuaikan dengan emoji yang tampil.

Contoh nama baru:

```text
Raja Blockchain
Penyihir Smart Contract
Wajah Auto Sultan
Si Paling Keren
Mikir Dulu
Nangis Karena Error
```

Penjelasan:

```text
Nama hadiah dibuat lebih cocok dengan ekspresi/avatar supaya kartu terasa lebih nyambung.
Perubahan ini hanya mengubah isi data hadiah, bukan cara kerja program.
```

### 6. Membuat file Log.md

File `Log.md` dibuat untuk mencatat perubahan dan menjelaskan kode.

Penjelasan:

```text
File ini berfungsi sebagai catatan belajar.
Isinya menjelaskan apa saja kode yang ditambahkan, fungsi tiap bagian, dan alur program.
```

### 7. Menambahkan fitur Koleksi Hadiah SSR dan RARE

Perubahan dilakukan di file `hari-1/index.html`.

Yang ditambahkan:

- Layout baru `.layout` untuk menaruh sistem gacha dan panel koleksi berdampingan.
- Container baru `<aside class="collection">` untuk menampilkan koleksi hadiah.
- Grup `SSR Collection` untuk menyimpan hadiah SSR.
- Grup `RARE Collection` untuk menyimpan hadiah RARE.
- Variabel `koleksiSSR` untuk menyimpan semua hasil SSR.
- Variabel `koleksiRare` untuk menyimpan semua hasil RARE.
- Fungsi `buatItemKoleksi()` untuk membuat tampilan item koleksi.
- Fungsi `renderKoleksi()` untuk menggambar ulang daftar koleksi.
- Fungsi `tambahKoleksi()` untuk mengecek hasil gacha dan menyimpan hanya SSR/RARE.

Penjelasan:

```text
Sebelumnya hasil gacha hanya tampil di kartu utama dan riwayat terakhir.
Sekarang, jika hasilnya SSR atau RARE, hadiah tersebut juga masuk ke panel koleksi.
Hadiah EPIC dan COMMON tidak masuk koleksi karena permintaannya hanya SSR dan RARE.
```

Alur fitur koleksi:

```text
Klik tombol gacha
-> tarikSekali()
-> rollSatu()
-> hasil didapat
-> tambahKoleksi(hasil)
-> jika SSR, masuk koleksi SSR
-> jika RARE, masuk koleksi RARE
-> jika EPIC atau COMMON, tidak masuk koleksi
```

Catatan tampilan:

```text
Pada layar besar, panel koleksi berada di samping kanan sistem gacha.
Pada layar kecil, panel koleksi otomatis turun ke bawah agar tetap rapi.
```

### 8. Menambahkan scroll internal pada koleksi

Perubahan dilakukan di file `hari-1/index.html`.

Yang ditambahkan:

- Batas tinggi `max-height` pada daftar koleksi.
- `overflow-y: auto` agar daftar koleksi bisa discroll jika item terlalu banyak.

Penjelasan:

```text
Sebelumnya, jika item koleksi terlalu banyak, panel koleksi bisa memanjang dan mengganggu layout.
Sekarang daftar koleksi punya batas tinggi dan bisa discroll.
```

### 9. Menghapus dropdown panah dan mempercantik scrollbar koleksi

Perubahan dilakukan di file `hari-1/index.html`.

Yang dihapus:

- Tombol panah pada `SSR Collection`.
- Tombol panah pada `RARE Collection`.
- Class CSS untuk mode dropdown seperti `.collection-toggle` dan `.collection-list.closed`.
- Variabel `collectionToggles`.
- Fungsi `toggleKoleksi()`.
- Event click khusus tombol dropdown.

Yang ditambahkan:

- Styling scrollbar untuk browser berbasis WebKit melalui `::-webkit-scrollbar`.
- Styling scrollbar untuk Firefox melalui `scrollbar-width` dan `scrollbar-color`.
- Warna scrollbar mengikuti tema gacha, yaitu kuning SSR dan biru RARE.

Penjelasan:

```text
Fungsi dropdown dihapus supaya panel koleksi selalu terlihat.
Scroll internal tetap dipakai agar panel tidak memanjang berlebihan.
Scrollbar dibuat lebih menarik supaya cocok dengan tema gelap, kuning SSR, dan biru RARE.
```

---

## 1. Data Hadiah

Saya menambahkan object `hadiah` untuk menyimpan daftar hadiah berdasarkan rarity:

```js
const hadiah = {
  ssr: [],
  epic: [],
  rare: [],
  common: []
};
```

Artinya:

- `ssr` berisi hadiah paling langka.
- `epic` berisi hadiah langka tingkat menengah.
- `rare` berisi hadiah yang cukup bagus.
- `common` berisi hadiah paling sering keluar.

Setiap hadiah punya format:

```js
{ n: "Nama Hadiah", e: "Emoji" }
```

Keterangan:

- `n` berarti nama hadiah.
- `e` berarti emoji yang tampil di kartu.

Contoh:

```js
{ n: "Raja Blockchain", e: "\uD83E\uDD34" }
```

---

## 2. Variabel Utama

Saya menambahkan 3 variabel penting:

```js
let pity = 0;
let total = 0;
let ssrCount = 0;
```

Fungsinya:

- `pity` menghitung berapa kali tarik sejak terakhir mendapat SSR.
- `total` menghitung total semua tarikan.
- `ssrCount` menghitung total SSR yang sudah didapat.

---

## 3. Fungsi `pilihAcak(arr)`

Fungsi ini dipakai untuk memilih satu hadiah secara acak dari sebuah array.

```js
function pilihAcak(arr) {
  const indexAcak = Math.floor(Math.random() * arr.length);
  return arr[indexAcak];
}
```

Cara kerjanya:

1. `Math.random()` membuat angka acak.
2. Angka itu dikalikan jumlah item dalam array.
3. `Math.floor()` membulatkan angka ke bawah.
4. Hasilnya dipakai sebagai index array.

Contoh sederhana:

```text
Jika array punya 4 item, maka index yang mungkin adalah 0, 1, 2, atau 3.
```

---

## 4. Fungsi `rollSatu()`

Fungsi ini adalah inti sistem gacha.

Setiap dipanggil, fungsi ini menjalankan 1 kali tarikan.

```js
function rollSatu() {
  total++;
  pity++;

  const acak = Math.random();
  let kelas;

  if (pity >= 10 || acak < 0.03) {
    kelas = "ssr";
    pity = 0;
    ssrCount++;
  } else if (acak < 0.10) {
    kelas = "epic";
  } else if (acak < 0.30) {
    kelas = "rare";
  } else {
    kelas = "common";
  }

  const item = pilihAcak(hadiah[kelas]);

  return {
    kelas: kelas,
    nama: item.n,
    emoji: item.e
  };
}
```

Alur sederhananya:

1. Total tarikan bertambah 1.
2. Pity bertambah 1.
3. Program membuat angka random dari `0` sampai kurang dari `1`.
4. Program menentukan rarity berdasarkan angka random.
5. Program memilih hadiah acak dari rarity tersebut.
6. Program mengembalikan hasil berupa `kelas`, `nama`, dan `emoji`.

Peluang rarity:

```text
SSR    : 3%
EPIC   : 7%
RARE   : 20%
COMMON : 70%
```

---

## 5. Sistem Pity SSR

Pity adalah sistem jaminan agar pemain tidak terlalu lama gagal mendapat SSR.

Di project ini:

```js
if (pity >= 10 || acak < 0.03)
```

Artinya:

- Jika `pity` sudah mencapai 10, pemain otomatis mendapat SSR.
- Jika angka random kurang dari `0.03`, pemain juga mendapat SSR.

Saat mendapat SSR:

```js
pity = 0;
ssrCount++;
```

Artinya:

- Pity di-reset kembali ke 0.
- Jumlah SSR bertambah 1.

Contoh:

```text
Tarik 1  -> COMMON, pity 1
Tarik 2  -> RARE, pity 2
Tarik 3  -> COMMON, pity 3
...
Tarik 10 -> SSR otomatis, pity reset 0
```

---

## 6. Mengambil Elemen HTML

Saya mengambil elemen-elemen HTML berdasarkan `id`.

Contoh:

```js
const card = document.getElementById("card");
const cardEmoji = document.getElementById("cardEmoji");
const totalEl = document.getElementById("total");
```

Tujuannya agar JavaScript bisa mengubah isi tampilan HTML.

Contoh:

```js
cardEmoji.textContent = hasil.emoji;
```

Kode di atas mengganti emoji yang tampil di kartu.

---

## 7. Fungsi `tampilkan(hasil)`

Fungsi ini menampilkan hasil gacha ke halaman.

```js
function tampilkan(hasil) {
  cardEmoji.textContent = hasil.emoji;
  cardName.textContent = hasil.nama;
  cardRarity.textContent = hasil.kelas.toUpperCase();

  card.className = "card";
  card.offsetWidth;
  card.className = "card " + hasil.kelas + " reveal";

  totalEl.textContent = total;
  ssrCountEl.textContent = ssrCount;

  pityText.textContent = pity + " / 10";
  pityFill.style.width = (pity / 10 * 100) + "%";
}
```

Yang dilakukan fungsi ini:

- Mengganti emoji kartu.
- Mengganti nama hadiah.
- Mengganti tulisan rarity.
- Mengubah warna kartu sesuai rarity.
- Menjalankan animasi reveal.
- Mengupdate total tarikan.
- Mengupdate jumlah SSR.
- Mengupdate teks dan bar pity.

Bagian ini:

```js
card.className = "card";
card.offsetWidth;
card.className = "card " + hasil.kelas + " reveal";
```

Dipakai untuk me-reset animasi, supaya animasi tetap berjalan setiap kali tombol ditekan.

---

## 8. Fungsi `tambahRiwayat(hasil)`

Fungsi ini menambahkan hasil gacha ke bagian riwayat.

```js
function tambahRiwayat(hasil) {
  const chip = document.createElement("div");
  chip.className = "chip " + hasil.kelas;
  chip.textContent = hasil.emoji;
  chip.title = hasil.nama + " - " + hasil.kelas.toUpperCase();

  history.prepend(chip);

  while (history.children.length > 12) {
    history.removeChild(history.lastElementChild);
  }
}
```

Yang dilakukan:

- Membuat elemen `div` baru.
- Memberi class sesuai rarity.
- Mengisi emoji hasil gacha.
- Menaruh hasil terbaru di paling depan.
- Membatasi riwayat maksimal 12 item.

---

## 9. Fungsi `tarikSekali()`

Fungsi ini menggabungkan 3 proses utama:

```js
function tarikSekali() {
  const hasil = rollSatu();
  tampilkan(hasil);
  tambahRiwayat(hasil);
  tambahKoleksi(hasil);
}
```

Artinya:

1. Jalankan random gacha.
2. Tampilkan hasil ke kartu.
3. Masukkan hasil ke riwayat.
4. Jika hasilnya SSR atau RARE, masukkan ke koleksi.

---

## 10. Fitur Koleksi SSR dan RARE

Fitur koleksi menyimpan hadiah tertentu yang berhasil didapat.

Variabel yang dipakai:

```js
let koleksiSSR = [];
let koleksiRare = [];
```

Artinya:

- `koleksiSSR` menyimpan semua hasil dengan rarity `ssr`.
- `koleksiRare` menyimpan semua hasil dengan rarity `rare`.

Fungsi utama:

```js
function tambahKoleksi(hasil) {
  if (hasil.kelas === "ssr") {
    koleksiSSR.unshift(hasil);
    renderKoleksi(koleksiSSR, ssrCollection, ssrCollectionCount, "Belum ada SSR");
  }

  if (hasil.kelas === "rare") {
    koleksiRare.unshift(hasil);
    renderKoleksi(koleksiRare, rareCollection, rareCollectionCount, "Belum ada RARE");
  }
}
```

Penjelasan:

- `hasil.kelas === "ssr"` mengecek apakah hadiah yang didapat adalah SSR.
- `hasil.kelas === "rare"` mengecek apakah hadiah yang didapat adalah RARE.
- `unshift()` memasukkan hadiah terbaru ke posisi paling atas array.
- `renderKoleksi()` memperbarui tampilan daftar koleksi di halaman.

Kenapa hanya SSR dan RARE?

```text
Karena fitur ini dibuat khusus untuk menyimpan hadiah penting.
COMMON terlalu sering keluar, sedangkan EPIC tidak diminta masuk koleksi.
```

---

## 11. Fitur Scroll Koleksi

Fitur ini dipakai agar panel koleksi tidak merusak layout saat isinya banyak.

Bagian CSS untuk scroll:

```css
.collection-list {
  max-height: 240px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #ffd24a rgba(255,255,255,0.06);
}
```

Artinya:

- Tinggi daftar koleksi dibatasi maksimal 240px.
- Jika item lebih banyak dari tinggi tersebut, daftar bisa digulir ke bawah.
- `scrollbar-width: thin` membuat scrollbar lebih ramping di Firefox.
- `scrollbar-color` memberi warna scrollbar agar sesuai tema.

Bagian CSS untuk tampilan scrollbar di Chrome/Edge:

```css
.collection-list::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg,#ffd24a,#4da6ff);
  border-radius: 999px;
  border: 2px solid #171b30;
}
```

Artinya:

```text
Scrollbar diberi warna gradasi kuning dan biru agar cocok dengan tema SSR dan RARE.
Border gelap membuat scrollbar tetap menyatu dengan background panel koleksi.
```

---

## 12. Tombol TARIK 1x

Kode:

```js
tarik1.addEventListener("click", function () {
  tarikSekali();
});
```

Artinya:

Saat tombol `TARIK 1x` diklik, program menjalankan satu kali gacha.

---

## 13. Tombol TARIK 10x

Kode:

```js
tarik10.addEventListener("click", function () {
  for (let i = 0; i < 10; i++) {
    tarikSekali();
  }
});
```

Artinya:

Saat tombol `TARIK 10x` diklik, program menjalankan gacha sebanyak 10 kali.

Loop ini:

```js
for (let i = 0; i < 10; i++)
```

Berarti:

- Mulai dari `i = 0`.
- Selama `i < 10`, jalankan kode di dalamnya.
- Setelah selesai satu putaran, `i` bertambah 1.
- Total berjalan 10 kali.

---

## Ringkasan Alur Program

Saat pengguna menekan tombol:

```text
Klik tombol
-> tarikSekali()
-> rollSatu()
-> tentukan rarity
-> pilih hadiah acak
-> tampilkan hasil
-> update statistik
-> tambah ke riwayat
-> simpan ke koleksi jika SSR atau RARE
```

---

## Catatan Belajar

Konsep JavaScript yang dipakai di project ini:

- Variable: `let`, `const`
- Object dan array
- Function
- `Math.random()`
- `if`, `else if`, `else`
- DOM selector: `document.getElementById()`
- Event listener: `addEventListener()`
- Loop: `for`
- Manipulasi HTML: `textContent`, `className`, `style.width`
- Membuat elemen baru: `document.createElement()`
- Menyimpan data sementara dengan array koleksi
- Merender ulang tampilan berdasarkan isi array
- Scroll internal dengan CSS `overflow-y: auto`
- Styling scrollbar dengan CSS `::-webkit-scrollbar`

Project ini bagus untuk latihan karena menggabungkan logika, data, tampilan, dan interaksi tombol dalam satu halaman HTML.
