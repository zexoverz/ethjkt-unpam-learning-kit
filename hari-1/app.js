// ==========================================================
// POKÉ GACHA & ARENA - HARI 1 UPGRADED
// Modern Cyberpunk Pokédex with Booster Packs, 3D Card Opening,
// Collection Mastery Badges, and Battle Arena.
// ==========================================================

// ---------- Configurations & State ----------
const PITY_MIN = 7;
const PITY_MAX = 12;

const RATE_SSR = 0.03;
const RATE_EPIC = 0.10;
const RATE_RARE = 0.30;
const SHINY_RATE = 1 / 40;

const API = "https://pokeapi.co/api/v2";
const DEX_MAX = 1025;

const SSR_IDS = [144,145,146,150,151,243,244,245,249,250,251,377,378,379,380,381,382,383,384,385,386,480,481,482,483,484,485,486,487,488,491,492,493,494,638,639,640,641,642,643,644,645,646,647,648,649,716,717,718,719,720,721,785,786,787,788,791,792,800,801,802,807,809,888,889,890,891,892,893,894,895,896,897,898,905,1001,1002,1003,1004,1007,1008,1014,1015,1016,1017,1024];
const EPIC_IDS = [3,6,9,149,248,257,282,373,376,445,448,462,530,635,700,706,784,887,998];
const SPECIAL_IDS = new Set([...SSR_IDS, ...EPIC_IDS]);

// Booster Pack definitions
const PACKS = {
  kanto: {
    name: "Kanto Journey Pack",
    logo: "🔴",
    class: "red-pack",
    desc: "Pokemon dari region Kanto (Gen 1). Rate standar.",
    singleCost: 4,
    packCost: 15,
    ids: Array.from({ length: 151 }, (_, i) => i + 1),
    rates: { ssr: 0.03, epic: 0.10, rare: 0.30 },
    shinyRate: 1 / 40
  },
  eevee: {
    name: "Eevee Spark Pack",
    logo: "🦊",
    class: "eevee-pack",
    desc: "Peluang Shiny tinggi! Berisi keluarga Eevee dan tipe Cute.",
    singleCost: 10,
    packCost: 40,
    ids: [133, 134, 135, 136, 196, 197, 470, 471, 700, 35, 36, 39, 40, 172, 173, 174, 175, 176, 183, 184, 280, 281, 282],
    rates: { ssr: 0.03, epic: 0.12, rare: 0.35 },
    shinyRate: 0.10 // 10% Shiny rate!
  },
  legendary: {
    name: "Legendary Raid Pack",
    logo: "👑",
    class: "gold-pack",
    desc: "Dijamin Epic atau SSR! Konsentrasi tinggi Legendary/Mythical.",
    singleCost: 25,
    packCost: 100,
    ids: [...SSR_IDS, ...EPIC_IDS],
    rates: { ssr: 0.40, epic: 0.60, rare: 0.00 }, // No common/rare
    shinyRate: 1 / 25
  }
};

// Fallback pool in case PokeAPI is down
const FALLBACK_POKEMON = [
  { id: 25, name: "Pikachu", types: ["electric"], stats: [35,55,40,50,50,90], tier: "common" },
  { id: 1, name: "Bulbasaur", types: ["grass", "poison"], stats: [45,49,49,65,65,45], tier: "common" },
  { id: 4, name: "Charmander", types: ["fire"], stats: [39,52,43,60,50,65], tier: "common" },
  { id: 7, name: "Squirtle", types: ["water"], stats: [44,48,65,50,64,43], tier: "common" },
  { id: 94, name: "Gengar", types: ["ghost", "poison"], stats: [60,65,60,130,75,110], tier: "rare" },
  { id: 130, name: "Gyarados", types: ["water", "flying"], stats: [95,125,79,60,100,81], tier: "rare" },
  { id: 143, name: "Snorlax", types: ["normal"], stats: [160,110,65,65,110,30], tier: "rare" },
  { id: 149, name: "Dragonite", types: ["dragon", "flying"], stats: [91,134,95,100,100,80], tier: "epic" },
  { id: 445, name: "Garchomp", types: ["dragon", "ground"], stats: [108,130,95,80,85,102], tier: "epic" },
  { id: 6, name: "Charizard", types: ["fire", "flying"], stats: [78,84,78,109,85,100], tier: "epic" },
  { id: 150, name: "Mewtwo", types: ["psychic"], stats: [106,110,90,154,90,130], tier: "ssr" },
  { id: 384, name: "Rayquaza", types: ["dragon", "flying"], stats: [105,150,90,150,90,95], tier: "ssr" },
  { id: 249, name: "Lugia", types: ["psychic", "flying"], stats: [106,90,130,90,154,110], tier: "ssr" },
  { id: 382, name: "Kyogre", types: ["water"], stats: [100,100,90,150,140,90], tier: "ssr" },
];

const TYPE_COLORS = {
  normal: "#A8A77A", fire: "#EE8130", water: "#6390F0", electric: "#F7D02C",
  grass: "#7AC74C", ice: "#96D9D6", fighting: "#C22E28", poison: "#A33EA1",
  ground: "#E2BF65", flying: "#A98FF3", psychic: "#F95587", bug: "#A6B91A",
  rock: "#B6A136", ghost: "#735797", dragon: "#6F35FC", dark: "#705746",
  steel: "#B7B7CE", fairy: "#D685AD",
};

const STAT_LABELS = {
  "hp": "HP", "attack": "ATK", "defense": "DEF",
  "special-attack": "SpA", "special-defense": "SpD", "speed": "SPD",
};
const STAT_MAX = 255;

// Cache for API responses
const cache = new Map();

// 8-bit Audio Synthesizer (Web Audio API)
const AudioSynth = {
  ctx: null,
  muted: false,
  init() {
    if (!this.ctx && !this.muted) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn("Web Audio API not supported", e);
      }
    }
  },
  toggleMute() {
    this.muted = !this.muted;
    if (this.muted && this.ctx) {
      this.ctx.close().then(() => { this.ctx = null; });
    }
    return this.muted;
  },
  playFlip() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  },
  playRip() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 800;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();

    // Low pop
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.18);
    oscGain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  },
  playCoin() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const playTone = (freq, delay, duration) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.03, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + duration);
    };
    playTone(987.77, 0, 0.08); // B5
    playTone(1318.51, 0.08, 0.2); // E6
  },
  playVictory() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const playTone = (freq, delay, duration) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.02, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + duration);
    };
    const speed = 0.1;
    playTone(523.25, 0, speed); // C5
    playTone(659.25, speed, speed); // E5
    playTone(783.99, speed * 2, speed); // G5
    playTone(1046.50, speed * 3, speed * 3); // C6
  },
  playHit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  },
  playTackle() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(90, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(140, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }
};

// CDN sprits redirection
function lewatCDN(url) {
  if (!url) return url;
  return url.replace(
    "https://raw.githubusercontent.com/PokeAPI/sprites/master/",
    "https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/"
  );
}

