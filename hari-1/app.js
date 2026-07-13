// ==========================================================
// POKÉ GACHA - HARI 1 UPGRADED
// Simulator gacha yang menarik Pokémon ASLI dari PokeAPI.
// ==========================================================

// ---------- Konfigurasi rarity & pity ----------
const PITY_MAX = 10; // tarikan ke-10 dijamin Legendary (SSR) kalau belum dapat

// Peluang tiap tier (dicek berurutan): SSR 3%, EPIC 10%, RARE 30%, sisanya COMMON.
const RATE_SSR = 0.03;
const RATE_EPIC = 0.10;
const RATE_RARE = 0.30;

const SHINY_RATE = 1 / 40; // peluang setiap Pokémon keluar versi shiny

// ---------- Sumber data: PokeAPI ----------
const API = "https://pokeapi.co/api/v2";
const DEX_MAX = 1025; // batas National Dex yang punya official artwork

// Kolam ID Pokémon per tier (Legendary/Mythical & Pseudo-Legendary)
const SSR_IDS = [144,145,146,150,151,243,244,245,249,250,251,377,378,379,380,381,382,383,384,385,386,480,481,482,483,484,485,486,487,488,491,492,493,494,638,639,640,641,642,643,644,645,646,647,648,649,716,717,718,719,720,721,785,786,787,788,791,792,800,801,802,807,809,888,889,890,891,892,893,894,895,896,897,898,905,1001,1002,1003,1004,1007,1008,1014,1015,1016,1017,1024];
const EPIC_IDS = [3,6,9,149,248,257,282,373,376,445,448,462,530,635,700,706,784,887,998];
const SPECIAL_IDS = new Set([...SSR_IDS, ...EPIC_IDS]);

// Warna resmi tiap tipe Pokémon (untuk badge tipe)
const TYPE_COLORS = {
  normal: "#A8A77A", fire: "#EE8130", water: "#6390F0", electric: "#F7D02C",
  grass: "#7AC74C", ice: "#96D9D6", fighting: "#C22E28", poison: "#A33EA1",
  ground: "#E2BF65", flying: "#A98FF3", psychic: "#F95587", bug: "#A6B91A",
  rock: "#B6A136", ghost: "#735797", dragon: "#6F35FC", dark: "#705746",
  steel: "#B7B7CE", fairy: "#D685AD",
};

// Label pendek untuk 6 stat dasar
const STAT_LABELS = {
  "hp": "HP", "attack": "ATK", "defense": "DEF",
  "special-attack": "SpA", "special-defense": "SpD", "speed": "SPD",
};
const STAT_MAX = 255; // stat dasar tertinggi untuk skala bar

// Cache hasil fetch
const cache = new Map();

// jsDelivr CDN mirror bypass untuk rate-limit PokeAPI sprites
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

// Pilih ID Pokémon sesuai tier hasil roll
function pickId(kelas) {
  if (kelas === "ssr") return pilihAcak(SSR_IDS);
  if (kelas === "epic") return pilihAcak(EPIC_IDS);
  let id;
  do { id = acakAntara(1, DEX_MAX); } while (SPECIAL_IDS.has(id));
  return id;
}

