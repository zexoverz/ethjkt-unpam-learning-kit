// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
// GHANICOIN (GC) - ERC20 milikku sendiri
// Dibuat berdasarkan standar OpenZeppelin ERC20
// ============================================================

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GhaniCoin is ERC20 {
    constructor()
        ERC20("GhaniCoin", "GC")
    {
        // cetak 1.000.000 token ke wallet yang deploy
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    // Faucet terbuka: siapa saja boleh mint token buat latihan.
    // CATATAN: ini SENGAJA tidak aman, cuma buat belajar.
    // Di proyek nyata, mint harus dibatasi (misal cuma owner).
    function mint(uint256 jumlah) external {
        _mint(msg.sender, jumlah);
    }
}