function acakAntara(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pilihAcak(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPityTarget() {
  return acakAntara(PITY_MIN, PITY_MAX);
}

function idFromUrl(url) {
  const match = String(url || "").match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : null;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Gagal ambil data dari PokeAPI");
  return res.json();
}

function englishName(items, fallback) {
  const found = (items || []).find(item => item.language && item.language.name === "en");
  return found ? found.name : fallback;
}

function englishFlavor(entries) {
  const found = (entries || []).find(entry => entry.language && entry.language.name === "en");
  return found ? found.flavor_text.replace(/\s+/g, " ") : "";
}

function shortMoves(moves) {
  return (moves || []).slice(0, 4).map(move => rapikanNama(move.move.name));
}

function flattenEvolution(chain, out = []) {
  if (!chain) return out;
  out.push(rapikanNama(chain.species.name));
  chain.evolves_to.forEach(next => flattenEvolution(next, out));
  return out;
}

function rapikanNama(nama) {
  return nama.split("-").map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(" ");
}

// Fetch and Aggregate Pokémon Details
async function getPokemon(id) {
  if (cache.has(id)) return cache.get(id);

  const [p, s] = await Promise.all([
    fetchJson(API + "/pokemon/" + id),
    fetchJson(API + "/pokemon-species/" + id),
  ]);
  const evo = s.evolution_chain ? await fetchJson(s.evolution_chain.url) : null;
  const art = p.sprites.other["official-artwork"];

  const mon = {
    id: p.id,
    speciesId: idFromUrl(s.url),
    name: rapikanNama(p.name),
    genus: englishName(s.genera, "Pokemon"),
    flavorText: englishFlavor(s.flavor_text_entries),
    artwork: lewatCDN(art.front_default),
    shinyArtwork: lewatCDN(art.front_shiny),
    fallbackArt: lewatCDN(p.sprites.front_default),
    cry: p.cries ? p.cries.latest || p.cries.legacy : "",
    heightM: p.height / 10,
    weightKg: p.weight / 10,
    baseExperience: p.base_experience || 0,
    captureRate: s.capture_rate,
    baseHappiness: s.base_happiness,
    generation: s.generation ? rapikanNama(s.generation.name) : "",
    habitat: s.habitat ? rapikanNama(s.habitat.name) : "Unknown",
    abilities: p.abilities.map(a => ({
      name: rapikanNama(a.ability.name),
      hidden: a.is_hidden,
    })),
    types: p.types.map(t => t.type.name),
    stats: p.stats.map(st => ({ name: st.stat.name, value: st.base_stat })),
    bst: p.stats.reduce((sum, st) => sum + st.base_stat, 0),
    moves: shortMoves(p.moves),
    evolutionLine: flattenEvolution(evo && evo.chain),
    isLegendary: s.is_legendary,
    isMythical: s.is_mythical,
  };
  cache.set(id, mon);
  return mon;
}

function artworkUrl(id, shiny) {
  const folder = shiny ? "shiny/" : "";
  return "https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/other/official-artwork/" + folder + id + ".png";
}

function spriteUrl(id) {
  return "https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/" + id + ".png";
}

function localPokemon(kelas) {
  const pool = FALLBACK_POKEMON.filter(p => p.tier === kelas);
  const p = pilihAcak(pool.length ? pool : FALLBACK_POKEMON);
  return {
    id: p.id,
    speciesId: p.id,
    name: p.name,
    genus: kelas === "ssr" ? "Legendary Pokemon" : "Pokemon",
    flavorText: "Data cadangan lokal dipakai saat PokeAPI tidak tersedia.",
    artwork: artworkUrl(p.id, false),
    shinyArtwork: artworkUrl(p.id, true),
    fallbackArt: spriteUrl(p.id),
    cry: "",
    heightM: 0,
    weightKg: 0,
    baseExperience: 0,
    captureRate: 0,
    baseHappiness: 0,
    generation: "Unknown",
    habitat: "Unknown",
    abilities: [],
    types: p.types,
    stats: Object.keys(STAT_LABELS).map((name, i) => ({ name, value: p.stats[i] })),
    bst: p.stats.reduce((sum, value) => sum + value, 0),
    moves: [],
    evolutionLine: [p.name],
    isLegendary: kelas === "ssr",
    isMythical: false,
    offline: true,
  };
}

// ---------- Game State & Persistence ----------
let pity = 0;
let pityTarget = randomPityTarget();
let total = 0;
let ssrCount = 0;
let coins = 100;
let claimCooldown = 0; // timestamp
let collection = {};
let activePack = "kanto";
let soundMuted = false;

const STORAGE_KEY = "pokegacha_state_v2";

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      total, pity, pityTarget, ssrCount, collection, coins, claimCooldown, soundMuted 
    }));
  } catch (e) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    total = s.total || 0;
    pity = s.pity || 0;
    pityTarget = s.pityTarget || randomPityTarget();
    ssrCount = s.ssrCount || 0;
    coins = s.coins !== undefined ? s.coins : 100;
    claimCooldown = s.claimCooldown || 0;
    collection = s.collection || {};
    soundMuted = !!s.soundMuted;
    
    if (soundMuted) {
      AudioSynth.muted = true;
    }
  } catch (e) {
    collection = {};
  }
}

function recordCatch(result) {
  const existing = collection[result.id];
  if (existing) {
    existing.count += 1;
    if (result.shiny) existing.shiny = true;
  } else {
    collection[result.id] = {
      id: result.id,
      name: result.name,
      artwork: result.artwork,
      shinyArtwork: result.shinyArtwork,
      fallbackArt: result.fallbackArt,
      types: result.types,
      shiny: !!result.shiny,
      kelas: result.kelas,
      count: 1,
      stats: result.stats // save stats for battle
    };
  }
}

// ---------- DOM Elements Object ----------
const el = {
  card: document.getElementById("card"),
  spinner: document.getElementById("spinner"),
  sprite: document.getElementById("sprite"),
  shinyBadge: document.getElementById("shinyBadge"),
  placeholder: document.getElementById("placeholder"),
  pokeName: document.getElementById("pokeName"),
  dexNum: document.getElementById("dexNum"),
  genus: document.getElementById("genus"),
  types: document.getElementById("types"),
  rarity: document.getElementById("rarity"),
  flavorText: document.getElementById("flavorText"),
  dataGrid: document.getElementById("dataGrid"),
  abilities: document.getElementById("abilities"),
  moves: document.getElementById("moves"),
  evolutionLine: document.getElementById("evolutionLine"),
  cryBtn: document.getElementById("cryBtn"),
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

  // Upgraded elements
  coinCount: document.getElementById("coinCount"),
  claimBtn: document.getElementById("claimBtn"),
  soundToggle: document.getElementById("soundToggle"),
  pokeSearch: document.getElementById("pokeSearch"),
  typeFilters: document.getElementById("typeFilters"),
  masteryGrid: document.getElementById("masteryGrid"),
  packOverlay: document.getElementById("packOverlay"),
  packWrapperStage: document.getElementById("packWrapperStage"),
  packCardsStage: document.getElementById("packCardsStage"),
  boosterPackWrapper: document.getElementById("boosterPackWrapper"),
  tearPackBtn: document.getElementById("tearPackBtn"),
  cardsFanGrid: document.getElementById("cardsFanGrid"),
  revealAllBtn: document.getElementById("revealAllBtn"),
  doneOpeningBtn: document.getElementById("doneOpeningBtn"),
  detailModal: document.getElementById("detailModal"),
  closeModal: document.getElementById("closeModal"),
  modalContentContainer: document.getElementById("modalContentContainer"),

  // Battle Arena elements
  userPokeSelect: document.getElementById("userPokeSelect"),
  startBattleBtn: document.getElementById("startBattleBtn"),
  exitBattleBtn: document.getElementById("exitBattleBtn"),
  battleSetup: document.getElementById("battleSetup"),
  battleStage: document.getElementById("battleStage"),
  oppName: document.getElementById("oppName"),
  oppHpText: document.getElementById("oppHpText"),
  oppHpFill: document.getElementById("oppHpFill"),
  oppSprite: document.getElementById("oppSprite"),
  playerName: document.getElementById("playerName"),
  playerHpText: document.getElementById("playerHpText"),
  playerHpFill: document.getElementById("playerHpFill"),
  playerSprite: document.getElementById("playerSprite"),
  battleLog: document.getElementById("battleLog"),
  battleActions: document.getElementById("battleActions"),
  battleErr: document.getElementById("battleErr")
};

