// ==========================================================
// POKÉ GACHA - HARI 1
// Simulator gacha yang menarik Pokémon ASLI dari PokeAPI.
//
// File ini dibangun bertahap (lihat LOG.md):
//   1) Mesin rarity + pity (lokal, tanpa internet)
//   2) Lapisan ambil data PokeAPI (fetch + cache)
//   3) Render kartu Pokémon (artwork, tipe, stat, shiny)
// ==========================================================

// ---------- Konfigurasi rarity & pity ----------
const PITY_MAX = 10; // tarikan ke-10 dijamin Legendary (SSR) kalau belum dapat

// Peluang tiap tier (dicek berurutan): SSR 3%, EPIC 10%, RARE 30%, sisanya COMMON.
const RATE_SSR = 0.03;
const RATE_EPIC = 0.10;
const RATE_RARE = 0.30;

const SHINY_RATE = 1 / 40; // peluang setiap Pokémon keluar versi shiny (langka & mengkilap)

// ---------- Sumber data: PokeAPI ----------
const API = "https://pokeapi.co/api/v2";
const DEX_MAX = 1025; // batas National Dex yang punya official artwork

// Kolam ID Pokémon per tier.
// SSR  = legendary + mythical asli (sudah diverifikasi lewat is_legendary/is_mythical).
// EPIC = "pseudo-legendary" & Pokémon kuat ikonik (base stat 500-600).
// RARE & COMMON = ID acak dari National Dex (di luar kolam SSR/EPIC).
const SSR_IDS = [144,145,146,150,151,243,244,245,249,250,251,377,378,379,380,381,382,383,384,385,386,480,481,482,483,484,485,486,487,488,491,492,493,494,638,639,640,641,642,643,644,645,646,647,648,649,716,717,718,719,720,721,785,786,787,788,791,792,800,801,802,807,809,888,889,890,891,892,893,894,895,896,897,898,905,1001,1002,1003,1004,1007,1008,1014,1015,1016,1017,1024];
const EPIC_IDS = [3,6,9,149,248,257,282,373,376,445,448,462,530,635,700,706,784,887,998];
const SPECIAL_IDS = new Set([...SSR_IDS, ...EPIC_IDS]);

// Warna resmi tiap tipe Pokémon (untuk badge tipe).
const TYPE_COLORS = {
  normal: "#A8A77A", fire: "#EE8130", water: "#6390F0", electric: "#F7D02C",
  grass: "#7AC74C", ice: "#96D9D6", fighting: "#C22E28", poison: "#A33EA1",
  ground: "#E2BF65", flying: "#A98FF3", psychic: "#F95587", bug: "#A6B91A",
  rock: "#B6A136", ghost: "#735797", dragon: "#6F35FC", dark: "#705746",
  steel: "#B7B7CE", fairy: "#D685AD",
};

// Label pendek + urutan tampil untuk 6 stat dasar.
const STAT_LABELS = {
  "hp": "HP", "attack": "ATK", "defense": "DEF",
  "special-attack": "SpA", "special-defense": "SpD", "speed": "SPD",
};
const STAT_MAX = 255; // stat dasar tertinggi yang mungkin (untuk skala bar)

// Cache hasil fetch supaya hemat request (patuh fair-use PokeAPI).
const cache = new Map();

// PokeAPI mengarahkan gambar ke raw.githubusercontent.com yang gampang kena
// rate-limit (HTTP 429) saat banyak gambar dimuat sekaligus (misal PULL 10x).
// Kita alihkan ke jsDelivr — CDN yang me-mirror repo yang sama tanpa limit.
function lewatCDN(url) {
  if (!url) return url;
  return url.replace(
    "https://raw.githubusercontent.com/PokeAPI/sprites/master/",
    "https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/"
  );
}

