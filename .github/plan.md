# RAD3 1.20.1 — Full Code Review Issue List

---

## Active Fix Plan

### COL-C1 — BetterCombat dual sweep ✅ DONE
**Status:** Already resolved — `config\bettercombat\server.json5` already has `"allow_vanilla_sweeping": false`. No change needed.

### COL-H14 — JEI removed; clean up JEI KubeJS scripts ✅ DONE
JEI has been removed from the modpack profile. **Completed in branch `fix/col-h14-remove-jei-scripts`.**

**1. Delete `jei-descriptions.js`** — migrate 10 `JEIEvents.information` item descriptions to `ItemEvents.tooltip` in a new `kubejs\client_scripts\tooltips\item-info.js` file. Tooltips work with any recipe viewer (EMI, REI, vanilla F3+H).

**2. Delete `jei-remove-cat.js`** — creates a new `kubejs\client_scripts\emi-pending.js-` file (disabled by default) that documents the uncrafting table category removal, explaining what needs to be done if an EMI-KubeJS bridge is added in future.

**3. Delete `script.js` JEI blocks** — `JEIEvents.hideItems` (~120 items) and `JEIEvents.addItems` (2 items) are dead code without JEI. Create `kubejs\client_scripts\emi-hide-pending.js-` listing all items to be hidden from EMI, disabled until an EMI bridge is added. Strip the dead JEI event blocks from `script.js`.

**4. Update ponder text strings** — 5 ponder scripts reference "JEI" in user-visible text; update to "EMI":
   - `kubejs\client_scripts\ponders\embers\alchemyTablet.js` line 152
   - `kubejs\client_scripts\ponders\embers\ignemReactor.js` line 62
   - `kubejs\client_scripts\ponders\embers\melter.js` line 182
   - `kubejs\client_scripts\ponders\embers\emberBore.js` line 52
   - `kubejs\client_scripts\ponders\embers\pressureRefinery.js` line 41

---

Acting as a senior game designer and software developer, this is a comprehensive review of all KubeJS scripts in the repository. Each issue is assigned a unique ID and can be selected for a fix in the next step.

---

## 🔴 CRITICAL BUGS (game-breaking)

---

### C-01 · `loot_crate_chaos.js` — `level` undefined crash in `giveTieredLoot`
- **File:** `kubejs/server_scripts/custom/loot_crates/loot_crate_chaos.js` ~line 19–22
- **Category:** Bug
- **Description:** The `giveTieredLoot(player, server)` function references `level.spawnParticles(...)` and `level.playSound(...)` inside the legendary branch, but `level` is never passed as a parameter and has no enclosing scope. Throws `ReferenceError: level is not defined` every time a player gets a legendary drop from the Chaos Crate — the entire loot function crashes, player gets nothing.

---

### C-02 · `mimic_drops.js` — Missing `§` color code prefix on item name and status message
- **File:** `kubejs/server_scripts/custom/loot_crates/mimic_drops.js` lines 12, 21
- **Category:** Bug
- **Description:**
  - Line 12: `.withName('7Broken Skeleton Key')` — missing `§`. Renders as literal "7Broken Skeleton Key".
  - Line 21: `setStatusMessage("6The Mimic's heart...")` — missing `§`. Renders literally.
  Both are permanently visible to players.

---

### C-03 · `loot_crate_ancient.js` — Jackpot gives wrong item ID `kubejs:loot_crate`
- **File:** `kubejs/server_scripts/custom/loot_crates/loot_crate_ancient.js` ~line 104
- **Category:** Bug
- **Description:** Jackpot chain gives `kubejs:loot_crate` but the real item is `kubejs:ancient_crate`. Non-existent ID produces an air/empty item — the jackpot silently gives nothing.

---

### C-04 · `loot_crate_ancient.js` + `loot_crate_cooldown.js` — Cooldown key collision between ticks and milliseconds
- **Files:** `loot_crate_ancient.js` ~lines 40–52; `loot_crate_cooldown.js` line 18
- **Category:** Bug
- **Description:** Ancient Crate stores/reads `player.persistentData.lastCrateOpen` as **game ticks**. All other crates (`global.setCrateCooldown`) store it as a **wall-clock millisecond timestamp** (`new Date().getTime()`). If a non-Ancient crate is opened first, `lastCrateOpen` becomes ~1,700,000,000,000 — Ancient Crate reads that as "85 billion ticks ago", bypassing the cooldown forever. Or the wrong unit comparison makes the cooldown never expire.

---

### C-05 · `raid.js` — Room `onEnd` handlers reference undeclared `server`
- **File:** `kubejs/server_scripts/custom/raid.js` lines 160, 178, 187, 196, 207–210, 218
- **Category:** Bug
- **Description:** Every `onEnd` lambda uses `server.runCommandSilent(...)` but only receives `(player)` as its argument — `server` is not in scope. Affects rooms: `frozen_dungeon`, `inferno`, `cursed_sight`, `dungeons_gift`, `haste_surge`, `darkness_falls`. When any of these rooms end, a `ReferenceError` is thrown, leaving the player permanently debuffed (blindness, slowness, etc.).

---

### C-06 · `interactable_items.js` — `level` undefined crash in bioscan syringe handler
- **File:** `kubejs/server_scripts/custom/interactable_items.js` ~line 459
- **Category:** Bug
- **Description:** Inside `ItemEvents.entityInteracted`, `level` is never extracted from the event. Line ~459 calls `level.playSound(...)` which throws `ReferenceError: level is not defined` every time the bioscan syringe is used on an entity.

---

### C-07 · `gamerules.js` — Persistent data flag written incorrectly, causing gamerules to re-apply every server boot
- **File:** `kubejs/server_scripts/gamerules.js` ~line 10
- **Category:** Bug
- **Description:** The guard checks `server.persistentData.contains("setGameRules")` (NBT API), but the flag is written as `server.persistentData.setGameRules = true` (JS property assignment), which does NOT create an actual NBT entry. `contains()` always returns false, so `naturalRegeneration false`, `refillCooldown 360`, `time set noon`, etc. re-apply **every single server startup**.

---

## 🟠 HIGH SEVERITY BUGS

---

### H-01 · `summon.js` — Cooldown is 20 ticks (1 second), not 2 minutes as commented
- **File:** `kubejs/server_scripts/custom/summon.js` line 10
- **Category:** Bug
- **Description:** `cooldown: 20` with comment `// 2 minutes`. 20 ticks = 1 second. Players can spam-summon companions by holding a stack of summon items.

---

### H-02 · `summon.js` — Summoned Wolf has `Angry: 1` NBT, making it hostile to its own summoner
- **File:** `kubejs/server_scripts/custom/summon.js` line 48
- **Category:** Bug
- **Description:** Wolf spawned with `nbt: { Angry: 1 }` enters an angry state without a valid target and attacks nearby entities including the summoner. Requires `Owner` NBT to be tamed/loyal.

---

### H-03 · `roguelite_ring.js` — Rebirth kit quantities silently ignored, players always get 1 of each item
- **File:** `kubejs/server_scripts/custom/roguelite_ring.js` lines 79–125
- **Category:** Logic Error
- **Description:** Kit arrays alternate item ID strings and count integers (e.g., `['minecraft:arrow', 64]`). The delivery loop only processes `typeof item === 'string'`, so all count values are ignored. "Legend" kit's 64× arrows, 64× golden carrots, etc. all become 1 each. Every kit is degraded.

---

### H-04 · `loot_crate_chaos.js` + `loot_crate_ritual.js` — Duplicate `giveTieredLoot` function name, last-loaded wins
- **Files:** `loot_crate_chaos.js` line 5; `loot_crate_ritual.js` line 7
- **Category:** Bug
- **Description:** Both files declare a top-level `giveTieredLoot` function. KubeJS server scripts share global scope — the last-loaded definition overwrites the first. Whichever crate type loaded second gets the wrong function body, breaking that crate's loot logic entirely.

---

### H-05 · `interactable_items.js` + `interactable_items2.js` — Duplicate `guardian_bee` tick handlers break Bee Jar
- **Files:** `interactable_items.js` ~line 394; `interactable_items2.js` ~line 208
- **Category:** Bug
- **Description:** Both scripts register a `LevelEvents.tick` handler for `guardian_bee` entities. Bees are processed twice per tick. The second handler discards bees without an `owner_` tag — bees released by the Bee Jar have no owner tag and are destroyed within ~1 second. The Bee Jar mechanic is broken.