// ---------- Gacha Mechanics Engine ----------

// Pick ID from specific pack & rarity
function pickIdForPack(packType, rarity) {
  const pack = PACKS[packType];
  let possibleIds = [];
  
  if (rarity === "ssr") {
    possibleIds = pack.ids.filter(id => SSR_IDS.includes(id));
    if (possibleIds.length === 0) possibleIds = SSR_IDS;
  } else if (rarity === "epic") {
    possibleIds = pack.ids.filter(id => EPIC_IDS.includes(id));
    if (possibleIds.length === 0) possibleIds = EPIC_IDS;
  } else {
    possibleIds = pack.ids.filter(id => !SPECIAL_IDS.has(id));
    if (possibleIds.length === 0) possibleIds = pack.ids;
  }
  
  return pilihAcak(possibleIds);
}

// Decide gacha rarity taking pity into account
function decideRarity(packType, currentPity, currentPityTarget) {
  const pack = PACKS[packType];
  const acak = Math.random();
  
  // Pity check
  if (currentPity + 1 >= currentPityTarget) {
    return "ssr";
  }

  // Roll based on pack custom rates
  if (acak < pack.rates.ssr) return "ssr";
  if (acak < pack.rates.ssr + pack.rates.epic) return "epic";
  if (acak < pack.rates.ssr + pack.rates.epic + pack.rates.rare) return "rare";
  return "common";
}

// Generate an array of cards rolls (simulates gacha engine pull-by-pull for pity logic)
function generateRolls(packType, numCards) {
  const rolls = [];
  let tempPity = pity;
  let tempPityTarget = pityTarget;
  const pack = PACKS[packType];

  for (let i = 0; i < numCards; i++) {
    const rarity = decideRarity(packType, tempPity, tempPityTarget);
    const id = pickIdForPack(packType, rarity);
    
    // Simulate pity progression
    tempPity++;
    if (rarity === "ssr") {
      tempPity = 0;
      tempPityTarget = randomPityTarget();
    }

    rolls.push({
      rarity,
      id,
      shinyRate: pack.shinyRate,
      newPity: tempPity,
      newPityTarget: tempPityTarget
    });
  }
  return rolls;
}

function updateCoinsDisplay() {
  el.coinCount.textContent = coins;
}

function updateStats() {
  el.total.textContent = total;
  el.ssrCount.textContent = ssrCount;
  el.pityText.textContent = pity + " / " + pityTarget;
  el.pityFill.style.width = (pity / pityTarget) * 100 + "%";
  updateCoinsDisplay();
}

// ---------- UI Renderers ----------

function buildTypeBadges(container, types) {
  container.innerHTML = "";
  types.forEach(t => {
    const badge = document.createElement("span");
    badge.className = "type-badge";
    badge.textContent = t;
    badge.style.background = TYPE_COLORS[t] || "#666";
    container.appendChild(badge);
  });
}

function buildStatsPanel(container, stats) {
  container.innerHTML = "";
  stats.forEach(s => {
    const row = document.createElement("div");
    row.className = "stat-row";
    const percent = Math.min(100, (s.value / STAT_MAX) * 100);
    row.innerHTML =
      '<span class="s-lbl">' + (STAT_LABELS[s.name] || s.name) + "</span>" +
      '<span class="s-val">' + s.value + "</span>" +
      '<span class="stat-bar"><span style="width:' + percent + '%"></span></span>';
    container.appendChild(row);
  });
}

function buildDataGrid(container, result) {
  const rows = [
    ["Height", result.heightM ? result.heightM.toFixed(1) + " m" : "Unknown"],
    ["Weight", result.weightKg ? result.weightKg.toFixed(1) + " kg" : "Unknown"],
    ["Capture", result.captureRate !== undefined ? result.captureRate : "Unknown"],
    ["Base EXP", result.baseExperience || "Unknown"],
    ["Habitat", result.habitat || "Unknown"],
    ["Generation", result.generation || "Unknown"],
  ];
  container.innerHTML = rows.map(([label, value]) =>
    '<div class="data-cell"><span>' + label + '</span><strong>' + value + '</strong></div>'
  ).join("");
}

function buildPills(container, items, emptyText) {
  container.innerHTML = "";
  const list = items && items.length ? items : [emptyText];
  list.forEach(item => {
    const pill = document.createElement("span");
    pill.className = "info-pill";
    pill.textContent = typeof item === "string" ? item : item.name + (item.hidden ? " (hidden)" : "");
    container.appendChild(pill);
  });
}

function buildEvolution(container, line) {
  const chain = line && line.length ? line : ["Unknown"];
  container.innerHTML = "";
  chain.forEach((name, index) => {
    const item = document.createElement("span");
    item.textContent = name;
    container.appendChild(item);
    if (index < chain.length - 1) {
      const arrow = document.createElement("b");
      arrow.textContent = ">";
      container.appendChild(arrow);
    }
  });
}

function renderMainDexScan(result) {
  el.placeholder.style.display = "none";
  el.sprite.style.display = "block";
  el.sprite.onerror = () => {
    el.sprite.onerror = null;
    if (result.fallbackArt) el.sprite.src = result.fallbackArt;
  };
  el.sprite.src = result.shiny && result.shinyArtwork ? result.shinyArtwork : result.artwork;
  el.sprite.alt = result.name;
  el.shinyBadge.style.display = result.shiny ? "block" : "none";

  el.pokeName.textContent = result.name;
  el.dexNum.textContent = "#" + String(result.id).padStart(3, "0");
  el.genus.textContent = result.genus || "Pokemon";

  buildTypeBadges(el.types, result.types);
  buildDataGrid(el.dataGrid, result);
  buildPills(el.abilities, result.abilities, "Unknown");
  buildPills(el.moves, result.moves, "No move data");
  buildEvolution(el.evolutionLine, result.evolutionLine);
  buildStatsPanel(el.statsPanel, result.stats);
  
  el.cryBtn.hidden = !result.cry;
  el.cryBtn.onclick = result.cry ? () => new Audio(result.cry).play() : null;

  el.rarity.textContent = result.kelas + (result.shiny ? " ✨ shiny" : "");
  el.rarity.className = "rar " + result.kelas;
  el.flavorText.textContent = result.flavorText || "No species description available.";

  // Force reflow for scan CSS pop animation
  el.card.className = "card";
  void el.card.offsetWidth;
  el.card.className = "card " + result.kelas + " reveal" + (result.shiny ? " shiny" : "");
}

