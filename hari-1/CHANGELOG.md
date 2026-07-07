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