function rapikanNama(nama) {
  return nama.split("-").map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(" ");
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================================
// AUDIO ENGINE (Web Audio API Synthesizers)
// ==========================================================
const AudioEngine = {
  ctx: null,
  muted: localStorage.getItem("pokegacha_muted") === "1",
  
  init() {
    try {
      if (!this.ctx) {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (AudioCtxClass) {
          this.ctx = new AudioCtxClass();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn("AudioContext not supported on this platform:", e);
    }
  },
  
  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem("pokegacha_muted", this.muted ? "1" : "0");
    return this.muted;
  },

  playClick() {
    this.init();
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.08);
    
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    
    osc.start(t);
    osc.stop(t + 0.08);
  },

  playRollClick() {
    this.init();
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.setValueAtTime(90, t + 0.04);
    
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.setValueAtTime(0, t + 0.04);
    
    osc.start(t);
    osc.stop(t + 0.05);
  },

  playReveal(rarity) {
    this.init();
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    
    if (rarity === "ssr") {
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, t + i * 0.1);
        
        gain.gain.setValueAtTime(0, t + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.07, t + i * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.4);
        
        osc.start(t + i * 0.1);
        osc.stop(t + i * 0.1 + 0.45);
      });
    } else if (rarity === "epic") {
      const notes = [261.63, 392.00, 523.25];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t + i * 0.08);
        
        gain.gain.setValueAtTime(0, t + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.05, t + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.3);
        
        osc.start(t + i * 0.08);
        osc.stop(t + i * 0.08 + 0.35);
      });
    } else if (rarity === "rare") {
      const notes = [523.25, 659.25];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t + i * 0.06);
        
        gain.gain.setValueAtTime(0, t + i * 0.06);
        gain.gain.linearRampToValueAtTime(0.05, t + i * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.2);
        
        osc.start(t + i * 0.06);
        osc.stop(t + i * 0.06 + 0.25);
      });
    } else {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(392.00, t);
      
      gain.gain.setValueAtTime(0.03, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      
      osc.start(t);
      osc.stop(t + 0.18);
    }
  },

  playShinySparkle() {
    this.init();
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const freqs = [1300, 1600, 1900, 2200];
    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t + i * 0.05);
      
      gain.gain.setValueAtTime(0, t + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.03, t + i * 0.05 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.12);
      
      osc.start(t + i * 0.05);
      osc.stop(t + i * 0.05 + 0.15);
    });
  },

  playBadgeEarned() {
    this.init();
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t + i * 0.1);
      
      gain.gain.setValueAtTime(0, t + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.06, t + i * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.45);
      
      osc.start(t + i * 0.1);
      osc.stop(t + i * 0.1 + 0.5);
    });
  }
};

// ==========================================================
// CANVAS EFFECT ENGINE (Particle System overlay inside cards)
// ==========================================================
const CanvasEffect = {
  canvas: null,
  ctx: null,
  particles: [],
  animationId: null,
  active: false,

  init(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext("2d");
    this.resize();
    window.addEventListener("resize", () => this.resize());
  },

  resize() {
    if (this.canvas) {
      this.canvas.width = this.canvas.offsetWidth;
      this.canvas.height = this.canvas.offsetHeight;
    }
  },

  start(rarity, isShiny) {
    if (!this.canvas) return;
    this.resize();
    this.particles = [];
    this.active = true;
    
    const count = rarity === "ssr" ? 70 : rarity === "epic" ? 45 : rarity === "rare" ? 25 : 12;
    
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(rarity, isShiny));
    }

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.tick();
  },

  stop() {
    this.active = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  },

  createParticle(rarity, isShiny) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    let color;
    if (isShiny) {
      color = `hsl(${Math.random() * 30 + 45}, 100%, 75%)`; // shiny gold-yellow
    } else {
      switch (rarity) {
        case "ssr":
          color = `hsl(${Math.random() * 25 + 40}, 100%, 65%)`; // gold/amber
          break;
        case "epic":
          color = `hsl(${Math.random() * 40 + 260}, 100%, 70%)`; // purple/indigo
          break;
        case "rare":
          color = `hsl(${Math.random() * 30 + 195}, 100%, 60%)`; // blue
          break;
        default:
          color = `rgba(180, 200, 220, 0.4)`; // common dusty grey/blue
      }
    }

    return {
      x: w / 2,
      y: h / 2 + 10,
      vx: (Math.random() - 0.5) * (rarity === "ssr" ? 4.5 : 3),
      vy: (Math.random() - 0.5) * (rarity === "ssr" ? 4.5 : 3) - 1.5, // slightly upward bias
      size: Math.random() * (rarity === "ssr" ? 3.5 : 2.5) + 1,
      alpha: 1,
      decay: Math.random() * 0.015 + 0.01,
      color: color,
      shape: (isShiny || rarity === "ssr") ? "star" : "circle"
    };
  },

  tick() {
    if (!this.active) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw and update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      
      if (p.shape === "star") {
        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y - p.size);
        this.ctx.lineTo(p.x + p.size / 3, p.y - p.size / 3);
        this.ctx.lineTo(p.x + p.size, p.y);
        this.ctx.lineTo(p.x + p.size / 3, p.y + p.size / 3);
        this.ctx.lineTo(p.x, p.y + p.size);
        this.ctx.lineTo(p.x - p.size / 3, p.y + p.size / 3);
        this.ctx.lineTo(p.x - p.size, p.y);
        this.ctx.lineTo(p.x - p.size / 3, p.y - p.size / 3);
        this.ctx.closePath();
        this.ctx.fill();
      } else {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }

    if (this.particles.length === 0) {
      this.active = false;
    } else {
      this.animationId = requestAnimationFrame(() => this.tick());
    }
  }
};