function addHistory(result) {
  const chip = document.createElement("div");
  chip.className = "chip " + result.kelas + (result.shiny ? " shiny" : "");
  const img = document.createElement("img");
  img.onerror = () => { img.onerror = null; if (result.fallbackArt) img.src = result.fallbackArt; };
  img.src = result.shiny && result.shinyArtwork ? result.shinyArtwork : result.artwork;
  img.alt = result.name;
  chip.appendChild(img);
  chip.title = result.name + " (" + result.kelas + (result.shiny ? ", shiny" : "") + ")";
  el.history.prepend(chip);
  while (el.history.children.length > 12) {
    el.history.removeChild(el.history.lastChild);
  }
}

// Show micro notification
let toastTimer = null;
function showToast(msg) {
  el.toast.innerHTML = msg;
  el.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.toast.hidden = true; }, 4000);
}

// ---------- interactive Booster Pack Opening Overlay Screen ----------
let packCardsResults = [];
let cardsOpenedCount = 0;

function setupPackOpeningOverlay(numCards, packType) {
  const pack = PACKS[packType];
  
  // Setup Wrapper Design
  el.boosterPackWrapper.className = "booster-pack-wrapper " + pack.class;
  el.boosterPackWrapper.querySelector(".pack-title").textContent = pack.name.split(" ")[0].toUpperCase();
  el.boosterPackWrapper.querySelector(".pack-logo").textContent = pack.logo;

  // Reset display states
  el.packOverlay.hidden = false;
  el.packWrapperStage.style.display = "flex";
  el.packCardsStage.hidden = true;
  el.boosterPackWrapper.style.display = "block";
  
  // Enable rip button
  el.tearPackBtn.disabled = false;
  el.tearPackBtn.textContent = "SOBEK BUNGKUS PACK";

  // Cache rolls
  const rolls = generateRolls(packType, numCards);
  
  // Prepare results array
  packCardsResults = [];
  cardsOpenedCount = 0;
  el.doneOpeningBtn.disabled = true;

  // Create loading grid of face-down cards
  el.cardsFanGrid.innerHTML = "";
  for (let i = 0; i < numCards; i++) {
    const cardEl = document.createElement("div");
    cardEl.className = "flip-card";
    cardEl.dataset.index = i;
    cardEl.innerHTML = `
      <div class="flip-card-inner">
        <div class="flip-card-back">
          <div class="card-logo">${pack.logo}</div>
        </div>
        <div class="flip-card-front" id="card-front-${i}">
          <div class="spinner" style="display:block"></div>
        </div>
      </div>
    `;
    
    cardEl.addEventListener("click", () => flipCard(i));
    el.cardsFanGrid.appendChild(cardEl);
  }

  // Pre-fetch cards data in parallel to avoid lag on reveal
  const promises = rolls.map(async (roll, index) => {
    let mon;
    try {
      mon = await getPokemon(roll.id);
    } catch (e) {
      mon = localPokemon(roll.rarity);
    }
    const shiny = Math.random() < roll.shinyRate && !!mon.shinyArtwork;
    const finalCard = { 
      ...mon, 
      kelas: roll.rarity, 
      shiny,
      newPity: roll.newPity,
      newPityTarget: roll.newPityTarget
    };
    packCardsResults[index] = finalCard;
    
    // Inject contents to the front side of card
    const frontSide = document.getElementById(`card-front-${index}`);
    const src = shiny && finalCard.shinyArtwork ? finalCard.shinyArtwork : finalCard.artwork;
    
    frontSide.className = `flip-card-front ${finalCard.kelas} ${shiny ? 'shiny' : ''}`;
    frontSide.innerHTML = `
      ${shiny ? '<span class="card-shiny-star">✨</span>' : ''}
      <div class="c-dex">#${String(finalCard.id).padStart(3, '0')}</div>
      <img src="${src}" onerror="this.onerror=null; this.src='${finalCard.fallbackArt}'" alt="${finalCard.name}">
      <div class="c-name">${finalCard.name}</div>
      <div class="c-rar ${finalCard.kelas}">${finalCard.kelas}</div>
    `;
  });

  // Handle Sobek Pack click
  const tearAction = () => {
    el.tearPackBtn.disabled = true;
    AudioSynth.playRip();
    
    el.boosterPackWrapper.classList.add("shaking");
    setTimeout(() => {
      el.boosterPackWrapper.classList.remove("shaking");
      el.boosterPackWrapper.classList.add("ripping");
      
      setTimeout(() => {
        el.packWrapperStage.style.display = "none";
        el.packCardsStage.hidden = false;
      }, 550);
    }, 400);
  };

  el.tearPackBtn.onclick = tearAction;
  el.boosterPackWrapper.onclick = tearAction;
}

function flipCard(index) {
  const cardEl = el.cardsFanGrid.querySelector(`.flip-card[data-index="${index}"]`);
  if (!cardEl || cardEl.classList.contains("flipped")) return;

  cardEl.classList.add("flipped");
  AudioSynth.playFlip();

  const data = packCardsResults[index];
  if (data) {
    // Play Pokemon Cry or sparkle sound if Legendary/Shiny
    if (data.kelas === "ssr" || data.shiny) {
      if (data.cry) {
        setTimeout(() => { new Audio(data.cry).play(); }, 200);
      }
    }
  }

  cardsOpenedCount++;
  if (cardsOpenedCount === packCardsResults.length) {
    el.doneOpeningBtn.disabled = false;
  }
}

// Reveal all cards with a cascading delay
el.revealAllBtn.addEventListener("click", () => {
  const unrevealed = Array.from(el.cardsFanGrid.querySelectorAll(".flip-card:not(.flipped)"));
  unrevealed.forEach((card, idx) => {
    setTimeout(() => {
      const index = parseInt(card.dataset.index);
      flipCard(index);
    }, idx * 150);
  });
});

// Pack opening finished — save state & masteries check
el.doneOpeningBtn.addEventListener("click", () => {
  el.packOverlay.hidden = true;
  
  // Identify highest rarity card to highlight
  const rarityRank = { ssr: 4, epic: 3, rare: 2, common: 1 };
  let bestCard = packCardsResults[0];
  
  packCardsResults.forEach(c => {
    // Apply pity progression from the cards card-by-card
    pity = c.newPity;
    pityTarget = c.newPityTarget;
    total += 1;
    if (c.kelas === "ssr") {
      ssrCount += 1;
    }

    recordCatch(c);
    addHistory(c);

    if (rarityRank[c.kelas] > rarityRank[bestCard.kelas]) {
      bestCard = c;
    } else if (rarityRank[c.kelas] === rarityRank[bestCard.kelas] && c.shiny && !bestCard.shiny) {
      bestCard = c;
    }
  });

  // Render best result in scan
  if (bestCard) {
    renderMainDexScan(bestCard);
  }

  // Cooldown / states
  checkCollectionMasteries();
  updateStats();
  saveState();
});

