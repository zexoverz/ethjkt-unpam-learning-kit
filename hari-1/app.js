const API_BASE = "https://pokeapi.co/api/v2";
const STATE_KEY = "pokepack_state_v2";
const CACHE_KEY = "pokepack_api_cache_v2";
const PACK_SIZE = 5;
const STAT_MAX = 255;

const TYPE_COLORS = {
  normal: "#A8A77A", fire: "#EE8130", water: "#6390F0", electric: "#F7D02C",
  grass: "#7AC74C", ice: "#96D9D6", fighting: "#C22E28", poison: "#A33EA1",
  ground: "#E2BF65", flying: "#A98FF3", psychic: "#F95587", bug: "#A6B91A",
  rock: "#B6A136", ghost: "#735797", dragon: "#6F35FC", dark: "#705746",
  steel: "#B7B7CE", fairy: "#D685AD",
};

const RARITIES = {
  common: { label: "Common", rank: 1, color: "#94a3b8" },
  uncommon: { label: "Uncommon", rank: 2, color: "#22c55e" },
  rare: { label: "Rare", rank: 3, color: "#2563eb" },
  epic: { label: "Epic", rank: 4, color: "#a855f7" },
  legendary: { label: "Legendary", rank: 5, color: "#f59e0b" },
};

const STAT_LABELS = {
  hp: "HP", attack: "ATK", defense: "DEF", "special-attack": "SpA", "special-defense": "SpD", speed: "SPD",
};

let state = {
  packsOpened: 0,
  totalPulled: 0,
  collection: {},
  history: [],
  rarityCounts: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
};
let apiCache = {};
let pokemonCount = 1025;
let isOpening = false;

const el = {
  views: document.querySelectorAll(".view"),
  navLinks: document.querySelectorAll("[data-view-link]"),
  openButtons: document.querySelectorAll("[data-open-pack]"),
  openPackButton: document.getElementById("openPackButton"),
  boosterPack: document.getElementById("boosterPack"),
  gachaPack: document.getElementById("gachaPack"),
  lightBurst: document.getElementById("lightBurst"),
  gachaBurst: document.getElementById("gachaBurst"),
  stageStatus: document.getElementById("stageStatus"),
  revealGrid: document.getElementById("revealGrid"),
  packCount: document.getElementById("packCount"),
  featuredGrid: document.getElementById("featuredGrid"),
  collectionGrid: document.getElementById("collectionGrid"),
  collectionEmpty: document.getElementById("collectionEmpty"),
  searchInput: document.getElementById("searchInput"),
  typeFilter: document.getElementById("typeFilter"),
  sortSelect: document.getElementById("sortSelect"),
  resetCollection: document.getElementById("resetCollection"),
  collectionProgressText: document.getElementById("collectionProgressText"),
  collectionProgressBar: document.getElementById("collectionProgressBar"),
  rarityDistribution: document.getElementById("rarityDistribution"),
  pullHistory: document.getElementById("pullHistory"),
  confettiLayer: document.getElementById("confettiLayer"),
  toast: document.getElementById("toast"),
  template: document.getElementById("pokemonCardTemplate"),
};

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

function saveJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
}