---

### H-06 · `interactable_items.js` — Void Core destroys player-placed structures despite tooltip claiming it won't
- **File:** `kubejs/server_scripts/custom/interactable_items.js` ~line 204
- **Category:** Logic Error
- **Description:** The Void Core effect destroys any block matching `/stone|deepslate|gravel|sand|dirt/` every 2 ticks for 30 seconds, with **no check for player-placed blocks**. The client tooltip (`crates_tooltips.js` ~line 238) explicitly states "Does not affect player-made structures" — this is a false promise. Bases and paths will be destroyed.

---

### H-07 · `loot_crate_echo.js` — Sonic pulse knockback direction inverted (pulls instead of pushes)
- **File:** `kubejs/server_scripts/custom/loot_crates/loot_crate_echo.js` line 39
- **Category:** Logic Error
- **Description:** `dx = target.x - player.x` gives vector from player→target. Then `knockback(1.5, -dx, -dz)` negates it, making entities fly **toward** the player instead of away. Should be `knockback(1.5, dx, dz)`.

---

### H-08 · `arsnouveauBlacklist.js` — Drygmy UUID hardcoded to one specific entity instance; all other Drygmys bypass the filter
- **File:** `kubejs/server_scripts/arsnouveauBlacklist.js` lines 1–5
- **Category:** Logic Error
- **Description:** `DRYGMY_UUID` is the UUID of one specific entity. Only that exact entity's kills are filtered. Any other Drygmy in any world can freely farm treasure goblins — the entire protection is bypassed.

---

### H-09 · `turret.js` — NBT written via `.nbt.putLong()` not persisted; turret never fires or expires correctly
- **File:** `kubejs/server_scripts/custom/turret.js` lines 26, 59, 62
- **Category:** Bug
- **Description:** In KubeJS 1.20.1, `entity.nbt` returns a snapshot copy — modifications require `entity.mergeNbt()` to persist. The turret's `turret_spawn_tick` is never actually saved, so `age` reads as 0 every tick. The turret never fires or expires.

---

## 🟡 MEDIUM SEVERITY BUGS & LOGIC ERRORS

---

### M-01 · `roguelite_ring.js` (client) — Completion percentage divides by 16 hardcoded but there are 50+ milestones
- **File:** `kubejs/client_scripts/roguelite_ring.js` line 17
- **Category:** Bug
- **Description:** `Math.floor((milestones.length / 16) * 100)` — MILESTONE_DATA has 50+ entries. A fully-progressed player shows 300%+ completion on the ring tooltip.

---

### M-02 · `roguelite_ring.js` — `milestone_twilight` never awarded (Twilight Forest missing from dimension map)
- **File:** `kubejs/server_scripts/custom/roguelite_ring.js` ~line 154
- **Category:** Missing Reference
- **Description:** `kubejs:coin_twilight` and `milestone_twilight` exist in MILESTONE_DATA but `twilightforest:twilight_forest` is absent from `dimMap`. Players never receive this milestone.

---

### M-03 · `raid.js` — `killMultiplierBonus` tracked but never applied to token reward calculation
- **File:** `kubejs/server_scripts/custom/raid.js` lines 496–501
- **Category:** Logic Error
- **Description:** `killMult` is computed but never used in `rawTokens` or `totalScore`. The Void Hourglass item that sets this flag has no mechanical effect on raid rewards.

---

### M-04 · `armor.js` — `grid.find(baseItem)` can return null, causing NPE in `modifyResult`
- **File:** `kubejs/server_scripts/armor.js` lines 80–83
- **Category:** Bug
- **Description:** `const item = grid.find(baseItem)` has no null check before `result.withNBT(item.nbt)`. Auto-crafting (hoppers, pipes) can crash this if the base armor slot is empty.

---

### M-05 · `interactable_items.js` — Echo Locator performs 28,500+ block lookups synchronously per right-click
- **File:** `kubejs/server_scripts/custom/interactable_items.js` lines 180–235
- **Category:** Design Issue
- **Description:** Triple nested loop: `for x in -20..20, for y in -8..8, for z in -20..20` = 28,577 block lookups on the server tick thread per right-click. Will stall the server for tens of milliseconds per use.

---

### M-06 · `mobs.js` — `haunt` in `limitOnePerArea` but not `milestoneMobs`, so limit never applies
- **File:** `kubejs/server_scripts/custom/mobs.js` line 78 vs lines 8–13
- **Category:** Logic Error
- **Description:** `haunt` is in `limitOnePerArea` but since it's not in `milestoneMobs`, the event handler returns early before the per-area limit check runs. Haunts spawn without any area limiting.

---

### M-07 · `mobs.js` — `entity.maxHealth = entity.maxHealth + 10` is not a valid KubeJS API call
- **File:** `kubejs/server_scripts/custom/mobs.js` line 109
- **Category:** Bug
- **Description:** In KubeJS 1.20.1, `entity.maxHealth` is not a writable property. The correct API is `entity.getAttribute('minecraft:generic.max_health').setBaseValue(newValue)`. Silently fails — Direwolves and cursed dolls never receive their +10 HP buff.

---

### M-08 · `slots.js` — Dragon Egg obtainable from slot machine, allowing unlimited Ender Dragon respawns
- **File:** `kubejs/server_scripts/custom/slots.js` line 67
- **Category:** Balance
- **Description:** `minecraft:dragon_egg` is a jackpot prize with weight 5. The Dragon Egg is canonically unique (1 per world). Duplicating it breaks the intended End progression system.

---

### M-09 · `loot_crate_well.js` — 60% chance to give enchanted diamond gear for 1 diamond input
- **File:** `kubejs/server_scripts/custom/loot_crates/loot_crate_well.js` lines 27–40
- **Category:** Balance
- **Description:** Diamond well offering: 60% chance for Sharpness V diamond sword, Protection IV chestplate/leggings, or Efficiency V diamond pickaxe. One diamond → 60% chance for multiple diamonds worth of enchanted gear. Breaks early-mid game economy.

---

### M-10 · `lootjs.js` — All gold/iron ingots replaced with 1–5 nuggets in every chest worldwide
- **File:** `kubejs/server_scripts/lootjs.js` lines 71–72
- **Category:** Balance
- **Description:** `.replaceLoot("minecraft:gold_ingot", ...)` and `.replaceLoot("minecraft:iron_ingot", ...)` apply globally. A chest giving 4 gold ingots now gives 1–5 nuggets (~0.1–0.55 ingot equivalent). Extremely harsh with no in-game explanation.

---

### M-11 · `lootjs.js` — `simplyswords:diamond_longsword` and `diamond_cutlass` each replaced twice
- **File:** `kubejs/server_scripts/lootjs.js` lines 83, 91–92, 99
- **Category:** Bug
- **Description:** Duplicate `replaceLoot` calls for the same items. Second call processes already-replaced entries. Indicates copy-paste errors.

---

### M-12 · `roguelite_ring.js` — Rebirth teleports to Y=100 which can be underground in mountainous biomes
- **File:** `kubejs/server_scripts/custom/roguelite_ring.js` ~line 393
- **Category:** Design Issue
- **Description:** `player.teleportTo('minecraft:overworld', rx, 100, rz, 0, 0)` — Y=100 can be inside mountains. The `slow_falling` effect only helps if the player spawns above terrain. Players can suffocate on rebirth.

---

### M-13 · `loot_crate_ritual.js` — "Deep water" condition trivially exploitable with a single placed water block
- **File:** `kubejs/server_scripts/custom/loot_crates/loot_crate_ritual.js` lines 44–45
- **Category:** Design Issue
- **Description:** `let isDeep = blockAtFeet.id == 'minecraft:water' && player.y < 0;` — players can place one water block at Y=-1 underground to satisfy this condition without diving to the ocean floor.

---

### M-14 · `recipes_mastery.js` — `damageIngredient(Item.of(tool))` uses wrong API type, tool never damaged
- **File:** `kubejs/server_scripts/recipes_mastery.js` line 115
- **Category:** Bug
- **Description:** `damageIngredient` expects an `Ingredient` object. `Item.of()` creates an `ItemStack`. Silently fails — portable tools (dissolver, transmutator, salvager, sifter) are infinitely durable.

