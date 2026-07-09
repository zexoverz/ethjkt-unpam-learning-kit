 LOG Hari 3 — Bikin Koin Sendiri

 1. Token & ERC20 itu apa? Kenapa disebut "standar"?
Token adalah aset digital yang dibuat di atas blockchain, bukan blockchain 
sendiri. ERC20 adalah standar/aturan baku supaya semua token bisa 
"berbicara" dengan cara yang sama — punya fungsi transfer, balanceOf, 
approve, dll. Karena standar ini, semua wallet dan aplikasi otomatis tahu 
cara membaca dan berinteraksi dengan token apapun yang mengikuti ERC20.

 2. Bedanya aksi baca vs aksi nulis? Yang mana yang bayar gas?
Aksi baca (misal balanceOf) cuma mengambil data yang sudah ada, tidak 
mengubah apapun, jadi GRATIS. Aksi nulis (misal transfer, mint) mengubah 
data di blockchain, harus dicatat permanen, makanya butuh gas.

 3. (Uji AI soal swap dijadwalkan Hari 4 sesuai arahan pengajar)

 4. Kenapa transaksi on-chain harus dicek dulu sebelum tanda tangan?
Karena transaksi di blockchain FINAL dan tidak bisa dibatalkan. Begitu 
klik Confirm, koin langsung terpotong dan permanen tercatat, terlihat 
siapa saja selamanya. Salah alamat/jumlah tidak bisa dibatalkan.

 Bukti
- Alamat contract MaxWinToken (MWT): [0xd40f54780F1bEE5b911EA9e7cD23bAAD25C68A4D]
- Transaksi transfer ke Zexo: 
  sepolia.etherscan.io/tx/0x0d47a36197b9327af29dd7a51f66b272533becf6982b1759e31a515e26e80ede

  Screenshot
  ![Token Di Meta Mask](<Screenshot 2026-07-09 210952.png>)
  ![Transfer](<Screenshot 2026-07-09 202849.png>)
  ![Etherscan](<Screenshot 2026-07-09 201523.png>)