function initStorage() {
  state = { ...state, ...loadJson(STATE_KEY, {}) };
  state.collection ||= {};
  state.history ||= [];
  state.rarityCounts ||= { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
  apiCache = loadJson(CACHE_KEY, {});
}

async function fetchJson(pathOrUrl) {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${API_BASE}${pathOrUrl}`;
  if (apiCache[url]) return apiCache[url];

  const response = await fetch(url);
  if (!response.ok) throw new Error(`PokeAPI request failed (${response.status})`);
  const data = await response.json();
  apiCache[url] = data;
  saveJson(CACHE_KEY, apiCache);
  return data;
}

async function loadApiMetadata() {
  try {
    const [pokemonList, types] = await Promise.all([
      fetchJson("/pokemon?limit=1"),
      fetchJson("/type?limit=100"),
    ]);
    pokemonCount = Math.min(pokemonList.count || pokemonCount, 1025);
    renderTypeOptions(types.results || []);
  } catch (error) {
    showToast("Using cached defaults while PokeAPI is unavailable.");
  }
}

function renderTypeOptions(types) {
  const allowed = Object.keys(TYPE_COLORS);
  const apiTypes = types.map(type => type.name).filter(type => allowed.includes(type));
  const names = apiTypes.length ? apiTypes : allowed;
  el.typeFilter.innerHTML = '<option value="all">All types</option>' + names
    .sort()
    .map(type => `<option value="${type}">${capitalize(type)}</option>`)
    .join("");
}

function randomPokemonId() {
  return Math.floor(Math.random() * pokemonCount) + 1;
}

function uniqueRandomIds(count) {
  const ids = new Set();
  while (ids.size < count) ids.add(randomPokemonId());
  return [...ids];
}

async function getPokemon(id) {
  const [pokemon, species] = await Promise.all([
    fetchJson(`/pokemon/${id}`),
    fetchJson(`/pokemon-species/${id}`),
  ]);
  const totalStats = pokemon.stats.reduce((sum, item) => sum + item.base_stat, 0);
  const rarity = calculateRarity({ pokemon, species, totalStats });
  const official = pokemon.sprites.other?.["official-artwork"] || {};
  const home = pokemon.sprites.other?.home || {};
  const fallback = pokemon.sprites.front_default || "";

  return {
    id: pokemon.id,
    name: titleCase(pokemon.name),
    species: titleCase(species.genera?.find(item => item.language.name === "en")?.genus || species.name),
    artwork: official.front_default || home.front_default || fallback,
    height: pokemon.height,
    weight: pokemon.weight,
    baseExperience: pokemon.base_experience || 0,
    types: pokemon.types.map(item => item.type.name),
    abilities: pokemon.abilities.map(item => titleCase(item.ability.name)),
    stats: pokemon.stats.map(item => ({ name: item.stat.name, value: item.base_stat })),
    totalStats,
    rarity,
    legendary: species.is_legendary || species.is_mythical,
    pulledAt: Date.now(),
  };
}

function calculateRarity({ pokemon, species, totalStats }) {
  const baseExperience = pokemon.base_experience || 0;
  if (species.is_legendary || species.is_mythical || totalStats >= 640) return "legendary";
  if (totalStats >= 540 || baseExperience >= 240) return "epic";
  if (totalStats >= 455 || baseExperience >= 170) return "rare";
  if (totalStats >= 330 || baseExperience >= 90) return "uncommon";
  return "common";
}

function recordPull(mon) {
  const current = state.collection[mon.id];
  const stored = {
    id: mon.id,
    name: mon.name,
    species: mon.species,
    artwork: mon.artwork,
    height: mon.height,
    weight: mon.weight,
    baseExperience: mon.baseExperience,
    types: mon.types,
    abilities: mon.abilities,
    stats: mon.stats,
    totalStats: mon.totalStats,
    rarity: mon.rarity,
    count: current ? current.count + 1 : 1,
    favorite: current ? !!current.favorite : false,
    firstPulled: current?.firstPulled || mon.pulledAt,
    lastPulled: mon.pulledAt,
  };

  state.collection[mon.id] = stored;
  state.totalPulled += 1;
  state.rarityCounts[mon.rarity] = (state.rarityCounts[mon.rarity] || 0) + 1;
  state.history.unshift({ id: mon.id, name: mon.name, artwork: mon.artwork, rarity: mon.rarity, pulledAt: mon.pulledAt });
  state.history = state.history.slice(0, 60);
  saveState();
}

function saveState() {
  saveJson(STATE_KEY, state);
}

function switchView(name) {
  el.views.forEach(view => view.classList.toggle("active", view.id === `view-${name}`));
  document.querySelectorAll(".nav-link").forEach(link => link.classList.toggle("active", link.dataset.viewLink === name));
  if (name === "collection") renderCollection();
  if (name === "stats") renderStats();
}

function setOpening(opening) {
  isOpening = opening;
  el.openButtons.forEach(button => { button.disabled = opening; });
  el.openPackButton.disabled = opening;
}

function animatePack() {
  [el.boosterPack?.parentElement, el.gachaPack?.parentElement].forEach(stage => {
    stage?.classList.remove("opening");
    void stage?.offsetWidth;
    stage?.classList.add("opening");
  });
  [el.lightBurst, el.gachaBurst].forEach(burst => {
    burst?.classList.remove("flash");
    void burst?.offsetWidth;
    burst?.classList.add("flash");
  });
}

async function openPack() {
  if (isOpening) return;
  setOpening(true);
  switchView("gacha");
  animatePack();
  el.stageStatus.textContent = "Charging the booster...";
  el.revealGrid.innerHTML = Array.from({ length: PACK_SIZE }, () => '<div class="skeleton"></div>').join("");
  el.packCount.textContent = `0 / ${PACK_SIZE}`;

  await wait(850);
  const ids = uniqueRandomIds(PACK_SIZE);
  el.revealGrid.innerHTML = "";

  for (let index = 0; index < ids.length; index += 1) {
    const finalCard = index === ids.length - 1;
    el.stageStatus.textContent = finalCard ? "Final card..." : `Revealing card ${index + 1}...`;
    if (finalCard) await wait(700);

    try {
      const mon = await getPokemon(ids[index]);
      recordPull(mon);
      const card = createPokemonCard(mon, { hidden: true, finalCard });
      el.revealGrid.appendChild(card);
      await wait(120);
      card.classList.remove("is-hidden");
      if (RARITIES[mon.rarity].rank >= RARITIES.epic.rank) pulseRare(mon, card);
      el.packCount.textContent = `${index + 1} / ${PACK_SIZE}`;
      renderAll();
      await wait(finalCard ? 900 : 520);
    } catch (error) {
      showToast(error.message || "Could not load Pokemon data.");
    }
  }

  state.packsOpened += 1;
  saveState();
  renderAll();
  el.stageStatus.textContent = "Pack complete. Open another booster anytime.";
  setOpening(false);
}

function createPokemonCard(mon, options = {}) {
  const node = el.template.content.firstElementChild.cloneNode(true);
  node.classList.add(mon.rarity);
  if (options.hidden) node.classList.add("is-hidden");
  if (options.finalCard) node.classList.add("final-reveal");
  node.dataset.id = mon.id;

  const rarity = RARITIES[mon.rarity];
  node.style.setProperty("--rarity-color", rarity.color);
  node.style.setProperty("--type-soft", hexToRgba(TYPE_COLORS[mon.types[0]] || "#2563eb", .18));
  node.querySelector(".rarity-chip").textContent = rarity.label;
  const img = node.querySelector("img");
  img.src = mon.artwork;
  img.alt = mon.name;
  img.onerror = () => { img.style.display = "none"; };
  node.querySelector(".dex-number").textContent = `#${String(mon.id).padStart(4, "0")}`;
  node.querySelector("h3").textContent = mon.name;
  node.querySelector(".type-row").append(...mon.types.map(createTypePill));
  node.querySelector(".detail-grid").innerHTML = detailMarkup(mon);
  node.querySelector(".abilities").textContent = `Abilities: ${mon.abilities.join(", ")}`;
  node.querySelector(".stats-list").innerHTML = statsMarkup(mon.stats);

  const favorite = node.querySelector(".favorite-btn");
  favorite.classList.toggle("active", !!mon.favorite);
  favorite.textContent = mon.favorite ? "â˜…" : "â˜†";
  favorite.addEventListener("click", () => toggleFavorite(mon.id));

  const deleteButton = node.querySelector(".delete-btn");
  deleteButton.addEventListener("click", () => deletePokemon(mon.id));
  if (!options.collection) deleteButton.hidden = true;
  if (!options.collection) favorite.hidden = true;

  return node;
}

function detailMarkup(mon) {
  const details = [
    ["Height", `${(mon.height / 10).toFixed(1)} m`],
    ["Weight", `${(mon.weight / 10).toFixed(1)} kg`],
    ["Base EXP", mon.baseExperience || "N/A"],
    ["Species", mon.species],
    ["Total", mon.totalStats],
    ["Copies", mon.count || 1],
  ];
  return details.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("");
}

function statsMarkup(stats) {
  return stats.map(stat => {
    const percent = Math.min(100, (stat.value / STAT_MAX) * 100);
    return `<div class="stat-line"><span>${STAT_LABELS[stat.name] || stat.name}</span><div class="stat-track"><div class="stat-fill" style="width:${percent}%"></div></div><span>${stat.value}</span></div>`;
  }).join("");
}

function createTypePill(type) {
  const pill = document.createElement("span");
  pill.className = "type-pill";
  pill.textContent = type;
  pill.style.background = TYPE_COLORS[type] || "#64748b";
  return pill;
}

function renderCollection() {
  const query = el.searchInput.value.trim().toLowerCase();
  const type = el.typeFilter.value;
  const sort = el.sortSelect.value;
  let items = Object.values(state.collection);

  if (query) items = items.filter(mon => mon.name.toLowerCase().includes(query));
  if (type !== "all") items = items.filter(mon => mon.types.includes(type));

  items.sort((a, b) => {
    if (sort === "dex") return a.id - b.id;
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "rarity") return RARITIES[b.rarity].rank - RARITIES[a.rarity].rank || a.id - b.id;
    if (sort === "duplicates") return b.count - a.count || a.id - b.id;
    if (sort === "favorites") return Number(b.favorite) - Number(a.favorite) || b.lastPulled - a.lastPulled;
    return b.lastPulled - a.lastPulled;
  });

  el.collectionGrid.innerHTML = "";
  items.forEach(mon => el.collectionGrid.appendChild(createPokemonCard(mon, { collection: true })));
  el.collectionEmpty.hidden = items.length > 0;
  renderProgress();
}