// ---------- Ambil + gabungkan data satu Pokémon ----------
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
    fallbackArt: lewatCDN(p.sprites.front_default),
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
let pity = 0;      
let total = 0;     
let ssrCount = 0;  
let shinyCountTotal = 0; 
let collection = {}; 
let pullHistory = []; // stores recent pull metadata
let lastFailedRoll = null; // caches { id, kelas } on api failure
let isMultiPullActive = false; // loops without 3-shake delay

// ---------- Simpan / muat progres (localStorage) ----------
const STORAGE_KEY = "pokegacha_state_v1";

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      total, 
      pity, 
      ssrCount, 
      shinyCountTotal,
      collection,
      pullHistory 
    }));
  } catch (e) {
    // localStorage disabled/full
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
    shinyCountTotal = s.shinyCountTotal || 0;
    collection = s.collection || {};
    pullHistory = s.pullHistory || [];
  } catch (e) {
    collection = {};
    pullHistory = [];
    shinyCountTotal = 0;
  }
}

function getRarityClass(id, storedKelas) {
  if (storedKelas) return storedKelas;
  if (SSR_IDS.includes(id)) return "ssr";
  if (EPIC_IDS.includes(id)) return "epic";
  return "common"; // default fallback for older localstorage formats
}

function recordCatch(result) {
  const existing = collection[result.id];
  if (existing) {
    existing.count += 1;
    if (result.shiny) existing.shiny = true;
    existing.kelas = existing.kelas || result.kelas;
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
      stats: result.stats,
      count: 1,
    };
  }
}

function addHistoryArray(result, timestamp) {
  const item = {
    id: result.id,
    name: result.name,
    kelas: result.kelas,
    shiny: result.shiny,
    timestamp: timestamp,
    artwork: result.artwork,
    shinyArtwork: result.shinyArtwork,
    fallbackArt: result.fallbackArt,
    types: result.types,
    stats: result.stats
  };
  pullHistory.push(item);
  if (result.shiny) {
    shinyCountTotal += 1;
  }
  // Cap history at 100 entries to prevent localStorage bloating
  while (pullHistory.length > 100) {
    pullHistory.shift();
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
  
  // New upgraded nodes
  themeToggle: document.getElementById("themeToggle"),
  soundToggle: document.getElementById("soundToggle"),
  errorPanel: document.getElementById("errorPanel"),
  errorMsgText: document.getElementById("errorMsgText"),
  retryBtn: document.getElementById("retryBtn"),
  clearHistoryBtn: document.getElementById("clearHistoryBtn"),
  historyList: document.getElementById("historyList"),
  historyEmpty: document.getElementById("historyEmpty"),
  recapModal: document.getElementById("recapModal"),
  recapGrid: document.getElementById("recapGrid"),
  closeRecapBtn: document.getElementById("closeRecapBtn"),
  detailModal: document.getElementById("detailModal"),
  detailOverlay: document.getElementById("detailOverlay"),
  closeDetail: document.getElementById("closeDetail"),
  
  // dex elements
  collectionProgressText: document.getElementById("collectionProgressText"),
  collectionProgressFill: document.getElementById("collectionProgressFill"),
  collectionSearch: document.getElementById("collectionSearch"),
  collectionRarityFilter: document.getElementById("collectionRarityFilter")
};

// ---------- Mesin Rarity ----------
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

// ---------- Update Stats Dashboard ----------
function updateStats() {
  el.total.textContent = total;
  el.ssrCount.textContent = ssrCount;
  
  // overall SSR Rate
  const rate = total > 0 ? ((ssrCount / total) * 100).toFixed(1) : "0.0";
  document.getElementById("ssrRate").textContent = "Rate: " + rate + "%";
  
  // Shiny count
  document.getElementById("shinyCountStats").textContent = shinyCountTotal;
  
  // Pity
  document.getElementById("pityStats").textContent = pity + " / " + PITY_MAX;
  el.pityText.textContent = pity + " / " + PITY_MAX;
  el.pityFill.style.width = (pity / PITY_MAX) * 100 + "%";
}

// ---------- State Machine & State Transitions ----------
const GachaState = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error"
};

