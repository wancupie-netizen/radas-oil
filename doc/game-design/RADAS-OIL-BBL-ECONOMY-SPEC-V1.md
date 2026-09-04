# RADAS Oil — BBL Economy Specification V1

**Status:** DRAFT FOR REVIEW  
**Purpose:** Define what BBL means in RADAS Oil, how it is produced, stored, used, sold, and how it should relate to RDO before Patch 029 — Player Economy & Account Unification.  
**Source-of-truth scope:** BBL production flow, storage, claim behavior, economic role, conversion boundaries, and anti-abuse principles.  
**Not locked yet:** Exact BBL→RDO rate, oil selling price, storage fees, operating cost, repair cost, upgrade cost, paid Well price, and real-money/token conversion.

---

## 1. Core Definition

**BBL = Barrel of Oil produced by a Well.**

BBL is the primary in-game production resource.

A Well does **not** directly mint RDO every time a production cycle completes.

The intended gameplay flow is:

> Well → Produce BBL → Store BBL → Player decides what to do with BBL → Economic action → RDO / progression / future utility

This separation is important because it gives RADAS Oil a real resource-management layer instead of turning every Well into a simple RDO faucet.

---

## 2. Why BBL Must Exist Separately From RDO

If every completed Well cycle directly gives RDO:

- RDO inflation becomes difficult to control,
- multi-wallet abuse becomes more attractive,
- Well output becomes equivalent to token emission,
- oil type and production differences become mostly cosmetic,
- future oil-market gameplay becomes harder to add,
- balancing paid vs free Well becomes more dangerous.

By keeping BBL separate:

- production can grow without immediately increasing token supply,
- the game can control when value enters the RDO economy,
- oil can have multiple uses,
- player decisions become more meaningful.

---

## 3. Official Resource Roles

### BBL

**Role:** Produced resource / inventory commodity.

BBL should be used for:

- selling oil,
- future contracts,
- production targets,
- progression requirements,
- event missions,
- refinery or processing systems if introduced later.

BBL is **not** an on-chain token.

---

### RDO

**Role:** Game economy / utility currency.

RDO should be used for:

- buying tradable Well assets,
- Marketplace transactions,
- upgrades,
- repairs,
- selected operating expenses,
- future premium economy actions.

RDO should not be emitted automatically from every production cycle without an economic conversion event.

---

## 4. Production Flow

Each Well has:

- cycle time,
- BBL output,
- durability,
- level,
- tier,
- status.

A completed cycle produces the configured BBL amount.

Example:

**Strait Well Lv.1**

- Cycle: 3 hours
- Output: 5 BBL
- Completed cycle result: +5 BBL

The production cycle itself does not directly add RDO.

---

## 5. Claim Behavior

Recommended flow:

1. Player starts production.
2. Production timer runs.
3. Cycle completes.
4. Well status becomes **Ready**.
5. Player presses **Claim BBL**.
6. BBL moves into player storage.
7. Durability decreases according to the locked Well specification.

### Locked Well Durability Rule

Durability decreases by **1 point per completed production cycle**.

Reference:
`doc/game-design/RADAS-OIL-WELL-TIER-SPEC-V1`

---

## 6. Oil Storage

BBL should be stored in a player-owned inventory or oil storage account.

Recommended logical field:

`oilInventoryBbl`

or equivalent authoritative backend field in future architecture.

### Storage Rules

- BBL persists across refresh and devices.
- BBL must not depend only on local React state.
- Storage must eventually become backend authoritative.
- BBL must never become negative.
- Claim operations must be replay-safe.
- A completed production cycle may only be claimed once.

---

## 7. Starter Well and BBL

Starter Well remains a free trial asset.

Official Starter Well specification:

- Cycle: 12 hours
- Output Lv.1: 1 BBL
- Max Level: 2
- Non-tradable
- Very low production

### Anti-Abuse Principle

The Starter Well should teach the production loop but must not become an efficient farming tool.

Therefore:

> Free Starter production must have very low economic extractability.

The game should not rely solely on “one wallet = one free Well” as the anti-abuse mechanism.

---

## 8. Selling BBL

Recommended V1 concept:

Players may eventually sell stored BBL through an in-game oil market or system buyer.

Flow:

> Stored BBL → Sell Oil → Receive RDO

This creates a controlled bridge between production and RDO.

The exact conversion mechanism is **not locked yet**.

Possible future models:

### Model A — Fixed Rate

Example only:

`1 BBL = X RDO`

Advantages:
- simple,
- easy to understand.

Risk:
- predictable farming,
- easier inflation exploitation.

### Model B — Dynamic Oil Price

Example:

`Oil Price = X RDO / BBL`

Price may move within controlled limits.

Advantages:
- stronger game identity,
- creates timing decisions,
- supports market events.

Risk:
- more complex balancing.

### Model C — Contract-Based

Players complete oil supply contracts.

Example:

`Deliver 50 BBL → receive fixed RDO reward`

Advantages:
- strong anti-farming controls,
- allows limited emissions,
- gives missions purpose.

Risk:
- less open-ended than a free oil market.

---

## 9. Recommended Direction

For RADAS Oil V1, the preferred direction is:

> **BBL production remains unlimited by token emission, while RDO entry is controlled through economic actions.**

Recommended initial priority:

1. Produce BBL
2. Store BBL
3. Sell / use BBL through a controlled game mechanism
4. Receive RDO only when a valid economic transaction occurs

This is safer than direct automatic RDO production.

---

## 10. Oil Type

Each Well tier has an oil identity:

| Well | Oil Type |
|---|---|
| Starter | Light Crude |
| Strait | Light Sweet Crude |
| Andaman | Medium Sweet Crude |
| Natuna | Light Crude + Condensate |
| Celebes | Low-Sulfur Crude |
| Pacific | Deepwater Premium Crude |

### V1 Rule

For the first implementation, oil type may remain **informational**.

Do not create multiple oil inventories or quality multipliers until the economy requires them.

Future versions may use oil quality for:

- price premiums,
- contracts,
- refinery yield,
- special events,
- regional demand.

---

## 11. Production Output Reference

From the locked Well specification:

| Well | Lv.1 | Lv.2 | Lv.3 | Lv.4 | Lv.5 |
|---|---:|---:|---:|---:|---:|
| Starter | 1 | 2 | — | — | — |
| Strait | 5 | 6 | 8 | 10 | 13 |
| Andaman | 14 | 17 | 21 | 26 | 32 |
| Natuna | 28 | 34 | 41 | 49 | 58 |
| Celebes | 50 | 59 | 69 | 80 | 92 |
| Pacific | 100 | 115 | 132 | 150 | 170 |

These numbers represent **BBL per completed production cycle**.

---

## 12. BBL Is Not RDO

This distinction must remain explicit in future code and UI.

### Wrong Mental Model

`Well output = RDO income`

### Correct Mental Model

`Well output = BBL production`

Then:

`BBL → economic action → RDO or other utility`

This rule should guide Patch 029 architecture.

---

## 13. RDO Emission Control

RDO should have controlled entry points.

Potential approved sources:

- selling BBL through a controlled mechanism,
- Marketplace seller proceeds,
- verified reward systems,
- limited quests or events,
- future contracts.

RDO should not be created simply because:

- a timer completed,
- a user created a wallet,
- a free Starter Well exists.

---

## 14. Economy Sink Requirement

Any future BBL→RDO model must be designed together with RDO sinks.

Potential RDO sinks:

- Well repair,
- Well upgrade,
- Well mint / acquisition,
- Marketplace purchase,
- operating cost,
- storage expansion,
- future contract entry,
- premium game systems.

The economy must not be designed around emissions alone.

---

## 15. Marketplace Relationship

The Marketplace trades **Well assets**, not raw BBL in V1.

Marketplace flow:

> Seller lists Well → Buyer pays RDO → ownership transfers → seller receives proceeds → treasury receives fee

BBL stored by a player does not automatically transfer with a sold Well unless explicitly defined in a future specification.

Recommended rule:

> Stored BBL belongs to the player account, not to the Well asset.

---

## 16. Treasury Relationship

Marketplace Treasury is separate from BBL production.

Current marketplace fee remains:

**5%**

BBL selling may later have its own fee, tax, or spread, but this is not locked here.

---

## 17. Anti-Abuse Principles

Future BBL systems should enforce:

- one production completion → one claim,
- server-side production timestamps,
- no client-controlled BBL minting,
- no negative storage,
- claim replay protection,
- authoritative Well ownership,
- authoritative Well durability,
- backend validation before BBL is credited.

Multi-wallet prevention should rely on **economic design + authoritative state**, not wallet uniqueness alone.

---

## 18. What Patch 029 Must Not Assume

Patch 029 must **not** assume:

- every BBL automatically converts to RDO,
- BBL and RDO are the same balance,
- oil type requires separate token balances,
- Starter Well should generate meaningful token income,
- all production needs blockchain settlement.

Patch 029 should first unify authoritative player state without forcing premature economy mechanics.

---

## 19. Items Still Requiring Design Approval

Before this specification becomes LOCKED, the following decisions are still required:

1. Is BBL manually claimed or automatically stored?
2. Does storage have a capacity limit?
3. How does a player sell BBL?
4. Fixed oil price, dynamic oil price, or contract system?
5. What controls RDO emissions?
6. Does oil quality affect value in V1 or remain informational?
7. Are there operating costs per production cycle?
8. Does a Well stop at zero durability before production can restart?
9. What happens to unclaimed production if the player does not return?
10. Should BBL ever be tradable player-to-player?

---

## 20. Recommended V1 Decision Direction

For simplicity and economic safety:

- Manual **Claim BBL**
- One cycle at a time
- BBL stored in authoritative player inventory
- Oil type informational initially
- No direct automatic BBL→RDO conversion
- Starter Well remains very low output
- Well Marketplace remains separate from oil inventory
- BBL selling mechanism designed before Patch 029 economy implementation
- RDO emissions controlled by server-authorized economic actions

---

## 21. Document Status

**RADAS Oil BBL Economy Specification V1 — DRAFT FOR REVIEW**

This file should become **LOCKED** only after the unresolved economy decisions in Section 19 are reviewed and approved.

Related source-of-truth:

`doc/game-design/RADAS-OIL-WELL-TIER-SPEC-V1`
