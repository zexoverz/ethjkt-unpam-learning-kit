const API_BASE = "https://pokeapi.co/api/v2";
const CACHE_KEY = "pokepack.apiCache.v1";
const STATE_KEY = "pokepack.collection.v1";
const CACHE_TTL = 1000 * 60 * 60 * 24;
const PACK_SIZE = 5;
const MAX_POKEMON_POOL = 1025;

const rarityTable = [
  { name: "Common", weight: 55, rank: 1 },
  { name: "Uncommon", weight: 25, rank: 2 },
  { name: "Rare", weight: 14, rank: 3 },
  { name: "Epic", weight: 5, rank: 4 },
  { name: "Legendary", weight: 1, rank: 5 }
];

const finalSlotTable = [
  { name: "Common", weight: 30, rank: 1 },
  { name: "Uncommon", weight: 30, rank: 2 },
  { name: "Rare", weight: 24, rank: 3 },
  { name: "Epic", weight: 12, rank: 4 },
  { name: "Legendary", weight: 4, rank: 5 }
];

const state = {
  pokemonList: [],
  types: [],
  detailCache: {},
  collection: {},
  stats: {
    packsOpened: 0,
    totalPokemon: 0,
    highestRarity: "None",
    rarityDistribution: {},
    history: []
  },
  loading: false
};

const el = {
  views: document.querySelectorAll(".view"),
  navLinks: document.querySelectorAll(".nav-link"),
  heroOpenPack: document.getElementById("hero-open-pack"),
  openPack: document.getElementById("open-pack"),
  refreshCache: document.getElementById("refresh-cache"),
  stagePack: document.getElementById("stage-pack"),
  arenaGlow: document.getElementById("arena-glow"),
  flash: document.getElementById("flash"),
  pullResults: document.getElementById("pull-results"),
  featuredGrid: document.getElementById("featured-grid"),
  apiStatus: document.getElementById("api-status"),
  homeStats: document.getElementById("home-stats"),
  rateTable: document.getElementById("rate-table"),
  typeFilter: document.getElementById("type-filter"),
  rarityFilter: document.getElementById("rarity-filter"),
  searchInput: document.getElementById("search-input"),
  sortSelect: document.getElementById("sort-select"),
  resetCollection: document.getElementById("reset-collection"),
  collectionGrid: document.getElementById("collection-grid"),
  completionLabel: document.getElementById("completion-label"),
  completionBar: document.getElementById("completion-bar"),
  statsGrid: document.getElementById("stats-grid"),
  historyList: document.getElementById("history-list"),
  dialog: document.getElementById("pokemon-dialog"),
  dialogContent: document.getElementById("dialog-content"),
  dialogClose: document.getElementById("dialog-close"),
  toast: document.getElementById("toast"),
  confetti: document.getElementById("confetti")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindEvents();
  loadLocalState();
  loadApiCache();
  renderRateTable();
  renderAll();
  await initializeApi();
}

function bindEvents() {
  el.navLinks.forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));
  document.querySelectorAll("[data-view-jump]").forEach((button) => button.addEventListener("click", () => showView(button.dataset.viewJump)));
  el.heroOpenPack.addEventListener("click", () => showView("gacha"));
  el.openPack.addEventListener("click", openPack);
  el.refreshCache.addEventListener("click", () => initializeApi(true));
  [el.searchInput, el.typeFilter, el.rarityFilter, el.sortSelect].forEach((input) => input.addEventListener("input", renderCollection));
  el.resetCollection.addEventListener("click", resetCollection);
  el.dialogClose.addEventListener("click", () => el.dialog.close());
  el.dialog.addEventListener("click", (event) => {
    if (event.target === el.dialog) el.dialog.close();
  });
}

