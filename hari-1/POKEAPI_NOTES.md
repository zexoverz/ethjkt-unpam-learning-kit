# PokeAPI Notes for the Gacha Simulator

Source docs:

- PokeAPI v2 docs: `https://pokeapi.co/docs/v2`
- Example Pokemon resource: `https://pokeapi.co/api/v2/pokemon/ditto`

Endpoints used:

1. `/pokemon/{id or name}`
   Used for the main battle-facing data:
   - `id`
   - `name`
   - `height`
   - `weight`
   - `base_experience`
   - `sprites`
   - `cries`
   - `types`
   - `abilities`
   - `stats`
   - `moves`

2. `/pokemon-species/{id or name}`
   Used for richer species data:
   - `capture_rate`
   - `base_happiness`
   - `is_legendary`
   - `is_mythical`
   - `generation`
   - `habitat`
   - `genera`
   - `flavor_text_entries`
   - `evolution_chain.url`

3. `/evolution-chain/{id}`
   Used after reading `evolution_chain.url` from species data.
   This gives the Pokemon family tree so the result card can show an evolution
   line instead of only a single isolated Pokemon.

Aggregation plan:

1. Roll rarity and pick a Pokemon ID.
2. Fetch `/pokemon/{id}` and `/pokemon-species/{id}` together.
3. Fetch the species `evolution_chain.url` only after species data is available.
4. Normalize everything into one small object for rendering.
5. Cache the normalized object by ID to respect PokeAPI fair use guidance.
