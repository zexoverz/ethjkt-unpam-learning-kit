# LOG.md — Gacha ETHJKT × PokeAPI

> Catatan belajar. Baca ini dulu sebelum lihat kode. Ditulis: 2026-07-06.

---

## 1. Apa itu PokeAPI?

**PokeAPI** adalah REST API publik berisi data Pokémon lengkap (dari game/Game Freak).
Gratis, tanpa API key, cukup `fetch()` dari browser.

- **Base URL:** `https://pokeapi.co/api/v2`
- **Format:** JSON
- **Rate limit:** ~100 request/menit (halus). Untuk app kecil gak masalah.
- **Caching:** tiap URL di-cache selamanya (resource gak pernah berubah),
  janya aman disimpan di `localStorage` biar gak request ulang.
- **Tidak butuh key, login, atau header khusus.** Tinggal GET.

Sumber resmi: https://pokeapi.co/docs/v2

---

## 2. Endpoint yang kita pakai

| Endpoint | Contoh | Untuk apa |
|---|---|---|
| `/pokemon/{id-atau-nama}` | `/pokemon/ditto` | Data inti: sprite, tipe, stats, berat, tinggi, ability, cry |
| `/pokemon-species/{id}` | `/pokemon-species/132` | Flavor text (deskripsi), genus, warna, legendary/mythical, evolution-chain URL |
| `/evolution-chain/{id}` | `/evolution-chain/66` | Rantai evolusi (mis. Pikachu → Raichu) |

### Kunci utama: endpoint `/pokemon/{id}`

Ada **1025 Pokémon** (id 1–1025). Kita bisa roll id acak di rentang itu.

Field penting dari response (diverifikasi via `ditto`):

```
id                 -> 132            (nomor dex)
name               -> "ditto"
height             -> 3              (dalam decimeter → 0.3 m)
weight             -> 40             (dalam hectogram → 4.0 kg)
base_experience    -> 101
types[]            -> [{ type: { name: "normal" } }]
stats[]            -> [{ base_stat: 48, stat: { name: "hp" } }, ...]
                     (hp, attack, defense, special-attack, special-defense, speed)
abilities[]        -> [{ ability: { name: "limber" }, is_hidden: false }, ...]
sprites.other."official-artwork".front_default  -> URL gambar HD
sprites.front_default                            -> URL gambar pixel kecil
cries.latest / cries.legacy                      -> URL suara .ogg
```

### Pendukung: endpoint `/pokemon-species/{id}`

```
genera[]           -> [{ genus: "Transform Pokémon", language: { name: "en" } }]
flavor_text_entries[] -> deskripsi singkat (ada banyak bahasa, kita ambil "en")
color.name          -> "purple"     (bisa dipakai buat tema warna kartu)
is_legendary / is_mythical -> true/false   (bisa jadi penanda rarity!)
evolution_chain.url -> URL ke rantai evolusi
capture_rate, habitat, egg_groups -> info tambahan
```

---

## 3. Ide gabungin ke gacha

Sekarang web gacha kita pakai emoji + nama statis (Drago Emas 🐉, dll).
Ganti dengan **Pokémon asli** — tiap roll ngambil Pokémon acak dari API.

### Pemetaan rarity Pokémon → kelas gacha

Rarity lama (ssr/epic/rare/common) kita petakan ke sifat Pokémon:

| Kelas gacha | Syarat Pokémon | Contoh |
|---|---|---|
| **SSR**  | `is_legendary` ATAU `is_mythical` = true | Mewtwo, Mew, Rayquaza |
| **EPIC** | `base_experience` tinggi (≥ 200) ATAU evolution terakhir | Charizard, Garchomp |
| **RARE** | `base_experience` menengah (100–199) | Pikachu, Eevee |
| **COMMON** | sisanya (base_experience < 100) | Pidgey, Rattata, Ditto |

> Keuntungan: rarity sekarang **bermakna** — Pokémon langka = langka di gacha,
> bukan cuma angka random. Pity 10-tarikan tetap berlaku (jaminan SSR).

### Yang ditampilkan di kartu (sebagai pengganti emoji/nama lama)
- **Gambar** resmi Pokémon (`official-artwork`) menggantikan emoji.
- **Nama** + **#id** (mis. "Ditto #132").
- **Tipe** (normal, fire, water, …) → bisa atur warna border sesuai tipe.
- **Stats** (HP/ATK/DEF/…) sebagai bar kecil di bawah kartu.
- **Cry** (suara) — tombol play, atau bunyi otomatis pas dapat SSR. 🔊
- **Flavor text** (deskripsi) muncul di kartu.

### Tantangan teknis (penting buat belajar)
1. **Async:** `fetch()` mengembalikan Promise. Roll harus `await` data dulu
   sebelum tampilkan kartu. Tombol harus di-disable saat loading biar gak dobel-request.
