"use strict";

const API_BASE_URL = "https://genshin.jmp.blue";
const HISTORY_LIMIT = 12;
const PITY_LIMIT = 10;
const SSR_RATE = 0.03;
const EPIC_RATE = 0.10;
const RARE_RATE = 0.30;

const fallbackPool = {
  ssr: [
    createCharacter("Traveler Anemo", "5*", "traveler-anemo"),
    createCharacter("Raiden Shogun", "5*", "raiden"),
    createCharacter("Zhongli", "5*", "zhongli"),
    createCharacter("Furina", "5*", "furina"),
    createCharacter("Nahida", "5*", "nahida")
  ],
  epic: [
    createCharacter("Amber", "4*", "amber"),
    createCharacter("Bennett", "4*", "bennett"),
    createCharacter("Xingqiu", "4*", "xingqiu"),
    createCharacter("Xiangling", "4*", "xiangling"),
    createCharacter("Sucrose", "4*", "sucrose")
  ],
  rare: [
    { name: "Rare Weapon", mark: "R", imageUrl: "" },
    { name: "Rare Artifact", mark: "R", imageUrl: "" }
  ],
  common: [
    { name: "Mora Pack", mark: "C", imageUrl: "" },
    { name: "EXP Book", mark: "C", imageUrl: "" }
  ]
};

const state = {
  pity: 0,
  total: 0,
  ssrCount: 0,
  pool: clonePool(fallbackPool)
};

const elements = {
  card: document.querySelector("#card"),
  cardImage: document.querySelector("#cardImage"),
  cardMark: document.querySelector("#cardMark"),
  cardName: document.querySelector("#cardName"),
  cardRarity: document.querySelector("#cardRarity"),
  history: document.querySelector("#history"),
  pityFill: document.querySelector("#pityFill"),
  pityText: document.querySelector("#pityText"),
  ssrCount: document.querySelector("#ssrCount"),
  total: document.querySelector("#total"),
  tarik1: document.querySelector("#tarik1"),
  tarik10: document.querySelector("#tarik10")
};

const characterIdOverrides = {
  "kaedehara kazuha": "kazuha",
  "kamisato ayaka": "ayaka",
  "kamisato ayato": "ayato",
  "kujou sara": "sara",
  "raiden shogun": "raiden",
  "sangonomiya kokomi": "kokomi",
  "shikanoin heizou": "shikanoin-heizou",
  "traveler": "traveler-anemo",
  "traveler anemo": "traveler-anemo",
  "yae miko": "yae-miko",
  "yun jin": "yun-jin"
};

function createCharacter(name, mark, characterId) {
  return {
    name,
    mark,
    imageUrl: `${API_BASE_URL}/characters/${characterId}/icon-big`
  };
}

function clonePool(pool) {
  return Object.fromEntries(
    Object.entries(pool).map(([key, value]) => [key, value.map((item) => ({ ...item }))])
  );
}

function createApiPool() {
  return {
    ssr: [],
    epic: [],
    rare: fallbackPool.rare.map((item) => ({ ...item })),
    common: fallbackPool.common.map((item) => ({ ...item }))
  };
}

function pickRandom(items) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function getRarity() {
  state.total += 1;
  state.pity += 1;

  const chance = Math.random();
  if (state.pity >= PITY_LIMIT || chance < SSR_RATE) return hitSsr();
  if (chance < EPIC_RATE) return "epic";
  if (chance < RARE_RATE) return "rare";
  return "common";
}

function hitSsr() {
  state.pity = 0;
  state.ssrCount += 1;
  return "ssr";
}

function rollOne() {
  const rarity = getRarity();
  const item = pickRandom(state.pool[rarity]) || pickRandom(fallbackPool[rarity]);
  return { rarity, name: item.name, mark: item.mark, imageUrl: item.imageUrl };
}

function renderResult(result) {
  renderCharacterImage(result);
  elements.cardName.textContent = result.name;
  elements.cardRarity.textContent = result.rarity;
  resetCardAnimation(result.rarity);
  renderStats();
}

function renderCharacterImage(result) {
  elements.cardMark.textContent = result.mark;
  elements.cardImage.style.display = result.imageUrl ? "block" : "none";
  elements.cardMark.style.display = result.imageUrl ? "none" : "block";
  elements.cardImage.alt = result.name;
  elements.cardImage.src = result.imageUrl || "";
}

function showImageFallback() {
  elements.cardImage.style.display = "none";
  elements.cardMark.style.display = "block";
}