// ---------- Collection List & Filters Rendering ----------
function renderCollection() {
  const searchVal = el.pokeSearch.value.toLowerCase().trim();
  const activeType = el.typeFilters.querySelector(".filter-pill.active").dataset.type;

  const list = Object.values(collection).sort((a, b) => a.id - b.id);
  const filteredList = list.filter(m => {
    // Search matching name
    const matchName = m.name.toLowerCase().includes(searchVal);
    if (!matchName) return false;

    // Type matching / Shiny / SSR filters
    if (activeType === "all") return true;
    if (activeType === "shiny") return m.shiny;
    if (activeType === "ssr") return m.kelas === "ssr";
    return m.types.includes(activeType);
  });

  const shinyCount = list.filter(m => m.shiny).length;
  el.uniqueCount.textContent = list.length;
  el.shinyCount.textContent = shinyCount;
  el.collectionEmpty.hidden = filteredList.length > 0;

  el.collectionGrid.innerHTML = "";
  filteredList.forEach(m => {
    const cell = document.createElement("div");
    cell.className = `dex-cell ${m.kelas} ${m.shiny ? 'shiny' : ''}`;
    
    const src = m.shiny && m.shinyArtwork ? m.shinyArtwork : m.artwork;
    const img = document.createElement("img");
    img.onerror = () => { img.onerror = null; if (m.fallbackArt) img.src = m.fallbackArt; };
    img.src = src;
    img.alt = m.name;

    cell.innerHTML = `
      ${m.shiny ? '<span class="shiny-star">✨</span>' : ""}
      ${m.count > 1 ? '<span class="dex-count">×' + m.count + "</span>" : ""}
      <div class="dex-no">#${String(m.id).padStart(3, "0")}</div>
    `;
    cell.insertBefore(img, cell.firstChild);
    
    const nameEl = document.createElement("div");
    nameEl.className = "dex-name";
    nameEl.textContent = m.name;
    cell.appendChild(nameEl);

    // Click on collection cell opens the inspection detail modal
    cell.addEventListener("click", () => openInspectionModal(m.id));

    el.collectionGrid.appendChild(cell);
  });
}

// Search and filter inputs listener
el.pokeSearch.addEventListener("input", renderCollection);
el.typeFilters.querySelectorAll(".filter-pill").forEach(pill => {
  pill.addEventListener("click", () => {
    el.typeFilters.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    renderCollection();
  });
});

// ---------- Detailed Inspection Modal ----------
async function openInspectionModal(id) {
  el.detailModal.hidden = false;
  el.modalContentContainer.innerHTML = `<div class="spinner" style="display:block; margin: 40px auto;"></div>`;

  try {
    const data = await getPokemon(id);
    const caughtInfo = collection[id] || {};
    const shiny = !!caughtInfo.shiny;
    const isSSR = SSR_IDS.includes(id);
    const kelas = isSSR ? "ssr" : (EPIC_IDS.includes(id) ? "epic" : (data.bst >= 440 ? "rare" : "common"));
    
    const src = shiny && data.shinyArtwork ? data.shinyArtwork : data.artwork;

    el.modalContentContainer.innerHTML = `
      <div class="scan-result-container" style="border:none; box-shadow:none; padding:0; background:transparent;">
        <div class="stage">
          <div class="card ${kelas} ${shiny ? 'shiny' : ''}" style="margin: 0 auto;">
            ${shiny ? '<span class="shiny-badge" style="display:block">✨ SHINY</span>' : ''}
            <img class="sprite" src="${src}" onerror="this.onerror=null; this.src='${data.fallbackArt}'" style="display:block;" alt="${data.name}">
          </div>
        </div>
        <div class="poke-info">
          <div class="poke-name">${data.name} <span class="dex">#${String(data.id).padStart(3, "0")}</span></div>
          <div class="genus">${data.genus}</div>
          <div class="types" id="modalTypes"></div>
          <div class="rar ${kelas}">${kelas} ${shiny ? '✨ shiny' : ''}</div>
          <p class="flavor">${data.flavorText || "No description."}</p>
          <div class="data-grid" id="modalDataGrid"></div>
          
          <div class="detail-block">
            <div class="detail-title">Abilities</div>
            <div class="pill-list" id="modalAbilities"></div>
          </div>
          <div class="detail-block">
            <div class="detail-title">Moves</div>
            <div class="pill-list" id="modalMoves"></div>
          </div>
          <div class="detail-block">
            <div class="detail-title">Evolution</div>
            <div class="evolution-line" id="modalEvolution"></div>
          </div>
          <button class="cry-btn" id="modalCryBtn">🔊 Putar Suara Tangisan</button>
          <div class="stats-panel" id="modalStatsPanel"></div>
        </div>
      </div>
    `;

    // Render inner content of modal
    buildTypeBadges(document.getElementById("modalTypes"), data.types);
    buildDataGrid(document.getElementById("modalDataGrid"), data);
    buildPills(document.getElementById("modalAbilities"), data.abilities, "Unknown");
    buildPills(document.getElementById("modalMoves"), data.moves, "No move data");
    buildEvolution(document.getElementById("modalEvolution"), data.evolutionLine);
    buildStatsPanel(document.getElementById("modalStatsPanel"), data.stats);

    const cryBtn = document.getElementById("modalCryBtn");
    cryBtn.hidden = !data.cry;
    if (data.cry) {
      cryBtn.onclick = () => new Audio(data.cry).play();
    }
  } catch (e) {
    el.modalContentContainer.innerHTML = `<p class="err">${e.message}</p>`;
  }
}

el.closeModal.addEventListener("click", () => { el.detailModal.hidden = true; });
window.addEventListener("click", (e) => {
  if (e.target === el.detailModal) el.detailModal.hidden = true;
});

// ---------- Gym Badges & Mastery Collection Badges ----------
const BADGE_GOAL = 3;
const GYM_BADGES = [
  { id: "boulder", name: "Boulder", gym: "Pewter",    type: "rock",     icon: "🪨", color: "#B6A136" },
  { id: "cascade", name: "Cascade", gym: "Cerulean",  type: "water",    icon: "💧", color: "#6390F0" },
  { id: "thunder", name: "Thunder", gym: "Vermilion", type: "electric", icon: "⚡", color: "#E8B900" },
  { id: "rainbow", name: "Rainbow", gym: "Celadon",   type: "grass",    icon: "🌿", color: "#7AC74C" },
  { id: "soul",    name: "Soul",    gym: "Fuchsia",   type: "poison",   icon: "☠️", color: "#A33EA1" },
  { id: "marsh",   name: "Marsh",   gym: "Saffron",   type: "psychic",  icon: "🔮", color: "#F95587" },
  { id: "volcano", name: "Volcano", gym: "Cinnabar",  type: "fire",     icon: "🔥", color: "#EE8130" },
  { id: "earth",   name: "Earth",   gym: "Viridian",  type: "ground",   icon: "⛰️", color: "#C79A45" },
];

