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