---

### M-15 · `food.js` (startup) — Platform mod name set to `'Industrial Village'` instead of `'RAD 3'`
- **File:** `kubejs/startup_scripts/food.js` ~line 72
- **Category:** Bug
- **Description:** `Platform.mods.kubejs.name = 'Industrial Village'` — copy-paste error. All other scripts use `'RAD 3'`. Since last-loaded script wins, "Industrial Village" may appear as the KubeJS mod name in the mod list and crash reports.

---

## 🔵 LOW SEVERITY BUGS & INCONSISTENCIES

---

### L-01 · `endLock.js` — `dragonkilled` stored as JS float assignment instead of NBT API
- **File:** `kubejs/server_scripts/endLock.js` lines 23–24
- **Category:** Inconsistency
- **Description:** `server.persistentData.dragonkilled = 1.0` (JS property) vs `contains('dragonkilled')` (NBT check). Works coincidentally but is inconsistent with correct NBT usage.

---

### L-02 · `decapitation_loot.js` — `supplementaries:enderman_head` hardcoded, no mod existence guard
- **File:** `kubejs/server_scripts/decapitation_loot.js` line 76
- **Category:** Missing Reference
- **Description:** If Supplementaries is removed, this drop call silently fails or throws. Should use `Item.exists()` guard or a fallback.

---

### L-03 · `endremloot.js` — `endrem:exotic_eye` missing from entity loot removal list
- **File:** `kubejs/server_scripts/endremloot.js` lines 19–24 vs line 49+
- **Category:** Inconsistency
- **Description:** Exotic eyes are added back via chest loot but not removed from entity loot first. If mobs naturally drop them, exotic eyes could be duplicated.

---

### L-04 · `recipes_processing.js` — All vanilla bread recipes removed with no in-game explanation
- **File:** `kubejs/server_scripts/recipes_processing.js` line 53
- **Category:** Design Issue
- **Description:** `event.remove({output: 'minecraft:bread'})` with no replacement or JEI tooltip explaining the change. Players unfamiliar with the pack will be confused.

---

### L-05 · `recipes_processing.js` — Blast furnace requires `embers:iron_plate` with no progression hint
- **File:** `kubejs/server_scripts/recipes_processing.js` lines 9–18
- **Category:** Design Issue
- **Description:** Blast furnace replaced with a recipe requiring Embers Rekindled. No in-game documentation added for new players.

---

### L-06 · `recipes.js` — Duplicate removal of `ars_trinkets:mana_stone_5`
- **File:** `kubejs/server_scripts/recipes.js` lines 72–73
- **Category:** Inconsistency
- **Description:** `"ars_trinkets:mana_stone_5"` appears twice in the `removals` array. Harmless, but indicates copy-paste sloppiness.

---

### L-07 · `client_scripts/script.js` — `ars_trinkets:mana_stone_5` hidden in JEI twice
- **File:** `kubejs/client_scripts/script.js` lines 79–80
- **Category:** Inconsistency
- **Description:** Same item hidden twice. No functional impact.

---

### L-08 · `turret.js` — `SHOOT_EVERY` constant declared but never used
- **File:** `kubejs/server_scripts/custom/turret.js` lines 4, 79
- **Category:** Code Quality
- **Description:** `const SHOOT_EVERY = 40` is dead code. Actual shoot interval is a hardcoded `age % 4 === 0`.

---

### L-09 · `vault.js` — Missing space in withdraw message produces `"DIAMONDCOIN"`
- **File:** `kubejs/server_scripts/custom/vault.js` line 210
- **Category:** Bug
- **Description:** `coinInput.toUpperCase() + "COIN"` → produces `"DIAMONDCOIN"`. Should be `coinInput.toUpperCase() + " COIN"`.

---

### L-10 · `vault.js` — `kubejs:coin_twilight` missing from `COIN_VALUES`, always worth 0 in vault
- **File:** `kubejs/server_scripts/custom/vault.js` lines 35–48
- **Category:** Missing Reference
- **Description:** `coin_twilight` is in `COIN_MAP` but not `COIN_VALUES`. Net worth summary always shows 0 value for twilight coins.

---

### L-11 · `mobs.js` — Direwolf pack members spawned at `entity.y` without surface detection
- **File:** `kubejs/server_scripts/custom/mobs.js` lines 65–70
- **Category:** Design Issue
- **Description:** Pack wolves may spawn inside blocks in hilly terrain.

---

### L-12 · `roguelite_ring.js` — Potion NBT passed as separate string argument, potion never given
- **File:** `kubejs/server_scripts/custom/roguelite_ring.js` lines 84, 88
- **Category:** Bug
- **Description:** `'{Potion:"minecraft:strong_strength"}'` is treated as another item ID string and passed to `player.give(...)`, silently failing. Potions in rebirth kits are never delivered.

---

### L-13 · `chestFix.js` — Quark chest ID built via array coercion (accidentally works but fragile)
- **File:** `kubejs/server_scripts/chestFix.js` line 24
- **Category:** Code Quality
- **Description:** `"quark:" + woodid` where `woodid` is an array. Works because single-element array `.toString()` = the string. Fragile and unreadable; should use `woodid[0]`.

---

### L-14 · `loot_crate_cooldown.js` — Scheduled cooldown notification fires for offline players
- **File:** `kubejs/server_scripts/custom/loot_crates/loot_crate_cooldown.js` lines 22–32
- **Category:** Bug
- **Description:** `server.scheduleInTicks(100, ...)` callback checks `player.isAlive()` but not online status. May throw on a disconnected player's reference.

---

### L-15 · `bonefire_spawn_location.js` — "Bonefire" typo in filename
- **File:** `kubejs/server_scripts/bonefire_spawn_location.js`
- **Category:** Code Quality
- **Description:** Should be `bonfire_spawn_location.js` to match `bonfire_dim_blacklist.js` and the mod's actual block name.

---

### L-16 · `recipes_weapons.js` — `ribboncleaver` uses `minecraft:red_wool` as upgrade material (trivially cheap)
- **File:** `kubejs/server_scripts/recipes_weapons.js` line 52
- **Category:** Balance
- **Description:** Red Wool as the smithing upgrade material for a legendary sword is far cheaper than all other legendary weapon materials (which use rare mod items).

---

### L-17 · `endremloot.js` — `isUndeadMob(true)` may not work as intended in LootJS
- **File:** `kubejs/server_scripts/endremloot.js` lines 112–117
- **Category:** Logic Error
- **Description:** `isUndeadMob(true)` — the boolean argument is non-standard in the LootJS API. May silently match all undead (including vanilla zombies) with a 0.5% `endrem:undead_soul` drop, which is too broad.

---

### L-18 · `startingItems.js` — New players get no helmet or chestplate despite natural regen being disabled
- **File:** `kubejs/server_scripts/startingItems.js` lines 27–28
- **Category:** Design Issue
- **Description:** Starting gear only covers legs and feet. With `naturalRegeneration false`, new players are significantly vulnerable in the early game.

---

### L-19 · `chatevents.js` — Redundant `else if (contains('firstjoin'))` check (always true when reached)
- **File:** `kubejs/server_scripts/chatevents.js` line 58
- **Category:** Code Quality
- **Description:** The second branch can only be reached when `contains('firstjoin')` is already confirmed true. The `else if` condition is redundant; should be plain `else`.

---

### L-20 · `recipes_mastery.js` — `portable_salvager` and `portable_transmutator` nearly identical recipes, easy to confuse in JEI
- **File:** `kubejs/server_scripts/recipes_mastery.js` lines 78–87
- **Category:** Design Issue
- **Description:** Both recipes use the same shaped pattern with one different center ingredient. Very easy for players to confuse in JEI. UX concern.

---

### L-21 · `curioRegistry.js` — Placeholder test item `kubejs:my_custom_curio` present in production build
- **File:** `kubejs/startup_scripts/curioRegistry.js` line 84
- **Category:** Code Quality
- **Description:** `kubejs:my_custom_curio` with `displayName('My Custom Curio')` is registered in the production build. This is a development artifact that should be removed.

---

