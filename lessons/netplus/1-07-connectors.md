# Transceivers & connectors

## Copper connectors

| Connector | Used for |
|---|---|
| **RJ45** (8P8C) | Twisted-pair Ethernet |
| **RJ11** (6P2C/6P4C) | Telephone lines, DSL |
| **F-type** | Coax for cable TV/modems (screws on) |
| **BNC** | Older coax Ethernet and video (bayonet twist-lock) |

**Tools:**
- **Crimper** attaches RJ45 plugs.
- **Punchdown tool** terminates wires into patch panels and keystone jacks (110 blocks).

## Fiber connectors

| Connector | How to recognize it |
|---|---|
| **LC** | Small form factor, push-pull latch, 1.25 mm ferrule. The most common on SFPs |
| **SC** | Square, push-pull snap-in, 2.5 mm ferrule |
| **ST** | Round metal, bayonet twist-lock (older multimode) |
| **MPO/MTP** | Multi-fiber (12+ fibers) in one ferrule, for 40/100G parallel optics and trunks |

**Polish types** must match:
- **UPC** connectors are often blue (single-mode).
- **APC** connectors are **green** and angled 8°, which lowers back reflection.
- Mating APC with UPC causes high loss.

## Transceivers

Hot-swappable modules let one switch port use different media and distances.

| Form factor | Speed |
|---|---|
| GBIC | 1 Gbps (old, large) |
| SFP | 1 Gbps |
| SFP+ | 10 Gbps |
| SFP28 | 25 Gbps |
| QSFP+ | 40 Gbps (4 × 10G) |
| QSFP28 | 100 Gbps (4 × 25G) |

- **Both ends must match:** same standard, wavelength, and fiber type. 10GBASE-**SR** (850 nm, multimode) won't link with 10GBASE-**LR** (1310 nm, single-mode).
- **BiDi** optics send and receive on **one** strand using two wavelengths, sold as complementary pairs.
- **DOM/DDM** reports optical TX/RX power and temperature, which helps troubleshoot weak links.
- **Media converters** join different media, such as copper to fiber.

> **Exam tip:** Small push-pull fiber connector → **LC**. Square → **SC**. Twist-lock → **ST**. Many fibers in one → **MPO**. Coax screw-on → **F-type**. "Link won't come up between SR and LR optics" → **transceiver mismatch**.
