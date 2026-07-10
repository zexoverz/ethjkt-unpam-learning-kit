// ==========================================================
<<<<<<< HEAD
// ANIME ARCHIVE GACHA - HARI 1
// Data anime diambil dari Jikan REST API v4.
// Endpoint utama: /anime dengan query pool per rarity.
// ==========================================================

const API = "https://api.jikan.moe/v4";
const STORAGE_KEY = "animegacha_state_v1";

const PITY_MAX = 10;
const RATE_SSR = 0.03;
const RATE_EPIC = 0.10;
const RATE_RARE = 0.30;
const LIMITED_RATE = 1 / 35;

// Jikan limit publik: 3 request/detik. Jeda ini menjaga PULL 10x tetap sopan.
const REQUEST_GAP_MS = 420;

const RARITY_POOLS = {
  ssr: {
    label: "SSR",
    maxPage: 4,
    params: { order_by: "score", sort: "desc", min_score: "8.6", sfw: "true", limit: "25" },
  },
  epic: {
    label: "EPIC",
    maxPage: 10,
    params: { order_by: "favorites", sort: "desc", min_score: "8", sfw: "true", limit: "25" },
  },
  rare: {
    label: "RARE",
    maxPage: 18,
    params: { order_by: "members", sort: "desc", min_score: "7.2", sfw: "true", limit: "25" },
  },
  common: {
    label: "COMMON",
    maxPage: 80,
    params: { order_by: "mal_id", sort: "desc", min_score: "6", sfw: "true", limit: "25" },
  },
};

const GENRE_COLORS = {
  Action: "#c94b45",
  Adventure: "#c27a2c",
  Comedy: "#c7a33c",
  Drama: "#6f70b7",
  Fantasy: "#7d5bd6",
  Horror: "#4f5665",
  Mystery: "#506b8f",
  Romance: "#c75d7a",
  "Sci-Fi": "#3c7d9d",
  Slice: "#5c8f68",
  Sports: "#4f8f88",
  Supernatural: "#7a6094",
};

const BADGE_GOAL = 3;
const BADGES = [
  { id: "action", name: "Action Curator", type: "genre", target: "Action", color: "#c94b45" },
  { id: "romance", name: "Romance Shelf", type: "genre", target: "Romance", color: "#c75d7a" },
  { id: "fantasy", name: "Fantasy Wing", type: "genre", target: "Fantasy", color: "#7d5bd6" },
  { id: "drama", name: "Drama Vault", type: "genre", target: "Drama", color: "#6f70b7" },
  { id: "classic", name: "Classic Room", type: "yearBefore", target: 2010, color: "#a87908" },
  { id: "prestige", name: "Prestige Row", type: "scoreAtLeast", target: 8.5, color: "#d8a73d" },
];

const poolCache = new Map();
const pageCache = new Map();
let lastRequestAt = 0;

let pity = 0;
let total = 0;
let ssrCount = 0;
let collection = {};
let shownBadges = new Set();
let toastTimer = null;

=======
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
>>>>>>> upstream/master
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
<<<<<<< HEAD
  resultMeta: document.getElementById("resultMeta"),
=======
>>>>>>> upstream/master
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

