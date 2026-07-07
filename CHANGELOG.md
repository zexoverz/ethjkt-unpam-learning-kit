# Change Log

## Hari 1 - Gacha pull feature

- Added reward data for common, rare, epic, and SSR results.
- Added pull buttons for 1x and 10x pulls.
- Added randomized pity target from 5 to 10 pulls.
- Updated the card, pity bar, total pull count, SSR count, and recent pull history after each pull.
- Verified the inline JavaScript syntax with Node.js.

## Hari 1 - Pokemon gacha with PokeAPI

- Changed the simulator theme into a Pokemon gacha.
- Pulls now request real Pokemon data from `https://pokeapi.co/api/v2/pokemon/{id}`.
- The app uses Pokemon names, official artwork or front sprites, type chips, and Pokedex numbers from the API response.
- Added browser caching with `localStorage` so the same Pokemon is not requested again every time.
- Kept the pity system: SSR Pokemon can appear randomly, or by guaranteed pity after a randomized target.
- Tested JavaScript syntax with Node.js.
- Tested the PokeAPI Pokemon endpoint with Pikachu and confirmed the response includes sprite data.