// Ambil satu angka acak dalam [min, max].
function acakAntara(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Ambil satu elemen acak dari array.
function pilihAcak(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Pilih ID Pokémon sesuai tier hasil roll.
function pickId(kelas) {
  if (kelas === "ssr") return pilihAcak(SSR_IDS);
  if (kelas === "epic") return pilihAcak(EPIC_IDS);
  // rare & common: ID acak dari dex, hindari yang sudah jadi milik SSR/EPIC.
  let id;
  do { id = acakAntara(1, DEX_MAX); } while (SPECIAL_IDS.has(id));
  return id;
}

// Judul rapi: "bulbasaur" -> "Bulbasaur", "mr-mime" -> "Mr Mime".
function rapikanNama(nama) {
  return nama.split("-").map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(" ");
}

// ---------- Ambil + gabungkan data satu Pokémon ----------
// Menggabungkan endpoint /pokemon (artwork, tipe, stat) dan
// /pokemon-species (status legendary/mythical) jadi satu objek rapi.
async function getPokemon(id) {
  if (cache.has(id)) return cache.get(id);

  const [pRes, sRes] = await Promise.all([
    fetch(API + "/pokemon/" + id),
    fetch(API + "/pokemon-species/" + id),
  ]);
  if (!pRes.ok || !sRes.ok) throw new Error("Gagal ambil data Pokémon #" + id);

  const p = await pRes.json();
  const s = await sRes.json();
  const art = p.sprites.other["official-artwork"];

  const mon = {
    id: p.id,
    name: rapikanNama(p.name),
    artwork: lewatCDN(art.front_default),
    shinyArtwork: lewatCDN(art.front_shiny),
    fallbackArt: lewatCDN(p.sprites.front_default), // sprite piksel klasik, jaring pengaman
    types: p.types.map(t => t.type.name),
    stats: p.stats.map(st => ({ name: st.stat.name, value: st.base_stat })),
    bst: p.stats.reduce((sum, st) => sum + st.base_stat, 0),
    isLegendary: s.is_legendary,
    isMythical: s.is_mythical,
  };
  cache.set(id, mon);
  return mon;
}

// ---------- State permainan ----------
let pity = 0;      // tarikan sejak Legendary terakhir
let total = 0;     // total tarikan
let ssrCount = 0;  // total Legendary/Mythical didapat

// Koleksi Pokédex: id -> data Pokémon yang pernah didapat (+ jumlahnya).
let collection = {};

// ---------- Simpan / muat progres (localStorage) ----------
// Semua progres bertahan walau browser ditutup / halaman di-refresh.
const STORAGE_KEY = "pokegacha_state_v1";

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ total, pity, ssrCount, collection }));
  } catch (e) {
    // localStorage bisa penuh atau diblokir — abaikan, game tetap jalan.
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    total = s.total || 0;
    pity = s.pity || 0;
    ssrCount = s.ssrCount || 0;
    collection = s.collection || {};
  } catch (e) {
    // Data rusak -> mulai dari nol saja.
    collection = {};
  }
}

// Catat satu Pokémon ke koleksi (atau tambah hitungannya kalau sudah punya).
function recordCatch(result) {
  const existing = collection[result.id];
  if (existing) {
    existing.count += 1;
    if (result.shiny) existing.shiny = true; // sekali shiny, selamanya ditandai shiny
  } else {
    collection[result.id] = {
      id: result.id,
      name: result.name,
      artwork: result.artwork,
      shinyArtwork: result.shinyArtwork,
      fallbackArt: result.fallbackArt,
      types: result.types,
      shiny: !!result.shiny,
      count: 1,
    };
  }
}

// ---------- Elemen DOM ----------
const el = {
  card: document.getElementById("card"),
  spinner: document.getElementById("spinner"),
  sprite: document.getElementById("sprite"),
  shinyBadge: document.getElementById("shinyBadge"),
  placeholder: document.getElementById("placeholder"),
  pokeName: document.getElementById("pokeName"),
  dexNum: document.getElementById("dexNum"),
  types: document.getElementById("types"),
  rarity: document.getElementById("rarity"),
  statsPanel: document.getElementById("statsPanel"),
  total: document.getElementById("total"),
  ssrCount: document.getElementById("ssrCount"),
  pityText: document.getElementById("pityText"),
  pityFill: document.getElementById("pityFill"),
  history: document.getElementById("history"),
  err: document.getElementById("err"),
  tarik1: document.getElementById("tarik1"),
  tarik10: document.getElementById("tarik10"),
  uniqueCount: document.getElementById("uniqueCount"),
  shinyCount: document.getElementById("shinyCount"),
  collectionGrid: document.getElementById("collectionGrid"),
  collectionEmpty: document.getElementById("collectionEmpty"),
  badgeGrid: document.getElementById("badgeGrid"),
  champion: document.getElementById("champion"),
  toast: document.getElementById("toast"),
};