### L-22 · `loot_crate_command.js` — `/crate reset` does not reset `echo` crate statistics
- **File:** `kubejs/server_scripts/custom/loot_crates/loot_crate_command.js` lines 28–29
- **Category:** Bug
- **Description:** Reset sets `{ rituals: 0, chaos: 0, wishes: 0, ancient: 0 }` — omitting `echo`. Echo crate count persists after a reset.

---

### L-23 · `lootjs.js` — `supplementaries:rope` silently replaced with `farmersdelight:rope` globally
- **File:** `kubejs/server_scripts/lootjs.js` line 100
- **Category:** Inconsistency
- **Description:** Undocumented item substitution. Fine if intentional, but no in-game explanation.

---

## 🟣 DESIGN ISSUES

---

### D-01 · `food.js` client/server — Dual food registries will drift out of sync
- **Files:** `client_scripts/food.js`; `server_scripts/custom/hunger.js`
- **Category:** Design Issue
- **Description:** Client tooltip food registry is a manual copy of server registry. They will diverge over time, causing tooltips to show wrong effects.

---

### D-02 · `endLock.js` — 100-tick polling for End boundary leaves 5-second escape window
- **File:** `kubejs/server_scripts/endLock.js` lines 1–18
- **Category:** Design Issue
- **Description:** The End lock teleports players back every 100 ticks. Players can run off the End island and fall for ~5 seconds each check cycle.

---

### D-03 · `slots.js` — Wall-clock cooldown in `persistentData` resets on server restart, bypassing spin limits
- **File:** `kubejs/server_scripts/custom/slots.js` lines 14–17
- **Category:** Design Issue
- **Description:** `new Date().getTime()` timestamps in persistentData may not survive restarts depending on persistence config. Gambling session limits could be bypassed by restarting the server.

---

### D-04 · `recraft.js` — Gold ingot recraft adds hundreds of shapeless recipes across broad tag
- **File:** `kubejs/server_scripts/recraft.js` lines 18–41
- **Category:** Design Issue / Medium Bug
- **Description:** Every item in sword/armor/pickaxe/axe/shield/melee_weapon tags gets a shapeless recipe. Creates hundreds of recipes, potential recipe resolution lag, and adds recraft to unintended mod items. Also `Item.empty` used as property instead of `Item.empty()` method.

---

### D-05 · `wildenSpawns.js` — Wilden Stalker/Hunter spawn in ALL overworld biomes including peaceful starting areas
- **File:** `kubejs/server_scripts/wildenSpawns.js` lines 1–5
- **Category:** Design Issue
- **Description:** Wilden Hunter/Stalker added to `#minecraft:is_overworld` (all biomes). Only Wilden Guardian is biome-restricted. Hostile Ars Nouveau mobs in plains/forests near villages can be brutal for new players.

---

### D-06 · `ars_nerfs.js` — File misleadingly named; actually performs ore unification, not Ars Nouveau nerfs
- **File:** `kubejs/server_scripts/ars_nerfs.js`
- **Category:** Design Issue (Naming)
- **Description:** This script maps silver ore to Embers silver ingots. The filename implies Ars Nouveau nerfs. Makes maintenance harder.

---

### D-07 · `interactable_items.js` — Kinetic Dampener/Translocation Coil cooldowns use `level.time` which differs between dimensions
- **File:** `kubejs/server_scripts/custom/interactable_items.js` lines 259–270, 330–340
- **Category:** Design Issue
- **Description:** Cooldowns stored as `level.time` (game ticks per dimension). Switching dimensions mid-cooldown produces incorrect cooldown calculations since `level.time` differs per dimension.

---

## Summary Table

| ID | Severity | Category | File |
|---|---|---|---|
| C-01 | Critical | Bug | `loot_crate_chaos.js` |
| C-02 | Critical | Bug | `mimic_drops.js` |
| C-03 | Critical | Bug | `loot_crate_ancient.js` |
| C-04 | Critical | Bug | `loot_crate_ancient.js` + `loot_crate_cooldown.js` |
| C-05 | Critical | Bug | `raid.js` |
| C-06 | Critical | Bug | `interactable_items.js` |
| C-07 | Critical | Bug | `gamerules.js` |
| H-01 | High | Bug | `summon.js` |
| H-02 | High | Bug | `summon.js` |
| H-03 | High | Logic Error | `roguelite_ring.js` |
| H-04 | High | Bug | `loot_crate_chaos.js` / `loot_crate_ritual.js` |
| H-05 | High | Bug | `interactable_items.js` / `interactable_items2.js` |
| H-06 | High | Logic Error | `interactable_items.js` |
| H-07 | High | Logic Error | `loot_crate_echo.js` |
| H-08 | High | Logic Error | `arsnouveauBlacklist.js` |
| H-09 | High | Bug | `turret.js` |
| M-01 | Medium | Bug | `roguelite_ring.js` (client) |
| M-02 | Medium | Missing Reference | `roguelite_ring.js` |
| M-03 | Medium | Logic Error | `raid.js` |
| M-04 | Medium | Bug | `armor.js` |
| M-05 | Medium | Performance | `interactable_items.js` |
| M-06 | Medium | Logic Error | `mobs.js` |
| M-07 | Medium | Bug | `mobs.js` |
| M-08 | Medium | Balance | `slots.js` |
| M-09 | Medium | Balance | `loot_crate_well.js` |
| M-10 | Medium | Balance | `lootjs.js` |
| M-11 | Medium | Bug | `lootjs.js` |
| M-12 | Medium | Design Issue | `roguelite_ring.js` |
| M-13 | Medium | Design Issue | `loot_crate_ritual.js` |
| M-14 | Medium | Bug | `recipes_mastery.js` |
| M-15 | Medium | Bug | `food.js` (startup) |
| L-01 | Low | Inconsistency | `endLock.js` |
| L-02 | Low | Missing Reference | `decapitation_loot.js` |
| L-03 | Low | Inconsistency | `endremloot.js` |
| L-04 | Low | Design Issue | `recipes_processing.js` |
| L-05 | Low | Design Issue | `recipes_processing.js` |
| L-06 | Low | Inconsistency | `recipes.js` |
| L-07 | Low | Inconsistency | `client_scripts/script.js` |
| L-08 | Low | Code Quality | `turret.js` |
| L-09 | Low | Bug | `vault.js` |
| L-10 | Low | Missing Reference | `vault.js` |
| L-11 | Low | Design Issue | `mobs.js` |
| L-12 | Low | Bug | `roguelite_ring.js` |
| L-13 | Low | Code Quality | `chestFix.js` |
| L-14 | Low | Bug | `loot_crate_cooldown.js` |
| L-15 | Low | Code Quality | `bonefire_spawn_location.js` |
| L-16 | Low | Balance | `recipes_weapons.js` |
| L-17 | Low | Logic Error | `endremloot.js` |
| L-18 | Low | Design Issue | `startingItems.js` |
| L-19 | Low | Code Quality | `chatevents.js` |
| L-20 | Low | Design Issue | `recipes_mastery.js` |
| L-21 | Low | Code Quality | `curioRegistry.js` |
| L-22 | Low | Bug | `loot_crate_command.js` |
| L-23 | Low | Inconsistency | `lootjs.js` |
| D-01 | Design | Design Issue | `food.js` client+server |
| D-02 | Design | Design Issue | `endLock.js` |
| D-03 | Design | Design Issue | `slots.js` |
| D-04 | Design | Design Issue / Bug | `recraft.js` |
| D-05 | Design | Design Issue | `wildenSpawns.js` |
| D-06 | Design | Design Issue | `ars_nerfs.js` |
| D-07 | Design | Design Issue | `interactable_items.js` |

---
---

# DATA & CONFIG FILE REVIEW — Additional Issues (34 more)

---

## 🔴 CRITICAL (Data/Config)

---

### DC-C1 · `magician.json` — Bounty decree references missing pool file `decree.json`
- **File:** `kubejs/data/bountiful/bounty_decrees/dreams/magician.json`
- **Category:** Missing Reference
- **Description:** The Magician decree's `rewards` array references pool name `"decree"` but no `decree.json` exists in `bounty_pools/dreams/`. Every other decree references an existing file. Magician bounties will never pay out correctly — reward silently dropped or errors thrown.

---

