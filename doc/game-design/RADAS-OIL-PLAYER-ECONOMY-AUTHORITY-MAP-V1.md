# RADAS Oil — Player Economy Authority Map V1

**Status:** LOCKED  
**Purpose:** Define the authoritative source of truth for player identity, Well assets, RDO, BBL, storage, production, operating cost, repair, upgrades, Marketplace settlement, and blockchain settlement before Patch 029 — Player Economy & Account Unification.  
**Scope:** Authority boundaries between Client/UI, Supabase backend, and Solana.  
**Related source-of-truth documents:**
- `doc/game-design/RADAS-OIL-WELL-TIER-SPEC-V1`
- `doc/game-design/RADAS-OIL-BBL-ECONOMY-SPEC-V1.md`

---

## 1. Core Authority Principle

> **Client may request actions, but client must never decide economic results.**

The client is responsible for:

- rendering UI,
- displaying authoritative state,
- sending user action requests,
- showing pending / success / error status.

The client must not be authoritative for:

- RDO balance,
- BBL balance,
- Well ownership,
- Well durability,
- Well level,
- production completion,
- OPEX,
- repair cost,
- upgrade result,
- BBL sale result,
- Contract Board settlement,
- Marketplace settlement.

---

## 2. Platform Roles

### Client / UI

Role:

- display state,
- accept player input,
- request actions,
- show timers and derived presentation state,
- refresh authoritative data.

The client must never mint, credit, debit, or finalize economic values by itself.

---

### Supabase Backend

Role:

**Primary authority for all gameplay economy.**

Supabase is responsible for:

- player identity,
- in-game RDO balance,
- BBL inventory,
- oil quality buckets,
- storage capacity,
- Well ownership,
- Well tier,
- Well level,
- Well durability,
- production timestamps,
- pending production,
- OPEX debits,
- repairs,
- upgrades,
- BBL sales,
- Contract Board settlements,
- Marketplace settlement,
- economy ledgers,
- concurrency protection,
- replay protection.

---

### Solana

Role:

**External settlement / claim layer.**

Solana is not the gameplay engine.

Solana may be used for:

- wallet connection,
- RDO blockchain claim / withdrawal,
- future token settlement,
- future asset tokenization if explicitly approved.

Production, BBL inventory, repair, upgrades, storage, and normal gameplay must remain backend-authoritative.

---

## 3. Official Authority Matrix

| Domain | Authoritative Source | Client Role | Solana Role |
|---|---|---|---|
| Player identity | Supabase `auth.uid()` | Session/display | Optional linked wallet |
| In-game RDO balance | Supabase backend | Display only | Claim/withdraw settlement |
| BBL inventory | Supabase backend | Display only | None |
| BBL quality buckets | Supabase backend | Display only | None |
| Storage capacity | Supabase backend | Display only | None |
| Well ownership | Supabase backend | Display only | Future optional |
| Well tier | Supabase asset record | Display only | None |
| Well level | Supabase backend | Display only | None |
| Well durability | Supabase backend | Display only | None |
| Production state | Supabase backend | Timer display | None |
| Production timestamps | Supabase backend | Derived display | None |
| Pending BBL | Supabase backend | Display only | None |
| OPEX debit | Backend transaction / RPC | Request + display | None |
| Repair | Backend transaction / RPC | Request + display | None |
| Upgrade | Backend transaction / RPC | Request + display | None |
| Storage upgrade | Backend transaction / RPC | Request + display | None |
| BBL sale | Backend transaction / RPC | Request + display | None |
| Contract settlement | Backend transaction / RPC | Request + display | None |
| Marketplace listing | Backend authoritative | Sync/display | None |
| Marketplace buy | Backend atomic transaction | Request + display | None |
| Marketplace seller proceeds | Backend account settlement | Display only | None |
| Marketplace treasury fee | Backend treasury ledger | Display aggregate only | None |
| RDO blockchain claim | Backend-verified claim state | Request/status | Final settlement |

---

## 4. Player Identity — LOCKED

The authoritative player identity is:

`Supabase auth.uid()`

### Rules

- Client-generated player IDs must not be used as economic authority.
- `LOCAL_PLAYER_ID` may remain only as a UI/local compatibility marker where legacy code still requires it.
- Economic ownership and settlement must use authenticated backend identity.
- Wallet address is not the primary gameplay account identity in V1.
- A wallet may be linked to an authenticated account for blockchain settlement.

---

## 5. RDO Authority — LOCKED

`radas_player_accounts` should be the authoritative source for in-game RDO balance.

All gameplay RDO credits and debits must ultimately affect the authoritative backend account.

Examples:

### Credits

- BBL sale
- Contract Board payout
- Marketplace seller proceeds
- approved reward systems

