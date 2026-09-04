# RADAS Oil — BBL Economy Specification V1

**Status:** LOCKED  
**Purpose:** Define what BBL means in RADAS Oil, how it is produced, accumulated, stored, sold, and how it relates to RDO before Patch 029 — Player Economy & Account Unification.  
**Source-of-truth scope:** BBL production flow, manual claim behavior, offline accumulation, storage, oil quality, Dynamic Oil Market, Contract Board, RDO emission controls, operating cost, durability interaction, and V1 anti-abuse rules.  
**Not locked here:** Exact BBL→RDO conversion rate, exact daily oil price values, exact player daily sell cap, exact global daily RDO emission budget, exact contract quota, exact repair cost, exact storage upgrade cost, exact paid Well price, and exact real-money/token conversion.

---

## 1. Core Definition

**BBL = Barrel of Oil produced by a Well.**

BBL is the primary in-game production resource.

A Well does **not** directly mint RDO every time a production cycle completes.

Official gameplay flow:

> Well → Produce BBL → Accumulate Pending BBL → Manual Claim → Player Storage → Sell / Contract → Receive RDO → Use RDO for operations and progression

This separation is fundamental to RADAS Oil V1.

---

## 2. BBL and RDO Are Separate Resources

### BBL

**Role:** Produced resource / inventory commodity.

BBL is:

- produced by Wells,
- accumulated during completed production cycles,
- claimed manually,
- stored by the player,
- sold through the Dynamic Oil Market,
- used for Contract Board requirements.

BBL is **not** an on-chain token.

### RDO

**Role:** Game economy / utility currency.

RDO is used for:

- Marketplace transactions,
- Well operating cost,
- Well repair,
- Well upgrades,
- storage upgrades,
- Well acquisition / minting where applicable,
- future premium game systems.

RDO is not automatically produced by a completed Well timer.

---

## 3. Production Cycle

Each Well has:

- tier,
- level,
- cycle time,
- BBL output,
- durability,
- operating cost,
- status.

When a production cycle completes:

1. the configured BBL amount becomes **pending BBL** on that Well,
2. durability decreases by 1 point,
3. the next production cycle may continue automatically if all required conditions are still valid,
4. pending BBL remains unclaimed until the player manually claims it.

---

## 4. Manual Claim Model — LOCKED

BBL claim is **manual**.

### Rules

- Player must press **Claim BBL**.
- Production continues while the player is offline.
- Completed cycles accumulate.
- Maximum accumulation is **3 completed cycles per Well**.
- After 3 completed cycles, production pauses.
- Claim collects all pending BBL from that Well in one action.
- Pending BBL does not expire.
- Pending BBL does not disappear if the player stays offline for a long time.
- Durability loss is based on completed cycles, not the number of claim actions.

### Example — Starter Well

- Cycle: 12 hours
- Output: 1 BBL / cycle

Results:

- 12 hours offline → 1 BBL pending
- 24 hours offline → 2 BBL pending
- 36 hours offline → 3 BBL pending
- 48 hours offline → still 3 BBL pending because the Well has reached the 3-cycle cap

After the player claims:

- 3 BBL moves to player storage,
- production may resume if all other conditions are satisfied.

---

## 5. Three-Cycle Accumulation Cap — LOCKED

Every Well may accumulate a maximum of:

**3 completed production cycles**

After the cap is reached:

- the Well pauses,
- pending BBL stays on the Well,
- no additional production is created,
- the player must claim before production can continue.

### Maximum Pending BBL at Lv.1

| Well | Cycle | Output / Cycle | Max Pending at 3 Cycles |
|---|---:|---:|---:|
| Starter | 12h | 1 BBL | 3 BBL |
| Strait | 3h | 5 BBL | 15 BBL |
| Andaman | 6h | 14 BBL | 42 BBL |
| Natuna | 8h | 28 BBL | 84 BBL |
| Celebes | 12h | 50 BBL | 150 BBL |
| Pacific | 24h | 100 BBL | 300 BBL |

---

## 6. Player Oil Storage — LOCKED

BBL is stored in a **shared player storage**, not separate storage per Well.

Recommended logical backend representation:

`oilInventoryBbl`

or a normalized equivalent that supports quality buckets.

### Storage Capacity

| Storage Level | Capacity |
|---|---:|
| Base Storage | 100 BBL |
| Upgrade 1 | 250 BBL |
| Upgrade 2 | 500 BBL |
| Upgrade 3 | 1,000 BBL |
| Upgrade 4 | 2,500 BBL |