### DC-C2 · `scarlet_or_sacrifice.json` + `armor.json` — Empty loot table overrides (`{}`) break two Incendium sources
- **Files:** `kubejs/data/incendium/loot_tables/artifact/scarlet_or_sacrifice.json`; `kubejs/data/incendium/loot_tables/castle/stand/armor.json`
- **Category:** Bug
- **Description:** Both files are entirely empty JSON objects `{}`. Minecraft treats these as invalid loot tables — any Incendium chest or armor-stand resolving either table always yields nothing.

---

### DC-C3 · `armor-bulky.json` — `multiply_total: -1` sets armor and toughness to absolute zero
- **File:** `kubejs/data/gearupgrades/refinements/armor-bulky.json`
- **Category:** Balance / Bug
- **Description:** `"operation": "multiply_total"` with `"amount": -1` means `base × (1 + (−1)) = 0`. Both `generic.armor` and `generic.armor_toughness` are zeroed regardless of the item. "Bulky" implies a small health-for-armor trade, not complete destruction of all defense. Should use a small negative value like `-0.1` or `-0.15`.

---

### DC-C4 · `secret_room.json` — Wrong namespace `hmag:coin_dungeon` should be `kubejs:coin_dungeon`
- **File:** `kubejs/data/dungeoncrawl/loot_tables/chests/secret_room.json`
- **Category:** Missing Reference
- **Description:** `"name": "hmag:coin_dungeon"` — every other dungeoncrawl file uses `kubejs:coin_dungeon`. The `hmag:` namespace almost certainly does not exist. Dungeon coin drops in secret rooms are silently broken.

---

## 🟠 HIGH (Data/Config)

---

### DC-H1 · `engine.json` — Both recipe keys `C` and `I` bound to the same ingredient `embers:iron_plate`
- **File:** `kubejs/data/immersive_aircraft/recipes/engine.json`
- **Category:** Bug
- **Description:** Two distinct shaped recipe keys resolve to the same material. Almost certainly a copy-paste error; one was likely intended to be `embers:copper_plate` or similar. Unintentionally simplifies the recipe.

---

### DC-H2 · `gyrodyne.json` — Empty recipe file `{}` makes the gyrodyne vehicle uncraftable
- **File:** `kubejs/data/immersive_aircraft/recipes/gyrodyne.json`
- **Category:** Bug
- **Description:** The file is a bare `{}`. Effectively deletes the gyrodyne recipe from the crafting system.

---

### DC-H3 · `lotr.json` — Duplicate `titles:gem_collector` ID clobbers the Gem Collector title
- **File:** `kubejs/data/titles/titles/lotr.json`; `kubejs/data/titles/titles/gem_collector.json`
- **Category:** Inconsistency
- **Description:** Both files register `"id": "titles:gem_collector"`. Last-loaded definition wins — one title effectively doesn't exist. Players granted either title may display the wrong one.

---

### DC-H4 · `pathfinder.json` — Uses `titles:sorcerer` ID, breaking both Pathfinder and Sorcerer titles
- **File:** `kubejs/data/titles/titles/pathfinder.json`; `kubejs/data/titles/titles/sorcerer.json`
- **Category:** Inconsistency
- **Description:** Same ID collision as DC-H3. `pathfinder.json` uses `"id": "titles:sorcerer"`. The Pathfinder title effectively doesn't exist.

---

### DC-H5 · `source_regen.json` — Heirloom tier has lower mana regen min than Rare tier (regression)
- **File:** `kubejs/data/apotheotic_additions/affixes/curios_jewelry/attribute/source_regen.json`
- **Category:** Balance
- **Description:** Heirloom `min: 0.03` is lower than Artifact `min: 0.07` and equal to Rare `min: 0.03`. Heirloom is a higher tier than Artifact. The mana regen progression regresses at the heirloom tier — better gear gives weaker bonuses.

---

### DC-H6 · `armor-weighted.json` + `shield-resilient.json` — `multiply_total` on base-0 knockback resistance gives zero benefit
- **Files:** `kubejs/data/gearupgrades/refinements/armor-weighted.json`; `kubejs/data/gearupgrades/refinements/shield-resilient.json`
- **Category:** Logic Error
- **Description:** Base `knockback_resistance` is 0 for all vanilla armor/shields. `0 × (1 + 0.3) = 0`. Both refinements provide zero knockback resistance for 99% of gear. Should use `"operation": "addition"` instead of `"multiply_total"`.

---

### DC-H7 · `stage_1.json` + `stage_2.json` — Identical enemy tables; no dungeon difficulty progression
- **Files:** `kubejs/data/dungeoncrawl/monster/entities/stage_1.json`; `stage_2.json`
- **Category:** Logic Error
- **Description:** Common and rare enemy lists are byte-for-byte identical between Stage 1 and Stage 2. Players see no increase in mob variety or difficulty when moving from stage 1 to stage 2 dungeons.

---

### DC-H8 · `spawn_rates.json` — Stage 5 dungeon spawn delay (260–400 ticks) is slower than stage 3/4 (180–240 ticks)
- **File:** `kubejs/data/dungeoncrawl/monster/spawn_rates.json`
- **Category:** Balance
- **Description:** The hardest dungeon stage has the slowest (easiest) spawn rate. Stage 5 (260–400 ticks = 13–20s) is slower than stages 3 and 4 (180–240 ticks = 9–12s). Higher stages should spawn faster to scale difficulty.

---

## 🟡 MEDIUM (Data/Config)

---

### DC-M1 · `magic_forest.json` (dimension type) — Multiple contradictory dimension settings
- **File:** `kubejs/data/magic_forest/dimension_type/magic_forest.json`
- **Category:** Design Issue / Logic Error
- **Description:**
  1. `"effects": "minecraft:the_nether"` — forest dimension gets Nether sky, fire particles, ambience.
  2. `"has_ceiling": true` + `"has_skylight": true` — mutually exclusive; sky light doesn't penetrate bedrock ceilings.
  3. `"respawn_anchor_works": true` + `"bed_works": false` — players die without an anchor → respawn at world spawn with no warning.
  4. `"monster_spawn_block_light_limit": 15` — monsters spawn at ANY light level including full brightness.

---

### DC-M2 · `skilltree-common.toml` — Level cost array has 85 entries vs 150 max points; amnesia scroll penalty is 0
- **File:** `config/skilltree-common.toml`
- **Category:** Logic Error / Balance
- **Description:** `"Levelup costs"` has 85 entries but `"Maximum skill points"` is 150. If array mode is enabled, levels 86–150 will throw `ArrayIndexOutOfBoundsException`. Also, `"Amnesia scroll penalty" = 0.0` — skill respecs are completely free, trivializing all investment decisions.

---

### DC-M3 · `levelhearts.toml` — 8 heart milestones exceed the HP cap; those levels give no reward
- **File:** `config/levelhearts.toml`
- **Category:** Logic Error
- **Description:** Max health is 60 HP (30 hearts) from default 10 HP. The level ramp has 33 milestones but only 25 hearts of room. The final 8 milestones (levels ~180–255) silently give nothing because the player is already at max health.

---

### DC-M4 · `shield-wise.json` — `multiply_total` on base-0 experience attribute gives no bonus
- **File:** `kubejs/data/gearupgrades/refinements/shield-wise.json`
- **Category:** Logic Error
- **Description:** Uses `multiply_total` on `attributeslib:experience_gained` which has base value 0. `0 × 1.1 = 0`. The shield wise refinement provides no XP bonus. Head-wise correctly uses `addition`.

---

### DC-M5 · `rebirth.json` — Roguelite ring given 0 upgrade slots; silently rejects all refinements
- **File:** `kubejs/data/gearupgrades/upgrade_slots/rebirth.json`
- **Category:** Design Issue
- **Description:** `"max_slots": 0` on `kubejs:roguelite_ring`. No in-game explanation. Players trying to upgrade the ring get no feedback.

---

### DC-M6 · `curio-summon.json` — Attribute namespace may be wrong (`ars_nouveau:ars_elemental...`)
- **File:** `kubejs/data/gearupgrades/refinements/curio-summon.json`
- **Category:** Missing Reference
- **Description:** `"property": "ars_nouveau:ars_elemental.perk.summon_power"` cross-references an Ars Elemental attribute under the Ars Nouveau namespace. Correct namespace may be `ars_elemental:`. If wrong, this refinement silently does nothing.

