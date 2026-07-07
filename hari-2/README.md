# Millennium Pack - Yu-Gi-Oh! Gacha Simulator

A static Yu-Gi-Oh! booster pack simulator powered by the public YGOPRODeck v7 API.

## Run

Open `index.html` directly or serve this folder with any static server:

```bash
python -m http.server 5173
```

Then visit `http://localhost:5173` from inside `hari-2`.

The app is plain HTML, CSS, Tailwind CDN, and JavaScript. There is no build step.

## API Integration

Primary API base:

```text
https://db.ygoprodeck.com/api/v7/
```

Used endpoints:

- `cardinfo.php?format=tcg&misc=yes` for card data, official images, card sets, archetypes on card records, Master Duel rarity when present, prices, release dates, and gameplay fields.
- `cardsets.php` for the current set catalog and release metadata.
- `archetypes.php` for the archetype catalog.

The app caches API responses in `localStorage` for 12 hours under `millenniumPack.cardCache.v1`. This follows YGOPRODeck's guidance to reduce repeated API calls and helps stay under the documented 20 requests per second rate limit.

Card images use the URLs returned in `card_images` (`image_url` and `image_url_small`) and are lazy-loaded in the UI.

## Rarity Algorithm

YGOPRODeck exposes real set rarity data in each card's `card_sets[].set_rarity`. The simulator groups pull pools from that value first:

- strings containing `Secret`, `Starlight`, `Ghost`, or `Collector` become `Secret Rare`
- strings containing `Ultra` become `Ultra Rare`
- strings containing `Super` become `Super Rare`
- strings containing `Rare` become `Rare`
- missing or unmatched data becomes `Common`

If `set_rarity` is missing, `md_rarity` from `misc=yes` is used as a secondary hint (`UR`, `SR`, `R`).

Base pull weights:

```text
Common      65
Rare        20
Super Rare  12
Ultra Rare   5
Secret Rare  0.95
```

The fifth card uses a boosted rare slot for pack-opening suspense while still selecting from API-derived rarity pools.

## Features

- Animated dark fantasy/Egyptian-inspired home screen.
- Five-card booster pack opening flow with shake, tear, flash, flip, rarity glow, final-card suspense, and Secret Rare confetti.
- Official card image, name, attribute/frame, type, level/link, race, ATK/DEF, description, archetype, card set, set code, rarity, price, and card ID.
- Local collection storage with search, rarity/type filters, sorting, duplicate counts, favorites, single-card delete, and reset.
- Statistics for packs opened, cards obtained, highest rarity, duplicates, rarity distribution, and pull history.
- Optional generated sound effects using the Web Audio API.
- Loading states and cache fallback when the API is unavailable.

## Architecture

- `index.html` defines the static views and semantic UI regions.
- `style.css` contains the Yu-Gi-Oh!-inspired visual system, responsive layout, card treatment, pack animation, rarity effects, and modal styles.
- `main.js` owns API fetching, cache management, rarity classification, pack generation, local collection state, rendering, sound, and confetti.

The repo has no React/build setup, so the requested motion effects are implemented with CSS animations and the browser Web Animations API rather than Framer Motion.
