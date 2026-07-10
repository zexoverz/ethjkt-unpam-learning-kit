# Progress Log — Gacha ETHJKT (Star Rail Edition)

## Hari 1 — Checkpoint 1
Bikin data hadiah (SSR/Epic/Rare/Common) pakai nama karakter Honkai 
Star Rail asli, dan fungsi pilihAcak() buat milih 1 item acak dari 
sebuah array.

## Hari 1 — Checkpoint 2
Bikin fungsi rollSatu() buat logika tarikan gacha. Tiap kali dipanggil:
- nambah total & pity masing-masing 1
- generate angka acak 0-1 pakai Math.random()
- kalau pity udah 10x tanpa SSR ATAU angka acak < 0.03 -> pasti dapet SSR 
  (ini namanya "sistem pity", biar pemain nggak kelamaan nggak dapet 
  yang bagus), terus pity di-reset ke 0
- kalau nggak, cek probabilitas: < 0.10 = Epic, < 0.30 = Rare, sisanya Common
- ambil 1 item acak dari rarity yang kena pakai pilihAcak()
- balikin hasil {kelas, nama, emoji}