function renderProgress() {
  const unique = Object.keys(state.collection).length;
  const percent = pokemonCount ? Math.round((unique / pokemonCount) * 1000) / 10 : 0;
  el.collectionProgressText.textContent = `${unique} / ${pokemonCount}`;
  el.collectionProgressBar.style.width = `${Math.min(100, percent)}%`;
}

function renderHome() {
  const unique = Object.keys(state.collection).length;
  const totalCopies = Object.values(state.collection).reduce((sum, mon) => sum + mon.count, 0);
  document.getElementById("homePacks").textContent = state.packsOpened;
  document.getElementById("homeTotal").textContent = totalCopies;
  document.getElementById("homeProgress").textContent = `${Math.round((unique / pokemonCount) * 100)}%`;
  document.getElementById("homeHighest").textContent = highestRarityLabel();

  const featured = Object.values(state.collection)
    .sort((a, b) => b.lastPulled - a.lastPulled)
    .slice(0, 5);
  el.featuredGrid.innerHTML = "";
  if (!featured.length) {
    el.featuredGrid.innerHTML = '<div class="empty-state">Featured Pokemon appear after your first pack.</div>';
    return;
  }
  featured.forEach(mon => el.featuredGrid.appendChild(createPokemonCard(mon)));
}

function renderStats() {
  const totalCopies = Object.values(state.collection).reduce((sum, mon) => sum + mon.count, 0);
  const duplicates = Object.values(state.collection).reduce((sum, mon) => sum + Math.max(0, mon.count - 1), 0);
  document.getElementById("statPacks").textContent = state.packsOpened;
  document.getElementById("statTotal").textContent = totalCopies;
  document.getElementById("statDuplicates").textContent = duplicates;
  document.getElementById("statHighest").textContent = highestRarityLabel();
  renderRarityDistribution();
  renderHistory();
}