// ---------- Mesin rarity ----------
// Menentukan tier tanpa mengubah state (biar aman kalau fetch gagal nanti).
function decideRarity() {
  const acak = Math.random();
  // "+1" karena tarikan ini belum masuk hitungan pity.
  if (pity + 1 >= PITY_MAX || acak < RATE_SSR) return "ssr";
  if (acak < RATE_EPIC) return "epic";
  if (acak < RATE_RARE) return "rare";
  return "common";
}

// Baru dicatat setelah tarikan benar-benar berhasil.
function commitCounters(kelas) {
  total += 1;
  pity += 1;
  if (kelas === "ssr") { pity = 0; ssrCount += 1; }
}

// ---------- Update panel statistik & pity bar ----------
function updateStats() {
  el.total.textContent = total;
  el.ssrCount.textContent = ssrCount;
  el.pityText.textContent = pity + " / " + PITY_MAX;
  el.pityFill.style.width = (pity / PITY_MAX) * 100 + "%";
}

// ---------- Status loading & error ----------
function setLoading(on) {
  el.spinner.style.display = on ? "block" : "none";
  if (on) {
    el.placeholder.style.display = "none";
    el.sprite.style.display = "none";
  }
  el.tarik1.disabled = on;
  el.tarik10.disabled = on;
}

function showError(msg) {
  el.err.textContent = msg;
}

// Bangun badge tipe (misal: grass / poison) dengan warna resminya.
function buildTypes(types) {
  el.types.innerHTML = "";
  types.forEach(t => {
    const badge = document.createElement("span");
    badge.className = "type-badge";
    badge.textContent = t;
    badge.style.background = TYPE_COLORS[t] || "#666";
    el.types.appendChild(badge);
  });
}

// Bangun 6 baris bar stat dasar (HP, ATK, DEF, SpA, SpD, SPD).
function buildStats(stats) {
  el.statsPanel.innerHTML = "";
  stats.forEach(s => {
    const row = document.createElement("div");
    row.className = "stat-row";
    const persen = Math.min(100, (s.value / STAT_MAX) * 100);
    row.innerHTML =
      '<span class="s-lbl">' + (STAT_LABELS[s.name] || s.name) + "</span>" +
      '<span class="s-val">' + s.value + "</span>" +
      '<span class="stat-bar"><span style="width:' + persen + '%"></span></span>';
    el.statsPanel.appendChild(row);
  });
}

// Gambar mana yang dipakai: shiny kalau lagi hoki, kalau tidak yang biasa.
function artOf(result) {
  return result.shiny && result.shinyArtwork ? result.shinyArtwork : result.artwork;
}

// ---------- Render kartu Pokémon ----------
function render(result) {
  el.placeholder.style.display = "none";
  el.sprite.style.display = "block";
  // Kalau artwork gagal dimuat, jatuh ke sprite piksel klasik (bukan ikon rusak).
  el.sprite.onerror = () => {
    el.sprite.onerror = null;
    if (result.fallbackArt) el.sprite.src = result.fallbackArt;
  };
  el.sprite.src = artOf(result);
  el.sprite.alt = result.name;
  el.shinyBadge.style.display = result.shiny ? "block" : "none";

  el.pokeName.textContent = result.name;
  el.dexNum.textContent = "#" + String(result.id).padStart(3, "0");

  buildTypes(result.types);
  buildStats(result.stats);

  el.rarity.textContent = result.kelas + (result.shiny ? " ✨ shiny" : "");
  el.rarity.className = "rar " + result.kelas;

  // Trik reset animasi: hapus kelas, paksa reflow, pasang lagi.
  el.card.className = "card";
  void el.card.offsetWidth;
  el.card.className = "card " + result.kelas + " reveal" + (result.shiny ? " shiny" : "");
}

