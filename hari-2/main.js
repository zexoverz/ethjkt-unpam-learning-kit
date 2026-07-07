const API_BASE = "https://db.ygoprodeck.com/api/v7/";
const CARD_CACHE_KEY = "millenniumPack.cardCache.v1";
const COLLECTION_KEY = "millenniumPack.collection.v1";
const STATS_KEY = "millenniumPack.stats.v1";
const CACHE_TTL = 1000 * 60 * 60 * 12;
const PACK_SIZE = 5;

/** @typedef {{id:number,name:string,type:string,frameType:string,desc:string,atk?:number,def?:number,level?:number,race?:string,attribute?:string,archetype?:string,scale?:number,linkval?:number,linkmarkers?:string[],tcg_date?:string,md_rarity?:string,card_sets?:CardSet[],card_images?:CardImage[],card_prices?:CardPrice[]}} YgoCard */
/** @typedef {{set_name:string,set_code:string,set_rarity:string,set_rarity_code?:string,set_price?:string}} CardSet */
/** @typedef {{id:number,image_url:string,image_url_small:string,image_url_cropped:string}} CardImage */
/** @typedef {{tcgplayer_price?:string,cardmarket_price?:string,ebay_price?:string,amazon_price?:string,coolstuffinc_price?:string}} CardPrice */
/** @typedef {{card:YgoCard,rarity:string,set:CardSet|null,pulledAt:number,favorite?:boolean,count:number,lastPulledAt:number}} CollectionEntry */

const rarityWeights = [
  { name: "Common", weight: 65, rank: 1 },
  { name: "Rare", weight: 20, rank: 2 },
  { name: "Super Rare", weight: 12, rank: 3 },
  { name: "Ultra Rare", weight: 5, rank: 4 },
  { name: "Secret Rare", weight: 0.95, rank: 5 }
];

const state = {
  cards: /** @type {YgoCard[]} */ ([]),
  sets: [],
  archetypes: [],
  rarityBuckets: new Map(),
  collection: /** @type {Record<string, CollectionEntry>} */ ({}),
  stats: {
    packsOpened: 0,
    totalCards: 0,
    highestRarity: "None",
    history: [],
    rarityDistribution: {}
  },
  currentPulls: [],
  loading: false
};

const el = {
  views: document.querySelectorAll(".view"),
  navLinks: document.querySelectorAll(".nav-link"),
  homeStats: document.getElementById("home-stats"),
  featuredCards: document.getElementById("featured-cards"),
  openPack: document.getElementById("open-pack"),
  preloadCards: document.getElementById("preload-cards"),
  apiStatus: document.getElementById("api-status"),
  rateTable: document.getElementById("rate-table"),
  stagePack: document.getElementById("stage-pack"),
  stageLight: document.getElementById("stage-light"),
  flash: document.getElementById("flash"),
  pullResults: document.getElementById("pull-results"),
  collectionGrid: document.getElementById("collection-grid"),
  collectionSearch: document.getElementById("collection-search"),
  rarityFilter: document.getElementById("rarity-filter"),
  typeFilter: document.getElementById("type-filter"),
  sortSelect: document.getElementById("sort-select"),
  resetCollection: document.getElementById("reset-collection"),
  progressText: document.getElementById("collection-progress-text"),
  progressBar: document.getElementById("collection-progress-bar"),
  statsGrid: document.getElementById("stats-grid"),
  historyList: document.getElementById("history-list"),
  dialog: document.getElementById("card-dialog"),
  dialogContent: document.getElementById("dialog-content"),
  dialogClose: document.getElementById("dialog-close"),
  toast: document.getElementById("toast"),
  soundToggle: document.getElementById("sound-toggle"),
  confetti: document.getElementById("confetti")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindEvents();
  loadLocalState();
  renderRateTable();
  renderAll();
  await loadApiData();
}

function bindEvents() {
  el.navLinks.forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));
  document.querySelectorAll("[data-view-jump]").forEach((button) => button.addEventListener("click", () => showView(button.dataset.viewJump)));
  document.getElementById("start-gacha").addEventListener("click", () => showView("gacha"));
  el.openPack.addEventListener("click", openPack);
  el.preloadCards.addEventListener("click", () => loadApiData(true));
  [el.collectionSearch, el.rarityFilter, el.typeFilter, el.sortSelect].forEach((input) => input.addEventListener("input", renderCollection));
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