### Debits

- OPEX
- repair
- Well upgrade
- storage upgrade
- Well acquisition
- Marketplace purchase
- future premium systems

### Rule

`game_saves.save_data` must not remain the long-term source of truth for RDO balance after migration is complete.

The UI may cache or mirror balance for display, but backend state wins on reconciliation.

---

## 6. BBL Authority — LOCKED

BBL is authoritative in the backend.

BBL must not exist only as local React state or client-computed inventory.

### Requirements

- persistent across devices,
- persistent across refresh,
- non-negative,
- server-authorized claims,
- replay-safe,
- stored by oil quality bucket,
- total storage constrained by authoritative capacity.

---

## 7. BBL Quality Buckets — LOCKED

Because oil quality has different economic value, inventory must preserve quality identity.

Required logical buckets:

- Starter / Light Crude
- Strait / Light Sweet Crude
- Andaman / Medium Sweet Crude
- Natuna / Light Crude + Condensate
- Celebes / Low-Sulfur Crude
- Pacific / Deepwater Premium Crude

The implementation may normalize these into quality codes rather than literal display strings.

### Rule

The total player storage used is:

`sum(all quality bucket balances)`

---

## 8. Storage Capacity — LOCKED

Storage capacity is backend-authoritative.

Official capacities:

- 100 BBL
- 250 BBL
- 500 BBL
- 1,000 BBL
- 2,500 BBL

### Backend must enforce

- hard capacity,
- no overflow,
- no partial claim,
- atomic validation before BBL is credited,
- authoritative storage upgrade level.

The client must not decide whether a claim fits.

---

## 9. Well Asset Authority — LOCKED

`radas_well_assets` should evolve into the authoritative Well asset record.

A Well should eventually have backend-authoritative fields equivalent to:

- asset ID
- owner user ID
- tier
- level
- durability
- max durability
- status
- production state
- production start timestamp
- pending completed cycles
- pending BBL
- oil quality
- tradability
- created timestamp
- updated timestamp

Exact schema naming may differ, but these authority responsibilities must remain.

---

## 10. Production Authority — LOCKED

Production must not rely on browser timers as economic truth.

Backend must determine production from authoritative timestamps and Well state.

### Client may display

- countdown timer,
- ready state,
- estimated completion time.

### Backend decides

- whether production started,
- OPEX successfully paid,
- how many cycles completed,
- whether 3-cycle cap is reached,
- durability consumed,
- pending BBL,
- whether production paused.

### Official Principle

> **Browser time is presentation. Backend time is authority.**

---

## 11. Production Start — LOCKED

Client request:

`Start Production`

Backend must validate:

- authenticated player owns the Well,
- Well is operational,
- durability > 0,
- pending cycle cap is not blocking production,
- storage/claim state does not violate rules where applicable,
- player has enough RDO for OPEX,
- Well is not already actively producing.

Backend then:

1. calculates OPEX,
2. debits RDO atomically,
3. records economy ledger entry,
4. records production start timestamp,
5. returns authoritative state.

Client must not send the amount of BBL it expects to receive.

---

## 12. BBL Claim — LOCKED

Client request:

`Claim Well <asset_id>`

Backend must calculate:

- completed cycles,
- maximum 3-cycle cap,
- pending BBL,
- oil quality,
- storage requirement,
- durability effects already due from completed cycles,
- claim replay state.

Backend must atomically:

1. validate ownership,
2. validate pending production,
3. validate storage capacity,
4. credit correct quality bucket,
5. clear claimed pending BBL/cycles,
6. update Well production state,
7. return authoritative balances.

---

## 13. OPEX Authority — LOCKED

OPEX is a backend-authoritative RDO debit.

Client must never calculate and directly subtract OPEX from local balance.

Backend must calculate:

`Base Tier OPEX × Level Multiplier × Tier Efficiency Modifier`

Celebes receives the locked 10% operating efficiency benefit.

OPEX is a dedicated economy sink and not Marketplace Treasury revenue.

---

## 14. Durability Authority — LOCKED

Durability must be backend-authoritative.

Rules:

- decreases by 1 per completed cycle,
- cannot become negative,
- warning threshold at ≤20%,
- at 0 → `Maintenance Required`,
- no new cycle may start at 0,
- cycle that reaches 0 still produces valid pending BBL.

Client may display durability but must not mutate authoritative durability locally.

---

## 15. Repair Authority — LOCKED

Repair must be a backend transaction.

Client request:

`Repair Well`

Backend must validate:

- ownership,
- Well state,
- current durability,
- repair cost,
- RDO balance,
- replay / duplicate action protection.

Backend must atomically:

1. debit RDO,
2. restore approved durability amount,
3. write economy ledger,
4. return updated Well and balance.

Repair cost itself is defined in a separate economy configuration and is not numerically locked in this document.

---

## 16. Upgrade Authority — LOCKED

Upgrade must be backend-authoritative.

Backend must validate:

- ownership,
- current level,
- max level,
- upgrade eligibility,
- upgrade cost,
- RDO balance,
- any future progression requirements.

Backend updates:

- Well level,
- derived output,
- derived OPEX level multiplier,
- any future tier-specific benefits.

Client must not directly modify level, output, or costs.

---

## 17. Dynamic Oil Market Authority — LOCKED

The backend is authoritative for Daily Oil Market pricing.

Pricing inputs include:

- base RDO oil price,
- Brent Crude reference movement,
- internal RADAS supply / demand,
- floor,
- ceiling,
- daily movement cap,
- RDO emission budget utilization.

The client only displays the published authoritative daily market state.

The client must not calculate the final settlement price independently.

---

## 18. BBL Sale Authority — LOCKED

Client request:

- quality bucket,
- requested BBL quantity.

Backend determines:

- authoritative bucket balance,
- player daily cap,
- current Daily Oil Market price,
- quality multiplier,
- global emission budget state,
- final payout,
- settlement eligibility.

Settlement must atomically:

1. debit BBL,
2. credit RDO,
3. record BBL sale,
4. record new RDO emission,
5. update emission budget counters,
6. write economy ledger.

---

## 19. Contract Board Authority — LOCKED

Contract generation, availability, eligibility, and settlement are backend-authoritative.

Backend determines:

- contract ID,
- expiry,
- BBL requirement,
- quality requirement,
- player quota,
- global quota,
- payout,
- completion state.

Contract settlement must be atomic and replay-safe.

---

## 20. Marketplace Authority — LOCKED

Patch 028 Marketplace architecture remains authoritative.

Marketplace backend controls:

- listing creation,
- cancellation,
- purchase,
- Well ownership transfer,
- buyer debit,
- seller proceeds,
- treasury fee,
- settlement records,
- concurrency protection.

### Marketplace Transaction Classification

Marketplace transactions are:

**RDO transfers**

not new RDO emissions.

Marketplace fee remains:

**5%**

---

## 21. Economy Ledger — LOCKED REQUIREMENT

All important economy movements should be auditable.

Recommended economy ledger entry types include:

### Credits

- `bbl_sale_credit`
- `contract_credit`
- `reward_credit`
- `marketplace_sale_credit`

### Debits / Sinks

- `opex_debit`
- `repair_debit`
- `upgrade_debit`
- `storage_upgrade_debit`
- `well_acquisition_debit`
- `marketplace_purchase_debit`

### System / Accounting

- `marketplace_fee`
- `rdo_claim_debit`
- `migration_adjustment`
- `reconciliation_adjustment`

Exact table implementation may differ, but auditability is mandatory.

---

## 22. Ledger Design Principle

A player should eventually be able to understand:

- why RDO increased,
- why RDO decreased,
- when BBL was sold,
- what Well caused OPEX,
- what repair cost was paid,
- what Marketplace transaction occurred.

Admin should be able to reconcile economy discrepancies from backend records.

---

## 23. `game_saves` Role — TRANSITIONAL

`game_saves` may continue temporarily for:

- legacy compatibility,
- UI preferences,
- non-economic local state,
- migration bootstrap during Patch 029.

It must not remain the permanent source of truth for:

- RDO,
- BBL,
- storage,
- Well ownership,
- Well durability,
- production settlement,
- Marketplace economy.

### Migration Rule

When normalized authoritative state exists, backend normalized records win over stale `game_saves` economic values.

---

## 24. Blockchain Boundary — LOCKED

Gameplay economy remains off-chain.

Solana is used only where blockchain settlement is actually required.

### Appropriate On-Chain Responsibilities

- wallet proof / connection,
- RDO claim / withdrawal,
- blockchain transfer verification,
- future explicitly approved tokenized asset features.

### Keep Off-Chain

- Well production,
- BBL,
- quality buckets,
- storage,
- OPEX,
- repair,
- upgrade,
- Dynamic Oil Market,
- Contract Board,
- normal Marketplace database state.

---

## 25. RDO Claim Boundary — LOCKED

RDO blockchain claim must not create a second uncontrolled balance.

Conceptual flow:

> Authoritative Game RDO → Claim Request → Backend Validation / Reservation → Solana Settlement → Signature Verification → Backend Finalization

Requirements:

- no double claim,
- replay protection,
- in-flight protection,
- wallet verification,
- authoritative claim amount,
- backend claim status,
- failure recovery.

