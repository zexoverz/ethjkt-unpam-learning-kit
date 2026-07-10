// ==========================================================
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
  resultMeta: document.getElementById("resultMeta"),
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

function updateStats() {
  el.total.textContent = total;
  el.ssrCount.textContent = ssrCount;
  el.pityText.textContent = pity + " / " + PITY_MAX;
  el.pityFill.style.width = (pity / PITY_MAX) * 100 + "%";
}

function setLoading(on) {
  el.spinner.style.display = on ? "block" : "none";
  if (on) {
    el.placeholder.style.display = "none";
    el.sprite.style.display = "none";
  }
  el.tarik1.disabled = on;
  el.tarik10.disabled = on;
}

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
    el.types.appendChild(badge);
  });
}

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
  el.sprite.onerror = () => {
    el.sprite.onerror = null;
    if (result.fallbackArt) el.sprite.src = result.fallbackArt;
  };
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
}

function addHistory(result) {
  const chip = document.createElement("div");
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

  while (el.history.children.length > 12) {
    el.history.removeChild(el.history.lastChild);
  }
}

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
    return null;
  }
}

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
    el.collectionGrid.appendChild(cell);
  });
}

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
}

function renderBadges() {
  const earned = earnedBadgeIds();
  el.champion.hidden = earned.size < BADGES.length;
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
    el.badgeGrid.appendChild(cell);
  });
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.toast.hidden = true;
  }, 3200);
}

function checkNewBadges() {
  const earned = earnedBadgeIds();
  earned.forEach(id => {
    if (!shownBadges.has(id)) {
      const badge = BADGES.find(item => item.id === id);
      showToast("Badge unlocked: " + badge.name);
    }
  });
  shownBadges = earned;
}

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