async function loadApiData(force = false) {
  if (state.loading) return;
  state.loading = true;
  setLoading(true);

  try {
    const cached = readCache();
    if (!force && cached) {
      applyApiData(cached);
      setStatus(`Loaded ${state.cards.length.toLocaleString()} cards from browser cache.`);
      return;
    }

    setStatus("Fetching YGOPRODeck cardinfo, card sets, and archetypes...");
    const [cardsResponse, setsResponse, archetypesResponse] = await Promise.all([
      fetch(`${API_BASE}cardinfo.php?format=tcg&misc=yes`),
      fetch(`${API_BASE}cardsets.php`),
      fetch(`${API_BASE}archetypes.php`)
    ]);

    if (!cardsResponse.ok) throw new Error(`cardinfo.php returned ${cardsResponse.status}`);
    const cardsPayload = await cardsResponse.json();
    const setsPayload = setsResponse.ok ? await setsResponse.json() : [];
    const archetypesPayload = archetypesResponse.ok ? await archetypesResponse.json() : [];
    const payload = { cards: cardsPayload.data || [], sets: setsPayload || [], archetypes: archetypesPayload || [], savedAt: Date.now() };
    localStorage.setItem(CARD_CACHE_KEY, JSON.stringify(payload));
    applyApiData(payload);
    setStatus(`Loaded ${state.cards.length.toLocaleString()} live TCG cards and ${state.sets.length.toLocaleString()} sets.`);
  } catch (error) {
    console.error(error);
    const cached = readCache(true);
    if (cached) {
      applyApiData(cached);
      setStatus("API request failed. Using the last saved local cache.");
      showToast("API unavailable, using cached archive.");
    } else {
      setStatus("Could not load YGOPRODeck data. Check network access and retry.");
      showToast("Could not load YGOPRODeck data.");
    }
  } finally {
    state.loading = false;
    setLoading(false);
    renderAll();
  }
}

function readCache(ignoreTtl = false) {
  try {
    const raw = localStorage.getItem(CARD_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!ignoreTtl && Date.now() - cached.savedAt > CACHE_TTL) return null;
    return cached;
  } catch {
    return null;
  }
}

function applyApiData(payload) {
  state.cards = (payload.cards || []).filter((card) => card.card_images?.length && !["Skill Card", "Token"].includes(card.type));
  state.sets = payload.sets || [];
  state.archetypes = payload.archetypes || [];
  buildRarityBuckets();
}

function buildRarityBuckets() {
  state.rarityBuckets = new Map(rarityWeights.map((rarity) => [rarity.name, []]));

  state.cards.forEach((card) => {
    const cardSets = Array.isArray(card.card_sets) ? card.card_sets : [];
    const matched = new Set();

    cardSets.forEach((set) => {
      const rarity = classifyRarity(set.set_rarity, card);
      if (!state.rarityBuckets.has(rarity)) state.rarityBuckets.set(rarity, []);
      state.rarityBuckets.get(rarity).push({ card, set, rarity });
      matched.add(rarity);
    });

    if (!cardSets.length) {
      const rarity = classifyRarity("", card);
      state.rarityBuckets.get(rarity).push({ card, set: null, rarity });
    }
  });
}

function classifyRarity(rawRarity = "", card = {}) {
  const rarity = rawRarity.toLowerCase();
  const md = String(card.md_rarity || "").toUpperCase();

  if (rarity.includes("secret") || rarity.includes("starlight") || rarity.includes("ghost") || rarity.includes("collector")) return "Secret Rare";
  if (rarity.includes("ultra") || md === "UR") return "Ultra Rare";
  if (rarity.includes("super") || md === "SR") return "Super Rare";
  if (rarity.includes("rare") || md === "R") return "Rare";
  return "Common";
}

function rollRarity(slotIndex) {
  const table = slotIndex === PACK_SIZE - 1
    ? [
        { name: "Common", weight: 25 },
        { name: "Rare", weight: 34 },
        { name: "Super Rare", weight: 24 },
        { name: "Ultra Rare", weight: 12 },
        { name: "Secret Rare", weight: 2.5 }
      ]
    : rarityWeights;
  const total = table.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.random() * total;
  for (const item of table) {
    cursor -= item.weight;
    if (cursor <= 0) return item.name;
  }
  return "Common";
}

