# PokéPack Studio

A mobile-first Pokémon gacha simulator built with HTML5, CSS3, Tailwind CDN, and vanilla JavaScript. The app uses PokéAPI as the live source for Pokémon artwork, species, types, abilities, stats, dimensions, and collection metadata.

## Run

Open `index.html` in a browser with an internet connection.

No build step is required. Tailwind is loaded from the CDN and the app runs as a static site.

## PokéAPI Strategy

Base URL: `https://pokeapi.co/api/v2/`

Endpoints used:

- `GET /pokemon?limit=1&offset=0` discovers the current Pokémon count.
- `GET /pokemon?limit={count}&offset=0` caches the Pokémon index for random pack pulls.
- `GET /type` builds the Collection type filter dynamically.
- `GET /pokemon/{name-or-id}` provides official artwork, sprites, types, height, weight, base experience, abilities, and base stats.
- `GET /pokemon-species/{name-or-id}` is followed through the `species.url` from `/pokemon` to get genus, flavor text, capture rate, legendary status, and mythical status.

The simulator avoids unnecessary requests by caching the Pokémon index, type list, and normalized Pokémon detail records in Local Storage for 24 hours. Collection data and player statistics are stored separately so refreshing API cache does not reset progress.

## Gacha Flow

- Each pack contains 5 Pokémon.
- Each slot rolls a target rarity first.
- The final slot uses boosted rates for a more exciting reveal.
- The app samples live Pokémon from the cached PokéAPI index and keeps the closest rarity match within a small attempt limit so the pack opens quickly.
- Pulled Pokémon are stored in Local Storage with duplicate counts and favorite state.

## Rarity Algorithm

PokéAPI does not provide card rarity, so PokéPack Studio derives custom rarity from game data:

- `Legendary`: species is legendary or mythical.
- `Epic`: base stat total >= 560, base experience >= 240, or capture rate <= 25.
- `Rare`: base stat total >= 480, base experience >= 170, or capture rate <= 75.
- `Uncommon`: base stat total >= 350, base experience >= 90, or capture rate <= 140.
- `Common`: any Pokémon below those thresholds.

Pack roll rates:

- Base slots: Common 55%, Uncommon 25%, Rare 14%, Epic 5%, Legendary 1%.
- Final slot boost: Common 30%, Uncommon 30%, Rare 24%, Epic 12%, Legendary 4%.

## Features

- Gacha-first mobile app layout with the booster pack as the centerpiece.
- Pack shake, flash, glow, card flip, final reveal, rare shine, sparkles, and Legendary confetti.
- Pokémon cards with official artwork, name, Pokédex number, species, types, height, weight, base experience, abilities, and stats.
- Collection gallery with search, type filter, rarity filter, sort, favorite, duplicate counter, delete, reset, and completion progress.
- Statistics for packs opened, total Pokémon, highest rarity, duplicate count, rarity distribution, and pull history.
- Lazy-loaded artwork, cached API data, fallback sprites, and error toasts.

## Files

- `index.html` contains the app shell and JavaScript-compatible DOM hooks.
- `styles.css` contains the mobile-first premium visual system and animations.
- `app.js` contains PokéAPI integration, caching, gacha logic, collection storage, and rendering.