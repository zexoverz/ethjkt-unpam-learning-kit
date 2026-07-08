const BASE_RATES = {
  6: 0.02,
  5: 0.08,
  4: 0.5,
  3: 0.4,
};

const SIX_STAR_PITY_START = 50;
const SIX_STAR_PITY_INCREASE = 0.02;

const resultsElement = document.querySelector("#results");
const pityCountElement = document.querySelector("#pityCount");
const sixRateElement = document.querySelector("#sixRate");
const pullOneButton = document.querySelector("#pullOneButton");
const pullTenButton = document.querySelector("#pullTenButton");

let operators = [];
let operatorsByRarity = {};
let pullsWithoutSixStar = Number(localStorage.getItem("pullsWithoutSixStar") ?? 0);

function getSixStarRate() {
  if (pullsWithoutSixStar < SIX_STAR_PITY_START) {
    return BASE_RATES[6];
  }

  const pityBonusPulls = pullsWithoutSixStar - SIX_STAR_PITY_START + 1;
  return Math.min(BASE_RATES[6] + pityBonusPulls * SIX_STAR_PITY_INCREASE, 1);
}

function getCurrentRates() {
  const sixStarRate = getSixStarRate();
  const remainingRate = 1 - sixStarRate;
  const nonSixStarBaseRate = BASE_RATES[5] + BASE_RATES[4] + BASE_RATES[3];

  return {
    6: sixStarRate,
    5: (BASE_RATES[5] / nonSixStarBaseRate) * remainingRate,
    4: (BASE_RATES[4] / nonSixStarBaseRate) * remainingRate,
    3: (BASE_RATES[3] / nonSixStarBaseRate) * remainingRate,
  };
}

function rollRarity() {
  const rates = getCurrentRates();
  const roll = Math.random();
  let totalChance = 0;

  for (const rarity of [6, 5, 4, 3]) {
    totalChance += rates[rarity];

    if (roll < totalChance) {
      pullsWithoutSixStar = rarity === 6 ? 0 : pullsWithoutSixStar + 1;
      return rarity;
    }
  }

  pullsWithoutSixStar += 1;
  return 3;
}

function getRandomOperatorByRarity(rarity) {
  const pool = operatorsByRarity[rarity];
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

function rollOperator() {
  const rarity = rollRarity();
  return {
    rarity,
    operator: getRandomOperatorByRarity(rarity),
  };
}

function rollMany(amount) {
  return Array.from({ length: amount }, rollOperator);
}

function updatePityDisplay() {
  localStorage.setItem("pullsWithoutSixStar", String(pullsWithoutSixStar));
  pityCountElement.textContent = pullsWithoutSixStar;
  sixRateElement.textContent = `${(getSixStarRate() * 100).toFixed(2)}%`;
}

function createResultCard(result) {
  const card = document.createElement("article");
  card.className = `operator-card rarity-${result.rarity}`;

  const imageWrap = document.createElement("div");
  imageWrap.className = "operator-art";

  const image = document.createElement("img");
  image.src = result.operator.artUrl;
  image.alt = result.operator.name;
  image.loading = "lazy";
  image.addEventListener("error", () => {
    if (image.dataset.fallbackLoaded !== "true" && result.operator.avatarUrl) {
      image.dataset.fallbackLoaded = "true";
      image.src = result.operator.avatarUrl;
      imageWrap.classList.add("avatar-art");
      return;
    }

    imageWrap.classList.remove("avatar-art");
    imageWrap.classList.add("missing-art");
    image.remove();
  });

  const fallbackName = document.createElement("span");
  fallbackName.className = "fallback-name";
  fallbackName.textContent = result.operator.name;

  imageWrap.append(image, fallbackName);

  const info = document.createElement("div");
  info.className = "operator-info";

  const rarity = document.createElement("span");
  rarity.className = "rarity-badge";
  rarity.textContent = `${result.rarity}-star`;

  const name = document.createElement("h2");
  name.textContent = result.operator.name;

  const role = document.createElement("p");
  role.textContent = result.operator.role;

  info.append(rarity, name, role);
  card.append(imageWrap, info);

  return card;
}

function renderResults(results) {
  resultsElement.className = `results count-${results.length}`;
  resultsElement.replaceChildren(...results.map(createResultCard));
  updatePityDisplay();
}

async function loadOperators() {
  if (Array.isArray(window.OPERATORS)) {
    operators = window.OPERATORS;
  } else {
    const response = await fetch("operators.json");

    if (!response.ok) {
      throw new Error("Failed to load operators.json");
    }

    operators = await response.json();
  }

  operatorsByRarity = operators.reduce((groupedOperators, operator) => {
    if (!groupedOperators[operator.rarity]) {
      groupedOperators[operator.rarity] = [];
    }

    groupedOperators[operator.rarity].push(operator);
    return groupedOperators;
  }, {});
}

async function init() {
  pullOneButton.disabled = true;
  pullTenButton.disabled = true;

  try {
    await loadOperators();
    updatePityDisplay();
    pullOneButton.disabled = false;
    pullTenButton.disabled = false;
  } catch (error) {
    resultsElement.className = "results empty-state";
    resultsElement.textContent = error.message;
  }
}

pullOneButton.addEventListener("click", () => renderResults(rollMany(1)));
pullTenButton.addEventListener("click", () => renderResults(rollMany(10)));

init();