### Storage Rules

- Default capacity: **100 BBL**
- Storage is upgradeable.
- Storage has a hard cap.
- No overflow is allowed.
- No partial claim is allowed.
- If the full pending claim cannot fit in available storage, the claim is rejected.
- Pending BBL stays on the Well.
- A Well at the 3-cycle cap remains paused until enough storage space is available and the player claims.
- Storage upgrade cost is not locked in this specification.

---

## 7. Oil Quality — LOCKED

Oil quality has real economic value in V1.

Each Well tier produces a different oil quality.

| Well | Oil Type | Quality Multiplier |
|---|---|---:|
| Starter | Light Crude | 1.00x |
| Strait | Light Sweet Crude | 1.05x |
| Andaman | Medium Sweet Crude | 1.10x |
| Natuna | Light Crude + Condensate | 1.15x |
| Celebes | Low-Sulfur Crude | 1.20x |
| Pacific | Deepwater Premium Crude | 1.30x |

### Sell Price Formula

`Effective Sell Price = Daily Market Price × Oil Quality Multiplier`

### Storage Quality Rule

BBL must be stored by **quality bucket / source quality**.

Do not merge all BBL into one undifferentiated total if that would remove the value difference between oil qualities.

### Contract Board

Contracts may:

- require a specific oil quality,
- offer a premium for certain oil types,
- target selected Well categories.

---

## 8. Dynamic Oil Market — LOCKED

RADAS Oil uses a **Dynamic Oil Market**.

The in-game oil price is not equal to the real-world oil price.

Real-world oil is used only as a **reference index**.

### Primary External Reference

**Brent Crude**

### Pricing Inputs

The game oil price is influenced by:

1. Base RDO oil price
2. Brent Crude daily movement
3. Internal RADAS Oil supply / demand
4. Controlled floor and ceiling
5. Daily movement cap

### Recommended Weighting

- Brent movement: **40%**
- Internal RADAS economy: **60%**

### Daily Price Safety

The game price should move within a controlled range.

Recommended daily movement cap:

**maximum ±5% per day**

The exact floor and ceiling values are not locked here.

### Public Explanation

> “Harga BBL RADAS Oil menggunakan pergerakan harga minyak dunia sebagai salah satu indeks rujukan, tetapi nilai dalam game ditentukan secara berasingan oleh sistem ekonomi RADAS Oil.”

---

## 9. Dynamic Oil Market + Contract Board — LOCKED

RADAS Oil V1 uses both:

**Dynamic Oil Market + Contract Board**

### Dynamic Oil Market

Purpose:

- baseline liquidity,
- always-available selling path,
- controlled daily oil price.

### Contract Board

Purpose:

- higher-value selling opportunities,
- retention,
- strategic decisions,
- limited premium demand.

Contracts may include:

- minimum BBL quantity,
- oil quality requirement,
- expiry,
- limited player quota,
- limited global availability,
- premium payout.

### Design Rule

Dynamic Oil Market is the default selling path.

Contract Board is an opportunity layer, not the only way to monetize BBL.

---

## 10. BBL Selling Flow — LOCKED

Official V1 flow:

> Produce BBL → Claim BBL → Store by Quality → Choose Dynamic Oil Market or Contract Board → Receive RDO

The exact BBL→RDO rate is dynamic and not permanently fixed.

---

## 11. RDO Emission Control — LOCKED

RDO emission must be controlled by multiple layers.

### Layer 1 — Server-Authorized Economic Actions

New RDO may only enter the economy through approved backend-authorized actions.

Examples:

- valid BBL sale,
- completed Contract Board settlement,
- approved reward / event systems.

A Well timer itself does not emit RDO.

### Layer 2 — Player Daily Cap

Each player has a daily limit on how much BBL may be converted into new RDO through normal market activity.

The exact player cap is not locked yet.

### Layer 3 — Contract Quota

Contract Board premium payouts are limited by:

- per-player limits,
- contract availability,
- contract expiry,
- global quota.

### Layer 4 — Global Daily Emission Budget

The game must maintain a maximum amount of **new RDO** that can enter the economy over a defined daily period.

The exact global budget is not locked yet.

### Near-Budget Behavior

The game should reduce payout gradually as the global budget becomes heavily utilized.

Recommended conceptual behavior:

- 0–70% used → normal payout
- 70–90% used → lower demand modifier
- 90–100% used → minimum market payout / fewer premium contracts
- budget reached → premium emission opportunities may pause until reset