let currentState = GachaState.IDLE;
let activeRequestId = 0;

function transitionTo(state, data = null) {
  currentState = state;
  
  switch (state) {
    case GachaState.IDLE:
      el.spinner.style.display = "none";
      el.sprite.style.display = "none";
      el.shinyBadge.style.display = "none";
      el.errorPanel.hidden = true;
      el.placeholder.style.display = "flex";
      
      el.pokeName.textContent = "—";
      el.dexNum.textContent = "";
      el.types.innerHTML = "";
      el.rarity.textContent = "";
      el.rarity.className = "rar";
      el.statsPanel.innerHTML = "";
      el.err.textContent = "";
      
      el.tarik1.disabled = false;
      el.tarik10.disabled = false;
      break;
      
    case GachaState.LOADING:
      el.spinner.style.display = "block";
      el.sprite.style.display = "none";
      el.shinyBadge.style.display = "none";
      el.errorPanel.hidden = true;
      el.placeholder.style.display = "none";
      
      el.tarik1.disabled = true;
      el.tarik10.disabled = true;
      break;
      
    case GachaState.SUCCESS:
      el.spinner.style.display = "none";
      el.placeholder.style.display = "none";
      el.errorPanel.hidden = true;
      el.sprite.style.display = "block";
      el.err.textContent = "";
      
      render(data);
      
      if (!isMultiPullActive) {
        el.tarik1.disabled = false;
        el.tarik10.disabled = false;
      }
      break;
      
    case GachaState.ERROR:
      el.spinner.style.display = "none";
      el.sprite.style.display = "none";
      el.shinyBadge.style.display = "none";
      el.placeholder.style.display = "none";
      CanvasEffect.stop();
      
      el.errorMsgText.textContent = "Gagal memuat Pokémon: " + data;
      el.errorPanel.hidden = false;
      el.err.textContent = "Koneksi terputus. Silakan klik Coba Lagi.";
      
      el.pokeName.textContent = "—";
      el.dexNum.textContent = "";
      el.types.innerHTML = "";
      el.rarity.textContent = "";
      el.rarity.className = "rar";
      el.statsPanel.innerHTML = "";
      
      if (!isMultiPullActive) {
        el.tarik1.disabled = false;
        el.tarik10.disabled = false;
      }
      break;
  }
}

// ---------- Render Card ----------
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

function artOf(result) {
  return result.shiny && result.shinyArtwork ? result.shinyArtwork : result.artwork;
}

function render(result) {
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

  // Trigger animations
  el.card.className = "card";
  void el.card.offsetWidth;
  el.card.className = "card " + result.kelas + " reveal" + (result.shiny ? " shiny" : "");
  
  CanvasEffect.start(result.kelas, result.shiny);
  AudioEngine.playReveal(result.kelas);
  if (result.shiny) {
    AudioEngine.playShinySparkle();
  }
}

// Add horizontal chip history
function addHistory(result) {
  const chip = document.createElement("div");
  chip.className = "chip " + result.kelas + (result.shiny ? " shiny" : "");
  const img = document.createElement("img");
  img.onerror = () => { img.onerror = null; if (result.fallbackArt) img.src = result.fallbackArt; };
  img.src = artOf(result);
  img.alt = result.name;
  chip.appendChild(img);
  chip.title = result.name + " (" + result.kelas + (result.shiny ? ", shiny" : "") + ")";
  
  chip.addEventListener("click", () => {
    openDetailModal(result.id);
  });

  el.history.prepend(chip);
  while (el.history.children.length > 12) {
    el.history.removeChild(el.history.lastChild);
  }
}

// Add list history item
function addHistoryList(result, timestamp) {
  if (el.historyEmpty) el.historyEmpty.style.display = "none";
  
  const domItem = document.createElement("div");
  domItem.className = "history-item" + (result.shiny ? " shiny" : "");
  
  const timeStr = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const src = result.shiny && result.shinyArtwork ? result.shinyArtwork : result.artwork;
  
  domItem.innerHTML = `
    <div class="history-item-left">
      <img src="${src}" class="history-item-img" alt="${result.name}" onerror="this.onerror=null; this.src='${result.fallbackArt || ''}';">
      <div>
        <div class="history-item-name">${result.name}${result.shiny ? ' ✨' : ''}</div>
        <div class="history-item-time">${timeStr}</div>
      </div>
    </div>
    <div class="history-item-rarity ${result.kelas}">${result.kelas.toUpperCase()}</div>
  `;
  
  el.historyList.prepend(domItem);
  while (el.historyList.children.length > 50) {
    el.historyList.removeChild(el.historyList.lastChild);
  }
}

