# RAD3 Modpack – Copilot Instructions

## Development

### Setup
- When creating a plan, be specific and set up a step by step task list.
- Review the plan after creating it and before prompting the user for permission to start changing files.
- Run /allow-all at the start so that all tools can be used.
- Always run tasks using /fleet to create sub-tasks so that prompts and responses can be optimized.
- Make sure to run plans in autopilot mode.

### Rules
- When making changes, always create a new git branch with a prefix following <prefix>/<branch-name>, with prefixes being (fix, bug, feature, chore, docs).
- When making git commits, always use the <prefix>: <commit-message> format following the same prefix list as the branches.
- When finished with changes use /diff.

### Behaviour
- DO NOT be creative, always only apply changes that are requested.
- NEVER add new code or features that are explicitly asked for.
- Make sure answers and solutions are as simple as they can be.
- DO NOT make tests in this repository.

## What this repo is

RAD3 (Rogues and Dragons 3) is a Minecraft 1.20.1 Forge modpack. There is no compiled code or build system. All custom logic lives in **KubeJS JavaScript scripts** and **JSON data files** that are loaded directly by the game at runtime.

## Repository layout

| Path | Purpose |
|---|---|
| `kubejs/startup_scripts/` | Run **once** at game startup. Used for item/block registration and world gen. Reload with `/kubejs reload_startup_scripts` (unreliable — game restart preferred). |
| `kubejs/server_scripts/` | Reload with `/reload`. Recipes, tags, loot tables, server-side events. |
| `kubejs/client_scripts/` | Reload with `F3+T`. Tooltips, JEI descriptions/removals, ponders. |
| `kubejs/data/` | Acts as a datapack. Raw JSON resources (advancements, loot tables, etc.). |
| `kubejs/assets/` | Acts as a resource pack. Textures, models, sounds. |
| `config/` | Per-mod `.toml`/`.json`/`.json5`/`.yaml` config files. |
| `defaultconfigs/` | Config defaults shipped with the pack (copied to new worlds). |

## KubeJS script conventions

- **Custom items** are registered under the `kubejs:` namespace (e.g. `kubejs:iron_coin`).
- **Custom tags** use the `rad3:` namespace (e.g. `rad3:rare_ingot`, `rad3:coin_quest`).
- A script file ending in `.js-` (e.g. `ars-trinkets-old.js-`) is **disabled** — the `-` suffix prevents KubeJS from loading it. Use this instead of deleting scripts you want to keep but not run.
- Recipe removals are declared as an array at the top of `recipes.js` before additions. When removing a recipe, add the output item ID to the `removals` array.
- The `// priority: 0` comment at the top of a script sets its load priority; lower numbers load first.

## Data file conventions

- `kubejs/data/gearupgrades/refinements/` — JSON configs for the GearUpgrades mod. Field schema is documented in `.info.md` in that directory. Each file defines one upgrade with `id`, `type`, `bonuses`, `material`, etc.
- `kubejs/data/rad3/` — Custom advancements and pack metadata.
- Loot tables, structure configs, and other vanilla-style data live under their respective mod namespaces inside `kubejs/data/`.

## Script reload reference

| What changed | How to reload |
|---|---|
| `server_scripts/` | `/reload` in-game |
| `client_scripts/` | `F3+T` in-game |
| `startup_scripts/` | Full game restart (item/block registration cannot hot-reload safely) |
| KubeJS logs | `logs/kubejs/` in the instance directory |

## Key game rules set by the pack

`kubejs/server_scripts/gamerules.js` applies these on first world load:
- `naturalRegeneration false` — health does not regenerate naturally
- `announceAdvancements false`
- `globalSoundEvents false`
- `refillCooldown 360`

These run once and are guarded by a persistent data flag, so they won't re-apply on every reload.

## Pack design philosophy (relevant when making changes)

- **Not a kitchen-sink pack.** Mod interactions and recipe changes are intentional. Recipe removals typically serve a balance purpose.
- Progression is gated by **boss kills and dimensional exploration**, not a stages mod. Recipe changes that require cross-dimensional ingredients are by design.
- Items that are overpowered or that bypass intended progression are removed from loot tables via `lootjs.js` and from crafting via the removals list in `recipes.js`.
- Coins (`kubejs:copper_coin`, `kubejs:iron_coin`, etc.) are finite quest/dungeon rewards — do not add them to generic loot tables.
