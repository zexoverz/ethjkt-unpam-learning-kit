# Change Log

## 2026-07-06 - Pokemon gacha simulator

- Replaced the starter ETHJKT gacha with a Pokemon gacha simulator.
- Pull buttons now fetch Pokemon data from PokeAPI.
- The card shows official artwork, Pokemon name, rarity, and type chips.
- Rarity uses PokeAPI data: legendary/mythical Pokemon become SSR, then capture rate and base stats decide Epic, Rare, or Common.
- Pity is randomized after every SSR, between 8 and 14 pulls.
- API responses are cached in `localStorage` so the app does not repeatedly request the same Pokemon data.

Testing done:

- Parsed the embedded JavaScript with Node.
- Ran `git diff --check`.

## 2026-07-06 - Thumbnail fix and premium UI

- Fixed broken history thumbnails by saving multiple sprite options from PokeAPI.
- If a sprite URL fails, the app tries the next sprite. If all fail, it shows a clean `?` placeholder.
- Upgraded the pull screen with card flip reveal, rarity glow, SSR particle burst, smoother pity bar animation, and button/history hover effects.
- Added a small Web Audio sound effect when SSR appears.
- Pull 10x now reveals results with a short delay so the animation is visible.

Testing done:

- Parsed the embedded JavaScript with Node.
- Ran `git diff --check`.