---

### DC-M7 · 17 refinement incompatibility pairs are one-sided (can be bypassed by applying in reverse order)
- **File:** `kubejs/data/gearupgrades/refinements/` (17 files)
- **Category:** Inconsistency
- **Description:** When A lists B as `incompat`, B can still be applied after A. All intended mutual exclusions (e.g., lifesteal/bloodthirsty, bulky/casting, sniping/bowfast) can be bypassed by applying in the opposite order. 17 such pairs identified.

---

### DC-M8 · `armor-armored.json` — Zero proficiency cost, free to apply vs all other refinements
- **File:** `kubejs/data/gearupgrades/refinements/armor-armored.json`
- **Category:** Balance
- **Description:** `"proficiency_cost": 0` while every other refinement costs 5–100. Trivializes access to a universal armor bonus.

---

### DC-M9 · `paraglider-common.toml` — Heart containers disabled; boss kills give no HP reward
- **File:** `config/paraglider-common.toml`
- **Category:** Design Issue
- **Description:** `heartContainers = false` silently removes heart container rewards from major boss kills (Ender Dragon, Wither, raids). Bargain recipes still exist, creating inconsistency.

---

### DC-M10 · Three apotheotic affix files have duplicate `types` entries doubling certain item probabilities
- **Files:** `kubejs/data/apotheotic_additions/affixes/curios_jewelry/attribute/gaia.json`; `source_regen.json`; `sourcetouched.json`
- **Category:** Inconsistency
- **Description:** `"curios:scroll"`, `"curios:spellstone"`, `"curios:bracelet"` each appear twice in the `types` array. Doubles their affix probability relative to other item types.

---

### DC-M11 · `bosskiller_mysterious_petal` — EPIC rarity but unitWorth 500 (8–16× below other EPIC items)
- **File:** `kubejs/data/bountiful/bounty_pools/dreams/bosskiller_rews.json`
- **Category:** Balance
- **Description:** EPIC rarity makes it rare as a bounty reward, but its value (500) is far below all other EPIC items (4,000–8,000). Hard to get AND barely worth anything.

---

### DC-M12 · Duplicate loot entries silently inflate drop weights across 6 dungeoncrawl chest files
- **Files:** `dungeoncrawl/loot_tables/chests/food.json`, `library.json`, `stage_3.json`, `stage_4.json`, `stage_5.json`, `treasure.json`
- **Category:** Logic Error
- **Description:** Duplicated item entries (e.g., `minecraft:book` ×2, `minecraft:cooked_porkchop` ×2) double drop probability without any indication it was intentional.

---

### DC-M13 · Stage 4/5 dungeon chests reward iron-tier gear — under-tiered for late-game content
- **Files:** `dungeoncrawl/loot_tables/chests/stage_4.json`; `stage_5.json`
- **Category:** Balance
- **Description:** Stage 4/5 chests primarily give iron and chainmail equipment. Stage 5 has only one diamond item at weight 1. Players at this stage have far better gear — most drops are vendor trash.

---

### DC-M14 · Magic Forest biome — Wilden spawns at weight 100 per type; `maxCount: 10` each; blazing weald walker in creature pool
- **File:** `kubejs/data/magic_forest/worldgen/biome/magic_forest.json`
- **Category:** Balance
- **Description:** Three hostile mob types each at weight 100 with maxCount 10. Additionally, a fire elemental (`blazing_weald_walker`) in the creature pool. The Magic Forest will be overwhelmingly hostile and on fire, inconsistent with the "magic forest" theme.

---

## 🔵 LOW (Data/Config)

---

### DC-L1 · All 40 milestone advancements use `minecraft:impossible` trigger with no parent — fragile
- **File:** `kubejs/data/rad3/advancements/milestone/` (all 40 files)
- **Category:** Design Issue
- **Description:** Entirely KubeJS-script-driven. If any script fails, all 40 milestones become permanently unobtainable. No parent links, so advancement tree is 40 disconnected root nodes.

---

### DC-L2 · `dimdungeons` config has `spawner_6` listed 3× — unintentional triple weight
- **File:** `config/dimdungeons-common-r207.toml`
- **Category:** Missing Reference
- **Description:** `"dimdungeons:spawner_6"` appears three consecutive times. Triples its weight over spawner_1 through spawner_5, dominating dead-end room generation.

---

### DC-L3 · Two Dimensional Dungeons config files (r190 + r207) may shadow each other
- **Files:** `config/dimdungeons-common-r190.toml`; `config/dimdungeons-common-r207.toml`
- **Category:** Inconsistency
- **Description:** If both are parsed, settings may conflict. The older r190 file should be removed if r207 is the active version.

---

### DC-L4 · Cartographer adventurer map trade silently removed via `no_op`
- **File:** `kubejs/data/minecraft/moonlight/villager_trades/cartographer/adventurer_map.json`
- **Category:** Design Issue
- **Description:** `"type": "no_op"` fully removes the adventurer map trade with no in-game indicator that it was intentional.

---

### DC-L5 · Refinement IDs lack consistent naming conventions across bow/feet/shield categories
- **File:** `kubejs/data/gearupgrades/refinements/` (multiple files)
- **Category:** Code Quality
- **Description:** Mixed prefix conventions (e.g., `bowfast` vs. `quick`, `feetquick2` vs. `rolling`) make querying fragile and risk future ID collisions.

---

### DC-L6 · Magic Forest biome — `has_precipitation: false` contradicts `downfall: 0.8`; dead `freeze_top_layer` feature
- **File:** `kubejs/data/magic_forest/worldgen/biome/magic_forest.json`
- **Category:** Inconsistency
- **Description:** High downfall value but precipitation disabled. `freeze_top_layer` feature will never trigger at the biome's warm temperature (0.7). Contradictory values.

---

### DC-L7 · `tombstone-common.toml` — 5% mob spawn on grave recovery not communicated to players
- **File:** `config/tombstone-common.toml`
- **Category:** Design Issue
- **Description:** `chance_mob_on_grave_recovery = 5` — 1-in-20 grave recoveries spawns hostile mobs. No tooltip or in-game warning. Minor but can surprise new players unexpectedly.

---

## Data/Config Summary Table

| ID | Severity | Category | File/System |
|---|---|---|---|
| DC-C1 | Critical | Missing Reference | `magician.json` bounty decree |
| DC-C2 | Critical | Bug | `scarlet_or_sacrifice.json` + `armor.json` empty loot tables |
| DC-C3 | Critical | Balance/Bug | `armor-bulky.json` zeros all armor |
| DC-C4 | Critical | Missing Reference | `secret_room.json` → `hmag:coin_dungeon` |
| DC-H1 | High | Bug | `engine.json` duplicate ingredient keys |
| DC-H2 | High | Bug | `gyrodyne.json` empty recipe |
| DC-H3 | High | Inconsistency | `lotr.json` title ID collision |
| DC-H4 | High | Inconsistency | `pathfinder.json` title ID collision |
| DC-H5 | High | Balance | `source_regen.json` tier regression |
| DC-H6 | High | Logic Error | `armor-weighted` + `shield-resilient` KBR = 0 |
| DC-H7 | High | Logic Error | Stage 1 = Stage 2 dungeon mob tables |
| DC-H8 | High | Balance | Stage 5 spawn delay slower than stage 4 |
| DC-M1 | Medium | Design/Logic | Magic Forest dimension type contradictions |
| DC-M2 | Medium | Logic/Balance | Skill tree cost array length mismatch; free respecs |
| DC-M3 | Medium | Logic | LevelHearts 8 milestones exceed HP cap |
| DC-M4 | Medium | Logic | `shield-wise` multiply_total on base-0 attribute |
| DC-M5 | Medium | Design | Roguelite ring has 0 upgrade slots |
| DC-M6 | Medium | Missing Reference | `curio-summon.json` wrong attribute namespace |
| DC-M7 | Medium | Inconsistency | 17 asymmetric refinement incompat pairs |
| DC-M8 | Medium | Balance | `armor-armored` zero proficiency cost |
| DC-M9 | Medium | Design | Paraglider heart containers disabled |
| DC-M10 | Medium | Inconsistency | 3 affix files with duplicate type entries |
| DC-M11 | Medium | Balance | Mysterious petal EPIC rarity but worth 500 |
| DC-M12 | Medium | Logic | Duplicate loot entries in 6 dungeoncrawl files |
| DC-M13 | Medium | Balance | Stage 4/5 chests reward iron-tier gear |
| DC-M14 | Medium | Balance | Magic Forest hostile mob spawns excessive |
| DC-L1 | Low | Design | 40 milestones use `minecraft:impossible`, no parents |
| DC-L2 | Low | Missing Reference | `spawner_6` listed 3× in dimdungeons config |
| DC-L3 | Low | Inconsistency | Two dimdungeons config files (r190 + r207) |
| DC-L4 | Low | Design | Cartographer map trade removed via `no_op` |
| DC-L5 | Low | Code Quality | Refinement ID naming inconsistency |
| DC-L6 | Low | Inconsistency | Magic Forest biome precipitation contradictions |
| DC-L7 | Low | Design | Tombstone grave recovery mob spawn undisclosed |