function showView(viewId) {
  el.views.forEach((view) => view.classList.toggle("active-view", view.id === viewId));
  el.navLinks.forEach((button) => button.classList.toggle("active", button.dataset.view === viewId));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function initializeApi(force = false) {
  if (state.loading) return;
  state.loading = true;
  setButtons(true);

  try {
    const cachedFresh = !force && loadApiCache();
    if (cachedFresh && state.pokemonList.length && state.types.length) {
      setStatus(`Loaded ${state.pokemonList.length.toLocaleString()} Pokémon from local cache.`);
      await renderFeaturedPokemon();
      return;
    }

    setStatus("Fetching Pokémon index and type filters from PokéAPI...");
    const [pokemonList, typeList] = await Promise.all([
      fetchJson(`${API_BASE}/pokemon?limit=${MAX_POKEMON_POOL}&offset=0`),
      fetchJson(`${API_BASE}/type`)
    ]);

    state.pokemonList = pokemonList.results || [];
    state.types = (typeList.results || []).map((type) => type.name).filter((name) => !["unknown", "shadow"].includes(name));
    persistApiCache();
    renderTypeOptions();
    setStatus(`Ready: ${state.pokemonList.length.toLocaleString()} Pokémon and ${state.types.length} types indexed.`);
    await renderFeaturedPokemon();
  } catch (error) {
    console.error(error);
    setStatus("PokéAPI request failed. Using any cached data available.");
    showToast("Could not refresh PokéAPI data.");
  } finally {
    state.loading = false;
    setButtons(false);
    renderAll();
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

function loadApiCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const cached = JSON.parse(raw);
    state.pokemonList = cached.pokemonList || [];
    state.types = cached.types || [];
    state.detailCache = cached.detailCache || {};
    renderTypeOptions();
    return Date.now() - (cached.savedAt || 0) < CACHE_TTL;
  } catch {
    return false;
  }
}

function persistApiCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      pokemonList: state.pokemonList,
      types: state.types,
      detailCache: state.detailCache,
      savedAt: Date.now()
    }));
  } catch {
    pruneDetailCache();
  }
}

function pruneDetailCache() {
  const entries = Object.entries(state.detailCache).slice(-160);
  state.detailCache = Object.fromEntries(entries);
}

async function getPokemon(identifier) {
  const key = String(identifier);
  if (state.detailCache[key]) return state.detailCache[key];

  const pokemon = await fetchJson(`${API_BASE}/pokemon/${identifier}`);
  const species = await fetchJson(pokemon.species.url);
  const normalized = normalizePokemon(pokemon, species);
  state.detailCache[key] = normalized;
  state.detailCache[String(normalized.id)] = normalized;
  persistApiCache();
  return normalized;
}

function normalizePokemon(pokemon, species) {
  const artwork = pokemon.sprites?.other?.["official-artwork"]?.front_default || pokemon.sprites?.front_default || "";
  const shinyArtwork = pokemon.sprites?.other?.["official-artwork"]?.front_shiny || pokemon.sprites?.front_shiny || artwork;
  const stats = pokemon.stats.map((item) => ({ name: item.stat.name, value: item.base_stat }));
  const bst = stats.reduce((sum, item) => sum + item.value, 0);
  const genus = species.genera?.find((item) => item.language.name === "en")?.genus || "Pokémon";
  const flavor = species.flavor_text_entries?.find((item) => item.language.name === "en")?.flavor_text?.replace(/[\n\f]/g, " ") || "No species note available.";
  const rarity = classifyRarity({ pokemon, species, bst });

  return {
    id: pokemon.id,
    name: titleCase(pokemon.name),
    rawName: pokemon.name,
    pokedexNumber: pokemon.id,
    artwork,
    shinyArtwork,
    sprite: pokemon.sprites?.front_default || artwork,
    types: pokemon.types.map((item) => item.type.name),
    height: pokemon.height,
    weight: pokemon.weight,
    baseExperience: pokemon.base_experience || 0,
    abilities: pokemon.abilities.map((item) => ({ name: titleCase(item.ability.name), hidden: item.is_hidden })),
    stats,
    bst,
    species: titleCase(species.name),
    genus,
    flavor,
    captureRate: species.capture_rate,
    isLegendary: species.is_legendary,
    isMythical: species.is_mythical,
    rarity
  };
}

function classifyRarity({ pokemon, species, bst }) {
  const exp = pokemon.base_experience || 0;
  const capture = species.capture_rate ?? 255;
  if (species.is_legendary || species.is_mythical) return "Legendary";
  if (bst >= 560 || exp >= 240 || capture <= 25) return "Epic";
  if (bst >= 480 || exp >= 170 || capture <= 75) return "Rare";
  if (bst >= 350 || exp >= 90 || capture <= 140) return "Uncommon";
  return "Common";
}

