# Pokemon Gacha Simulator

A modern vanilla HTML/CSS/JavaScript Pokemon booster-opening simulator powered by the official PokéAPI.

## Run

Open `index.html` in a browser. Internet access is required for first-time PokéAPI requests and official artwork. The app caches API responses in `localStorage`, so repeated Pokemon and metadata requests are reused locally.

## PokéAPI usage

The app uses PokéAPI as the primary data source:

- `GET /pokemon?limit=1` to discover the current available Pokemon count, capped to National Dex IDs with stable official artwork.
- `GET /pokemon/{id}` for artwork, types, height, weight, base experience, abilities, and base stats.
- `GET /pokemon-species/{id}` for species/genus plus `is_legendary` and `is_mythical` rarity signals.
- `GET /type?limit=100` to populate collection type filters.

Requests are routed through a small `fetchJson()` client that caches every successful response in `localStorage`, matching PokéAPI's fair-use recommendation to cache locally.

## Rarity algorithm

PokéAPI does not provide trading-card rarity, so rarity is derived from real API data after each Pokemon is fetched:

1. `Legendary`: species is legendary/mythical, or total base stats are at least 640.
2. `Epic`: total base stats are at least 540, or base experience is at least 240.
3. `Rare`: total base stats are at least 455, or base experience is at least 170.
4. `Uncommon`: total base stats are at least 330, or base experience is at least 90.
5. `Common`: everything else.

This keeps pulls random while letting powerful or officially legendary Pokemon naturally receive premium reveal effects.

## Features

- Five-card booster pack opening centered on the gacha screen.
- Smooth pack shake, light burst, reveal queue, card flip, rare glow, sparkles, and Legendary confetti.
- Pokemon cards with official artwork, name, Pokedex number, type, height, weight, base experience, abilities, stats, and species.
- Collection stored in Local Storage with search, type filter, sorting, favorites, duplicate counters, delete, reset, and completion progress.
- Statistics for packs opened, total Pokemon in collection, highest rarity, pull history, duplicate count, and rarity distribution.
- Loading skeletons, error toasts, lazy-loaded images, cached API requests, and responsive layout.

## Files

- `index.html` - application structure and templates.
- `styles.css` - visual system, responsive layout, and animations.
- `app.js` - PokéAPI client, gacha flow, collection, statistics, and persistence.
