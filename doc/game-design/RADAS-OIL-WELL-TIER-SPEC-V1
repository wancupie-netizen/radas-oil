# RADAS Oil — Well Tier Specification V1

**Status:** LOCKED  
**Purpose:** Source-of-truth specification for RADAS Oil Well tiers before Patch 029 and future economy work.  
**Scope:** Well identity, tier roles, cycle time, base output, durability, crew size, oil type, operation type, tradability, level cap, and icon direction.  
**Not locked here:** Well price, repair cost, upgrade cost, BBL-to-RDO conversion, operating cost, and monetization rules.

---

## 1. Design Principles

1. **Starter Well is a free trial asset, not a full economic asset.**
2. Paid Well tiers use **sea/location-based names** instead of generic names such as Standard or Industrial.
3. Every tier must have:
   - a unique identity,
   - a distinct playstyle,
   - a unique icon/logo,
   - operation information inspired by real oil-field operations,
   - crew size,
   - oil type,
   - different production characteristics.
4. Higher tiers must not be designed as simple linear power upgrades only.
5. Each tier should represent a different operator playstyle.
6. Marketplace trading applies to paid tiers; Starter Well is non-tradable.
7. The numbers below are gameplay specifications and do **not** claim to be exact real-world production statistics.

---

## 2. Official Well Tier Structure

| Tier | Well | Role | Cycle | Base Output (Lv.1) | Durability | Crew | Oil Type |
|---|---|---|---:|---:|---:|---:|---|
| T0 | Starter Well | Trial / Tutorial | 12h | 1 BBL | 40 | 4 | Light Crude |
| T1 | Strait Well | Active Player | 3h | 5 BBL | 60 | 10 | Light Sweet Crude |
| T2 | Andaman Well | Balanced | 6h | 14 BBL | 80 | 18 | Medium Sweet Crude |
| T3 | Natuna Well | High Output / Harvest | 8h | 28 BBL | 100 | 30 | Light Crude + Condensate |
| T4 | Celebes Well | Efficiency / Durability | 12h | 50 BBL | 140 | 45 | Low-Sulfur Crude |
| T5 | Pacific Well | Endgame / Prestige | 24h | 100 BBL | 200 | 75 | Deepwater Premium Crude |

---

## 3. Tier Specifications

### T0 — Starter Well

**Purpose:** Free trial and onboarding asset.

- Free: Yes
- Tradable: No
- Max Level: 2
- Cycle Time: 12 hours
- Base Output: 1 BBL
- Durability: 40
- Crew Size: 4
- Operation Type: Nearshore Training Site
- Oil Type: Light Crude
- Playstyle: Learn
- Economic Role: Minimal
- Main Purpose:
  - teach Start → Wait → Claim → Repair,
  - reduce pressure to pay before understanding the game,
  - reduce incentive for multi-wallet farming by keeping output very low.

**Design Rule:** Starter Well must never become the most efficient farming option through multi-wallet creation.

---

### T1 — Strait Well

**Purpose:** First paid-entry Well.

- Tradable: Yes
- Max Level: 5
- Cycle Time: 3 hours
- Base Output: 5 BBL
- Durability: 60
- Crew Size: 10
- Operation Type: Shallow-Water Offshore
- Oil Type: Light Sweet Crude
- Playstyle: Active
- Main Advantage: Fast production cycle
- Main Weakness: More frequent management and faster durability consumption

**Target Player:** Players who check the game several times per day.

---

### T2 — Andaman Well

**Purpose:** Balanced mainstream Well.

- Tradable: Yes
- Max Level: 5
- Cycle Time: 6 hours
- Base Output: 14 BBL
- Durability: 80
- Crew Size: 18
- Operation Type: Offshore Production Platform
- Oil Type: Medium Sweet Crude
- Playstyle: Balanced
- Main Advantage: Balanced output, cycle, and durability
- Main Weakness: No extreme specialization

**Target Player:** General players who want stable progression without frequent checking.

---

### T3 — Natuna Well

**Purpose:** Higher-output harvest Well.

- Tradable: Yes
- Max Level: 5
- Cycle Time: 8 hours
- Base Output: 28 BBL
- Durability: 100
- Crew Size: 30
- Operation Type: Deep Offshore Field
- Oil Type: Light Crude + Condensate
- Playstyle: Harvest
- Main Advantage: Larger output per claim
- Main Weakness: Longer production cycle

**Target Player:** Players who prefer fewer logins with larger harvests.

---

### T4 — Celebes Well

**Purpose:** Premium efficiency and durability Well.

- Tradable: Yes
- Max Level: 5
- Cycle Time: 12 hours
- Base Output: 50 BBL
- Durability: 140
- Crew Size: 45
- Operation Type: Advanced Deep-Sea Platform
- Oil Type: Low-Sulfur Crude
- Playstyle: Efficient
- Main Advantage: High durability and stable output
- Main Weakness: Higher future repair and upgrade costs

**Target Player:** Long-term operators who value durability and operating efficiency.

---

### T5 — Pacific Well