async function openPack() {
  if (!state.pokemonList.length) {
    showToast("Loading PokéAPI index first.");
    await initializeApi();
    if (!state.pokemonList.length) return;
  }

  setButtons(true);
  el.pullResults.innerHTML = "";
  el.stagePack.classList.remove("opened");
  el.stagePack.classList.add("shaking");
  await wait(920);
  el.stagePack.classList.remove("shaking");
  el.stagePack.classList.add("opened");
  flash();

  const pulls = [];
  for (let index = 0; index < PACK_SIZE; index += 1) {
    const target = rollRarity(index === PACK_SIZE - 1 ? finalSlotTable : rarityTable);
    const pull = await drawPokemon(target);
    pulls.push(pull);
    setTimeout(() => revealPull(pull, index), 320 + index * 560);
  }

  await wait(320 + PACK_SIZE * 560 + 500);
  savePack(pulls);
  renderAll();
  el.stagePack.classList.remove("opened");
  setButtons(false);
}

function rollRarity(table) {
  const total = table.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.random() * total;
  for (const item of table) {
    cursor -= item.weight;
    if (cursor <= 0) return item.name;
  }
  return "Common";
}

async function drawPokemon(targetRarity) {
  const attempts = targetRarity === "Legendary" ? 16 : 8;
  let best = null;

  for (let i = 0; i < attempts; i += 1) {
    const candidate = await getPokemon(randomPokemonName());
    if (candidate.rarity === targetRarity) return candidate;
    if (!best || Math.abs(rarityRank(candidate.rarity) - rarityRank(targetRarity)) < Math.abs(rarityRank(best.rarity) - rarityRank(targetRarity))) {
      best = candidate;
    }
  }
  return best;
}

function randomPokemonName() {
  const item = state.pokemonList[Math.floor(Math.random() * state.pokemonList.length)];
  return item.name;
}

function revealPull(pokemon, index) {
  const card = document.createElement("article");
  card.className = `pokemon-card pull-card revealed ${rarityClass(pokemon.rarity)} ${index === PACK_SIZE - 1 ? "final" : ""}`;
  card.innerHTML = `<div class="card-inner"><div class="card-back"></div>${cardFaceHtml(pokemon, true)}</div>${sparklesHtml(pokemon.rarity)}`;
  card.addEventListener("click", () => openDetails(pokemon));
  el.pullResults.appendChild(card);

  if (rarityRank(pokemon.rarity) >= 4) {
    el.arenaGlow.animate([
      { transform: "scale(1)", opacity: .55 },
      { transform: "scale(1.55)", opacity: .95 },
      { transform: "scale(1)", opacity: .5 }
    ], { duration: 850, easing: "ease-out" });
  }
  if (pokemon.rarity === "Legendary") burstConfetti();
}

function savePack(pulls) {
  state.stats.packsOpened += 1;
  state.stats.totalPokemon += pulls.length;

  pulls.forEach((pokemon) => {
    const key = String(pokemon.id);
    const existing = state.collection[key];
    if (existing) {
      existing.count += 1;
      existing.lastPulledAt = Date.now();
      existing.rarity = higherRarity(existing.rarity, pokemon.rarity);
    } else {
      state.collection[key] = {
        ...pokemon,
        count: 1,
        favorite: false,
        pulledAt: Date.now(),
        lastPulledAt: Date.now()
      };
    }
    state.stats.rarityDistribution[pokemon.rarity] = (state.stats.rarityDistribution[pokemon.rarity] || 0) + 1;
    state.stats.highestRarity = higherRarity(state.stats.highestRarity, pokemon.rarity);
  });

  const history = pulls.map((pokemon) => ({
    id: pokemon.id,
    name: pokemon.name,
    rarity: pokemon.rarity,
    artwork: pokemon.artwork,
    types: pokemon.types,
    at: Date.now()
  }));
  state.stats.history = [...history, ...state.stats.history].slice(0, 60);
  saveLocalState();
  showToast("Pack added to your collection.");
}

function higherRarity(a, b) {
  if (!a || a === "None") return b;
  return rarityRank(b) > rarityRank(a) ? b : a;
}

function rarityRank(rarity) {
  return rarityTable.find((item) => item.name === rarity)?.rank || 0;
}