The existing Reward Claim security work must be preserved unless intentionally superseded by a later locked specification.

---

## 26. Atomic Transaction Principle — LOCKED

Any action that changes more than one economic object must be atomic where practical.

Examples:

### BBL Sale

`BBL debit + RDO credit + emission accounting + ledger`

### Repair

`RDO debit + durability restore + ledger`

### Upgrade

`RDO debit + Well level change + ledger`

### Marketplace Buy

`buyer debit + seller credit + Well transfer + settlement + treasury fee`

Partial economic state must not be committed.

---

## 27. Replay and Concurrency Protection — LOCKED

Backend economy actions must support:

- idempotency where appropriate,
- duplicate request protection,
- transaction locks,
- row locks / advisory locks where needed,
- no double claim,
- no double debit,
- no double credit,
- deterministic replay behavior.

The security principles established in Patch 028G should be preserved for future economy RPCs.

---

## 28. Client Reconciliation Rule — LOCKED

If client state conflicts with backend state:

> **Backend wins.**

The client should:

1. fetch authoritative state,
2. replace stale economic UI state,
3. avoid re-crediting local optimistic values,
4. show reconciliation errors when needed.

Optimistic UI must never become economic authority.

---

## 29. Failure Behavior — LOCKED

If an economic action fails:

- no partial debit,
- no partial credit,
- no partial Well mutation,
- no lost pending BBL,
- no phantom Marketplace transfer,
- no client-only fallback that changes economy.

User receives an error and may retry safely where supported.

---

## 30. Recommended Authoritative Data Domains

The following logical backend domains should exist by the end of the Player Economy unification phase:

### Player Account

- user ID
- RDO balance
- storage level / capacity
- economy metadata

### BBL Inventory

- user ID
- quality code
- BBL amount

### Well Assets

- Well identity
- ownership
- tier
- level
- durability
- production state
- pending production

### Economy Ledger

- player
- entry type
- amount
- direction
- reference ID
- timestamp
- metadata

### Market / Emission State

- Daily Oil Market price
- Brent reference snapshot
- internal demand modifier
- global emission budget
- current usage

### Contract State

- contract definitions
- quotas
- eligibility
- settlements

Exact schema design is implementation-specific and must be based on the exact current production database before Patch 029 changes are written.

---

## 31. Source-of-Truth Hierarchy — LOCKED

When determining authoritative state, use this hierarchy:

### Gameplay Economy

1. **Supabase normalized authoritative tables / RPC transactions**
2. Client display cache
3. Legacy `game_saves` only during explicit migration compatibility

### Blockchain Settlement

1. Backend verified claim state
2. Confirmed Solana transaction evidence
3. Client wallet display

Client localStorage is never an authoritative economic source.

---

## 32. Patch 029 Architecture Goal

Patch 029 should move RADAS Oil toward:

> **One authoritative gameplay economy, one auditable transaction path, one clear blockchain boundary.**

The goal is not to rewrite everything unnecessarily.

Patch 029 should only normalize systems required by the locked Well and BBL economy specifications.

---

## 33. What Patch 029 Must Not Do

Patch 029 must not:

- rebuild Marketplace 028 without need,
- move ordinary gameplay on-chain,
- trust client-calculated rewards,
- create duplicate RDO balances,
- merge all BBL qualities into one value,
- remove existing security protections,
- redesign unrelated UI,
- add unnecessary economic systems outside locked specifications,
- treat GitHub history as the current local patch baseline.

All code changes remain subject to the locked RADAS Oil patch SOP.

---

## 34. Official Authority Summary

### Identity

**Supabase `auth.uid()`**

### Assets

**Supabase authoritative Well records**

### In-Game RDO

**`radas_player_accounts` / authoritative backend account**

### BBL

**Backend authoritative quality-bucket inventory**

### Storage

**Backend authoritative player capacity**

### Production

**Backend timestamps and Well state**

### Economy Actions

**Backend RPC / atomic transaction**

### Marketplace

**Patch 028 authoritative backend**

### Blockchain

**Solana external claim / settlement layer**

### UI

**Request + display + reconciliation**

---

## 35. Core Locked Principles

> **Client may request actions, but client must never decide economic results.**

> **Browser time is presentation. Backend time is authority.**

> **If client and backend disagree, backend wins.**

> **Supabase backend is the authority for gameplay economy. Solana is the external settlement / claim layer.**

---

## 36. Document Status

**RADAS Oil Player Economy Authority Map V1 — LOCKED**

This document is the architecture source-of-truth for Patch 029 planning until explicitly superseded by a newer locked specification.

Recommended next step:

**Patch 029 design breakdown — map the authority rules in this document into the smallest safe migration stages before touching production code.**
