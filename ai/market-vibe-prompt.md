# AI MARKET VIBE (ringkasan "suasana pasar hari ini") - BONUS

Fitur AI opsional buat KampusSwap. Kamu kumpulin daftar swap terakhir
(dari event `Swapped` di contract), terus minta AI bikin ringkasan santai.

## Prompt

```
Berikut daftar swap terakhir di KampusSwap (token masuk -> token keluar,
jumlah):
[
  "5000 MIEAYAM -> 4820 ETHJKT",
  "1200 ETHJKT -> 1180 MIEAYAM",
  "..."
]
Buat ringkasan "vibe pasar hari ini" 3 kalimat, bahasa santai anak muda.
Sebutin token mana yang lagi banyak diburu. JANGAN kasih saran finansial.
```

## Catatan

- Ini murni buat gaya-gayaan/demo, BUKAN nasihat investasi. Kasih
  disclaimer jelas: "hiburan, bukan saran finansial."
- Data swap diambil dari log event on-chain (transparan) -> nyambung ke
  pelajaran Hari 3: semua isi blockchain bisa dibaca siapa aja.