// Initialize history screens on load
function initHistoryList() {
  el.historyList.innerHTML = "";
  if (pullHistory.length === 0) {
    el.historyList.innerHTML = '<div class="history-empty" id="historyEmpty">Belum ada riwayat tarikan.</div>';
    el.historyEmpty = document.getElementById("historyEmpty");
    return;
  }
  const reversedHistory = [...pullHistory].reverse();
  reversedHistory.forEach(item => {
    const domItem = document.createElement("div");
    domItem.className = "history-item" + (item.shiny ? " shiny" : "");
    const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const src = item.shiny && item.shinyArtwork ? item.shinyArtwork : item.artwork;
    
    domItem.innerHTML = `
      <div class="history-item-left">
        <img src="${src}" class="history-item-img" alt="${item.name}" onerror="this.onerror=null; this.src='${item.fallbackArt || ''}';">
        <div>
          <div class="history-item-name">${item.name}${item.shiny ? ' ✨' : ''}</div>
          <div class="history-item-time">${timeStr}</div>
        </div>
      </div>
      <div class="history-item-rarity ${item.kelas}">${item.kelas.toUpperCase()}</div>
    `;
    el.historyList.appendChild(domItem);
  });
}

function initHistoryChips() {
  el.history.innerHTML = "";
  const last12 = pullHistory.slice(-12).reverse();
  last12.forEach(item => {
    const chip = document.createElement("div");
    chip.className = "chip " + item.kelas + (item.shiny ? " shiny" : "");
    const img = document.createElement("img");
    img.onerror = () => { img.onerror = null; if (item.fallbackArt) img.src = item.fallbackArt; };
    img.src = item.shiny && item.shinyArtwork ? item.shinyArtwork : item.artwork;
    img.alt = item.name;
    chip.appendChild(img);
    chip.title = item.name + " (" + item.kelas + (item.shiny ? ", shiny" : "") + ")";
    
    chip.addEventListener("click", () => {
      openDetailModal(item.id);
    });
    el.history.appendChild(chip);
  });
}

// ---------- Roll Animation (3-Shakes) ----------
async function playPokeballRollAnimation(kelas) {
  el.placeholder.style.display = "flex";
  el.sprite.style.display = "none";
  el.shinyBadge.style.display = "none";
  el.card.className = "card";
  CanvasEffect.stop();

  const pokeballEl = el.placeholder.querySelector(".pokeball");
  const textEl = el.placeholder.querySelector(".ph-text");
  
  textEl.textContent = "Menggulung...";
  
  // Shake 1
  pokeballEl.className = `pokeball glow-${kelas} shake`;
  AudioEngine.playRollClick();
  await sleep(400);
  
  // Shake 2
  pokeballEl.className = `pokeball glow-${kelas}`;
  void pokeballEl.offsetWidth;
  pokeballEl.className = `pokeball glow-${kelas} shake`;
  AudioEngine.playRollClick();
  await sleep(400);
  
  // Shake 3
  pokeballEl.className = `pokeball glow-${kelas}`;
  void pokeballEl.offsetWidth;
  pokeballEl.className = `pokeball glow-${kelas} shake`;
  AudioEngine.playRollClick();
  await sleep(400);
  
  pokeballEl.className = "pokeball";
  textEl.textContent = "Tekan PULL";
}

// ---------- Execute single Pull ----------
async function pull(retryId = null, retryKelas = null) {
  activeRequestId++;
  const reqId = activeRequestId;

  const kelas = retryKelas || decideRarity();
  const id = retryId || pickId(kelas);
  
  transitionTo(GachaState.LOADING);
  
  try {
    if (!isMultiPullActive && !retryId) {
      await playPokeballRollAnimation(kelas);
    }
    
    if (reqId !== activeRequestId) return null;
    
    const mon = await getPokemon(id);
    
    if (reqId !== activeRequestId) return null;
    
    const shiny = Math.random() < SHINY_RATE && !!mon.shinyArtwork;
    const result = { ...mon, kelas, shiny };
    
    commitCounters(kelas); 
    recordCatch(result);   
    
    const timestamp = Date.now();
    addHistoryArray(result, timestamp);
    
    updateStats();
    transitionTo(GachaState.SUCCESS, result);
    addHistory(result);
    addHistoryList(result, timestamp);
    checkNewBadges();      
    saveState();           
    
    lastFailedRoll = null;
    return result;
  } catch (e) {
    if (reqId === activeRequestId) {
      lastFailedRoll = { id, kelas };
      transitionTo(GachaState.ERROR, e.message);
    }
    return null;
  }
}