function renderAll() {
  renderHomeStats();
  renderCollection();
  renderStats();
}

function renderHomeStats() {
  const unique = Object.keys(state.collection).length;
  const duplicates = Math.max(0, state.stats.totalPokemon - unique);
  el.homeStats.innerHTML = [
    statHtml("Packs opened", state.stats.packsOpened),
    statHtml("Total Pokémon", state.stats.totalPokemon),
    statHtml("Unique owned", unique),
    statHtml("Duplicates", duplicates)
  ].join("");
}

function statHtml(label, value) {
  return `<div class="stat-card"><span>${label}</span><strong>${String(value).toLocaleString()}</strong></div>`;
}

function renderRateTable() {
  el.rateTable.innerHTML = rarityTable.map((item) => `<div class="rate-row"><span>${item.name}</span><strong>${item.weight}%</strong></div>`).join("");
}

function renderTypeOptions() {
  const current = el.typeFilter.value || "all";
  el.typeFilter.innerHTML = `<option value="all">All types</option>` + state.types.map((type) => `<option value="${type}">${titleCase(type)}</option>`).join("");
  el.typeFilter.value = state.types.includes(current) ? current : "all";
}

async function renderFeaturedPokemon() {
  if (!state.pokemonList.length) return;
  const picks = [];
  while (picks.length < 4) {
    const name = randomPokemonName();
    if (!picks.includes(name)) picks.push(name);
  }
  const pokemon = await Promise.all(picks.map((name) => getPokemon(name)));
  el.featuredGrid.classList.remove("loading-grid");
  el.featuredGrid.innerHTML = pokemon.map((mon) => `<article class="pokemon-card ${rarityClass(mon.rarity)}">${cardFaceHtml(mon)}</article>`).join("");
  el.featuredGrid.querySelectorAll(".pokemon-card").forEach((node, index) => node.addEventListener("click", () => openDetails(pokemon[index])));
}

function renderCollection() {
  const entries = Object.values(state.collection);
  const query = el.searchInput.value.trim().toLowerCase();
  const type = el.typeFilter.value;
  const rarity = el.rarityFilter.value;
  const sort = el.sortSelect.value;

  let filtered = entries.filter((pokemon) => {
    const haystack = [pokemon.name, pokemon.species, pokemon.genus, ...pokemon.types, ...pokemon.abilities.map((ability) => ability.name)].join(" ").toLowerCase();
    return (!query || haystack.includes(query)) && (type === "all" || pokemon.types.includes(type)) && (rarity === "all" || pokemon.rarity === rarity);
  });

  filtered.sort((a, b) => {
    if (sort === "number") return a.id - b.id;
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "rarity") return rarityRank(b.rarity) - rarityRank(a.rarity);
    if (sort === "dupes") return b.count - a.count;
    return b.lastPulledAt - a.lastPulledAt;
  });

  const completion = state.pokemonList.length ? (entries.length / state.pokemonList.length) * 100 : 0;
  el.completionLabel.textContent = `${completion.toFixed(2)}% complete`;
  el.completionBar.style.width = `${Math.min(100, completion)}%`;

  if (!filtered.length) {
    el.collectionGrid.innerHTML = `<div class="empty-state">No Pokémon match this collection view.</div>`;
    return;
  }

  el.collectionGrid.innerHTML = filtered.map((pokemon) => collectionCardHtml(pokemon)).join("");
  el.collectionGrid.querySelectorAll("[data-detail]").forEach((button) => button.addEventListener("click", () => openDetails(state.collection[button.dataset.detail])));
  el.collectionGrid.querySelectorAll("[data-favorite]").forEach((button) => button.addEventListener("click", () => toggleFavorite(button.dataset.favorite)));
  el.collectionGrid.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => deletePokemon(button.dataset.delete)));
}

function collectionCardHtml(pokemon) {
  return `<article class="pokemon-card ${rarityClass(pokemon.rarity)}">
    ${cardFaceHtml(pokemon)}
    <div class="card-body">
      <div class="meta-line"><span class="pill">Owned x${pokemon.count}</span>${pokemon.favorite ? `<span class="pill">Favorite</span>` : ""}</div>
      <div class="card-actions">
        <button class="icon-btn" data-detail="${pokemon.id}">Details</button>
        <button class="icon-btn ${pokemon.favorite ? "active" : ""}" data-favorite="${pokemon.id}">Star</button>
        <button class="icon-btn" data-delete="${pokemon.id}">Delete</button>
      </div>
    </div>
  </article>`;
}