<<<<<<< HEAD
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function compactNumber(value) {
  if (!value && value !== 0) return "-";
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function safeText(value, fallback) {
  return value || fallback;
}

function buildUrl(path, params) {
  const query = new URLSearchParams(params);
  return API + path + "?" + query.toString();
}

async function fetchJson(url, retry = true) {
  const wait = Math.max(0, REQUEST_GAP_MS - (Date.now() - lastRequestAt));
  if (wait > 0) await delay(wait);
  lastRequestAt = Date.now();

  const response = await fetch(url);
  if (response.status === 429 && retry) {
    await delay(1400);
    return fetchJson(url, false);
  }
  if (!response.ok) throw new Error("Jikan request failed (" + response.status + ")");
  return response.json();
}

function decideRarity() {
  const roll = Math.random();
  const pityHit = pity + 1 >= PITY_MAX;

  if (pityHit || roll < RATE_SSR) return { kelas: "ssr", roll, pityHit };
  if (roll < RATE_EPIC) return { kelas: "epic", roll, pityHit };
  if (roll < RATE_RARE) return { kelas: "rare", roll, pityHit };
  return { kelas: "common", roll, pityHit };
}

function commitCounters(kelas) {
  total += 1;
  pity += 1;
  if (kelas === "ssr") {
    pity = 0;
    ssrCount += 1;
  }
}

function normalizeAnime(anime) {
  const genres = [
    ...(anime.genres || []),
    ...(anime.themes || []),
    ...(anime.demographics || []),
  ].map(item => item.name);

  return {
    id: anime.mal_id,
    name: safeText(anime.title_english, anime.title),
    originalTitle: anime.title,
    japaneseTitle: anime.title_japanese,
    url: anime.url,
    artwork:
      anime.images?.webp?.large_image_url ||
      anime.images?.jpg?.large_image_url ||
      anime.images?.jpg?.image_url ||
      "",
    fallbackArt: anime.images?.jpg?.image_url || "",
    types: genres.slice(0, 3),
    score: anime.score || 0,
    rank: anime.rank || null,
    popularity: anime.popularity || null,
    members: anime.members || 0,
    episodes: anime.episodes || 0,
    year: anime.year || anime.aired?.prop?.from?.year || null,
    format: safeText(anime.type, "Unknown"),
    status: safeText(anime.status, "Unknown"),
    synopsis: safeText(anime.synopsis, "No synopsis available."),
  };
}

function isUsableAnime(anime) {
  return anime && anime.mal_id && anime.title && anime.images && (anime.images.webp || anime.images.jpg);
}

async function fetchAnimePage(kelas, page) {
  const profile = RARITY_POOLS[kelas];
  const cacheKey = kelas + ":" + page;
  if (pageCache.has(cacheKey)) return pageCache.get(cacheKey);

  const url = buildUrl("/anime", { ...profile.params, page: String(page) });
  const payload = await fetchJson(url);
  const titles = (payload.data || []).filter(isUsableAnime).map(normalizeAnime);
  pageCache.set(cacheKey, titles);

  return titles;
}

async function loadPool(kelas) {
  const cached = poolCache.get(kelas);
  if (cached && cached.length > 0) return cached;

  const profile = RARITY_POOLS[kelas];
  const page = randomBetween(1, profile.maxPage);
  let titles = await fetchAnimePage(kelas, page);

  // If one page is sparse, add page 1 from the same pool as a stable fallback.
  if (titles.length < 5 && page !== 1) {
    titles = titles.concat(await fetchAnimePage(kelas, 1));
  }
  if (titles.length === 0) throw new Error("Pool " + profile.label + " kosong dari Jikan");

  poolCache.set(kelas, titles);
  return titles;
}

async function pickAnime(kelas) {
  const pool = await loadPool(kelas);
  return randomItem(pool);
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ total, pity, ssrCount, collection }));
  } catch (e) {
    // Storage can be blocked or full; the simulator still works for this session.
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const state = JSON.parse(raw);
    total = state.total || 0;
    pity = state.pity || 0;
    ssrCount = state.ssrCount || 0;
    collection = state.collection || {};
  } catch (e) {
    collection = {};
  }
}

function recordCatch(result) {
  const existing = collection[result.id];
  if (existing) {
    existing.count += 1;
    if (result.limited) existing.limited = true;
    return;
  }

  collection[result.id] = {
    id: result.id,
    name: result.name,
    artwork: result.artwork,
    fallbackArt: result.fallbackArt,
    types: result.types,
    score: result.score,
    rank: result.rank,
    members: result.members,
    year: result.year,
    format: result.format,
    limited: !!result.limited,
    count: 1,
  };
}

=======
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
>>>>>>> upstream/master
function updateStats() {
  el.total.textContent = total;
  el.ssrCount.textContent = ssrCount;
  el.pityText.textContent = pity + " / " + PITY_MAX;
  el.pityFill.style.width = (pity / PITY_MAX) * 100 + "%";
}

<<<<<<< HEAD
=======
// ---------- Status loading & error ----------
>>>>>>> upstream/master
function setLoading(on) {
  el.spinner.style.display = on ? "block" : "none";
  if (on) {
    el.placeholder.style.display = "none";
    el.sprite.style.display = "none";
  }
  el.tarik1.disabled = on;
  el.tarik10.disabled = on;
}

<<<<<<< HEAD
function showError(message) {
  el.err.textContent = message;
}

function buildTypes(types) {
  el.types.innerHTML = "";

  const labels = types.length > 0 ? types : ["Uncategorized"];
  labels.forEach(type => {
    const badge = document.createElement("span");
    badge.className = "type-badge";
    badge.textContent = type;
    badge.style.background = GENRE_COLORS[type] || "#2f3442";
=======
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
>>>>>>> upstream/master
    el.types.appendChild(badge);
  });
}

<<<<<<< HEAD
function buildStats(result) {
  const rows = [
    { label: "Score", value: result.score ? result.score.toFixed(2) : "-", percent: Math.min(100, (result.score / 10) * 100) },
    { label: "Rank", value: result.rank ? "#" + result.rank : "-", percent: result.rank ? Math.max(8, 100 - Math.min(result.rank, 5000) / 50) : 0 },
    { label: "Members", value: compactNumber(result.members), percent: Math.min(100, Math.log10(Math.max(result.members, 1)) * 14) },
    { label: "Episodes", value: result.episodes || "-", percent: Math.min(100, (Math.min(result.episodes || 0, 100) / 100) * 100) },
  ];

  el.statsPanel.innerHTML = "";
  rows.forEach(row => {
    const item = document.createElement("div");
    item.className = "stat-row";
    item.innerHTML =
      '<span class="s-lbl">' + row.label + "</span>" +
      '<span class="s-val">' + row.value + "</span>" +
      '<span class="stat-bar"><span style="width:' + row.percent + '%"></span></span>';
    el.statsPanel.appendChild(item);
  });
}