function resetCardAnimation(rarity) {
  elements.card.className = "card";
  elements.card.offsetWidth;
  elements.card.className = `card ${rarity} reveal`;
}

function renderStats() {
  elements.total.textContent = state.total;
  elements.ssrCount.textContent = state.ssrCount;
  elements.pityText.textContent = `${state.pity} / ${PITY_LIMIT}`;
  elements.pityFill.style.width = `${(state.pity / PITY_LIMIT) * 100}%`;
}

function addHistory(result) {
  const chip = document.createElement("div");
  chip.className = `chip ${result.rarity}`;
  chip.textContent = result.mark;
  elements.history.prepend(chip);
  trimHistory();
}

function trimHistory() {
  while (elements.history.children.length > HISTORY_LIMIT) {
    elements.history.lastElementChild.remove();
  }
}

function pull(times) {
  if (!Number.isInteger(times) || times <= 0) return null;

  let latestResult = null;
  for (let count = 0; count < times; count += 1) {
    latestResult = rollOne();
    addHistory(latestResult);
  }
  renderResult(latestResult);
}

function normalizeCharacters(characters, characterIds) {
  const pool = createApiPool();
  characters.forEach((character) => addCharacterToPool(pool, character, characterIds));
  fillEmptyCharacterPools(pool);
  return pool;
}

function fillEmptyCharacterPools(pool) {
  if (pool.ssr.length === 0) pool.ssr = fallbackPool.ssr.map((item) => ({ ...item }));
  if (pool.epic.length === 0) pool.epic = fallbackPool.epic.map((item) => ({ ...item }));
}

function addCharacterToPool(pool, character, characterIds) {
  if (!character || !character.name || !character.rarity) return;

  const rarity = character.rarity === 5 ? "ssr" : "epic";
  const mark = character.rarity === 5 ? "5*" : "4*";
  const imageUrl = getCharacterImageUrl(character.name, characterIds);
  pool[rarity].push({ name: character.name, mark, imageUrl });
}

function getCharacterImageUrl(name, characterIds = []) {
  return `${API_BASE_URL}/characters/${getCharacterId(name, characterIds)}/icon-big`;
}

function getCharacterId(name, characterIds) {
  const slug = slugifyCharacterName(name);
  const override = characterIdOverrides[getCharacterKey(name)];
  if (override && characterIds.includes(override)) return override;
  if (characterIds.includes(slug)) return slug;
  return override || slug;
}

function slugifyCharacterName(name) {
  return getCharacterKey(name)
    .replace(/['.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getCharacterKey(name) {
  return name.toLowerCase().replace(/['.]/g, "");
}

async function fetchCharacterDetails() {
  const url = `${API_BASE_URL}/characters/all?lang=en`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const data = await response.json();
  return getApiArray(data, "API response tidak valid");
}

async function fetchCharacterIds() {
  const response = await fetch(`${API_BASE_URL}/characters`);
  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const data = await response.json();
  return getApiArray(data, "API ID response tidak valid");
}

function getApiArray(data, errorMessage) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.value)) return data.value;
  throw new Error(errorMessage);
}

async function loadApiPool() {
  try {
    const [characters, characterIds] = await Promise.all([
      fetchCharacterDetails(),
      fetchCharacterIds()
    ]);
    state.pool = normalizeCharacters(characters, characterIds);
  } catch (error) {
    console.warn("Memakai fallback data:", error);
  }
}

function bindEvents() {
  elements.tarik1.addEventListener("click", () => pull(1));
  elements.tarik10.addEventListener("click", () => pull(10));
  elements.cardImage.addEventListener("error", showImageFallback);
}

function setButtonsDisabled(isDisabled) {
  elements.tarik1.disabled = isDisabled;
  elements.tarik10.disabled = isDisabled;
}

function runPullTest(times = 10) {
  for (let count = 0; count < times; count += 1) pull(1);
  return {
    history: elements.history.children.length,
    pool: getPoolSummary(),
    ssrCount: state.ssrCount,
    total: state.total
  };
}

function getPoolSummary() {
  return Object.fromEntries(
    Object.entries(state.pool).map(([key, value]) => [key, value.length])
  );
}

function init() {
  bindEvents();
  setButtonsDisabled(true);
  return loadApiPool().finally(() => setButtonsDisabled(false));
}

const ready = init();
window.gachaApp = { pull, ready, runPullTest, getPoolSummary };