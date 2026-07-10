const operators = require("./operators.json");

const BASE_RATES = {
  6: 0.02,
  5: 0.08,
  4: 0.50,
  3: 0.40,
};

const SIX_STAR_PITY_START = 50;
const SIX_STAR_PITY_INCREASE = 0.02;

let pullsWithoutSixStar = 0;

const operatorsByRarity = operators.reduce((groupedOperators, operator) => {
  if (!groupedOperators[operator.rarity]) {
    groupedOperators[operator.rarity] = [];
  }

  groupedOperators[operator.rarity].push(operator);
  return groupedOperators;
}, {});

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
      if (rarity === 6) {
        pullsWithoutSixStar = 0;
      } else {
        pullsWithoutSixStar += 1;
      }

      return {
        rarity,
        rates,
        pullsWithoutSixStar,
      };
    }
  }

  pullsWithoutSixStar += 1;
  return {
    rarity: 3,
    rates,
    pullsWithoutSixStar,
  };
}

function rollMany(amount) {
  const results = [];

  for (let i = 0; i < amount; i += 1) {
    results.push(rollOperator());
  }

  return results;
}

function getRandomOperatorByRarity(rarity) {
  const availableOperators = operatorsByRarity[rarity];

  if (!availableOperators || availableOperators.length === 0) {
    throw new Error(`No operators found for ${rarity}-star rarity.`);
  }

  const index = Math.floor(Math.random() * availableOperators.length);
  return availableOperators[index];
}

function rollOperator() {
  const rarityResult = rollRarity();
  const operator = getRandomOperatorByRarity(rarityResult.rarity);

  return {
    ...rarityResult,
    operator,
  };
}

function resetPity() {
  pullsWithoutSixStar = 0;
}

module.exports = {
  getCurrentRates,
  resetPity,
  rollMany,
  rollOperator,
  rollRarity,
};

if (require.main === module) {
  const results = rollMany(10);

  for (const result of results) {
    console.log(
      `${result.operator.name} | ${result.rarity}-star | ${result.operator.role}`,
    );
  }
}
