# Hari 1 Change Log

## Pull feature with randomized pity

This update makes the gacha simulator easier to demo and more reliable.

What changed:

1. The pity target is randomized for each cycle.
   Instead of always guaranteeing Legendary at pull `10`, the target is now
   randomly picked from `7` to `12`.

2. The UI shows the current pity target.
   Example: `3 / 9` means the player has pulled 3 times toward a guarantee
   at 9 pulls.

3. Legendary results reset pity.
   After an SSR / Legendary appears, pity goes back to `0` and the next pity
   target is randomized again.

4. Pulls still work if PokeAPI is unavailable.
   The app first tries to fetch real Pokemon data from PokeAPI. If that fails,
   it uses a small local fallback pool so the PULL button still shows a result.

5. Progress is still saved.
   Total pulls, pity, pity target, Legendary count, and collection data are
   saved in `localStorage`.

Test run:

```powershell
node --check .\ethjkt-unpam-learning-kit\hari-1\app.js
```

Result: passed with no syntax errors.

## Rich PokeAPI scan

This update makes the simulator use more of the real PokeAPI response instead
of only showing artwork, type, and stats.

What changed:

1. The app now combines three API resources:
   - `/pokemon/{id}` for stats, types, abilities, moves, sprites, cry, height,
     weight, and base experience.
   - `/pokemon-species/{id}` for flavor text, genus, capture rate, habitat,
     generation, and legendary/mythical flags.
   - `evolution_chain.url` from species data for the evolution line.

2. The result view now shows:
   - genus
   - flavor text
   - height and weight
   - capture rate
   - habitat and generation
   - abilities
   - sample moves
   - evolution line
   - Pokemon cry button when the API provides one

3. The layout was tightened so the result feels more like a Pokedex scan and
   less like a generic generated card.

Tests run:

```powershell
node --check .\ethjkt-unpam-learning-kit\hari-1\app.js
node -e "fetch('https://pokeapi.co/api/v2/pokemon/ditto').then(r=>r.json()).then(j=>console.log([j.id,j.name,j.types.length,j.stats.length].join(',')))"
```

Result:

- Syntax check passed.
- Live PokeAPI check returned `132,ditto,1,6`.

## Interactive Booster Packs, Web Audio FX, & Battle Arena Redesign

This update brings a comprehensive, high-fidelity modernization of the Pokédex interface, moving away from simple button click reveals to an immersive game-loop.

What changed:

1. **Modern Cyberpunk Dark Theme**:
   - Upgraded colors to dark space purple with vibrant neon borders (red, cyan, purple, gold) based on rarity and state.
   - Incorporated modern Google fonts (Poppins, Outfit, Orbitron).
   - Styled scrollbars, buttons, grids, and filters to feel premium and cohesive.

2. **Interactive Gacha Booster Packs & 3D Card Opening**:
   - Introduced 3 selectable booster packs: **Kanto Journey** (Gen 1), **Eevee Spark** (Higher shiny rates), and **Legendary Raid** (Guaranteed Epic/SSR).
   - Designed a physical card pack tearing overlay sequence. The user manually clicks to sob / rip open the pack wrapper with paper-rip animations and audio.
   - 5 cards slide out face-down. Clicking them triggers a perspective 3D flip card rotation, accompanied by retro synth flips and shiny/legendary audio cries.

3. **Gacha Coins Economy & Claim Cooldown**:
   - Starting balance of 100 coins. Packs cost 15, 40, or 100 coins (or 4, 10, 25 coins for 1x card pull).
   - Integrated a Claim Free Coins button with a 30-second cooldown timer.

4. **Web Audio API Synth**:
   - Synthesized real-time retro 8-bit sound effects (flips, card rips, coin sounds, victory fanfare, battle tackle/hit sounds) dynamically using oscillator nodes.
   - Clickable top-left camera lens toggles mute (saving preferences to `localStorage`).

5. **Battle Arena**:
   - Users select their collected Pokémon to fight CPU trainers.
   - 4 difficulties (Gym Trainer, Gym Leader, Elite Four, Rival Champion) costing entry coins but returning high coin payouts upon victory.
   - Animated health bars and real-time battle logs with damage formulas scaling with Attack/Defense and speed priority.

6. **Collection Filters & Mastery Badges**:
   - Search bar and type/rarity filter pills for the collection grid.
   - Clicking a collected item opens a detailed floating inspection modal.
   - Mastery section detailing 5 custom checklists (Starter Squad, Eevee Clan, Legendary Birds, Weather Lords, Mew Duo) which grant Mastery Badges when complete.

Test run:
```powershell
node --check .\ethjkt-unpam-learning-kit\hari-1\app.js
```
Result: Passed with no syntax errors.