2. **Caching:** simpan data per id di `localStorage` (`pokeapi:132`).
   Penghematan request + tetap jalan saat offline (selama sudah pernah diroll).
3. **Dua request per Pokémon** kalau mau flavor text + rarity:
   `/pokemon/{id}` + `/pokemon-species/{id}`. Pakai `Promise.all` biar paralel.
4. **Error handling:** id bisa 404 (jarang, tapi mungkin). Bungkus `try/catch`,
   kalau gagal → roll id lain.
5. **Rate limit:** untuk TARIK 10x, jangan tembak 20 request sekaligus (10 pokemon
   × 2 endpoint). Bisa batch kecil atau cache agresif. Untuk belajar, 10x masih aman.

---

## 4. Rencana implementasi (checkpoint)

Mirip gaya checkpoint di `index.html` — satu langkah demi satu langkah:

- **CP-A — Fetch dasar**
  Fungsi `ambilPokemon(id)` → `fetch` `/pokemon/{id}`, balikin object bersih
  `{ id, name, types, stats, sprite, cry }`. Tes di console dengan id 132.

- **CP-B — Rarity dari data asli**
  Fungsi `hitungRarity(pokemon, species)` → balikin "ssr"|"epic"|"rare"|"common"
  sesuai tabel di atas. Ganti logika random lama.

- **CP-C — Cache localStorage**
  Simpan & ambil dari `localStorage` supaya gak request ulang.

- **CP-D — Tampilkan Pokémon**
  Ganti emoji jadi `<img>` sprite. Tampilkan nama, id, tipe, stats bar.
  Pertahankan kelas `card <rarity> reveal` + animasi yang sudah ada.

- **CP-E — Suara & flavor text**
  Tombol play cry. Tampilkan flavor text (dari species). Bunyi otomatis saat SSR.

- **CP-F — Tombol 10x**
  TARIK 10x → roll 10 Pokémon, tampilkan grid 10 kartu + semua masuk riwayat.

- **CP-G — Poles**
  Warna border sesuai tipe (fire=merah, water=biru, …). Loading spinner.
  Disabled state tombol saat fetching.

---

## 5. Cara ngetes API sendiri (buat belajar)

Buka DevTools (F12) → Console, jalankan:

```js
// ambil 1 pokemon
const r = await fetch("https://pokeapi.co/api/v2/pokemon/25").then(r=>r.json());
console.log(r.name, r.sprites.other["official-artwork"].front_default);

// ambil species buat flavor text + legendary
const s = await fetch("https://pokeapi.co/api/v2/pokemon-species/25").then(r=>r.json());
console.log(s.is_legendary, s.genera.find(g=>g.language.name==="en").genus);
```

Ganti `25` (Pikachu) jadi id lain (1–1025) atau nama (`pikachu`, `mewtwo`, dst).

---

## 6. Status

- [x] Dokumentasi dibaca & dipahami
- [x] LOG.md ditulis
- [x] Implementasi CP-A s/d CP-G — selesai (2026-07-06)

### Yang sudah diimplementasi
- **CP-A** `ambilPokemon(id)` — `Promise.all` fetch `/pokemon/{id}` + `/pokemon-species/{id}`, balikin object bersih.
- **CP-B** `hitungRarity(poke)` — legendary/mythical→SSR, baseExp≥200→epic, ≥100→rare, else common.
- **CP-C** localStorage cache (`pokeapi:{id}`) + in-memory `Map`, jadi gak request ulang.
- **CP-D** kartu besar: official-artwork sprite, nama + #dex, type badges (warna per tipe), 6 stat bars animasi, flavor text.
- **CP-E** cry `.ogg` (tombol 🔊 + auto bunyi saat dapat SSR).
- **CP-F** TARIK 10x → grid 5×2 mini-card dengan stagger animasi.
- **CP-G** loading spinner + tombol disabled saat fetch; chip riwayat pake sprite mini.

### Catatan teknis
- Pity guarantee: tiap 10 tarikan = SSR. Karena SSR butuh legendary/mythical
  (jarang), `rollSatu` retry sampai 8x; kalau gak dapet, ambil rarity tertinggi yang kepegang.
- Rate limit diakalin dengan cache: Pokémon yang pernah diroll gak difetch ulang.
- `fetch` di browser = CORS enabled (PokeAPI izinin), jadi file `index.html` bisa dibuka langsung via `file://`.

### Cara coba
1. Buka `index.html` di browser (klik dobel, atau live server).
2. Buka DevTools → Network: lihat request ke `pokeapi.co` pas roll pertama; roll kedua Pokémon sama = gak ada request (cache).
3. TARIK 1x → kartu besar muncul + stats bar isi. TARIK 10x → grid 10 mini + kartu besar.
4. Klik 🔊 untuk dengar cry. Dapat SSR (legendary) → cry otomatis + animasi shake/glow.