function addHistory(result) {
  const chip = document.createElement("div");
  chip.className = "chip " + result.kelas + (result.shiny ? " shiny" : "");
  const img = document.createElement("img");
  img.onerror = () => { img.onerror = null; if (result.fallbackArt) img.src = result.fallbackArt; };
  img.src = artOf(result);
  img.alt = result.name;
  chip.appendChild(img);
  chip.title = result.name + " (" + result.kelas + (result.shiny ? ", shiny" : "") + ")";
  el.history.prepend(chip);
  while (el.history.children.length > 12) {
    el.history.removeChild(el.history.lastChild);
  }
}

// ---------- Satu tarikan (async: ambil data dulu, baru tampil) ----------
async function pull() {
  const kelas = decideRarity();
  const id = pickId(kelas);
  try {
    const mon = await getPokemon(id);
    const shiny = Math.random() < SHINY_RATE && !!mon.shinyArtwork;
    const result = { ...mon, kelas, shiny };
    commitCounters(kelas); // hanya dihitung kalau fetch sukses
    recordCatch(result);   // masukkan ke koleksi Pokédex
    updateStats();
    render(result);
    addHistory(result);
    checkNewBadges();      // rayakan kalau ada badge baru
    saveState();           // simpan progres ke localStorage
    return result;
  } catch (e) {
    showError(e.message);
    return null;
  }
}

// ---------- Tombol ----------
el.tarik1.addEventListener("click", async () => {
  showError("");
  setLoading(true);
  await pull();
  setLoading(false);
});

el.tarik10.addEventListener("click", async () => {
  showError("");
  setLoading(true);
  for (let i = 0; i < 10; i++) {
    await pull(); // berurutan biar sopan ke API & animasi enak dilihat
  }
  setLoading(false);
});

// ---------- Render koleksi (Pokédex) ----------
function renderCollection() {
  // Urutkan berdasarkan nomor Pokédex biar rapi seperti Pokédex asli.
  const daftar = Object.values(collection).sort((a, b) => a.id - b.id);
  const shinyTotal = daftar.filter(m => m.shiny).length;

  el.uniqueCount.textContent = daftar.length;
  el.shinyCount.textContent = shinyTotal;
  el.collectionEmpty.hidden = daftar.length > 0;

  el.collectionGrid.innerHTML = "";
  daftar.forEach(m => {
    const cell = document.createElement("div");
    cell.className = "dex-cell" + (m.shiny ? " shiny" : "");

    const src = m.shiny && m.shinyArtwork ? m.shinyArtwork : m.artwork;
    const img = document.createElement("img");
    img.onerror = () => { img.onerror = null; if (m.fallbackArt) img.src = m.fallbackArt; };
    img.src = src;
    img.alt = m.name;

    cell.innerHTML =
      (m.shiny ? '<span class="shiny-star">✨</span>' : "") +
      (m.count > 1 ? '<span class="dex-count">×' + m.count + "</span>" : "") +
      '<div class="dex-no">#' + String(m.id).padStart(3, "0") + "</div>";
    cell.insertBefore(img, cell.firstChild);
    const name = document.createElement("div");
    name.className = "dex-name";
    name.textContent = m.name;
    cell.appendChild(name);

    el.collectionGrid.appendChild(cell);
  });
}