function choosePull(rarity) {
  const preferred = state.rarityBuckets.get(rarity) || [];
  const pool = preferred.length ? preferred : state.cards.map((card) => ({ card, set: card.card_sets?.[0] || null, rarity: classifyRarity(card.card_sets?.[0]?.set_rarity, card) }));
  return pool[Math.floor(Math.random() * pool.length)];
}

async function openPack() {
  if (!state.cards.length) {
    showToast("Load card data first.");
    await loadApiData();
    if (!state.cards.length) return;
  }

  el.openPack.disabled = true;
  el.pullResults.innerHTML = "";
  state.currentPulls = [];
  playTone(180, 0.08);
  el.stagePack.classList.remove("torn");
  el.stagePack.classList.add("opening");
  await wait(900);
  el.stagePack.classList.remove("opening");
  el.stagePack.classList.add("torn");
  el.flash.classList.add("show");
  setTimeout(() => el.flash.classList.remove("show"), 900);

  const pulls = Array.from({ length: PACK_SIZE }, (_, index) => choosePull(rollRarity(index)));
  state.currentPulls = pulls;
  pulls.forEach((pull, index) => {
    setTimeout(() => revealPullCard(pull, index), 420 + index * 620);
  });

  await wait(420 + PACK_SIZE * 620 + 500);
  savePulls(pulls);
  renderAll();
  el.stagePack.classList.remove("torn");
  el.openPack.disabled = false;
}

function revealPullCard(pull, index) {
  const article = document.createElement("article");
  article.className = `pull-card revealed ${rarityClass(pull.rarity)} ${index === PACK_SIZE - 1 ? "final" : ""}`;
  article.style.setProperty("--delay", "0ms");
  article.innerHTML = `<div class="card-inner"><div class="card-back"></div>${cardFaceHtml(pull.card, pull.rarity, pull.set, true)}</div>`;
  article.addEventListener("click", () => openCardDialog(pull.card, pull.rarity, pull.set));
  el.pullResults.appendChild(article);
  playTone(index === PACK_SIZE - 1 ? 440 : 260 + index * 35, 0.09);

  if (["Ultra Rare", "Secret Rare"].includes(pull.rarity)) {
    el.stageLight.animate([
      { transform: "scale(1)", opacity: 0.5 },
      { transform: "scale(1.5)", opacity: 0.85 },
      { transform: "scale(1)", opacity: 0.45 }
    ], { duration: 900, easing: "ease-out" });
  }
  if (pull.rarity === "Secret Rare") burstConfetti();
}

function savePulls(pulls) {
  state.stats.packsOpened += 1;
  state.stats.totalCards += pulls.length;

  pulls.forEach((pull) => {
    const key = String(pull.card.id);
    const existing = state.collection[key];
    if (existing) {
      existing.count += 1;
      existing.lastPulledAt = Date.now();
      existing.rarity = higherRarity(existing.rarity, pull.rarity);
      if (rarityRank(pull.rarity) >= rarityRank(existing.rarity)) existing.set = pull.set;
    } else {
      state.collection[key] = {
        card: pull.card,
        rarity: pull.rarity,
        set: pull.set,
        pulledAt: Date.now(),
        lastPulledAt: Date.now(),
        favorite: false,
        count: 1
      };
    }
    state.stats.rarityDistribution[pull.rarity] = (state.stats.rarityDistribution[pull.rarity] || 0) + 1;
    state.stats.highestRarity = higherRarity(state.stats.highestRarity, pull.rarity);
  });

  const historyEntries = pulls.map((pull) => ({ id: pull.card.id, name: pull.card.name, rarity: pull.rarity, image: getImage(pull.card, "small"), set: pull.set?.set_name || "Unknown set", at: Date.now() }));
  state.stats.history = [...historyEntries, ...state.stats.history].slice(0, 40);
  persistLocalState();
  showToast("Pack added to collection.");
}

function higherRarity(a, b) {
  if (a === "None") return b;
  return rarityRank(b) > rarityRank(a) ? b : a;
}

function rarityRank(rarity) {
  return rarityWeights.find((item) => item.name === rarity)?.rank || 0;
}