function renderResultMeta(result) {
  const nextPity = result.kelas === "ssr" ? PITY_MAX : PITY_MAX - pity;
  const sourceLabel = result.pityHit ? "SSR from pity" : "Roll " + Math.round(result.roll * 100) + "%";
  const chips = [
    { text: RARITY_POOLS[result.kelas].label, className: result.kelas },
    { text: sourceLabel, className: result.pityHit ? "pity-hit" : "" },
    { text: result.kelas === "ssr" ? "Pity reset" : nextPity + " to pity", className: "" },
    { text: result.limited ? "Limited cover" : result.format, className: result.limited ? "pity-hit" : "" },
  ];

  el.resultMeta.innerHTML = "";
  chips.forEach(item => {
    const chip = document.createElement("span");
    chip.textContent = item.text;
    if (item.className) chip.className = item.className;
    el.resultMeta.appendChild(chip);
  });
}

function imageOf(result) {
  return result.artwork || result.fallbackArt;
}

function render(result) {
  el.placeholder.style.display = "none";
  el.sprite.style.display = "block";
=======
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
>>>>>>> upstream/master
  el.sprite.onerror = () => {
    el.sprite.onerror = null;
    if (result.fallbackArt) el.sprite.src = result.fallbackArt;
  };
<<<<<<< HEAD
  el.sprite.src = imageOf(result);
  el.sprite.alt = result.name;
  el.shinyBadge.style.display = result.limited ? "block" : "none";

  el.pokeName.textContent = result.name;
  el.dexNum.textContent = "#" + result.id + (result.year ? " / " + result.year : "");
  el.rarity.textContent = RARITY_POOLS[result.kelas].label + (result.limited ? " limited" : "");
  el.rarity.className = "rar " + result.kelas;

  buildTypes(result.types);
  buildStats(result);
  renderResultMeta(result);

  el.card.className = "card";
  void el.card.offsetWidth;
  el.card.className = "card " + result.kelas + " reveal" + (result.limited ? " shiny" : "");
=======
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
>>>>>>> upstream/master
}

function addHistory(result) {
  const chip = document.createElement("div");
<<<<<<< HEAD
  chip.className = "chip " + result.kelas + (result.limited ? " shiny" : "");

  const img = document.createElement("img");
  img.onerror = () => {
    img.onerror = null;
    if (result.fallbackArt) img.src = result.fallbackArt;
  };
  img.src = imageOf(result);
  img.alt = result.name;

  chip.appendChild(img);
  chip.title = result.name + " (" + RARITY_POOLS[result.kelas].label + ")";
  el.history.prepend(chip);

=======
  chip.className = "chip " + result.kelas + (result.shiny ? " shiny" : "");
  const img = document.createElement("img");
  img.onerror = () => { img.onerror = null; if (result.fallbackArt) img.src = result.fallbackArt; };
  img.src = artOf(result);
  img.alt = result.name;
  chip.appendChild(img);
  chip.title = result.name + " (" + result.kelas + (result.shiny ? ", shiny" : "") + ")";
  el.history.prepend(chip);
>>>>>>> upstream/master
  while (el.history.children.length > 12) {
    el.history.removeChild(el.history.lastChild);
  }
}

<<<<<<< HEAD
async function pull() {
  const decision = decideRarity();

  try {
    const anime = await pickAnime(decision.kelas);
    const limited = Math.random() < LIMITED_RATE;
    const result = { ...anime, kelas: decision.kelas, roll: decision.roll, pityHit: decision.pityHit, limited };

    commitCounters(decision.kelas);
    recordCatch(result);
    updateStats();
    render(result);
    addHistory(result);
    checkNewBadges();
    saveState();

    return result;
  } catch (e) {
    showError(e.message || "Gagal mengambil data anime dari Jikan");
=======
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
>>>>>>> upstream/master
    return null;
  }
}

<<<<<<< HEAD
async function pullMany(count) {
  showError("");
  setLoading(true);

  for (let i = 0; i < count; i++) {
    await pull();
  }

  setLoading(false);
}

el.tarik1.addEventListener("click", () => pullMany(1));
el.tarik10.addEventListener("click", () => pullMany(10));