// ---------- Recap Modal (10x Pulls) ----------
function showRecapModal(results) {
  const modal = el.recapModal;
  const grid = el.recapGrid;
  grid.innerHTML = "";
  
  results.forEach(m => {
    const cell = document.createElement("div");
    cell.className = "recap-cell " + m.kelas + (m.shiny ? " shiny" : "");
    const src = m.shiny && m.shinyArtwork ? m.shinyArtwork : m.artwork;
    
    cell.innerHTML = `
      ${m.shiny ? '<span class="recap-cell-star">✨</span>' : ''}
      <img src="${src}" alt="${m.name}" onerror="this.onerror=null; this.src='${m.fallbackArt || ''}';">
      <div class="recap-cell-name">${m.name}</div>
    `;
    
    cell.addEventListener("click", () => {
      closeRecapModal();
      openDetailModal(m.id);
    });
    
    grid.appendChild(cell);
  });
  
  modal.hidden = false;
  AudioEngine.playBadgeEarned();
}

function closeRecapModal() {
  AudioEngine.playClick();
  el.recapModal.hidden = true;
  if (el.tarik10) {
    el.tarik10.focus();
  }
}

// ---------- Detail Inspect Modal ----------
async function openDetailModal(id) {
  AudioEngine.playClick();
  
  const modal = el.detailModal;
  const nameEl = document.getElementById("detailName");
  const idEl = document.getElementById("detailId");
  const imgEl = document.getElementById("detailImg");
  const badgeEl = document.getElementById("detailShinyBadge");
  const typesEl = document.getElementById("detailTypes");
  const statsEl = document.getElementById("detailStats");
  const countEl = document.getElementById("detailCountVal");
  const toggleContainer = document.getElementById("detailShinyToggleContainer");
  const shinyBtn = document.getElementById("detailShinyBtn");

  nameEl.textContent = "Loading...";
  idEl.textContent = "#" + String(id).padStart(3, "0");
  imgEl.src = "";
  badgeEl.hidden = true;
  typesEl.innerHTML = "";
  statsEl.innerHTML = "";
  countEl.textContent = "-";
  toggleContainer.hidden = true;
  
  modal.hidden = false;
  
  try {
    const mon = await getPokemon(id);
    const inCol = collection[id] || { count: 1, shiny: false };
    
    nameEl.textContent = mon.name;
    countEl.textContent = inCol.count;
    
    typesEl.innerHTML = "";
    mon.types.forEach(t => {
      const b = document.createElement("span");
      b.className = "type-badge";
      b.textContent = t;
      b.style.background = TYPE_COLORS[t] || "#666";
      typesEl.appendChild(b);
    });
    
    statsEl.innerHTML = "";
    mon.stats.forEach(s => {
      const row = document.createElement("div");
      row.className = "stat-row";
      const persen = Math.min(100, (s.value / STAT_MAX) * 100);
      row.innerHTML =
        '<span class="s-lbl">' + (STAT_LABELS[s.name] || s.name) + "</span>" +
        '<span class="s-val">' + s.value + "</span>" +
        '<span class="stat-bar"><span style="width:' + persen + '%"></span></span>';
      statsEl.appendChild(row);
    });
    
    let showingShiny = false;
    imgEl.src = mon.artwork;
    
    imgEl.onerror = () => {
      imgEl.onerror = null;
      if (mon.fallbackArt) imgEl.src = mon.fallbackArt;
    };
    
    if (inCol.shiny && mon.shinyArtwork) {
      toggleContainer.hidden = false;
      shinyBtn.className = "shiny-toggle-btn";
      shinyBtn.textContent = "Tampilkan Shiny";
      
      shinyBtn.onclick = () => {
        AudioEngine.playClick();
        showingShiny = !showingShiny;
        if (showingShiny) {
          imgEl.src = mon.shinyArtwork;
          badgeEl.hidden = false;
          shinyBtn.classList.add("active");
          shinyBtn.textContent = "Tampilkan Normal";
          CanvasEffect.start("ssr", true);
          AudioEngine.playShinySparkle();
        } else {
          imgEl.src = mon.artwork;
          badgeEl.hidden = true;
          shinyBtn.classList.remove("active");
          shinyBtn.textContent = "Tampilkan Shiny";
          CanvasEffect.stop();
        }
      };
    } else {
      toggleContainer.hidden = true;
    }
  } catch (err) {
    nameEl.textContent = "Gagal memuat";
    statsEl.innerHTML = `<div class="error-msg">${err.message}</div>`;
  }
}