function renderAll() {
  renderHomeStats();
  renderFeaturedCards();
  renderCollection();
  renderStats();
}

function renderHomeStats() {
  const unique = Object.keys(state.collection).length;
  const duplicates = Math.max(0, state.stats.totalCards - unique);
  el.homeStats.innerHTML = [
    statHtml("Packs opened", state.stats.packsOpened),
    statHtml("Cards obtained", state.stats.totalCards),
    statHtml("Unique cards", unique),
    statHtml("Duplicates", duplicates)
  ].join("");
}

function statHtml(label, value) {
  return `<div class="stat-card"><span>${label}</span><strong>${String(value).toLocaleString()}</strong></div>`;
}

function renderRateTable() {
  el.rateTable.innerHTML = rarityWeights.map((rarity) => `<div class="rate-row"><span>${rarity.name}</span><strong>${rarity.weight}%</strong></div>`).join("");
}

function renderFeaturedCards() {
  if (!state.cards.length) return;
  const wanted = ["Dark Magician", "Blue-Eyes White Dragon", "Exodia the Forbidden One", "Red-Eyes Black Dragon"];
  const featured = wanted.map((name) => state.cards.find((card) => card.name === name)).filter(Boolean);
  const fallback = state.cards.slice(0, 4 - featured.length);
  el.featuredCards.classList.remove("skeleton-grid");
  el.featuredCards.innerHTML = [...featured, ...fallback].slice(0, 4).map((card) => {
    const set = card.card_sets?.[0] || null;
    const rarity = classifyRarity(set?.set_rarity, card);
    return `<article class="featured-card ${rarityClass(rarity)}">${cardFaceHtml(card, rarity, set)}</article>`;
  }).join("");
  el.featuredCards.querySelectorAll(".featured-card").forEach((node, index) => node.addEventListener("click", () => {
    const card = [...featured, ...fallback][index];
    const set = card.card_sets?.[0] || null;
    openCardDialog(card, classifyRarity(set?.set_rarity, card), set);
  }));
}

function renderCollection() {
  const entries = Object.values(state.collection);
  const query = el.collectionSearch.value.trim().toLowerCase();
  const rarityFilter = el.rarityFilter.value;
  const typeFilter = el.typeFilter.value;
  const sort = el.sortSelect.value;

  let filtered = entries.filter((entry) => {
    const card = entry.card;
    const haystack = [card.name, card.type, card.race, card.attribute, card.archetype, entry.set?.set_name, entry.set?.set_code].filter(Boolean).join(" ").toLowerCase();
    const typeOk = typeFilter === "all" || (typeFilter === "Monster" ? !["Spell Card", "Trap Card"].includes(card.type) : card.type === typeFilter);
    return (!query || haystack.includes(query)) && (rarityFilter === "all" || entry.rarity === rarityFilter) && typeOk;
  });

  filtered.sort((a, b) => {
    if (sort === "name") return a.card.name.localeCompare(b.card.name);
    if (sort === "rarity") return rarityRank(b.rarity) - rarityRank(a.rarity);
    if (sort === "dupes") return b.count - a.count;
    return b.lastPulledAt - a.lastPulledAt;
  });

  const totalCards = state.cards.length || 1;
  const progress = Math.min(100, (entries.length / totalCards) * 100);
  el.progressText.textContent = `${progress.toFixed(2)}% complete`;
  el.progressBar.style.width = `${progress}%`;

  if (!filtered.length) {
    el.collectionGrid.innerHTML = `<div class="empty-state">No cards match this collection view.</div>`;
    return;
  }

  el.collectionGrid.innerHTML = filtered.map((entry) => collectionCardHtml(entry)).join("");
  el.collectionGrid.querySelectorAll("[data-detail]").forEach((button) => button.addEventListener("click", () => {
    const entry = state.collection[button.dataset.detail];
    openCardDialog(entry.card, entry.rarity, entry.set);
  }));
  el.collectionGrid.querySelectorAll("[data-favorite]").forEach((button) => button.addEventListener("click", () => toggleFavorite(button.dataset.favorite)));
  el.collectionGrid.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => deleteCard(button.dataset.delete)));
}