// ---------- Badge gym Kanto ----------
// Tiap badge "dikuasai" dengan mengumpulkan BADGE_GOAL jenis Pokémon dari tipe tertentu.
const BADGE_GOAL = 3;
const BADGES = [
  { id: "boulder", name: "Boulder", gym: "Pewter",    type: "rock",     icon: "🪨", color: "#B6A136" },
  { id: "cascade", name: "Cascade", gym: "Cerulean",  type: "water",    icon: "💧", color: "#6390F0" },
  { id: "thunder", name: "Thunder", gym: "Vermilion", type: "electric", icon: "⚡", color: "#E8B900" },
  { id: "rainbow", name: "Rainbow", gym: "Celadon",   type: "grass",    icon: "🌿", color: "#7AC74C" },
  { id: "soul",    name: "Soul",    gym: "Fuchsia",   type: "poison",   icon: "☠️", color: "#A33EA1" },
  { id: "marsh",   name: "Marsh",   gym: "Saffron",   type: "psychic",  icon: "🔮", color: "#F95587" },
  { id: "volcano", name: "Volcano", gym: "Cinnabar",  type: "fire",     icon: "🔥", color: "#EE8130" },
  { id: "earth",   name: "Earth",   gym: "Viridian",  type: "ground",   icon: "⛰️", color: "#C79A45" },
];

// Berapa jenis unik dari sebuah tipe yang sudah dikoleksi.
function countType(type) {
  return Object.values(collection).filter(m => m.types.includes(type)).length;
}

// Kumpulan id badge yang sudah diraih saat ini.
function earnedBadgeIds() {
  return new Set(BADGES.filter(b => countType(b.type) >= BADGE_GOAL).map(b => b.id));
}

// Ubah warna hex jadi rgba (untuk efek glow badge).
function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + alpha + ")";
}

function renderBadges() {
  const earned = earnedBadgeIds();
  el.champion.hidden = earned.size < BADGES.length;

  el.badgeGrid.innerHTML = "";
  BADGES.forEach(b => {
    const punya = Math.min(countType(b.type), BADGE_GOAL);
    const isEarned = earned.has(b.id);
    const persen = (punya / BADGE_GOAL) * 100;

    const cell = document.createElement("div");
    cell.className = "badge-cell" + (isEarned ? " earned" : "");
    cell.style.setProperty("--gym", b.color);
    cell.style.setProperty("--gym-glow", hexToRgba(b.color, 0.45));
    cell.style.setProperty("--gym-soft", hexToRgba(b.color, 0.12));
    cell.innerHTML =
      (isEarned ? '<span class="badge-check">✔</span>' : "") +
      '<div class="badge-icon">' + b.icon + "</div>" +
      '<div class="badge-name">' + b.name + " Badge</div>" +
      '<div class="badge-gym">' + b.gym + " · " + b.type + "</div>" +
      '<div class="badge-prog-track"><div class="badge-prog-fill" style="width:' + persen + '%"></div></div>' +
      '<div class="badge-prog-txt">' + punya + " / " + BADGE_GOAL + "</div>";
    el.badgeGrid.appendChild(cell);
  });
}

// Badge yang sudah diraih & sudah ditampilkan (biar toast tidak muncul ulang).
let shownBadges = new Set();

// Munculkan notifikasi kecil selama beberapa detik.
let toastTimer = null;
function showToast(msg) {
  el.toast.textContent = msg;
  el.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.toast.hidden = true; }, 3500);
}

// Cek apakah ada badge baru setelah sebuah tarikan; kalau ada, rayakan.
function checkNewBadges() {
  const earned = earnedBadgeIds();
  earned.forEach(id => {
    if (!shownBadges.has(id)) {
      const b = BADGES.find(x => x.id === id);
      showToast(b.icon + " Badge " + b.name + " diraih!");
    }
  });
  shownBadges = earned;
}

// ---------- Navigasi tab ----------
function switchTab(name) {
  document.querySelectorAll(".tab").forEach(t => {
    t.classList.toggle("active", t.dataset.tab === name);
  });
  document.querySelectorAll(".tab-panel").forEach(p => {
    p.hidden = p.id !== "panel-" + name;
  });
  if (name === "koleksi") renderCollection(); // selalu tampilkan data terbaru
  if (name === "badge") renderBadges();
}

document.querySelectorAll(".tab").forEach(t => {
  t.addEventListener("click", () => switchTab(t.dataset.tab));
});

// ---------- Mulai: pulihkan progres yang tersimpan ----------
loadState();
updateStats();
shownBadges = earnedBadgeIds(); // badge yang sudah diraih dari sesi lama, jangan toast ulang