function closeDetailModal() {
  AudioEngine.playClick();
  el.detailModal.hidden = true;
  CanvasEffect.stop();
  const activeTab = document.querySelector(".tab.active");
  if (activeTab) {
    activeTab.focus();
  }
}

// ---------- Render Koleksi (Pokédex) ----------
function renderCollection() {
  const searchQuery = el.collectionSearch.value.toLowerCase().trim();
  const rarityFilter = el.collectionRarityFilter.value;
  
  const daftar = Object.values(collection).sort((a, b) => a.id - b.id);
  const uniqueCount = daftar.length;
  
  // Progres bar Dex
  const progressPercent = ((uniqueCount / DEX_MAX) * 100).toFixed(1);
  el.collectionProgressText.textContent = `${uniqueCount} / ${DEX_MAX} (${progressPercent}%)`;
  el.collectionProgressFill.style.width = `${progressPercent}%`;

  // Filter
  const filtered = daftar.filter(m => {
    const nameMatch = m.name.toLowerCase().includes(searchQuery);
    const idMatch = String(m.id).includes(searchQuery) || String(m.id).padStart(3, "0").includes(searchQuery);
    if (!nameMatch && !idMatch) return false;
    
    if (rarityFilter === "all") return true;
    if (rarityFilter === "shiny") return m.shiny;
    
    const itemRarity = getRarityClass(m.id, m.kelas);
    return itemRarity === rarityFilter;
  });

  const shinyTotal = daftar.filter(m => m.shiny).length;
  el.uniqueCount.textContent = uniqueCount;
  el.shinyCount.textContent = shinyTotal;
  
  el.collectionEmpty.hidden = filtered.length > 0;
  el.collectionGrid.innerHTML = "";
  
  filtered.forEach(m => {
    const cell = document.createElement("div");
    const itemRarity = getRarityClass(m.id, m.kelas);
    cell.className = "dex-cell " + itemRarity + (m.shiny ? " shiny" : "");

    const src = m.shiny && m.shinyArtwork ? m.shinyArtwork : m.artwork;
    const img = document.createElement("img");
    img.onerror = () => { img.onerror = null; if (m.fallbackArt) img.src = m.fallbackArt; };
    img.src = src;
    img.alt = m.name;
    img.loading = "lazy";

    cell.innerHTML =
      (m.shiny ? '<span class="shiny-star">✨</span>' : "") +
      (m.count > 1 ? '<span class="dex-count">×' + m.count + "</span>" : "") +
      '<div class="dex-no">#' + String(m.id).padStart(3, "0") + "</div>";
    
    cell.insertBefore(img, cell.firstChild);
    
    const name = document.createElement("div");
    name.className = "dex-name";
    name.textContent = m.name;
    cell.appendChild(name);

    cell.addEventListener("click", () => {
      openDetailModal(m.id);
    });

    el.collectionGrid.appendChild(cell);
  });
}

// ---------- Badge gym Kanto ----------
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

function countType(type) {
  return Object.values(collection).filter(m => m.types.includes(type)).length;
}

function earnedBadgeIds() {
  return new Set(BADGES.filter(b => countType(b.type) >= BADGE_GOAL).map(b => b.id));
}

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
    cell.style.setProperty("--gym-glow", hexToRgba(b.color, 0.4));
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
  let hasNew = false;
  earned.forEach(id => {
    if (!shownBadges.has(id)) {
      hasNew = true;
      const b = BADGES.find(x => x.id === id);
      showToast(b.icon + " Badge " + b.name + " diraih!");
    }
  });
  if (hasNew) {
    AudioEngine.playBadgeEarned();
  }
  shownBadges = earned;
}

