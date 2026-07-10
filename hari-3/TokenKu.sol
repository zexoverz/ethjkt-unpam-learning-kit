// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
// TOKEN-KU - ERC20 PERTAMA KAMU (Hari 3)  ->  ini "koin" milikmu
//
// Ini "duit" pertama yang kamu cetak sendiri di blockchain. Namanya
// terserah kamu: mau $MIEAYAM, $GABUT, $SKENA, $KOPI, bebas. Ini koin
// pribadimu. Besok koin ini yang bakal kita perdagangkan di KampusSwap.
//
// ERC20 = standar token yang dipakai HAMPIR SEMUA koin di Ethereum
// (USDT, USDC, DAI, IDRX -- semua ERC20). Karena standar, semua wallet
// & aplikasi (termasuk MetaMask) otomatis ngerti token buatanmu.
//
// Kita NGGAK nulis ERC20 dari nol. Kita PAKAI OpenZeppelin: library
// ERC20 yang udah dipakai & diaudit ribuan proyek. Ini persis prinsip
// kita: jangan bikin ulang roda yang udah teruji. Kamu cukup NGERTI
// fungsi apa aja yang kamu warisi, bukan ngetik ulang.
//
// Yang kamu dapet GRATIS dari "is ERC20" (6 fungsi inti - besok dibedah):
//   name(), symbol(), decimals()  : identitas token
//   totalSupply()                 : total token yang beredar
//   balanceOf(alamat)             : saldo seseorang
//   transfer(ke, jumlah)          : kirim token
//   approve(siapa, jumlah)        : IZIN-in orang/contract pakai token-mu
//   transferFrom(dari, ke, jml)   : yang diizinin narik token-mu
//
// Cara pakai (di Remix):
//   1. Ganti nama & simbol di bawah (bagian >>> GANTI DI SINI <<<).
//   2. Compile (OpenZeppelin auto ke-download sama Remix).
//   3. Deploy ke jaringan "Sepolia" lewat MetaMask (blockchain ASLI).
//   4. 1.000.000 token otomatis masuk ke wallet kamu.
//   5. Import alamat contract ke MetaMask -> koin-mu keliatan!
// ============================================================

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TokenKu is ERC20 {
    constructor()
        // >>> GANTI DI SINI <<<  ("Nama Panjang Token", "SIMBOL")
        // contoh: ERC20("Mie Ayam Coin", "MIEAYAM")
        ERC20("Token Ku", "TOKENKU")
    {
        // cetak 1.000.000 token ke kamu (deployer). "10 ** decimals()"
        // karena token pakai 18 angka di belakang koma, sama kayak ETH.
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    // FAUCET TERBUKA: siapa pun boleh cetak token buat latihan.
    // >> SENGAJA nggak aman <<. Di dunia nyata, cetak token WAJIB
    // dibatasi (cuma owner). Ini teachable moment: kalau AI ngasih kamu
    // token dengan mint terbuka kayak gini buat proyek beneran, itu BUG
    // serius. Untuk kelas, ini bikin gampang bagi-bagi token ke temen
    // biar bisa nyobain swap bareng.
    function mint(uint256 jumlah) external {
        _mint(msg.sender, jumlah);
    }
}