**Purpose:** Endgame / prestige Well.

- Tradable: Yes
- Max Level: 5
- Cycle Time: 24 hours
- Base Output: 100 BBL
- Durability: 200
- Crew Size: 75
- Operation Type: Ultra-Deepwater Platform
- Oil Type: Deepwater Premium Crude
- Playstyle: Prestige
- Main Advantage: Highest capacity
- Main Weakness: Very long cycle and highest future operating cost

**Target Player:** Late-game players and high-value operators.

**Design Rule:** Pacific Well should not be aggressively sold at the beginning of the game. It should feel rare and valuable.

---

## 4. Output Progression by Level

| Well | Lv.1 | Lv.2 | Lv.3 | Lv.4 | Lv.5 |
|---|---:|---:|---:|---:|---:|
| Starter | 1 | 2 | — | — | — |
| Strait | 5 | 6 | 8 | 10 | 13 |
| Andaman | 14 | 17 | 21 | 26 | 32 |
| Natuna | 28 | 34 | 41 | 49 | 58 |
| Celebes | 50 | 59 | 69 | 80 | 92 |
| Pacific | 100 | 115 | 132 | 150 | 170 |

### Progression Rule

Upgrade growth should remain **controlled rather than exponential**.

The purpose of upgrading is to improve an asset, not to make lower tiers irrelevant or create runaway output inflation.

---

## 5. Durability Rule

**Locked rule:** Durability decreases by **1 point per completed production cycle**.

Examples:

- Strait Well:
  - 60 durability
  - 3-hour cycle
  - theoretical full-durability operating span = 180 production hours before reaching zero durability if no repair is performed.

- Pacific Well:
  - 200 durability
  - 24-hour cycle
  - very long operating span,
  - but future repair and operating costs should be significantly higher.

### Durability Design Principle

Higher durability does not automatically mean lower total cost.  
Higher-tier Well maintenance should remain economically meaningful.

---

## 6. Icon / Logo System

Every tier must have its **own icon/logo**, while remaining part of one consistent visual family.

### Starter Well
- Small rig
- Single oil droplet
- Simplest silhouette
- Trial identity

### Strait Well
- Offshore rig
- Two wave lines
- Compact badge
- Fast / active identity

### Andaman Well
- Offshore platform
- Horizon line
- Stronger badge structure
- Balanced identity

### Natuna Well
- Deep-water rig
- Three deep-wave layers
- More advanced silhouette
- Harvest identity

### Celebes Well
- Deep-sea platform
- Protective ring / operational shield
- Premium industrial look
- Efficiency identity

### Pacific Well
- Ultra-deepwater rig
- Ocean crest / prestige mark
- Most complex silhouette
- Endgame identity

### Icon Design Rule

Icons must remain recognizable at small UI sizes.  
The silhouette should communicate tier even before the player reads the Well name.

---

## 7. Official Tier Playstyles

| Well | Playstyle |
|---|---|
| Starter | Learn |
| Strait | Active |
| Andaman | Balanced |
| Natuna | Harvest |
| Celebes | Efficient |
| Pacific | Prestige |

**Locked principle:**  
A tier represents a playstyle and operational identity, not only a higher price or higher output.

---

## 8. Operation Information Display

Every Well detail card should eventually support the following fields:

### Core Game Information
- Well Name
- Tier
- Owner
- Level
- Status
- Output
- Cycle Time
- Durability
- Repair Cost
- Upgrade Cost
- Tradable / Non-Tradable

### Operation Information
- Operation Type
- Crew Size
- Oil Type
- Region / Field Class

### Example

**Andaman Well**

- Operation Type: Offshore Production Platform
- Crew Size: 18
- Oil Type: Medium Sweet Crude
- Output: 14 BBL / cycle
- Cycle: 6 hours
- Durability: 80 / 80

---

## 9. Economy Items Intentionally Not Locked

The following must be designed separately before Patch 029 economy work:

- Paid Well price in RM / SOL / RDO
- Upgrade cost
- Repair cost
- Operating cost
- BBL market value
- BBL → RDO conversion
- RDO earning rate
- Reward claim rules
- Paid Well supply limits
- Marketplace floor-price logic
- Scarcity model
- Any ROI / payback assumptions

These must not be inferred from this document.

---

## 10. Source-of-Truth Rule

For future RADAS Oil development:

> This document is the authoritative Well Tier Specification V1 until explicitly superseded by a newer locked specification.

Any patch that changes:
- tier names,
- cycle times,
- output,
- durability,
- crew size,
- oil type,
- max level,
- tradability,
- or tier identity

must explicitly state that it is modifying this specification.

---

## 11. Current Locked Status

**RADAS Oil Well Tier Specification V1 — LOCKED**

Official tiers:

1. Starter Well
2. Strait Well
3. Andaman Well
4. Natuna Well
5. Celebes Well
6. Pacific Well

Next recommended design topic:

**BBL Economy Definition — What BBL represents, how it is claimed, stored, sold, and how/if it converts into RDO.**