function renderCollection() {
  const items = Object.values(collection).sort((a, b) => (b.score || 0) - (a.score || 0));
  const limitedTotal = items.filter(item => item.limited).length;

  el.uniqueCount.textContent = items.length;
  el.shinyCount.textContent = limitedTotal;
  el.collectionEmpty.hidden = items.length > 0;
  el.collectionGrid.innerHTML = "";

  items.forEach(item => {
    const cell = document.createElement("div");
    cell.className = "dex-cell" + (item.limited ? " shiny" : "");

    const img = document.createElement("img");
    img.onerror = () => {
      img.onerror = null;
      if (item.fallbackArt) img.src = item.fallbackArt;
    };
    img.src = item.artwork || item.fallbackArt;
    img.alt = item.name;

    const count = document.createElement("span");
    count.className = "dex-count";
    count.textContent = "x" + item.count;

    const flag = document.createElement("span");
    flag.className = "shiny-star";
    flag.textContent = "LIMITED";

    const number = document.createElement("div");
    number.className = "dex-no";
    number.textContent = "#" + item.id + " / " + (item.score ? item.score.toFixed(2) : "-");

    const name = document.createElement("div");
    name.className = "dex-name";
    name.textContent = item.name;

    cell.appendChild(img);
    if (item.count > 1) cell.appendChild(count);
    if (item.limited) cell.appendChild(flag);
    cell.appendChild(number);
    cell.appendChild(name);
=======
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

>>>>>>> upstream/master
    el.collectionGrid.appendChild(cell);
  });
}

<<<<<<< HEAD
function countBadgeProgress(badge) {
  const items = Object.values(collection);

  if (badge.type === "genre") {
    return items.filter(item => (item.types || []).includes(badge.target)).length;
  }
  if (badge.type === "scoreAtLeast") {
    return items.filter(item => (item.score || 0) >= badge.target).length;
  }
  if (badge.type === "yearBefore") {
    return items.filter(item => item.year && item.year < badge.target).length;
  }
  return 0;
}

function earnedBadgeIds() {
  return new Set(BADGES.filter(badge => countBadgeProgress(badge) >= BADGE_GOAL).map(badge => badge.id));
}

function hexToRgba(hex, alpha) {
  const value = parseInt(hex.slice(1), 16);
  return "rgba(" + ((value >> 16) & 255) + "," + ((value >> 8) & 255) + "," + (value & 255) + "," + alpha + ")";
=======
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
>>>>>>> upstream/master
}

function renderBadges() {
  const earned = earnedBadgeIds();
  el.champion.hidden = earned.size < BADGES.length;
<<<<<<< HEAD
  el.badgeGrid.innerHTML = "";

  BADGES.forEach(badge => {
    const progress = Math.min(countBadgeProgress(badge), BADGE_GOAL);
    const isEarned = earned.has(badge.id);
    const cell = document.createElement("div");
    const detail = badge.type === "genre" ? badge.target : badge.type === "scoreAtLeast" ? "Score " + badge.target + "+" : "Before " + badge.target;

    cell.className = "badge-cell" + (isEarned ? " earned" : "");
    cell.style.setProperty("--badge", badge.color);
    cell.style.setProperty("--badge-soft", hexToRgba(badge.color, 0.18));
    cell.innerHTML =
      (isEarned ? '<span class="badge-check">OK</span>' : "") +
      '<div class="badge-icon">AG</div>' +
      '<div class="badge-name">' + badge.name + "</div>" +
      '<div class="badge-gym">' + detail + "</div>" +
      '<div class="badge-prog-track"><div class="badge-prog-fill" style="width:' + (progress / BADGE_GOAL) * 100 + '%"></div></div>' +
      '<div class="badge-prog-txt">' + progress + " / " + BADGE_GOAL + "</div>";
=======

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
>>>>>>> upstream/master
    el.badgeGrid.appendChild(cell);
  });
}

<<<<<<< HEAD
function showToast(message) {
  el.toast.textContent = message;
  el.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.toast.hidden = true;
  }, 3200);
}

=======
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
>>>>>>> upstream/master
function checkNewBadges() {
  const earned = earnedBadgeIds();
  earned.forEach(id => {
    if (!shownBadges.has(id)) {
<<<<<<< HEAD
      const badge = BADGES.find(item => item.id === id);
      showToast("Badge unlocked: " + badge.name);
=======
      const b = BADGES.find(x => x.id === id);
      showToast(b.icon + " Badge " + b.name + " diraih!");
>>>>>>> upstream/master
    }
  });
  shownBadges = earned;
}

<<<<<<< HEAD
function switchTab(name) {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.tab === name);
  });
  document.querySelectorAll(".tab-panel").forEach(panel => {
    panel.hidden = panel.id !== "panel-" + name;
  });

  if (name === "koleksi") renderCollection();
  if (name === "badge") renderBadges();
}

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => switchTab(tab.dataset.tab));
});

loadState();
updateStats();
shownBadges = earnedBadgeIds();
=======
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
>>>>>>> upstream/master