const SPECIAL_COLLECTIONS = [
  {
    id: "starters",
    name: "Starter Squad",
    badgeName: "Oak's Choice Badge",
    desc: "Kumpulkan 3 starter legendaris Kanto & evolusinya.",
    icon: "🌿🔥💧",
    ids: [1, 2, 3, 4, 5, 6, 7, 8, 9] // Bulbasaur family, Charmander family, Squirtle family
  },
  {
    id: "eeveelutions",
    name: "Eevee Clan",
    badgeName: "Adaptability Badge",
    desc: "Kumpulkan Eevee dan 8 bentuk evolusinya.",
    icon: "🧬🦊",
    ids: [133, 134, 135, 136, 196, 197, 470, 471, 700]
  },
  {
    id: "legendary_birds",
    name: "Legendary Birds",
    badgeName: "Winged Trinity",
    desc: "Kumpulkan Articuno, Zapdos, dan Moltres.",
    icon: "🦅❄️",
    ids: [144, 145, 146]
  },
  {
    id: "weather_trio",
    name: "Weather Lords",
    badgeName: "Sky Pillar Crown",
    desc: "Kumpulkan Trio Cuaca: Kyogre, Groudon, Rayquaza.",
    icon: "⛈️🐉",
    ids: [382, 383, 384]
  },
  {
    id: "mew_duo",
    name: "Mew Gene",
    badgeName: "Gene Splicer Badge",
    desc: "Kumpulkan Mew dan klonnya Mewtwo.",
    icon: "🔮🧬",
    ids: [150, 151]
  }
];

let earnedBadges = new Set();
let masteredCollections = new Set();

function countType(type) {
  return Object.values(collection).filter(m => m.types.includes(type)).length;
}

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + alpha + ")";
}

function renderBadgesTab() {
  // 1. Render Gym Badges
  const gymEarned = GYM_BADGES.filter(b => countType(b.type) >= BADGE_GOAL);
  el.champion.hidden = gymEarned.length < GYM_BADGES.length;

  el.badgeGrid.innerHTML = "";
  GYM_BADGES.forEach(b => {
    const count = Math.min(countType(b.type), BADGE_GOAL);
    const isEarned = count >= BADGE_GOAL;
    const pct = (count / BADGE_GOAL) * 100;

    const cell = document.createElement("div");
    cell.className = "badge-cell" + (isEarned ? " earned" : "");
    cell.style.setProperty("--gym", b.color);
    cell.style.setProperty("--gym-glow", hexToRgba(b.color, 0.45));
    cell.style.setProperty("--gym-soft", hexToRgba(b.color, 0.12));
    
    cell.innerHTML = `
      ${isEarned ? '<span class="badge-check">✔</span>' : ""}
      <div class="badge-icon">${b.icon}</div>
      <div class="badge-name">${b.name} Badge</div>
      <div class="badge-gym">${b.gym} · ${b.type}</div>
      <div class="badge-prog-track"><div class="badge-prog-fill" style="width:${pct}%"></div></div>
      <div class="badge-prog-txt">${count} / ${BADGE_GOAL}</div>
    `;
    el.badgeGrid.appendChild(cell);
  });

  // 2. Render Mastery Badges
  el.masteryGrid.innerHTML = "";
  SPECIAL_COLLECTIONS.forEach(col => {
    const ownedCount = col.ids.filter(id => collection[id]).length;
    const isMastered = ownedCount === col.ids.length;
    const pct = (ownedCount / col.ids.length) * 100;

    const card = document.createElement("div");
    card.className = "mastery-card" + (isMastered ? " mastered" : "");
    
    // Build Pokémon Checklist icons
    let checklistHtml = "";
    col.ids.forEach(id => {
      const owned = !!collection[id];
      const name = rapikanNama(FALLBACK_POKEMON.find(f => f.id === id)?.name || `ID ${id}`);
      checklistHtml += `
        <div class="checklist-item ${owned ? 'owned' : 'missing'}" title="${name}">
          <img src="${artworkUrl(id, false)}" onerror="this.onerror=null; this.src='${spriteUrl(id)}'" alt="">
        </div>
      `;
    });

    card.innerHTML = `
      <div class="mastery-header">
        <div class="mastery-badge-icon">${col.icon}</div>
        <div class="mastery-info">
          <div class="mastery-title">${col.name}</div>
          <div class="mastery-badge-name">${col.badgeName}</div>
        </div>
      </div>
      <p class="mastery-desc">${col.desc}</p>
      <div class="mastery-checklist">${checklistHtml}</div>
      <div class="mastery-footer">
        <div class="mastery-progress-bar">
          <div class="mastery-progress-fill" style="width: ${pct}%"></div>
        </div>
        <div class="mastery-progress-text">${ownedCount} / ${col.ids.length}</div>
      </div>
    `;

    el.masteryGrid.appendChild(card);
  });
}

function checkCollectionMasteries() {
  // Check gym badges
  GYM_BADGES.forEach(b => {
    const isEarned = countType(b.type) >= BADGE_GOAL;
    if (isEarned && !earnedBadges.has(b.id)) {
      earnedBadges.add(b.id);
      showToast(`${b.icon} Badge <strong>${b.name} Gym</strong> didapatkan!`);
      AudioSynth.playVictory();
    }
  });

  // Check special collections
  SPECIAL_COLLECTIONS.forEach(col => {
    const allOwned = col.ids.every(id => collection[id]);
    if (allOwned && !masteredCollections.has(col.id)) {
      masteredCollections.add(col.id);
      showToast(`🏆 Koleksi Terkuasai! Menggenggam <strong>${col.badgeName}</strong>!`);
      AudioSynth.playVictory();
    }
  });
}

// ---------- TAB: BATTLE ARENA (GAMEPLAY LOOP) ----------
let activeBattleInterval = null;
let playerHp = 100;
let oppHp = 100;
let userFighter = null;
let oppFighter = null;
let activeBattleTier = "trainer";

const ATTACK_MOVES = [
  "Tackle", "Thunderbolt", "Flamethrower", "Hydro Pump", 
  "Vine Whip", "Bite", "Psychic", "Hyper Beam", "Air Slash", 
  "Dragon Rage", "Earthquake", "Ice Beam", "Shadow Ball"
];

function getStatValue(stats, name) {
  return stats.find(s => s.name === name)?.value || 50;
}

// Setup Battle dropdown with owned Pokemon
function prepareBattleSetup() {
  el.userPokeSelect.innerHTML = "";
  const owned = Object.values(collection).sort((a,b) => a.id - b.id);
  
  if (owned.length === 0) {
    el.userPokeSelect.innerHTML = `<option value="">-- Belum ada Pokemon --</option>`;
    el.startBattleBtn.disabled = true;
    return;
  }

  el.startBattleBtn.disabled = false;
  owned.forEach(m => {
    const isShiny = m.shiny ? "✨ Shiny " : "";
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = `${isShiny}${m.name} (BST: ${m.stats.reduce((s,x)=>s+x.value, 0)})`;
    el.userPokeSelect.appendChild(opt);
  });
}