function collectionCardHtml(entry) {
  return `<article class="collection-card ${rarityClass(entry.rarity)}">
    ${cardFaceHtml(entry.card, entry.rarity, entry.set)}
    <div class="card-content">
      <div class="meta-line"><span class="pill">Owned x${entry.count}</span>${entry.favorite ? `<span class="pill">Favorite</span>` : ""}</div>
      <div class="card-actions">
        <button class="icon-btn" data-detail="${entry.card.id}">Details</button>
        <button class="icon-btn ${entry.favorite ? "active" : ""}" data-favorite="${entry.card.id}">Star</button>
        <button class="icon-btn" data-delete="${entry.card.id}">Delete</button>
      </div>
    </div>
  </article>`;
}

function renderStats() {
  const unique = Object.keys(state.collection).length;
  const duplicates = Math.max(0, state.stats.totalCards - unique);
  const topRarity = state.stats.highestRarity || "None";
  el.statsGrid.innerHTML = [
    statHtml("Total packs", state.stats.packsOpened),
    statHtml("Total cards", state.stats.totalCards),
    statHtml("Highest rarity", topRarity),
    statHtml("Duplicate count", duplicates)
  ].join("");

  const distribution = rarityWeights.map((rarity) => {
    const count = state.stats.rarityDistribution[rarity.name] || 0;
    return `<div class="history-item"><span class="pill rarity-badge" style="--rarity-color:${rarityColor(rarity.name)}">${rarity.name}</span><strong>${count}</strong><span>${state.stats.totalCards ? ((count / state.stats.totalCards) * 100).toFixed(1) : "0.0"}%</span></div>`;
  }).join("");

  const history = state.stats.history.length
    ? state.stats.history.map((item) => `<div class="history-item"><img class="history-thumb" src="${item.image}" alt="${escapeHtml(item.name)}" loading="lazy"><div><strong>${escapeHtml(item.name)}</strong><div class="meta-line"><span class="pill rarity-badge" style="--rarity-color:${rarityColor(item.rarity)}">${item.rarity}</span><span class="pill">${escapeHtml(item.set)}</span></div></div><time>${new Date(item.at).toLocaleDateString()}</time></div>`).join("")
    : `<div class="empty-state">Open a pack to create pull history.</div>`;

  el.historyList.innerHTML = distribution + history;
}

function cardFaceHtml(card, rarity, set, compact = false) {
  const image = getImage(card, compact ? "small" : "full");
  const stats = formatStats(card);
  return `<div class="card-face">
    <img class="card-image" src="${image}" alt="${escapeHtml(card.name)}" loading="lazy">
    <div class="card-content">
      <h3 class="card-title">${escapeHtml(card.name)}</h3>
      <div class="meta-line">
        <span class="pill rarity-badge" style="--rarity-color:${rarityColor(rarity)}">${rarity}</span>
        <span class="pill">${escapeHtml(card.attribute || card.frameType || "Card")}</span>
        <span class="pill">${escapeHtml(card.type)}</span>
      </div>
      <div class="meta-line">
        ${stats.map((item) => `<span class="pill">${escapeHtml(item)}</span>`).join("")}
      </div>
      <p class="card-desc">${escapeHtml(card.desc || "No effect text available.")}</p>
      <div class="meta-line">
        <span class="pill">${escapeHtml(card.archetype || "No archetype")}</span>
        <span class="pill">${escapeHtml(set?.set_name || "No set data")}</span>
        <span class="pill">ID ${card.id}</span>
      </div>
    </div>
  </div>`;
}

