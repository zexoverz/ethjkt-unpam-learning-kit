// ==========================================================
// DRAGON BALL GACHA - HARI 1
// Simulator gacha yang menarik karakter asli dari Dragon Ball API.
//
// Data digabung dari:
//   1) /characters, semua halaman via links.next
//   2) /characters/:id, detail planet asal + transformasi saat kartu keluar
//   3) /planets, semua halaman untuk konteks koleksi planet
// ==========================================================

// ---------- Konfigurasi rarity & pity ----------
const PITY_MAX = 10; // tarikan ke-10 dijamin SSR kalau belum dapat

// Peluang tiap tier (dicek berurutan): SSR 3%, EPIC 10%, RARE 30%, sisanya COMMON.
const RATE_SSR = 0.03;
const RATE_EPIC = 0.10;
const RATE_RARE = 0.30;

const AURA_RATE = 1 / 40; // peluang setiap karakter keluar versi Aura Burst

// ---------- Sumber data: Dragon Ball API ----------
const API = "https://dragonball-api.com/api";
const STORAGE_KEY = "dragonball_gacha_state_v1";

const dataCache = {
  roster: null,
  planets: null,
  pools: null,
  details: new Map(),
};

// Warna badge untuk race/affiliation.
const TAG_COLORS = {
  Saiyan: "#d9572b",
  Human: "#2d6f9f",
  Namekian: "#4f9b45",
  Android: "#8b3ff0",
  "Frieza Race": "#9a65c7",
  Majin: "#d66ba4",
  Angel: "#4ba3c7",
  God: "#d99e00",
  "Z Fighter": "#2fae5a",
  "Army of Frieza": "#6e5aa8",
  Freelancer: "#687386",
  Villain: "#b83b3b",
  Other: "#687386",
};

const POWER_UNITS = {
  thousand: 1e3,
  million: 1e6,
  billion: 1e9,
  trillion: 1e12,
  quadrillion: 1e15,
  quintillion: 1e18,
  sextillion: 1e21,
  septillion: 1e24,
  septllion: 1e24,
  octillion: 1e27,
  googolplex: 1e100,
};

// ---------- Utilitas ----------
function acakAntara(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pilihAcak(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shortText(text, max = 170) {
  if (!text) return "Deskripsi belum tersedia dari API.";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max - 1).trim() + "..." : clean;
}

function normalizeTag(value) {
  return value && String(value).trim() ? String(value).trim() : "Other";
}

function parsePower(value) {
  if (!value) return 0;
  const raw = String(value).toLowerCase().replace(/,/g, "").trim();
  const unit = Object.keys(POWER_UNITS).find(u => raw.includes(u));

  if (unit) {
    const number = parseFloat(raw.replace(/[^0-9.]/g, ""));
    return Number.isFinite(number) ? number * POWER_UNITS[unit] : 0;
  }

  const digits = raw.replace(/\./g, "").replace(/[^0-9]/g, "");
  return digits ? Number(digits) : 0;
}

function powerScore(character) {
  return parsePower(character.maxKi) || parsePower(character.ki);
}

function formatPower(value) {
  return value || "Unknown";
}

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + alpha + ")";
}

async function fetchJson(url, label) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Gagal ambil data " + label + " (" + res.status + ")");
  return res.json();
}

async function fetchAll(endpoint) {
  let url = API + "/" + endpoint + "?limit=100";
  const items = [];

  while (url) {
    const page = await fetchJson(url, endpoint);
    items.push(...(page.items || []));
    url = page.links && page.links.next ? page.links.next : "";
  }

  return items.filter(item => !item.deletedAt);
}

async function getRoster() {
  if (!dataCache.roster) dataCache.roster = fetchAll("characters");
  return dataCache.roster;
}

async function getPlanets() {
  if (!dataCache.planets) dataCache.planets = fetchAll("planets");
  return dataCache.planets;
}

async function getCharacterDetail(id) {
  if (dataCache.details.has(id)) return dataCache.details.get(id);
  const detail = await fetchJson(API + "/characters/" + id, "karakter #" + id);
  dataCache.details.set(id, detail);
  return detail;
}

async function buildPools() {
  if (dataCache.pools) return dataCache.pools;

  const roster = await getRoster();
  const ranked = [...roster].sort((a, b) => powerScore(b) - powerScore(a));
  const topCount = Math.max(8, Math.ceil(ranked.length * 0.18));
  const epicCount = Math.max(12, Math.ceil(ranked.length * 0.28));

  dataCache.pools = {
    ssr: ranked.slice(0, topCount),
    epic: ranked.slice(topCount, topCount + epicCount),
    rare: ranked.slice(topCount + epicCount, topCount + epicCount + Math.max(12, Math.ceil(ranked.length * 0.28))),
    common: ranked.slice(topCount + epicCount + Math.max(12, Math.ceil(ranked.length * 0.28))),
  };

  if (!dataCache.pools.common.length) dataCache.pools.common = ranked;
  return dataCache.pools;
}

