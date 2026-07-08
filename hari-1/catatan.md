# 📓 Catatan Project — Gacha ETHJKT

> Tanggal: 6 Juli 2026
> Stack: HTML + CSS + Vanilla JavaScript
> API: PokeAPI (https://pokeapi.co/api/v2/) + Pokemon.com CDN

---

## 📁 Struktur Project

```
GASIN/
├── index.html    ← satu-satunya file (HTML + CSS + JS jadi satu)
└── catatan.md    ← file ini
```

---

## 🎯 Tujuan Project

Gacha simulator bertema Pokémon. User bisa "menarik" kartu secara acak
dengan sistem rarity dan pity, mirip gacha game modern (Genshin, dll).

---

## ✅ Checkpoint yang Dikerjakan

### Checkpoint 1 — Data & Fungsi Acak
- Definisi `pokemonIds` berisi 40 ID Pokémon, dibagi 4 tier rarity
- Object `hadiah` diisi setelah fetch API selesai
- Variabel state: `pity`, `total`, `ssrCount`
- Fungsi `pilihAcak(arr)` → return 1 item random dari array

### Checkpoint 2 — Logika Tarikan
- Fungsi `rollSatu()` → increment `total` & `pity` tiap tarik
- Logika probabilitas:

  | Kondisi                      | Rarity    | Chance                   |
  |------------------------------|-----------|--------------------------|
  | `pity >= 10` OR `rand < 0.03`| ⭐ SSR    | ~3% + pity guarantee     |
  | `rand < 0.10`                | 💜 EPIC   | ~7%                      |
  | `rand < 0.30`                | 💙 RARE   | ~20%                     |
  | selain itu                   | ⬜ COMMON | ~70%                     |

- Saat SSR: `pity` reset ke 0, `ssrCount` +1

### Checkpoint 3 — Tampilkan + Animasi
- Fungsi `tampilkan(hasil)` → update card UI
- **Reflow trick** untuk reset animasi CSS:
  ```js
  card.className = 'card';
  void card.offsetWidth; // paksa browser recalculate
  card.className = `card ${kelas} reveal`;
  ```
- Update: `#total`, `#ssrCount`, `#pityText`, `#pityFill` (width %)
- Animasi per rarity:
  - Common/Rare/Epic: `pop` (scale 0.5 → 1.08 → 1)
  - SSR: `pop` + `shake` + `glowpulse` (berkedip emas)

### Checkpoint 4 — Riwayat + Tombol
- Fungsi `tambahRiwayat(hasil)` → chip mini di bagian bawah
- Chip disisipkan di **depan** list (terbaru di kiri)
- Maksimal **12 chip** ditampilkan (lama dihapus otomatis)
- **TARIK 1x** → roll 1, tampilkan
- **TARIK 10x** → roll 10, tampilkan yang **rarity tertinggi** di kartu utama, semua 10 masuk history

---

## 🌐 Integrasi PokeAPI

### Endpoint yang Dipakai
```
GET https://pokeapi.co/api/v2/pokemon/{id}
```

### Data yang Diambil
| Field          | Digunakan untuk                    |
|----------------|------------------------------------|
| `data.name`    | Nama Pokémon (di-capitalize)       |
| `data.stats[]` | Base stats: HP, ATK, DEF, SPD      |

### Image CDN
```
https://assets.pokemon.com/assets/cms2/img/pokedex/full/{id_3digit}.png
```
Contoh: `150.png` → Mewtwo HD

> ⚠️ JANGAN pakai `raw.githubusercontent.com` untuk gambar — kena rate limit 429!

---

## 🖼️ Strategi Loading Gambar

```
[Page Load]
    ↓
[Promise.all → fetch 40 Pokémon dari PokeAPI]  ← paralel, bukan satu-satu
    ↓  counter: "Fetching data... 12/40"
[Extract: nama + stats, construct sprite URL dari pokemon.com CDN]
    ↓
[Preload semua 40 gambar HD dengan new Image()]
    ↓  counter: "Preloading... 28/40"
[Tombol aktif — semua gambar sudah di-cache browser]
    ↓
[Tarik → gambar tampil INSTAN, no lag]
```

---

## 🃏 Daftar Pokémon per Rarity

### ⭐ SSR — Legendary (10 Pokémon)
| ID  | Nama     |
|-----|----------|
| 150 | Mewtwo   |
| 249 | Lugia    |
| 250 | Ho-Oh    |
| 382 | Kyogre   |
| 383 | Groudon  |
| 384 | Rayquaza |
| 483 | Dialga   |
| 484 | Palkia   |
| 487 | Giratina |
| 493 | Arceus   |

### 💜 EPIC — Pseudo-Legendary (10 Pokémon)
| ID  | Nama      |
|-----|-----------|
| 149 | Dragonite |
| 248 | Tyranitar |
| 282 | Gardevoir |
| 330 | Flygon    |
| 373 | Salamence |
| 376 | Metagross |
| 445 | Garchomp  |
| 635 | Hydreigon |
| 706 | Goodra    |

### 💙 RARE — Stage-2 (10 Pokémon)
| ID  | Nama      |
|-----|-----------|
| 3   | Venusaur  |
| 6   | Charizard |
| 9   | Blastoise |
| 65  | Alakazam  |
| 94  | Gengar    |
| 130 | Gyarados  |
| 131 | Lapras    |
| 143 | Snorlax   |
| 196 | Espeon    |
| 197 | Umbreon   |

### ⬜ COMMON — Basics (10 Pokémon)
| ID  | Nama      |
|-----|-----------|
| 1   | Bulbasaur |
| 4   | Charmander|
| 7   | Squirtle  |
| 25  | Pikachu   |
| 39  | Jigglypuff|
| 52  | Meowth    |
| 54  | Psyduck   |
| 58  | Growlithe |
| 60  | Poliwag   |
| 133 | Eevee     |

---

## 📊 Stat Bars di Kartu

Setiap Pokémon menampilkan 4 stat dengan bar animasi:

| Stat | Warna     | CSS Color  |
|------|-----------|------------|
| HP   | 🔴 Merah  | `#ff6b6b`  |
| ATK  | 🟠 Orange | `#ff9f43`  |
| DEF  | 🔵 Cyan   | `#48dbfb`  |
| SPD  | 🟣 Ungu   | `#a29bfe`  |

- Max bar = `200` (Deoxys Speed = 180, tertinggi di pool kita)
- Animasi: `cubic-bezier(0.34, 1.56, 0.64, 1)` → efek bounce
- **⚡ Power** = total BST (Base Stat Total) semua 6 stats

---

## 💡 Konsep JavaScript Penting

### `Promise.all` — Fetch Paralel
```js
// ❌ Lambat — fetch satu-satu (sequential)
for (const id of ids) {
  const data = await fetch(`/api/${id}`).then(r => r.json());
}

// ✅ Cepat — fetch semua sekaligus (paralel)
const results = await Promise.all(
  ids.map(id => fetch(`/api/${id}`).then(r => r.json()))
);
```

### Reflow Trick untuk Reset Animasi CSS
```js
card.className = 'card';           // hapus kelas animasi
void card.offsetWidth;             // paksa browser recalculate layout
card.className = 'card ssr reveal'; // terapkan ulang → animasi jalan lagi
```

### Preload Image dengan `new Image()`
```js
const img = new Image();
img.onload = () => console.log('cached!');
img.src = url; // browser download & cache gambar ini di background
```

### `requestAnimationFrame` untuk Animasi Bar
```js
// Tanpa rAF: width bisa tidak ke-render karena timing DOM update
requestAnimationFrame(() => {
  bars.forEach(bar => bar.style.width = bar.dataset.pct + '%');
});
```

---

## 🐛 Bug yang Ditemui & Fix

| Bug                        | Penyebab                                      | Fix                              |
|----------------------------|-----------------------------------------------|----------------------------------|
| Gambar error 429           | GitHub raw.githubusercontent.com rate limit   | Ganti ke assets.pokemon.com CDN  |
| Animasi tidak reset        | CSS animation tidak re-trigger jika class sama| Reflow trick: baca `offsetWidth` |
| Bar stat tidak animasi     | DOM update & CSS transition conflict          | Wrap dengan `requestAnimationFrame()` |

---

## 🚀 Ide Pengembangan Selanjutnya

- [ ] Tambah efek partikel/konfeti saat SSR
- [ ] Simpan history ke `localStorage` agar tidak hilang saat refresh
- [ ] Mode multi-reveal: tampilkan semua 10 kartu TARIK 10x sekaligus
- [ ] Sound effect per rarity (cry Pokémon dari PokeAPI)
- [ ] Tambah Pokémon Gen 4-9 ke pool
- [ ] Filter history berdasarkan rarity
- [ ] Share hasil ke media sosial (screenshot + caption)