---
**Grand Total: 95 issues** (11 Critical, 17 High, 29 Medium, 30 Low/Design)

---

# MOD COLLISION REVIEW — 47 Cross-Mod Conflicts

Review of the full modlist (~350 mods) and all config files for systems that collide,
double-modify the same mechanic, or produce unintended interactions.

---

## 🔴 CRITICAL COLLISIONS (6)

---

### COL-C1 · BetterCombat — Both vanilla AND reworked sweep active simultaneously ✅ DONE
- **File:** `config\bettercombat\server.json5` lines 24 & 26
- **Conflict:** `allow_vanilla_sweeping: true` + `allow_reworked_sweeping: true` — both fire independently on each sweep swing. Double AoE damage per attack. BetterCombat's own config warns to choose one.
- **Fix:** Set `"allow_vanilla_sweeping": false`
- **Resolution:** Config was already correct — `allow_vanilla_sweeping` was already `false`. No change needed.

---

### ~~COL-C2~~ · ~~ShieldMechanics + ShieldOverhaul — Two full shield system overhauls with no compat~~ — ✅ DISMISSED (false positive)
- **Files:** `config\shieldmechanics.json`; `config\shield_overhaul\shield_overhaul.json`
- **Assessment:** These are complementary mods, not duplicates. ShieldMechanics controls *per-shield damage reduction numbers* (how much % a shield blocks/passively reduces). ShieldOverhaul controls *new actions* (parry window, bash, instant raise). Their config schemas are entirely different and there is no functional overlap. Intended to work together.

---

### ~~COL-C3~~ · ~~KubeJS gamerules.js + Iron's RPG Tweaks — `naturalRegeneration false` kills live regen attributes~~ — ✅ DISMISSED (false positive)
- **Files:** `kubejs\server_scripts\gamerules.js`; `config\attributefix.json`
- **Assessment:** `naturalRegeneration false` only disables the vanilla passive tick regen — it does not affect food-saturation regen, healing potions/items, or Iron's RPG Tweaks attribute-granted regen. Additionally, both `irons_rpg_tweaks:natural_regen_speed` and `irons_rpg_tweaks:natural_regen_amount` entries in `attributefix.json` are `"enabled": false`, meaning AttributeFix is not managing them; they run at their mod defaults. No conflict exists.

---

### ~~COL-C22~~ · ~~YUNG's Better Strongholds + Dungeons & Taverns Stronghold Rework — registry collision~~ — ✅ DISMISSED (false positive, files removed)
- **Assessment:** YUNG's Better Strongholds is not in the modpack profile. D&T Stronghold Rework is the only active stronghold replacer. Two orphaned files have been deleted in branch `chore/col-c22-remove-orphaned-stronghold-files`:
  - `config/betterstrongholds-forge-1_20.toml` (config for absent mod)
  - `config/paxi/datapacks/rad3-structures/data/artifacts/loot_tables/inject/chests/stronghold_corridor.json` (empty `{}` loot injection; target replaced by D&T)

---

### ~~COL-C23~~ · ~~Underground structure density — ATI spacing=10 + Dungeon Crawl + YUNG Dungeons + Dungeons Enhanced~~ — ✅ COMPLETE (no changes needed)
- **Mechanic:** ATI `underground_small` spacing=10/separation=5 means 5 different underground structures every 5–10 chunks. Multiple large underground mods with no mutual exclusion zones — physical overlapping guaranteed.
- **Resolution:** Intentional design — dense underground content is part of the pack experience. No changes required.

---

### ~~COL-C37~~ · ~~Tombstone (95% XP loss) + LevelHearts Hardcore + PassiveSkillTree — triple death penalty~~ — ✅ COMPLETE (no changes needed)
- **Files:** `tombstone-server.toml: xp_loss_on_death=95`; `levelhearts.toml: Hardcore=true`; `skilltree-common.toml: first skill point cost=250 XP`
- **Conflict:** Single death: 95% XP wiped + max health reset to 5 hearts + future skill points severely delayed.
- **Resolution:** Intentional difficulty design — the harsh death penalty is a core pack mechanic. No changes required.

---

## 🟠 HIGH COLLISIONS (14)

---

### COL-H4 · CombatRoll i-frames vs Iron's RPG Tweaks `invulnerabilityTickCount=0`
- **Files:** `combatroll\server.json5: invulnerable_ticks_upon_roll=4`; `irons_rpg_tweaks-server.toml: invulnerabilityTickCount=0, playerDamageMode=ALL`
- **Conflict:** Iron's RPG Tweaks strips all i-frames globally. CombatRoll's dodge window may be completely neutered.
- **Fix:** Set `playerDamageMode = "NONE"` in irons_rpg_tweaks-server.toml

---

### COL-H5 · LevelHearts + Paraglider + Aether — max health ceiling enforced by three separate systems
- **Conflict:** LevelHearts cap=60 hearts; Paraglider `maxHeartContainers=10`; Aether Life Shards add a third modifier. No single authority enforces the ceiling — players may exceed 60 hearts.

---

### COL-H6 · LevelHearts Hardcore=true + SecondChance death prevention — undefined event order
- **Conflict:** SecondChance cancels death event; LevelHearts resets health on death. Hardcore reset may fire even when death was prevented depending on event handler order.
- **Fix:** Set `Hardcore = false` if SecondChance is the intended death mitigation, OR disable SecondChance

---

### COL-H14 · JEI + EMI both fully active — duplicate sidebars and R/U keybind conflict ✅ DONE
- **Config:** `emi.css: enabled=true`; `jei-client.ini` has active non-default settings. Both bind `R` and `U`. Ars Nouveau recipe categories duplicated.
- **Fix:** Disable one viewer (recommend keeping EMI)
- **Resolution:** JEI removed from modpack. KubeJS JEI scripts deleted and migrated — see branch `fix/col-h14-remove-jei-scripts`.

---

### COL-H15 · TooManyGlyphs amplify tier stacking — 16 augments possible on a single spell
- **Config:** Limits enforced per glyph ID, not per amplify family (8+6+2=16 total possible)
- **Fix:** Add `augment_limits` cross-references between the three amplify toml files

---

### COL-H24 · YUNG's Nether Fortresses + Incendium — fortress gaps in Incendium biomes
- **Config:** `Disable Vanilla Nether Fortresses=true`; no paxi override for YUNG spacing (default=80)
- **Fix:** Create paxi override reducing YUNG's fortress spacing to ~50

---

### COL-H25 · DimStructRestrict missing protections for Mining Dimension, Aether, Undergarden, Bumblezone
- **Fix:** Add dimension entries to `dimstructrestrict.json` for each unprotected dimension

---

### COL-H26 · Animation Overhaul + BetterCombat + CombatRoll — competing animation controllers
- **Config:** `animation_overhaul/animations.json5: rolling=true, sword_swing=true`; two different animation libraries both active
- **Fix:** Set `rolling: false` and `sword_swing/sword_swing_sneak: false` in animations.json5

---

### COL-H27 · Overworld structure density — 9 structure sets (spacing 35–55) with no cross-exclusion zones
- **Fix:** Raise castle/tower/ruin spacings to 60+ or add exclusion zones in paxi overrides

---

