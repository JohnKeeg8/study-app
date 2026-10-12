# Transmission media

## Copper twisted pair

Pairs are twisted to cancel **EMI** and reduce **crosstalk**. The maximum Ethernet run is **100 m**: 90 m permanent link plus 10 m of patch cords.

| Category | Typical max speed | Notes |
|---|---|---|
| Cat 5e | 1 Gbps | 100 m |
| Cat 6 | 10 Gbps up to ~55 m | 1 Gbps to 100 m |
| Cat 6a | 10 Gbps | Full 100 m |
| Cat 8 | 25/40 Gbps | ~30 m, data centers |

- **UTP vs STP:** shielded twisted pair resists EMI but must be grounded.
- **Wiring:** T568A and T568B. Same standard on both ends = **straight-through**; A on one end and B on the other = **crossover**. Modern ports use **Auto-MDIX**, so either cable works. A **rollover** (console) cable reverses pin order.
- **Jacket ratings:**
  - **Plenum** (CMP) for air-handling spaces; low smoke when burned.
  - **Riser** (CMR) for vertical runs between floors.
  - **Direct burial** for underground runs.

## Fiber optic

Fiber carries light, so it's **immune to EMI**, works over long distances, and is hard to tap.

| | Single-mode (SMF) | Multimode (MMF) |
|---|---|---|
| Core | ~9 µm | 50 or 62.5 µm |
| Light source | Laser (1310/1550 nm) | LED/VCSEL (850 nm) |
| Distance | Kilometers | Hundreds of meters |
| Examples | 10GBASE-LR (10 km) | 10GBASE-SR (~300 m on OM3) |

- **Distance limit:** multimode is limited by *modal dispersion* (light takes many paths).
- **Multimode grades:** OM3 and OM4 are laser-optimized multimode for 10G and faster.

## Coaxial

- **RG-6** (75 Ω) with **F-type** connectors carries cable TV and cable modems.
- RG-59 is older and thinner. Older Ethernet (10BASE2) used BNC connectors.

## DAC and AOC

- **Direct attach copper (DAC):** twinax with SFP/QSFP ends permanently attached. It's the cheapest, lowest-power option for links of a few meters inside or between racks.
- **Active optical cable (AOC):** the same idea using fiber, so it reaches longer distances.

## Wireless media

- **802.11 Wi-Fi:** see Wireless devices for bands and standards.

| Wi-Fi | Standard | Bands |
|---|---|---|
| Wi-Fi 4 | 802.11n | 2.4 and 5 GHz |
| Wi-Fi 5 | 802.11ac | 5 GHz |
| Wi-Fi 6 / 6E | 802.11ax | 2.4/5 GHz; 6E adds 6 GHz |
| Wi-Fi 7 | 802.11be | 2.4, 5, and 6 GHz |

- **Cellular (4G/5G):** quick to deploy anywhere there's coverage; 5G has lower latency.
- **Satellite:**
  - Geostationary satellites (~35,786 km up) have **high latency** (~600 ms round trip).
  - **LEO** constellations are much lower, with latency in the tens of ms.

> **Exam tip:** "Long distance" or "near EMI sources (motors, elevators)" → **fiber**. "Short in-rack 10/25G link, cheapest" → **DAC**. Exceeding 100 m on copper causes **attenuation**.
