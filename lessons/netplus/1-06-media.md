# Transmission media

Transmission media is **what carries the signal**: electricity over copper, light over glass, or radio waves through the air. The right choice depends on distance, speed, interference, cost, and environment.

## Twisted-pair copper

Ethernet cable has **four pairs** of copper wires. Each pair is **twisted**, so electromagnetic interference (EMI) hits both wires equally and cancels out, and pairs don't leak into each other (**crosstalk**).

- **Maximum length:** **100 meters** (328 ft) per run, typically 90 m in the wall plus 10 m of patch cords. Beyond that, the signal fades (**attenuation**) and errors appear.
- **UTP vs STP:** UTP (unshielded) is standard. STP (shielded) adds foil or braid to resist EMI in noisy places and **must be grounded**.

| Category | Speed | Max distance at that speed |
|---|---|---|
| Cat 5e | 1 Gbps | 100 m |
| Cat 6 | 10 Gbps | **~55 m** (1 Gbps to 100 m) |
| **Cat 6a** | 10 Gbps | **100 m** |
| Cat 8 | 25/40 Gbps | ~30 m (data centers) |

**1000BASE-T** (gigabit) uses **all four pairs** at once; older 100BASE-TX used only two.

## Wiring standards and cable types

The pin order is set by **T568A** or **T568B** (they swap the orange and green pairs).

| Cable | Wiring | Use |
|---|---|---|
| **Straight-through** | Same standard on both ends | Normal device-to-switch links |
| **Crossover** | T568A on one end, T568B on the other | Historically switch-to-switch or PC-to-PC |
| **Rollover (console)** | Pins fully reversed (1↔8, 2↔7…) | PC to a device's **console port** |

**Auto-MDIX** on modern ports detects and swaps the transmit and receive pairs automatically, so straight-through cables work almost everywhere.

**Jacket (fire) ratings:**
- **Plenum (CMP):** low smoke and toxic fumes. **Required in air-handling spaces** such as above drop ceilings.
- **Riser (CMR):** for vertical runs between floors.
- **Direct burial:** moisture- and crush-resistant, for running underground.

## Fiber optic

Fiber carries **light** through glass, so it's **immune to EMI**, goes much farther and faster than copper, and is hard to tap.

| | **Single-mode (SMF)** | **Multimode (MMF)** |
|---|---|---|
| Core size | ~**9 µm** (tiny) | **50 or 62.5 µm** |
| Light source | **Laser** (1310/1550 nm) | LED or VCSEL (850 nm) |
| Distance | **Kilometers** | Hundreds of meters |
| Cost | Optics cost more | Cheaper optics |
| Example | **10GBASE-LR** (long reach, 10 km) | **10GBASE-SR** (short reach, ~300 m on OM3) |

- **Why multimode is limited:** light takes **multiple paths (modes)** down the wide core and spreads out (**modal dispersion**). Single-mode's narrow core allows one path, so the signal stays clean over long distances.
- **Multimode grades:** **OM3/OM4** are laser-optimized multimode for 10G and faster.
- **Handling:** don't bend fiber tighter than its **bend radius**, and keep connectors clean.

## Coaxial, DAC, and AOC

- **Coaxial cable:** a center conductor inside shielding.
  - **RG-6 (75 Ω)** with **F-type** screw-on connectors carries **cable TV and cable-modem internet**. RG-59 is older and thinner.
  - Old 10BASE2 Ethernet used thin coax with BNC connectors.
- **Direct attach copper (DAC):** **twinax** copper with SFP or QSFP modules **permanently attached** to each end. The **cheapest, lowest-power** option for links of a few meters, such as server to top-of-rack switch.
- **Active optical cable (AOC):** the same idea with **fiber** in the middle. Lighter and reaches longer distances than DAC.

## Wireless media

- **802.11 (Wi-Fi):** radio in the 2.4, 5, and 6 GHz bands. Details are in *Wireless devices*.

| Marketing name | Standard | Bands |
|---|---|---|
| Wi-Fi 4 | 802.11n | 2.4 and 5 GHz |
| Wi-Fi 5 | 802.11ac | 5 GHz only |
| Wi-Fi 6 / 6E | 802.11ax | 2.4/5 GHz; **6E adds 6 GHz** |
| Wi-Fi 7 | 802.11be | 2.4, 5, and 6 GHz |

- **Cellular (4G LTE / 5G):** no cabling, quick to deploy anywhere with coverage. Good for temporary sites and backup links. **5G** gives higher speeds and lower latency.
- **Satellite:**
  - **Geostationary** satellites orbit ~35,786 km up, so signals travel far: **round-trip latency around 600 ms**, which hurts VoIP and gaming.
  - **Low-earth-orbit (LEO)** constellations are much closer, with latency in the tens of milliseconds.
  - Both can be affected by weather.

## Common mix-ups

- **Cat 6 vs Cat 6a:** both do 10 Gbps, but **only Cat 6a reaches the full 100 m**. Cat 6 manages about 55 m.
- **Single-mode vs multimode:** single-mode = **small core, laser, long distance**. Multimode = **bigger core, short distance**. SR optics → multimode; LR optics → single-mode.
- **Plenum vs riser:** plenum is for **air-handling spaces** and can also be used in risers; riser cable is **not** allowed in plenums.
- **Crossover vs rollover:** crossover connects two network devices directly; rollover connects to a **console port**.
- **DAC vs AOC:** DAC is **copper** (shortest, cheapest); AOC is **fiber** (longer).
- **Attenuation vs crosstalk:** attenuation = signal **weakens over distance**; crosstalk = signal **leaks between pairs**.

## Key terms

- **EMI:** electromagnetic interference from motors, lights, and power lines.
- **Attenuation:** loss of signal strength over distance.
- **Crosstalk:** a signal bleeding into an adjacent pair.
- **Modal dispersion:** light spreading across many paths in multimode fiber.
- **Auto-MDIX:** automatic swapping of transmit and receive pairs.
- **Twinax:** the copper used in DAC cables.

> **Exam tip:** "Run past electric motors" → fiber (immune to EMI). "10 Gbps for 100 m on copper" → Cat 6a. "Several kilometers between buildings" → single-mode. "Above the drop ceiling" → plenum.