### COL-H28 · EuphoriaPatcher loaded but Sildur's shader configured — patcher non-functional
- **Fix:** Ship Complementary Reimagined/Unbound as default shaderpack, OR remove EuphoriaPatcher

---

### COL-H29 · TerraBlender `nether_region_size=2` fragments Incendium and Gardens of the Dead biomes
- **Fix:** Set `nether_region_size=4`; reduce `vanilla_nether_region_weight` to 4–6

---

### COL-H38 · Ageing Spawners empty blacklist — ALL dungeon spawners permanently die at 20 spawns
- **Config:** `BLACKLIST mode, blacklist=[""], playerPlacedOnly=false`
- **Fix:** Set `playerPlacedOnly = true` OR populate blacklist with dungeon mod IDs

---

### COL-H39 · Anti Mob Farm `ONLY_AFFECT_MOBS_KILLED_BY_PLAYER=true` — Drygmy farms fully exempt
- **Fix:** Set `ONLY_AFFECT_MOBS_KILLED_BY_PLAYER=false` OR significantly expand the Drygmy blacklist

---

### COL-H40 · InControl 3 hostile/chunk cap throttling L2Hostility adaptive leveling
- **Config:** `incontrol/spawn.json: maxcount 3 hostile per chunk (non-spawner, non-structure)`
- **Fix:** Raise per-chunk hostile cap or reduce L2Hostility `killsPerLevel`

---

## 🟡 MEDIUM COLLISIONS (17)

| ID | Conflict | Fix |
|---|---|---|
| COL-M7 | CombatRoll hunger + BetterParagliders stamina — dual-resource combat drain | Document or unify resource systems |
| COL-M8 | ExhaustionOptions globalMultiplier=1.5 inflates roll exhaustion 50% | Verify intended interaction |
| COL-M9 | ShieldingHealth + ShieldMechanics + ShieldOverhaul — triple passive mitigation stack | Test combined values in-game |
| COL-M10 | BetterCombat 2× hit range inflates EnhancedAI mob shield block proc rate | Reduce shield block chances in enhancedai config |
| COL-M16 | LootJS random loot cap (size=9) splices out endremloot.js targeted eye placements | Raise lootsize from 9 to 12–14 |
| COL-M17 | EMI Loot shows pre-LootJS tables — players see incorrect loot sources | Disable EMI loot parsing or add quest note |
| COL-M18 | Apotheosis affixes roll on mob-worn Artifacts items | Add Artifacts to `apotheosis:no_affix` tag |
| COL-M20 | Ars Nouveau removed recipes (ritual_disintegration etc.) may have no replacement | Verify quest/loot unlock exists for each |
| COL-M30 | Aether Redux Auto-Reset=true prevents stable Aether biome layout | Set Auto-Reset and First Startup flags to false |
| COL-M31 | Tectonic vertical_scale breaks Valhelsia flatness_delta=4 checks | Increase flatness_delta to 6–8 |
| COL-M32 | Nullscape + YUNG End Island — terrain boundary conflict in some seeds | Monitor; may need paxi override |
| COL-M33 | Sparse Structures spreadFactor=1.2 penalizing all dungeon mods | Set to 1.0; apply targeted factors only |
| COL-M41 | Second Chance activation HP (13.5) exceeds new player HP (10) — no early protection | Lower secondChanceActivationHealth to 8–10 HP |
| COL-M42 | WallJump uses hunger; ParCool/Paraglider use stamina — split movement resources | Document or use WallJump stamina compat mode |
| COL-M43 | Cartographer trade overflow — KubeJS 24+ trades + DVT randomization | Reduce KubeJS cartographer trade count |
| COL-M44 | Curios extra;size=0 silently blocks Artifacts/Relics items from equipping | Set extra and quiver slots to positive size |
| COL-M19 | Anti Mob Farm bypassed by Drygmy (covered in H39) | See H39 |

---

## 🟢 LOW COLLISIONS (10)

| ID | Conflict |
|---|---|
| COL-L11 | RoughTweaks HP regen off but ShieldingHealth absorption regen on — undocumented asymmetry |
| COL-L12 | ArmorDamageLimit vs Iron's RPG Tweaks durability module — latent conflict if re-enabled |
| COL-L13 | BetterBurning fire spread chains L2Hostility Fiery trait ignitions |
| COL-L21 | ars_elemental arc_projectile missing from burst.toml invalid_combos |
| COL-L34 | Dungeons Enhanced stables !#forge:is_plains inverts biome filter |
| COL-L35 | Dungeons Enhanced druid_circle frequency=0 — never generates |
| COL-L36 | Valhelsia deep_spawner_rooms empty structure list spacing=4 |
| COL-L45 | red_exp redundant with XP Tome and Tombstone Scrolls |
| ~~COL-L46~~ | ~~5+ simultaneous HUD mods — screen clutter~~ | ✅ Done — FancyHotbar XP number disabled; AppleSkin health overlay disabled; OverflowingBars owns XP+health rendering |
| COL-L47 | Bountiful + FTB Quests overlapping reward objectives |

---

## Collision Summary Table

| ID | Mods | System | Severity |
|---|---|---|---|
| ~~COL-C1~~ | ~~BetterCombat~~ | ~~Dual sweep damage per swing~~ | ✅ Done |
| ~~COL-C2~~ | ~~ShieldMechanics × ShieldOverhaul~~ | ~~Undefined combined shield system~~ | ✅ Dismissed — complementary mods (numbers vs mechanics) |
| ~~COL-C3~~ | ~~KubeJS × Iron's RPG Tweaks~~ | ~~naturalRegeneration=false kills regen attributes~~ | ✅ Dismissed — gamerule only stops passive tick regen; food/item/attribute regen unaffected; AttributeFix entries are disabled |
| ~~COL-C22~~ | ~~YUNG Strongholds × D&T Stronghold Rework~~ | ~~minecraft:strongholds registry collision~~ | ✅ Dismissed — YUNG's Strongholds not in pack; orphaned files removed |
| ~~COL-C23~~ | ~~ATI × DungeonCrawl × YUNG × DE~~ | ~~Underground physical overlaps~~ | ✅ Complete — intentional design, no changes needed |
| ~~COL-C37~~ | ~~Tombstone × LevelHearts × PassiveSkillTree~~ | ~~Triple compounding death penalty~~ | ✅ Complete — intentional difficulty design, no changes needed |
| COL-H4 | CombatRoll × Iron's RPG Tweaks | Roll i-frames stripped | 🟠 High |
| COL-H5 | LevelHearts × Paraglider × Aether | Max health ceiling unenforced | 🟠 High |
| COL-H6 | LevelHearts × SecondChance | Hardcore reset vs death prevention event order | 🟠 High |
| ~~COL-H14~~ | ~~JEI × EMI~~ | ~~Both active — keybind conflict + duplicate categories~~ | ✅ Done |
| COL-H15 | TooManyGlyphs × Ars Nouveau | 16 amplify augments per spell | 🟠 High |
| COL-H24 | YUNG Fortresses × Incendium | Fortress gaps in Nether | 🟠 High |
| COL-H25 | DimStructRestrict | 4 dimensions unprotected | 🟠 High |
| COL-H26 | Animation Overhaul × BetterCombat × CombatRoll | Competing animation controllers | 🟠 High |
| COL-H27 | 6 structure mods | Overworld density — no cross-exclusion | 🟠 High |
| COL-H28 | EuphoriaPatcher × Oculus | Wrong shaderpack — patcher inactive | 🟠 High |
| COL-H29 | TerraBlender × Incendium × GotD | Nether biomes fragmented | 🟠 High |
| COL-H38 | Ageing Spawners × dungeon mods | All spawners die at 20 spawns | 🟠 High |
| COL-H39 | Anti Mob Farm × Drygmy | Anti-farming bypass | 🟠 High |
| COL-H40 | InControl × L2Hostility | Spawn cap throttles adaptive difficulty | 🟠 High |
| COL-M7–M44 | Various | (17 medium collisions — see table above) | 🟡 Medium |
| COL-L11–L47 | Various | (10 low collisions — see table above) | 🟢 Low |

---
**Collision Grand Total: 47 issues** (6 Critical, 14 High, 17 Medium, 10 Low)
**Combined all-review Grand Total: 142 issues** (17 Critical, 31 High, 46 Medium, 48 Low/Design)