function renderStats() {
  const unique = Object.keys(state.collection).length;
  const duplicates = Math.max(0, state.stats.totalPokemon - unique);
  el.statsGrid.innerHTML = [
    statHtml("Packs opened", state.stats.packsOpened),
    statHtml("Collected", state.stats.totalPokemon),
    statHtml("Highest rarity", state.stats.highestRarity || "None"),
    statHtml("Duplicates", duplicates)
  ].join("");

  const distribution = rarityTable.map((item) => {
    const count = state.stats.rarityDistribution[item.name] || 0;
    const percent = state.stats.totalPokemon ? ((count / state.stats.totalPokemon) * 100).toFixed(1) : "0.0";
    return `<div class="history-item"><span class="pill rarity-pill" style="--rarity-color:${rarityColor(item.name)}">${item.name}</span><strong>${count}</strong><span>${percent}%</span></div>`;
  }).join("");

  const history = state.stats.history.length
    ? state.stats.history.map((item) => `<div class="history-item"><img class="history-thumb" src="${item.artwork}" alt="${escapeHtml(item.name)}" loading="lazy"><div><strong>${escapeHtml(item.name)}</strong><div class="meta-line"><span class="pill rarity-pill" style="--rarity-color:${rarityColor(item.rarity)}">${item.rarity}</span>${item.types.map((type) => `<span class="pill">${type}</span>`).join("")}</div></div><time>${new Date(item.at).toLocaleDateString()}</time></div>`).join("")
    : `<div class="empty-state">Open a pack to create pull history.</div>`;

  el.historyList.innerHTML = distribution + history;
}

function cardFaceHtml(pokemon, compact = false) {
  const stats = compact ? pokemon.stats.slice(0, 3) : pokemon.stats;
  return `<div class="card-face">
    <div class="art-wrap"><img src="${pokemon.artwork}" alt="${escapeHtml(pokemon.name)}" loading="lazy" onerror="this.onerror=null;this.src='${pokemon.sprite}'"></div>
    <div class="card-body">
      <h3 class="card-title">${escapeHtml(pokemon.name)}</h3>
      <div class="meta-line">
        <span class="pill rarity-pill" style="--rarity-color:${rarityColor(pokemon.rarity)}">${pokemon.rarity}</span>
        <span class="pill">#${String(pokemon.pokedexNumber).padStart(4, "0")}</span>
        ${pokemon.types.map((type) => `<span class="pill">${type}</span>`).join("")}
      </div>
      <div class="meta-line">
        <span class="pill">${(pokemon.height / 10).toFixed(1)} m</span>
        <span class="pill">${(pokemon.weight / 10).toFixed(1)} kg</span>
        <span class="pill">EXP ${pokemon.baseExperience}</span>
      </div>
      <div class="stat-bars">${stats.map((stat) => statRowHtml(stat)).join("")}</div>
    </div>
  </div>`;
}

function statRowHtml(stat) {
  const label = ({ hp: "HP", attack: "ATK", defense: "DEF", "special-attack": "SpA", "special-defense": "SpD", speed: "SPD" })[stat.name] || stat.name;
  const width = Math.min(100, (stat.value / 180) * 100);
  return `<div class="stat-row"><span>${label}</span><span class="stat-track"><span class="stat-fill" style="width:${width}%"></span></span><strong>${stat.value}</strong></div>`;
}