function openCardDialog(card, rarity, set) {
  el.dialogContent.innerHTML = `<div class="dialog-layout">
    <img src="${getImage(card, "full")}" alt="${escapeHtml(card.name)}">
    <div>
      <p class="eyebrow">${escapeHtml(rarity)}</p>
      <h2>${escapeHtml(card.name)}</h2>
      <div class="detail-list">
        <div><span>Attribute</span><strong>${escapeHtml(card.attribute || card.frameType || "N/A")}</strong></div>
        <div><span>Card type</span><strong>${escapeHtml(card.type)}</strong></div>
        <div><span>Level / Link</span><strong>${escapeHtml(String(card.level ?? card.linkval ?? "N/A"))}</strong></div>
        <div><span>Race</span><strong>${escapeHtml(card.race || "N/A")}</strong></div>
        <div><span>ATK / DEF</span><strong>${escapeHtml(`${card.atk ?? "-"} / ${card.def ?? "-"}`)}</strong></div>
        <div><span>Archetype</span><strong>${escapeHtml(card.archetype || "None")}</strong></div>
        <div><span>Card set</span><strong>${escapeHtml(set?.set_name || "No set data")}</strong></div>
        <div><span>Card ID</span><strong>${card.id}</strong></div>
      </div>
      <p class="panel-copy">${escapeHtml(card.desc || "No effect text available.")}</p>
      <div class="meta-line"><span class="pill">${escapeHtml(set?.set_code || "No set code")}</span><span class="pill">${escapeHtml(set?.set_rarity || rarity)}</span><span class="pill">$${escapeHtml(set?.set_price || card.card_prices?.[0]?.tcgplayer_price || "0.00")}</span></div>
    </div>
  </div>`;
  el.dialog.showModal();
}

function formatStats(card) {
  const output = [];
  if (card.level) output.push(`Level ${card.level}`);
  if (card.linkval) output.push(`Link ${card.linkval}`);
  if (card.race) output.push(card.race);
  if (card.atk !== undefined) output.push(`ATK ${card.atk}`);
  if (card.def !== undefined) output.push(`DEF ${card.def}`);
  if (card.scale !== undefined) output.push(`Scale ${card.scale}`);
  return output.slice(0, 4);
}

function getImage(card, size) {
  const image = card.card_images?.[0];
  if (!image) return "";
  return size === "small" ? image.image_url_small : image.image_url;
}

function rarityClass(rarity) {
  return `rarity-${rarity.replaceAll(" ", "-")}`;
}

function rarityColor(rarity) {
  return {
    "Common": "#c6c8d1",
    "Rare": "#74c0fc",
    "Super Rare": "#c084fc",
    "Ultra Rare": "#ffd166",
    "Secret Rare": "#ff7ad9"
  }[rarity] || "#c6c8d1";
}

function toggleFavorite(id) {
  const entry = state.collection[id];
  if (!entry) return;
  entry.favorite = !entry.favorite;
  persistLocalState();
  renderCollection();
}

function deleteCard(id) {
  const entry = state.collection[id];
  if (!entry) return;
  if (entry.count > 1) entry.count -= 1;
  else delete state.collection[id];
  persistLocalState();
  renderAll();
}

function resetCollection() {
  if (!confirm("Reset all pulled cards and statistics?")) return;
  state.collection = {};
  state.stats = { packsOpened: 0, totalCards: 0, highestRarity: "None", history: [], rarityDistribution: {} };
  persistLocalState();
  renderAll();
  showToast("Collection reset.");
}

function loadLocalState() {
  try {
    state.collection = JSON.parse(localStorage.getItem(COLLECTION_KEY)) || {};
    state.stats = { ...state.stats, ...(JSON.parse(localStorage.getItem(STATS_KEY)) || {}) };
  } catch {
    state.collection = {};
  }
}

function persistLocalState() {
  localStorage.setItem(COLLECTION_KEY, JSON.stringify(state.collection));
  localStorage.setItem(STATS_KEY, JSON.stringify(state.stats));
}

function setLoading(loading) {
  el.openPack.disabled = loading;
  el.preloadCards.disabled = loading;
}

function setStatus(message) {
  el.apiStatus.textContent = message;
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => el.toast.classList.remove("show"), 2800);
}

function playTone(frequency, duration) {
  if (!el.soundToggle.checked) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = frequency;
  oscillator.type = "triangle";
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.07, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration + 0.02);
}

function burstConfetti() {
  const canvas = el.confetti;
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  const particles = Array.from({ length: 90 }, () => ({
    x: canvas.width / 2,
    y: canvas.height * 0.28,
    vx: (Math.random() - 0.5) * 13,
    vy: Math.random() * -10 - 3,
    size: Math.random() * 7 + 3,
    color: ["#f4c84f", "#ff7ad9", "#64f4ff", "#ffffff"][Math.floor(Math.random() * 4)],
    life: 90
  }));

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.28;
      p.life -= 1;
      ctx.globalAlpha = Math.max(p.life / 90, 0);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;
    if (particles.some((p) => p.life > 0)) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  frame();
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[char]));
}