// ---------- Navigasi tab ----------
function switchTab(name) {
  tabButtons.forEach(t => {
    const active = t.dataset.tab === name;
    t.classList.toggle("active", active);
    t.setAttribute("aria-selected", active ? "true" : "false");
  });
  
  document.querySelectorAll(".tab-panel").forEach(p => {
    p.hidden = p.id !== "panel-" + name;
  });
  
  if (name === "koleksi") renderCollection(); 
  if (name === "badge") renderBadges();
  AudioEngine.playClick();
}

// ---------- Event Listeners ----------

// Tab bindings
const tabButtons = document.querySelectorAll(".tab");
tabButtons.forEach((t, idx) => {
  t.addEventListener("click", () => switchTab(t.dataset.tab));
  
  // Tab Accessibility keyboard navigation
  t.addEventListener("keydown", (e) => {
    let nextIdx;
    if (e.key === "ArrowRight") {
      nextIdx = (idx + 1) % tabButtons.length;
    } else if (e.key === "ArrowLeft") {
      nextIdx = (idx - 1 + tabButtons.length) % tabButtons.length;
    } else {
      return;
    }
    tabButtons[nextIdx].focus();
    switchTab(tabButtons[nextIdx].dataset.tab);
  });
});

// Gacha buttons
el.tarik1.addEventListener("click", async () => {
  el.err.textContent = "";
  await pull();
});

el.tarik10.addEventListener("click", async () => {
  el.err.textContent = "";
  isMultiPullActive = true;
  el.tarik1.disabled = true;
  el.tarik10.disabled = true;
  
  const results = [];
  for (let i = 0; i < 10; i++) {
    const res = await pull();
    if (res) {
      results.push(res);
      await sleep(150); // fast pacing between multi pulls
    } else {
      break; // stop on API error to handle retry
    }
  }
  
  isMultiPullActive = false;
  el.tarik1.disabled = false;
  el.tarik10.disabled = false;
  
  if (results.length > 0) {
    showRecapModal(results);
  }
});

// Retry button
el.retryBtn.addEventListener("click", async (e) => {
  e.stopPropagation();
  if (lastFailedRoll) {
    el.err.textContent = "";
    const { id, kelas } = lastFailedRoll;
    await pull(id, kelas);
  }
});

// Clear history button
el.clearHistoryBtn.addEventListener("click", () => {
  AudioEngine.playClick();
  pullHistory = [];
  el.history.innerHTML = "";
  initHistoryList();
  saveState();
});

// Collection Filter and Search bindings
el.collectionSearch.addEventListener("input", renderCollection);
el.collectionRarityFilter.addEventListener("change", renderCollection);

// Close Recap Modal
el.closeRecapBtn.addEventListener("click", closeRecapModal);

// Close Detail Modal
el.closeDetail.addEventListener("click", closeDetailModal);
el.detailOverlay.addEventListener("click", closeDetailModal);

// ---------- Theme Toggle Setup ----------
let activeTheme = localStorage.getItem("pokegacha_theme") || "light";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  el.themeToggle.textContent = theme === "light" ? "🌙" : "☀️";
  el.themeToggle.setAttribute("aria-label", theme === "light" ? "Aktifkan Mode Gelap" : "Aktifkan Mode Terang");
}

applyTheme(activeTheme);

el.themeToggle.addEventListener("click", () => {
  activeTheme = activeTheme === "light" ? "dark" : "light";
  localStorage.setItem("pokegacha_theme", activeTheme);
  applyTheme(activeTheme);
  AudioEngine.playClick();
});

// ---------- Sound Toggle Setup ----------
function applyMuted(muted) {
  AudioEngine.muted = muted;
  el.soundToggle.textContent = muted ? "🔇" : "🔊";
  el.soundToggle.setAttribute("aria-label", muted ? "Aktifkan Suara" : "Senyapkan Suara");
}

applyMuted(AudioEngine.muted);

el.soundToggle.addEventListener("click", () => {
  const isMuted = AudioEngine.toggleMute();
  applyMuted(isMuted);
  if (!isMuted) {
    AudioEngine.playClick();
  }
});

// ==========================================================
// INITIALIZATION
// ==========================================================
loadState();
updateStats();
initHistoryChips();
initHistoryList();
shownBadges = earnedBadgeIds(); 
CanvasEffect.init(document.getElementById("effectCanvas"));