function renderRarityDistribution() {
  const max = Math.max(1, ...Object.values(state.rarityCounts));
  el.rarityDistribution.innerHTML = Object.entries(RARITIES).map(([key, rarity]) => {
    const count = state.rarityCounts[key] || 0;
    return `<div class="rarity-row" style="--rarity-color:${rarity.color}"><span>${rarity.label}</span><div class="rarity-track"><div class="rarity-fill" style="width:${(count / max) * 100}%"></div></div><strong>${count}</strong></div>`;
  }).join("");
}

function renderHistory() {
  if (!state.history.length) {
    el.pullHistory.innerHTML = '<div class="empty-state">Pull history appears here.</div>';
    return;
  }
  el.pullHistory.innerHTML = state.history.slice(0, 30).map(item => `
    <div class="history-item">
      <img loading="lazy" src="${item.artwork}" alt="${item.name}">
      <div><strong>${item.name}</strong><span>${RARITIES[item.rarity].label} - #${String(item.id).padStart(4, "0")}</span></div>
      <span>${new Date(item.pulledAt).toLocaleDateString()}</span>
    </div>
  `).join("");
}

function renderAll() {
  renderHome();
  renderProgress();
  if (document.getElementById("view-collection").classList.contains("active")) renderCollection();
  if (document.getElementById("view-stats").classList.contains("active")) renderStats();
}