// Select Battle Opponent Tier
document.querySelectorAll(".battle-tier-card").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".battle-tier-card").forEach(c => c.classList.remove("active"));
    card.classList.add("active");
    activeBattleTier = card.dataset.tier;
  });
});

el.startBattleBtn.addEventListener("click", async () => {
  el.battleErr.textContent = "";
  const userId = el.userPokeSelect.value;
  if (!userId) {
    el.battleErr.textContent = "Pilih petarung terlebih dahulu!";
    return;
  }

  // Cost entry validation
  const tierCost = { trainer: 5, leader: 15, elite: 30, champion: 50 };
  const cost = tierCost[activeBattleTier];

  if (coins < cost) {
    el.battleErr.textContent = `Koin tidak cukup! Butuh 🪙 ${cost}`;
    return;
  }

  // Deduct Entry fee
  coins -= cost;
  updateCoinsDisplay();
  saveState();

  // Get Player Fighter
  userFighter = collection[userId];

  // Pick AI opponent
  let oppId;
  if (activeBattleTier === "trainer") {
    // Common
    let pool = FALLBACK_POKEMON.filter(p => p.tier === "common").map(p => p.id);
    oppId = pilihAcak(pool.length ? pool : [1, 4, 7, 25]);
  } else if (activeBattleTier === "leader") {
    // Rare / Medium
    let pool = FALLBACK_POKEMON.filter(p => p.tier === "rare").map(p => p.id);
    oppId = pilihAcak(pool.length ? pool : [94, 130, 143]);
  } else if (activeBattleTier === "elite") {
    // Epic / Heavy
    oppId = pilihAcak(EPIC_IDS);
  } else {
    // SSR / Legendary
    oppId = pilihAcak(SSR_IDS);
  }

  // Transition UI
  el.battleSetup.hidden = true;
  el.battleStage.hidden = false;
  el.battleActions.hidden = true;
  el.battleLog.innerHTML = `<div class="battle-log-row battle-log-system">Menghubungi data lawan...</div>`;
  
  // HP reset
  playerHp = 100;
  oppHp = 100;
  updateHpBar("player", 100);
  updateHpBar("opp", 100);

  // Load Sprites
  const userShiny = !!userFighter.shiny;
  el.playerSprite.src = userShiny && userFighter.shinyArtwork ? userFighter.shinyArtwork : userFighter.artwork;
  el.playerName.textContent = userFighter.name;

  try {
    oppFighter = await getPokemon(oppId);
    el.oppSprite.src = oppFighter.artwork;
    el.oppName.textContent = oppFighter.name;
    
    // Start Fight Simulation loop
    startFightLoop();
  } catch (e) {
    el.battleLog.innerHTML += `<div class="battle-log-row battle-log-system">Koneksi API lambat. Menggunakan data cadangan.</div>`;
    oppFighter = localPokemon(activeBattleTier === "champion" ? "ssr" : (activeBattleTier === "elite" ? "epic" : "rare"));
    el.oppSprite.src = oppFighter.artwork;
    el.oppName.textContent = oppFighter.name;
    startFightLoop();
  }
});

function updateHpBar(who, val) {
  const fill = document.getElementById(`${who}HpFill`);
  const text = document.getElementById(`${who}HpText`);
  
  fill.style.width = val + "%";
  text.textContent = `HP: ${val}/100`;

  // Color dynamic
  if (val > 50) {
    fill.style.background = "#2ed573";
  } else if (val > 20) {
    fill.style.background = "#ffa502";
  } else {
    fill.style.background = "#ff4757";
  }
}

function startFightLoop() {
  el.battleLog.innerHTML = `<div class="battle-log-row battle-log-system">Pertarungan dimulai! ⚔️</div>`;
  el.battleLog.innerHTML += `<div class="battle-log-row battle-log-system">${userFighter.name} vs ${oppFighter.name}</div>`;

  const pSpeed = getStatValue(userFighter.stats, "speed");
  const oSpeed = getStatValue(oppFighter.stats, "speed");
  
  let playerTurn = pSpeed >= oSpeed; // Higher speed attacks first
  
  activeBattleInterval = setInterval(() => {
    if (playerHp <= 0 || oppHp <= 0) {
      endBattle();
      return;
    }

    if (playerTurn) {
      // Player attacks Opponent
      const dmg = calculateDamage(userFighter, oppFighter);
      oppHp = Math.max(0, oppHp - dmg.value);
      updateHpBar("opp", oppHp);

      animateFighter("player", "opp");
      AudioSynth.playTackle();

      el.oppSprite.parentElement.classList.add("shake-animation");
      setTimeout(() => el.oppSprite.parentElement.classList.remove("shake-animation"), 400);

      const isCrit = dmg.crit ? " (KRITIS!)" : "";
      el.battleLog.innerHTML += `<div class="battle-log-row battle-log-player">${userFighter.name} menggunakan <strong>${pilihAcak(ATTACK_MOVES)}</strong>! Musuh kehilangan ${dmg.value} HP.${isCrit}</div>`;
    } else {
      // Opponent attacks Player
      const dmg = calculateDamage(oppFighter, userFighter);
      playerHp = Math.max(0, playerHp - dmg.value);
      updateHpBar("player", playerHp);

      animateFighter("opp", "player");
      AudioSynth.playHit();

      el.playerSprite.parentElement.classList.add("shake-animation");
      setTimeout(() => el.playerSprite.parentElement.classList.remove("shake-animation"), 400);

      const isCrit = dmg.crit ? " (KRITIS!)" : "";
      el.battleLog.innerHTML += `<div class="battle-log-row battle-log-opp">${oppFighter.name} membalas dengan <strong>${pilihAcak(ATTACK_MOVES)}</strong>! Kamu kehilangan ${dmg.value} HP.${isCrit}</div>`;
    }

    // Scroll battle logs to bottom
    el.battleLog.scrollTop = el.battleLog.scrollHeight;
    
    // Toggle turn
    playerTurn = !playerTurn;
  }, 1000);
}

function animateFighter(attacker, defender) {
  const element = document.getElementById(`${attacker}Sprite`).parentElement;
  element.classList.add("bounce-animation");
  setTimeout(() => element.classList.remove("bounce-animation"), 400);
}

function calculateDamage(attacker, defender) {
  const attVal = getStatValue(attacker.stats, "attack");
  const defVal = getStatValue(defender.stats, "defense");
  
  // damage formula modified
  const baseDmg = 18;
  const ratio = attVal / defVal;
  const mod = 0.85 + Math.random() * 0.3;
  let val = Math.floor(baseDmg * ratio * mod);

  // boundary constraints
  val = Math.max(6, Math.min(val, 45));

  // Critical hit roll 10%
  const isCrit = Math.random() < 0.12;
  if (isCrit) val = Math.floor(val * 1.5);

  return { value: val, crit: isCrit };
}