async function pickCharacter(kelas) {
  const pools = await buildPools();
  return pilihAcak(pools[kelas] && pools[kelas].length ? pools[kelas] : await getRoster());
}

async function hydrateCharacter(base) {
  const detail = await getCharacterDetail(base.id);
  const origin = detail.originPlanet || detail.planet || null;
  const transformations = Array.isArray(detail.transformations) ? detail.transformations : [];

  return {
    id: detail.id || base.id,
    name: detail.name || base.name,
    image: detail.image || base.image,
    race: normalizeTag(detail.race || base.race),
    gender: normalizeTag(detail.gender || base.gender),
    affiliation: normalizeTag(detail.affiliation || base.affiliation),
    ki: detail.ki || base.ki,
    maxKi: detail.maxKi || base.maxKi,
    description: detail.description || base.description,
    planet: origin ? origin.name : "Unknown Planet",
    planetDestroyed: origin ? !!origin.isDestroyed : false,
    transformations,
  };
}

// ---------- State permainan ----------
let pity = 0;
let total = 0;
let ssrCount = 0;
let collection = {};

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ total, pity, ssrCount, collection }));
  } catch (e) {
    // Game tetap berjalan kalau localStorage diblokir.
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
    collection = {};
  }
}

function recordCatch(result) {
  const existing = collection[result.id];
  if (existing) {
    existing.count += 1;
    if (result.aura) existing.aura = true;
  } else {
    collection[result.id] = {
      id: result.id,
      name: result.name,
      image: result.image,
      race: result.race,
      affiliation: result.affiliation,
      planet: result.planet,
      aura: !!result.aura,
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
  fighterName: document.getElementById("pokeName"),
  fighterNum: document.getElementById("dexNum"),
  tags: document.getElementById("types"),
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
function decideRarity() {
  const acak = Math.random();
  if (pity + 1 >= PITY_MAX || acak < RATE_SSR) return "ssr";
  if (acak < RATE_EPIC) return "epic";
  if (acak < RATE_RARE) return "rare";
  return "common";
}

function commitCounters(kelas) {
  total += 1;
  pity += 1;
  if (kelas === "ssr") {
    pity = 0;
    ssrCount += 1;
  }
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

function showError(msg) {
  el.err.textContent = msg;
}

function buildTags(result) {
  el.tags.innerHTML = "";
  [result.race, result.affiliation, result.planet].forEach(t => {
    const badge = document.createElement("span");
    badge.className = "type-badge";
    badge.textContent = t;
    badge.style.background = TAG_COLORS[t] || TAG_COLORS.Other;
    el.tags.appendChild(badge);
  });
}

function buildPowerPanel(result) {
  const rows = [
    { label: "KI", value: formatPower(result.ki) },
    { label: "MAX", value: formatPower(result.maxKi) },
    { label: "FORM", value: result.transformations.length ? result.transformations.length + " transformasi" : "Base form" },
    { label: "PLANET", value: result.planet + (result.planetDestroyed ? " (destroyed)" : "") },
    { label: "BIO", value: shortText(result.description) },
  ];

  el.statsPanel.innerHTML = "";
  rows.forEach(rowData => {
    const row = document.createElement("div");
    row.className = "stat-row db-row";
    row.style.gridTemplateColumns = "48px 1fr";
    row.style.alignItems = "start";
    row.innerHTML =
      '<span class="s-lbl">' + rowData.label + "</span>" +
      '<span class="s-val">' + rowData.value + "</span>";
    row.querySelector(".s-val").style.cssText = "text-align:left;line-height:1.35;overflow-wrap:anywhere;";
    el.statsPanel.appendChild(row);
  });
}

function render(result) {
  el.placeholder.style.display = "none";
  el.sprite.style.display = "block";
  el.sprite.onerror = () => {
    el.sprite.onerror = null;
    el.sprite.style.display = "none";
    el.placeholder.style.display = "flex";
  };
  el.sprite.src = result.image;
  el.sprite.alt = result.name;
  el.shinyBadge.style.display = result.aura ? "block" : "none";

  el.fighterName.textContent = result.name;
  el.fighterNum.textContent = "#" + String(result.id).padStart(3, "0");

  buildTags(result);
  buildPowerPanel(result);

  el.rarity.textContent = result.kelas + (result.aura ? " aura burst" : "");
  el.rarity.className = "rar " + result.kelas;

  el.card.className = "card";
  void el.card.offsetWidth;
  el.card.className = "card " + result.kelas + " reveal" + (result.aura ? " shiny" : "");
}

function addHistory(result) {
  const chip = document.createElement("div");
  chip.className = "chip " + result.kelas + (result.aura ? " shiny" : "");
  const img = document.createElement("img");
  img.src = result.image;
  img.alt = result.name;
  chip.appendChild(img);
  chip.title = result.name + " (" + result.kelas + (result.aura ? ", aura" : "") + ")";
  el.history.prepend(chip);
  while (el.history.children.length > 12) el.history.removeChild(el.history.lastChild);
}

async function pull() {
  const kelas = decideRarity();

  try {
    const base = await pickCharacter(kelas);
    const character = await hydrateCharacter(base);
    const aura = Math.random() < AURA_RATE;
    const result = { ...character, kelas, aura };

    commitCounters(kelas);
    recordCatch(result);
    updateStats();
    render(result);
    addHistory(result);
    checkNewBadges();
    saveState();
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
  for (let i = 0; i < 10; i++) await pull();
  setLoading(false);
});

// ---------- Render koleksi ----------
function renderCollection() {
  const daftar = Object.values(collection).sort((a, b) => a.id - b.id);
  const auraTotal = daftar.filter(m => m.aura).length;

  el.uniqueCount.textContent = daftar.length;
  el.shinyCount.textContent = auraTotal;
  el.collectionEmpty.hidden = daftar.length > 0;

  el.collectionGrid.innerHTML = "";
  daftar.forEach(m => {
    const cell = document.createElement("div");
    cell.className = "dex-cell" + (m.aura ? " shiny" : "");

    const img = document.createElement("img");
    img.src = m.image;
    img.alt = m.name;

    cell.innerHTML =
      (m.aura ? '<span class="shiny-star">AURA</span>' : "") +
      (m.count > 1 ? '<span class="dex-count">x' + m.count + "</span>" : "") +
      '<div class="dex-no">#' + String(m.id).padStart(3, "0") + "</div>";
    cell.insertBefore(img, cell.firstChild);

    const name = document.createElement("div");
    name.className = "dex-name";
    name.textContent = m.name;
    cell.appendChild(name);

    const meta = document.createElement("div");
    meta.className = "dex-meta";
    meta.textContent = m.race + " - " + m.affiliation;
    meta.style.cssText = "font-size:9px;color:var(--muted);line-height:1.25;min-height:22px;overflow:hidden;";
    cell.appendChild(meta);

    el.collectionGrid.appendChild(cell);
  });
}

// ---------- Badge fraksi ----------
const BADGE_GOAL = 3;
const BADGES = [
  { id: "zf", name: "Z Fighter", group: "Z Fighter", icon: "ZF", color: "#2fae5a" },
  { id: "frieza", name: "Frieza Force", group: "Army of Frieza", icon: "FF", color: "#6e5aa8" },
  { id: "saiyan", name: "Saiyan Pride", group: "Saiyan", icon: "SA", color: "#d9572b" },
  { id: "namek", name: "Namekian", group: "Namekian", icon: "NA", color: "#4f9b45" },
  { id: "android", name: "Android", group: "Android", icon: "AN", color: "#8b3ff0" },
  { id: "cosmic", name: "Cosmic", group: "God", icon: "CO", color: "#d99e00" },
];

function countGroup(group) {
  return Object.values(collection).filter(m => m.affiliation === group || m.race === group).length;
}

function earnedBadgeIds() {
  return new Set(BADGES.filter(b => countGroup(b.group) >= BADGE_GOAL).map(b => b.id));
}

function renderBadges() {
  const earned = earnedBadgeIds();
  el.champion.hidden = earned.size < BADGES.length;

  el.badgeGrid.innerHTML = "";
  BADGES.forEach(b => {
    const punya = Math.min(countGroup(b.group), BADGE_GOAL);
    const isEarned = earned.has(b.id);
    const persen = (punya / BADGE_GOAL) * 100;

    const cell = document.createElement("div");
    cell.className = "badge-cell" + (isEarned ? " earned" : "");
    cell.style.setProperty("--gym", b.color);
    cell.style.setProperty("--gym-glow", hexToRgba(b.color, 0.45));
    cell.style.setProperty("--gym-soft", hexToRgba(b.color, 0.12));
    cell.innerHTML =
      (isEarned ? '<span class="badge-check">OK</span>' : "") +
      '<div class="badge-icon">' + b.icon + "</div>" +
      '<div class="badge-name">' + b.name + " Badge</div>" +
      '<div class="badge-gym">' + b.group + "</div>" +
      '<div class="badge-prog-track"><div class="badge-prog-fill" style="width:' + persen + '%"></div></div>' +
      '<div class="badge-prog-txt">' + punya + " / " + BADGE_GOAL + "</div>";
    el.badgeGrid.appendChild(cell);
  });
}

let shownBadges = new Set();
let toastTimer = null;

function showToast(msg) {
  el.toast.textContent = msg;
  el.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.toast.hidden = true; }, 3500);
}

function checkNewBadges() {
  const earned = earnedBadgeIds();
  earned.forEach(id => {
    if (!shownBadges.has(id)) {
      const b = BADGES.find(x => x.id === id);
      showToast("Badge " + b.name + " diraih!");
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
  if (name === "koleksi") renderCollection();
  if (name === "badge") renderBadges();
}

document.querySelectorAll(".tab").forEach(t => {
  t.addEventListener("click", () => switchTab(t.dataset.tab));
});

// ---------- Mulai ----------
loadState();
updateStats();
shownBadges = earnedBadgeIds();

// Warm-up ringan: ambil roster + planet agar error koneksi muncul lebih awal.
Promise.all([getRoster(), getPlanets()]).catch(e => showError(e.message));
