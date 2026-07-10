// DRAGON BALL GACHA — data karakter asli dari Dragon Ball API.
const API = "https://dragonball-api.com/api";
const PITY_MAX = 10;
const ULTRA_IDS = [1, 2, 4, 9, 11, 17, 20, 21, 31, 45];
const FEATURED_IDS = new Set([1, 2, 4]);
const STORAGE_KEY = "dragonball_gacha_state_v1";
const cache = new Map();

let pity = 0;
let total = 0;
let lrCount = 0;
let featuredId = null;
let collection = {};

const el = {
  total: document.getElementById("total"), lrCount: document.getElementById("lrCount"),
  pityText: document.getElementById("pityText"), pityFill: document.getElementById("pityFill"),
  featured: document.getElementById("featuredFighter"), card: document.getElementById("card"),
  spinner: document.getElementById("spinner"), placeholder: document.getElementById("placeholder"),
  image: document.getElementById("fighterImage"), rarity: document.getElementById("rarity"),
  name: document.getElementById("fighterName"), race: document.getElementById("fighterRace"),
  ki: document.getElementById("fighterKi"), transformations: document.getElementById("transformations"),
  err: document.getElementById("err"), pullOne: document.getElementById("pullOne"), pullTen: document.getElementById("pullTen"),
  history: document.getElementById("history"), uniqueCount: document.getElementById("uniqueCount"),
  transformCount: document.getElementById("transformCount"), collectionEmpty: document.getElementById("collectionEmpty"),
  collectionGrid: document.getElementById("collectionGrid"), radarGrid: document.getElementById("radarGrid"),
};

function randomFrom(items) { return items[Math.floor(Math.random() * items.length)]; }
function randomId() { return Math.floor(Math.random() * 58) + 1; }
function rarity() {
  const roll = Math.random();
  if (pity + 1 >= PITY_MAX || roll < 0.03) return "ultra";
  if (roll < 0.13) return "super";
  if (roll < 0.43) return "rare";
  return "common";
}
function pickId(tier) {
  if (tier === "ultra") return featuredId && Math.random() < 0.5 ? featuredId : randomFrom(ULTRA_IDS);
  return randomId();
}
async function getFighter(id) {
  if (cache.has(id)) return cache.get(id);
  const response = await fetch(`${API}/characters/${id}`);
  if (!response.ok) throw new Error("Sinyal scouter gagal. Coba lagi sebentar.");
  const data = await response.json();
  const fighter = {
    id: data.id, name: data.name, image: data.image, race: data.race || "Unknown",
    affiliation: data.affiliation || "Tidak diketahui", ki: data.ki || "Tidak diketahui",
    maxKi: data.maxKi || "—", transformations: Array.isArray(data.transformations) ? data.transformations : [],
  };
  cache.set(id, fighter);
  return fighter;
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify({ pity, total, lrCount, featuredId, collection })); }
function load() {
  try {
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!state) return;
    pity = Number(state.pity) || 0; total = Number(state.total) || 0; lrCount = Number(state.lrCount) || 0;
    featuredId = FEATURED_IDS.has(Number(state.featuredId)) ? Number(state.featuredId) : null;
    collection = state.collection || {};
  } catch (_) { collection = {}; }
}
function updateStats() {
  el.total.textContent = total; el.lrCount.textContent = lrCount;
  el.pityText.textContent = `${pity} / ${PITY_MAX}`; el.pityFill.style.width = `${(pity / PITY_MAX) * 100}%`;
}
function setLoading(active) { el.spinner.hidden = !active; el.pullOne.disabled = active; el.pullTen.disabled = active; }
function record(result) {
  const saved = collection[result.id];
  collection[result.id] = saved ? { ...saved, count: saved.count + 1 } : { ...result, count: 1 };
}
function render(result) {
  el.placeholder.hidden = true; el.image.hidden = false; el.image.src = result.image; el.image.alt = result.name;
  el.image.onerror = () => { el.image.hidden = true; el.placeholder.hidden = false; };
  el.rarity.textContent = result.tier.toUpperCase(); el.rarity.className = `rarity ${result.tier}`;
  el.name.textContent = result.name; el.race.textContent = `${result.race} · ${result.affiliation}`;
  el.ki.textContent = result.ki;
  el.transformations.textContent = result.transformations.length ? `${result.transformations.length} transformasi tersedia · Max Ki: ${result.maxKi}` : `Belum ada transformasi · Max Ki: ${result.maxKi}`;
  el.card.className = `fighter-card ${result.tier} reveal`;
}
function addHistory(result) {
  const chip = document.createElement("img"); chip.src = result.image; chip.alt = result.name; chip.title = `${result.name} (${result.tier})`; chip.className = result.tier;
  el.history.prepend(chip); while (el.history.children.length > 12) el.history.lastChild.remove();
}
async function pull() {
  const tier = rarity();
  try {
    const fighter = await getFighter(pickId(tier));
    const result = { ...fighter, tier };
    total += 1; pity += 1; if (tier === "ultra") { pity = 0; lrCount += 1; }
    record(result); updateStats(); render(result); addHistory(result); save();
  } catch (error) { el.err.textContent = error.message; }
}
async function summon(times) {
  el.err.textContent = ""; setLoading(true);
  for (let i = 0; i < times; i += 1) await pull();
  setLoading(false);
}
function renderCollection() {
  const fighters = Object.values(collection).sort((a, b) => a.id - b.id);
  el.uniqueCount.textContent = fighters.length;
  el.transformCount.textContent = fighters.reduce((sum, fighter) => sum + fighter.transformations.length, 0);
  el.collectionEmpty.hidden = fighters.length > 0; el.collectionGrid.innerHTML = "";
  fighters.forEach(fighter => {
    const cell = document.createElement("article"); cell.className = `roster-card ${fighter.tier}`;
    cell.innerHTML = `<img src="${fighter.image}" alt="${fighter.name}"><b>${fighter.name}</b><span>${fighter.race}</span>${fighter.count > 1 ? `<em>×${fighter.count}</em>` : ""}`;
    el.collectionGrid.appendChild(cell);
  });
}
function renderRadar() {
  const races = ["Saiyan", "Human", "Namekian", "Android", "Majin", "Frieza Race", "God", "Angel"];
  el.radarGrid.innerHTML = "";
  races.forEach(race => {
    const found = Object.values(collection).filter(fighter => fighter.race === race).length;
    const cell = document.createElement("div"); cell.className = `radar-node ${found ? "found" : ""}`;
    cell.innerHTML = `<div class="dragon-ball"><i></i><i></i><i></i><i></i></div><b>${race}</b><span>${found} fighter</span>`;
    el.radarGrid.appendChild(cell);
  });
}
document.querySelectorAll(".tab").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(tab => tab.classList.toggle("active", tab === button));
  document.querySelectorAll(".tab-panel").forEach(panel => { panel.hidden = panel.id !== `panel-${button.dataset.tab}`; });
  if (button.dataset.tab === "koleksi") renderCollection();
  if (button.dataset.tab === "radar") renderRadar();
}));
el.pullOne.addEventListener("click", () => summon(1)); el.pullTen.addEventListener("click", () => summon(10));
el.featured.addEventListener("change", () => { featuredId = FEATURED_IDS.has(Number(el.featured.value)) ? Number(el.featured.value) : null; save(); });
load(); el.featured.value = featuredId || ""; updateStats();