The system should not unexpectedly break or erase player BBL.

---

## 12. New Emission vs Transfer — LOCKED

This distinction is mandatory.

### New Emission

Examples:

- system buys BBL and credits new RDO,
- system-funded reward,
- Contract Board system payout.

### Transfer

Example:

- Buyer pays 100 RDO for a Marketplace Well.
- RDO moves from buyer to seller and treasury.

Marketplace activity is **not** counted as 100 new RDO emission.

### Official Principle

> **RDO emission is controlled by economic throughput, not by the number of wallets or completed timers.**

> **Marketplace transfers existing RDO; only system-funded rewards and BBL settlements count as new emission.**

---

## 13. RDO Economy Sinks — LOCKED PRINCIPLE

RDO emission must operate together with RDO sinks.

Approved sink categories include:

- Well operating cost,
- Well repair,
- Well upgrade,
- storage expansion,
- Well mint / acquisition where applicable,
- Marketplace fee,
- future premium systems.

Economy health should be measured using both emission and sink activity.

Conceptually:

`Net RDO Expansion = New RDO Emitted - RDO Removed / Burned / Sunk`

---

## 14. Operating Cost per Production Cycle — LOCKED

Operating cost is paid in **RDO**.

Operating cost is charged **before each production cycle begins**.

### Base OPEX at Lv.1

| Well | Base OPEX / Cycle |
|---|---:|
| Starter | 0 RDO |
| Strait | 0.25 RDO |
| Andaman | 0.70 RDO |
| Natuna | 1.50 RDO |
| Celebes | 2.50 RDO |
| Pacific | 6.00 RDO |

Starter Well is free to operate because it is a tutorial / trial asset.

---

## 15. OPEX Level Multipliers — LOCKED

| Level | OPEX Multiplier |
|---|---:|
| Lv.1 | 1.00x |
| Lv.2 | 1.15x |
| Lv.3 | 1.30x |
| Lv.4 | 1.45x |
| Lv.5 | 1.60x |

Formula:

`Cycle OPEX = Base Tier OPEX × Level Multiplier`

Upgrade growth should remain economically beneficial.

Output growth must not be fully cancelled by operating cost growth.

---

## 16. Celebes Operating Efficiency — LOCKED

Celebes Well has a unique operating advantage:

**10% Operating Efficiency**

After calculating normal cycle OPEX:

`Celebes Final OPEX = Calculated OPEX × 0.90`

This perk reinforces the Celebes Well identity as:

**Efficiency / Durability**

---

## 17. OPEX and Offline Production — LOCKED

For paid Wells, each next cycle requires enough RDO to fund that cycle.

If the player cannot afford the next cycle:

- production pauses,
- already-produced BBL remains pending,
- no BBL is lost,
- the player may sell other stored BBL or acquire RDO before restarting.

---

## 18. Operating Cost Is Not Repair Cost — LOCKED

These are separate mechanics.

### Operating Cost

- paid for production operations,
- charged per cycle,
- recurring economic sink.

### Repair Cost

- restores Well durability,
- long-term maintenance sink,
- charged separately.

Operating cost must not be treated as Marketplace Treasury revenue.

OPEX should be recorded as a dedicated system economy sink.

---

## 19. Durability Zero Behavior — LOCKED

Durability decreases by:

**1 point per completed production cycle**

### When Durability Reaches 0

- the cycle that reduced durability to 0 is still valid,
- its BBL remains claimable,
- the Well enters **Maintenance Required**,
- no new production cycle may start,
- pending BBL is not lost,
- manual repair is required,
- no grace cycle exists,
- durability cannot become negative.

### Maintenance Warning

When durability reaches:

**20% or less**

the UI should show:

**Maintenance Soon**

---

## 20. Long Offline / Unclaimed Production — LOCKED

If a player does not return for a long period:

- production accumulates up to 3 completed cycles,
- production then pauses,
- pending BBL remains indefinitely,
- pending BBL does not expire,
- pending BBL is not deleted.

To resume production, the player must:

1. return to the game,
2. claim pending BBL,
3. have enough storage capacity,
4. have durability above 0,
5. have enough RDO to fund the next cycle if the Well has OPEX.

---

## 21. BBL Player-to-Player Trading — DISABLED IN V1

BBL cannot be transferred or traded between players in V1.

BBL may only be:

- stored,
- sold through the Dynamic Oil Market,
- used for Contract Board requirements.

