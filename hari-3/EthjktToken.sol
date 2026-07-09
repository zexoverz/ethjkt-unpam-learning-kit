// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
// ETHJKT TOKEN - "MATA UANG KAMPUS" BERSAMA (Hari 3)
//
// Kenapa butuh token kedua? Karena SWAP artinya "tukeran": kamu kasih
// token A, dapet token B. Jadi butuh dua koin berbeda buat diadu.
//
// Bedanya sama TokenKu: ETHJKT ini token BERSAMA satu kelas. Anggap
// aja "rupiah"-nya KampusSwap. Semua koin pribadi kalian (TokenKu)
// nanti diadu lawan ETHJKT -> jadi harga tiap koin bisa dibandingin.
// (Persis kayak di dunia nyata: hampir semua token dipasangin lawan
// ETH atau stablecoin kayak USDC/IDRX.)
//
// PENTING: pengajar deploy SATU ETHJKT resmi, terus BAGIIN alamatnya
// ke semua murid. Kalian NGGAK usah deploy ETHJKT sendiri -- cukup
// pakai alamat dari pengajar, lalu panggil mint() buat dapet ETHJKT
// gratis (buat modal isi pool + swap besok).
// ============================================================

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract EthjktToken is ERC20 {
    constructor() ERC20("Ethjkt Token", "ETHJKT") {
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    // faucet terbuka (sama catatan keamanan kayak TokenKu): siapa pun
    // boleh cetak ETHJKT buat latihan.
    function mint(uint256 jumlah) external {
        _mint(msg.sender, jumlah);
    }
}