function openDetails(pokemon) {
  el.dialogContent.innerHTML = `<div class="dialog-layout">
    <div class="dialog-art"><img src="${pokemon.artwork}" alt="${escapeHtml(pokemon.name)}" onerror="this.onerror=null;this.src='${pokemon.sprite}'"></div>
    <div>
      <p class="eyebrow">${escapeHtml(pokemon.rarity)} Pokémon</p>
      <h2>${escapeHtml(pokemon.name)}</h2>
      <p class="panel-copy">${escapeHtml(pokemon.flavor)}</p>
      <div class="detail-grid">
        <div><span>Pokédex Number</span><strong>#${String(pokemon.pokedexNumber).padStart(4, "0")}</strong></div>
        <div><span>Species</span><strong>${escapeHtml(pokemon.genus || pokemon.species)}</strong></div>
        <div><span>Type</span><strong>${pokemon.types.map(titleCase).join(" / ")}</strong></div>
        <div><span>Height</span><strong>${(pokemon.height / 10).toFixed(1)} m</strong></div>
        <div><span>Weight</span><strong>${(pokemon.weight / 10).toFixed(1)} kg</strong></div>
        <div><span>Base Experience</span><strong>${pokemon.baseExperience}</strong></div>
        <div><span>Abilities</span><strong>${pokemon.abilities.map((ability) => `${ability.name}${ability.hidden ? " (Hidden)" : ""}`).join(", ")}</strong></div>
        <div><span>Base Stat Total</span><strong>${pokemon.bst}</strong></div>
      </div>
      <div class="stat-bars">${pokemon.stats.map((stat) => statRowHtml(stat)).join("")}</div>
    </div>
  </div>`;
  el.dialog.showModal();
}

function toggleFavorite(id) {
  if (!state.collection[id]) return;
  state.collection[id].favorite = !state.collection[id].favorite;
  saveLocalState();
  renderCollection();
}

function deletePokemon(id) {
  const entry = state.collection[id];
  if (!entry) return;
  if (entry.count > 1) entry.count -= 1;
  else delete state.collection[id];
  saveLocalState();
  renderAll();
}

function resetCollection() {
  if (!confirm("Reset your collection, history, and statistics?")) return;
  state.collection = {};
  state.stats = { packsOpened: 0, totalPokemon: 0, highestRarity: "None", rarityDistribution: {}, history: [] };
  saveLocalState();
  renderAll();
  showToast("Collection reset.");
}

function loadLocalState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STATE_KEY));
    if (!saved) return;
    state.collection = saved.collection || {};
    state.stats = { ...state.stats, ...(saved.stats || {}) };
  } catch {
    state.collection = {};
  }
}

function saveLocalState() {
  localStorage.setItem(STATE_KEY, JSON.stringify({ collection: state.collection, stats: state.stats }));
}

function setButtons(disabled) {
  el.openPack.disabled = disabled;
  el.refreshCache.disabled = disabled;
  el.heroOpenPack.disabled = disabled;
}

function setStatus(message) {
  el.apiStatus.textContent = message;
}

function flash() {
  el.flash.classList.add("show");
  setTimeout(() => el.flash.classList.remove("show"), 900);
}

function sparklesHtml(rarity) {
  if (rarityRank(rarity) < 4) return "";
  return `<span class="sparkle" style="left:18%;top:18%"></span><span class="sparkle" style="right:16%;top:32%;animation-delay:.3s"></span><span class="sparkle" style="left:44%;bottom:18%;animation-delay:.6s"></span>`;
}

function burstConfetti() {
  const canvas = el.confetti;
  const context = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  const colors = ["#2a75bb", "#ffcb05", "#ef4444", "#ffffff"];
  const particles = Array.from({ length: 120 }, () => ({
    x: canvas.width / 2,
    y: canvas.height * .24,
    vx: (Math.random() - .5) * 14,
    vy: Math.random() * -11 - 4,
    size: Math.random() * 7 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: 95
  }));

  function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += .3;
      particle.life -= 1;
      context.globalAlpha = Math.max(0, particle.life / 95);
      context.fillStyle = particle.color;
      context.fillRect(particle.x, particle.y, particle.size, particle.size);
    });
    context.globalAlpha = 1;
    if (particles.some((particle) => particle.life > 0)) requestAnimationFrame(draw);
  }
  draw();
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => el.toast.classList.remove("show"), 2800);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rarityClass(rarity) {
  return `rarity-${rarity}`;
}

function rarityColor(rarity) {
  return {
    Common: "#8fa0b8",
    Uncommon: "#22c55e",
    Rare: "#2a75bb",
    Epic: "#a855f7",
    Legendary: "#f59e0b"
  }[rarity] || "#8fa0b8";
}

function titleCase(value) {
  return String(value).split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[char]));
}