### Marketplace Scope

The Marketplace remains focused on:

**Well assets**

not raw BBL.

### Future Option

A future **BBL Commodity Exchange** may be considered after the economy has real player data and sufficient anti-abuse controls.

---

## 22. Starter Well Anti-Abuse Role — LOCKED

Starter Well remains:

- free,
- non-tradable,
- low output,
- free to operate,
- limited to Level 2,
- designed for onboarding.

The system must not rely solely on:

`one wallet = one free Well`

for abuse prevention.

Starter economic value is deliberately low.

---

## 23. Marketplace Relationship — LOCKED

Marketplace trades **Well assets**.

Stored BBL belongs to the **player account**, not to the Well asset.

Selling a Well does not automatically transfer the seller's stored BBL to the buyer.

Marketplace fee remains:

**5%**

Marketplace Treasury remains separate from BBL production and operating sinks.

---

## 24. Backend Authority Requirements

Future production and BBL implementation should enforce:

- server-side production timestamps,
- authoritative Well ownership,
- authoritative Well durability,
- authoritative RDO balance,
- authoritative BBL storage,
- authoritative quality bucket balances,
- claim replay protection,
- one completed cycle → one production credit,
- no client-controlled BBL minting,
- no negative BBL balances,
- no negative RDO balance from OPEX,
- atomic sell / contract settlements where required.

---

## 25. What Patch 029 Must Respect

Patch 029 must not assume:

- BBL and RDO are the same balance,
- Well timers directly emit RDO,
- Starter Well is a meaningful RDO faucet,
- Marketplace transactions create new RDO,
- BBL can be freely transferred between players,
- all BBL has the same economic quality,
- all gameplay actions need blockchain settlement.

Patch 029 should unify authoritative player economy state around these locked game rules.

---

## 26. Locked Decisions Summary

### Claim
- Manual claim
- Offline accumulation
- Maximum 3 cycles
- Pending BBL does not expire

### Storage
- Shared player storage
- 100 / 250 / 500 / 1,000 / 2,500 BBL capacities
- No overflow
- No partial claim

### Oil Quality
- Economic quality multipliers
- Separate quality buckets

### Market
- Dynamic Oil Market
- Brent Crude reference
- 40% external reference / 60% internal economy weighting
- controlled floor / ceiling
- recommended ±5% daily movement cap

### Contracts
- Contract Board enabled
- premium and limited opportunities
- quantity / quality / expiry / quota rules

### Emissions
- server-authorized
- player daily cap
- contract quota
- global emission budget
- dynamic payout
- RDO sinks

### OPEX
- per-cycle RDO operating cost
- charged before cycle start
- level multiplier
- Celebes 10% efficiency
- Starter free operation

### Durability
- -1 per completed cycle
- Maintenance Soon at ≤20%
- hard stop at 0
- manual repair required

### Trading
- BBL player-to-player trading disabled in V1
- Well Marketplace remains separate

---

## 27. Items Intentionally Not Yet Numerically Locked

The design is locked, but these numbers remain open for economy simulation:

- exact base Daily Oil Market RDO price,
- exact minimum / maximum market price,
- exact player daily BBL sell cap,
- exact global daily RDO emission budget,
- exact Contract Board quota,
- exact Contract Board bonus ranges,
- repair cost,
- storage upgrade cost,
- Well upgrade cost,
- paid Well price,
- final BBL→RDO payout values,
- future real-money / token conversion policies.

These values must be determined through economy simulation before production implementation.

---

## 28. Source-of-Truth Rule

> This document is the authoritative RADAS Oil BBL Economy Specification V1 until explicitly superseded by a newer locked specification.

Any future patch that changes:

- BBL claim rules,
- accumulation cap,
- storage behavior,
- oil quality multipliers,
- selling model,
- Dynamic Oil Market logic,
- Contract Board role,
- RDO emission controls,
- OPEX rules,
- durability interaction,
- or BBL tradability

must explicitly state that it modifies this specification.

---

## 29. Related Source-of-Truth

Well tier specifications:

`doc/game-design/RADAS-OIL-WELL-TIER-SPEC-V1`

---

## 30. Document Status

**RADAS Oil BBL Economy Specification V1 — LOCKED**

Recommended next design topic before Patch 029:

**Player Economy Authority Map — define the authoritative ownership and balance model for RDO, BBL quality buckets, storage capacity, Well state, OPEX, repair, and Marketplace settlement.**