function highestRarityLabel() {
  const top = Object.keys(state.rarityCounts).reduce((best, key) => {
    return (state.rarityCounts[key] || 0) && RARITIES[key].rank > RARITIES[best].rank ? key : best;
  }, "common");
  return Object.values(state.rarityCounts).some(Boolean) ? RARITIES[top].label : "None";
}

function toggleFavorite(id) {
  if (!state.collection[id]) return;
  state.collection[id].favorite = !state.collection[id].favorite;
  saveState();
  renderCollection();
  renderHome();
}

function deletePokemon(id) {
  if (!state.collection[id]) return;
  if (state.collection[id].count > 1) state.collection[id].count -= 1;
  else delete state.collection[id];
  saveState();
  renderAll();
}

function resetCollection() {
  if (!confirm("Reset your local collection and statistics?")) return;
  state = {
    packsOpened: 0,
    totalPulled: 0,
    collection: {},
    history: [],
    rarityCounts: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
  };
  saveState();
  el.revealGrid.innerHTML = "";
  el.packCount.textContent = `0 / ${PACK_SIZE}`;
  renderAll();
}

function pulseRare(mon, card) {
  const rank = RARITIES[mon.rarity].rank;
  addSparkles(card, rank >= RARITIES.legendary.rank ? 24 : 14);
  if (rank >= RARITIES.legendary.rank) launchConfetti();
  showToast(`${RARITIES[mon.rarity].label} pull: ${mon.name}`);
}

function addSparkles(card, amount) {
  const face = card.querySelector(".card-front");
  if (!face) return;
  for (let i = 0; i < amount; i += 1) {
    const sparkle = document.createElement("span");
    sparkle.className = "sparkle";
    sparkle.style.left = `${20 + Math.random() * 60}%`;
    sparkle.style.top = `${14 + Math.random() * 54}%`;
    sparkle.style.setProperty("--spark-x", `${(Math.random() - .5) * 140}px`);
    sparkle.style.setProperty("--spark-y", `${(Math.random() - .5) * 120}px`);
    sparkle.style.animationDelay = `${Math.random() * .18}s`;
    face.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 1200);
  }
}

function launchConfetti() {
  const colors = ["#2563eb", "#38bdf8", "#facc15", "#ef4444", "#ffffff"];
  for (let i = 0; i < 90; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty("--x", `${(Math.random() - .5) * 220}px`);
    piece.style.animationDelay = `${Math.random() * .35}s`;
    el.confettiLayer.appendChild(piece);
    setTimeout(() => piece.remove(), 2300);
  }
}

let toastTimer;
function showToast(message) {
  el.toast.textContent = message;
  el.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.toast.hidden = true; }, 3200);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function titleCase(value) {
  return String(value).split("-").map(capitalize).join(" ");
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function hexToRgba(hex, alpha) {
  const normalized = hex.replace("#", "");
  const value = parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function bindEvents() {
  el.navLinks.forEach(link => {
    link.addEventListener("click", () => switchView(link.dataset.viewLink));
  });
  el.openButtons.forEach(button => button.addEventListener("click", openPack));
  el.openPackButton.addEventListener("click", openPack);
  el.searchInput.addEventListener("input", renderCollection);
  el.typeFilter.addEventListener("change", renderCollection);
  el.sortSelect.addEventListener("change", renderCollection);
  el.resetCollection.addEventListener("click", resetCollection);
}

async function init() {
  initStorage();
  bindEvents();
  renderTypeOptions([]);
  renderAll();
  await loadApiMetadata();
  renderAll();
}

init();
