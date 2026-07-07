# PokePack Studio

A modern Pokemon gacha simulator built with HTML5, CSS3, Tailwind CDN, and vanilla JavaScript. The app uses PokéAPI as the live data source for Pokemon artwork, types, stats, abilities, species data, and collection metadata.

## Run

Open `index.html` in a browser with an internet connection.

No build step is required. Tailwind is loaded through the CDN and the app runs as a static site.

## PokéAPI Strategy

Base URL: `https://pokeapi.co/api/v2/`

The app aggregates data from these endpoints:

- `GET /pokemon?limit=1&offset=0` to discover the current Pokemon index count.
- `GET /pokemon?limit={count}&offset=0` to cache the available Pokemon names and API URLs for random pack pulls.
- `GET /type` to build the collection type filter dynamically.
- `GET /pokemon/{name-or-id}` for official artwork, types, height, weight, base experience, abilities, and base stats.
- `GET /pokemon-species/{name-or-id}` through the `species.url` returned by `/pokemon` for genus, flavor text, capture rate, legendary status, and mythical status.

The app stores the Pokemon index, type list, and normalized detail records in Local Storage for 24 hours to reduce repeated API requests. Pulled Pokemon and player statistics are stored separately in Local Storage.

## Rarity Algorithm

PokéAPI does not provide trading-card rarity, so the simulator derives rarity from game data.

Rarity classification:

- `Legendary`: `is_legendary` or `is_mythical` from `/pokemon-species` is true.
- `Epic`: base stat total >= 560, base experience >= 240, or capture rate <= 25.
- `Rare`: base stat total >= 480, base experience >= 170, or capture rate <= 75.
- `Uncommon`: base stat total >= 350, base experience >= 90, or capture rate <= 140.
- `Common`: anything below those thresholds.

Pack roll rates:

- Base slots: Common 55%, Uncommon 25%, Rare 14%, Epic 5%, Legendary 1%.
- Final slot boost: Common 30%, Uncommon 30%, Rare 24%, Epic 12%, Legendary 4%.

Each pack rolls a target rarity for each of 5 slots. The app samples live Pokemon from PokéAPI and keeps the closest rarity match found within a limited number of attempts, so pulls stay fast while still favoring the displayed rates.

## Features

- Centered booster pack opening flow with shake, flash, card flip, rare glow, sparkles, and legendary confetti.
- Five Pokemon reveal sequence with a boosted final slot.
- Pokemon cards with official artwork, name, Pokedex number, type, height, weight, base experience, abilities, stats, and species details.
- Collection stored in Local Storage with search, type filter, rarity filter, sorting, favorite toggles, duplicate counts, delete, reset, and completion progress.
- Statistics for packs opened, total collected, highest rarity, duplicates, rarity distribution, and pull history.
- Responsive mobile-first layout with lazy-loaded images and cached API responses.
