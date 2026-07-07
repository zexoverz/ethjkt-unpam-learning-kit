# Development Log

## Plan

1. Read the PokéAPI v2 documentation and identify the endpoints needed for efficient Pokemon aggregation.
2. Build a pack-first responsive UI with Home, Gacha, Collection, and Statistics views.
3. Implement a cached PokéAPI client and five-card booster opening flow.
4. Add collection management, filtering, favorites, duplicates, reset, and progress.
5. Document setup, API usage, and the custom rarity algorithm.

## PokéAPI notes

PokéAPI is a read-only API and supports paginated resource lists with `limit` and `offset`. This app uses `/pokemon?limit=1` to discover the API count, `/pokemon/{id}` for battle/display details, `/pokemon-species/{id}` for species metadata and legendary/mythical flags, and `/type?limit=100` for dynamic type filters.

Every successful API response is cached in localStorage to reduce repeated requests.

## Commits

- `feat: build gacha app shell`
- `feat: add PokeAPI pack logic`
- `feat: polish rare reveal effects`