function endBattle() {
  clearInterval(activeBattleInterval);
  activeBattleInterval = null;
  el.battleActions.hidden = false;

  const rewardCoins = { trainer: 15, leader: 45, elite: 100, champion: 200 };
  const winPrize = rewardCoins[activeBattleTier];

  if (playerHp > 0) {
    // Victory!
    coins += winPrize;
    el.battleLog.innerHTML += `<div class="battle-log-row battle-log-system">🎉 Kamu MENANG! Dapat hadiah 🪙 ${winPrize}.</div>`;
    AudioSynth.playVictory();
  } else {
    // Defeat consolation
    coins += 3;
    el.battleLog.innerHTML += `<div class="battle-log-row battle-log-opp">💀 Kamu KALAH! Uang hiburan diberikan 🪙 3.</div>`;
    
    // Low retro fail tone
    if (!AudioSynth.muted) {
      AudioSynth.init();
      if (AudioSynth.ctx) {
        const osc = AudioSynth.ctx.createOscillator();
        const gain = AudioSynth.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(120, AudioSynth.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, AudioSynth.ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.06, AudioSynth.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, AudioSynth.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(AudioSynth.ctx.destination);
        osc.start();
        osc.stop(AudioSynth.ctx.currentTime + 0.3);
      }
    }
  }
  
  updateCoinsDisplay();
  saveState();
}

el.exitBattleBtn.addEventListener("click", () => {
  el.battleSetup.hidden = false;
  el.battleStage.hidden = true;
  prepareBattleSetup();
});

// ---------- Coin Claims & Muting Listener ----------
el.claimBtn.addEventListener("click", () => {
  const now = Date.now();
  if (now < claimCooldown) {
    const diff = Math.ceil((claimCooldown - now) / 1000);
    showToast(`⏳ Tunggu <strong>${diff}</strong> detik lagi sebelum klaim koin!`);
    return;
  }

  // Claim
  coins += 50;
  claimCooldown = now + (30 * 1000); // 30s cooldown for easy gacha tests
  updateCoinsDisplay();
  AudioSynth.playCoin();
  showToast("🪙 50 Koin ditambahkan!");
  saveState();
  startCooldownTimer();
});

function startCooldownTimer() {
  const updateTimer = () => {
    const now = Date.now();
    if (now >= claimCooldown) {
      el.claimBtn.disabled = false;
      el.claimBtn.textContent = "🎁 Klaim +50 Koin";
      return;
    }

    el.claimBtn.disabled = true;
    const diff = Math.ceil((claimCooldown - now) / 1000);
    el.claimBtn.textContent = `⏳ ${diff}s Cooldown`;
    setTimeout(updateTimer, 1000);
  };
  updateTimer();
}

// Sound toggle controls
el.soundToggle.addEventListener("click", () => {
  const isMuted = AudioSynth.toggleMute();
  soundMuted = isMuted;
  
  // Indicate in lens glow visual styles
  if (isMuted) {
    el.soundToggle.querySelector(".lens").style.background = "radial-gradient(circle at 30% 30%, #7d8b9e 0%, #30353c 55%, #18191c 100%)";
    el.soundToggle.querySelector(".lens").style.boxShadow = "inset 0 -4px 8px rgba(0,0,0,0.5)";
    showToast("🔊 Efek Suara Dimatikan");
  } else {
    el.soundToggle.querySelector(".lens").style.background = "radial-gradient(circle at 30% 30%, #eefcff 0%, #00d1b2 45%, #006053 100%)";
    el.soundToggle.querySelector(".lens").style.boxShadow = "0 4px 15px rgba(0, 209, 178, 0.4), inset 0 -4px 8px rgba(0,0,0,0.3)";
    AudioSynth.playCoin();
    showToast("🔊 Efek Suara Diaktifkan");
  }
  saveState();
});

// ---------- Booster Pack Selection Store ----------
document.querySelectorAll(".pack-card").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".pack-card").forEach(c => c.classList.remove("active"));
    card.classList.add("active");
    activePack = card.dataset.pack;
  });
});

// Upgrade Gacha Pull triggers to route to Interactive Pack overlay
el.tarik1.addEventListener("click", () => {
  const pack = PACKS[activePack];
  if (coins < pack.singleCost) {
    showToast(`🪙 Koin tidak cukup! Butuh ${pack.singleCost} koin.`);
    return;
  }
  coins -= pack.singleCost;
  updateCoinsDisplay();
  saveState();
  setupPackOpeningOverlay(1, activePack);
});

el.tarik10.addEventListener("click", () => {
  const pack = PACKS[activePack];
  if (coins < pack.packCost) {
    showToast(`🪙 Koin tidak cukup! Butuh ${pack.packCost} koin.`);
    return;
  }
  coins -= pack.packCost;
  updateCoinsDisplay();
  saveState();
  setupPackOpeningOverlay(5, activePack); // Booster pack contains 5 cards!
});

// ---------- Tab Switch Navigation ----------
function switchTab(name) {
  document.querySelectorAll(".tab").forEach(t => {
    t.classList.toggle("active", t.dataset.tab === name);
  });
  document.querySelectorAll(".tab-panel").forEach(p => {
    p.hidden = p.id !== "panel-" + name;
  });
  
  if (name === "koleksi") renderCollection();
  if (name === "badge") renderBadgesTab();
  if (name === "battle") prepareBattleSetup();
}

document.querySelectorAll(".tab").forEach(t => {
  t.addEventListener("click", () => switchTab(t.dataset.tab));
});

// ---------- Initial Boot Setup ----------
loadState();
updateStats();
checkCollectionMasteries();

if (claimCooldown > Date.now()) {
  startCooldownTimer();
}

// Sync visual sound state on load
if (soundMuted) {
  el.soundToggle.querySelector(".lens").style.background = "radial-gradient(circle at 30% 30%, #7d8b9e 0%, #30353c 55%, #18191c 100%)";
  el.soundToggle.querySelector(".lens").style.boxShadow = "inset 0 -4px 8px rgba(0,0,0,0.5)";
}

// Initial placeholder state
el.placeholder.style.display = "flex";
el.sprite.style.display = "none";
el.shinyBadge.style.display = "none";
el.cryBtn.hidden = true;
el.rarity.textContent = "";
el.rarity.className = "rar";
el.pokeName.textContent = "—";
el.dexNum.textContent = "";
el.genus.textContent = "Menunggu Pemindaian";
el.types.innerHTML = "";
el.dataGrid.innerHTML = "";
el.abilities.innerHTML = "";
el.moves.innerHTML = "";
el.evolutionLine.innerHTML = "";
el.statsPanel.innerHTML = "";
el.err.textContent = "";

// Pre-fill history list on load if collection exists
const collectionList = Object.values(collection);
if (collectionList.length > 0) {
  // Add latest few items to visual history list
  const historyItems = collectionList.slice(-6);
  historyItems.forEach(h => addHistory(h));
  
  // Render details of the latest collected pokemon
  renderMainDexScan(collectionList[collectionList.length - 1]);
}
