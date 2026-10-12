# Transceivers & connectors

Connectors attach cables to devices. Transceivers convert electrical signals to light (or copper signaling) in a switch port. On the exam you'll need to **identify connectors by description** and **pick or troubleshoot the right transceiver**.

## Copper connectors

| Connector | Looks like / used for |
|---|---|
| **RJ45** (8P8C) | 8-pin plug for **twisted-pair Ethernet** |
| **RJ11** (6P2C/6P4C) | Smaller plug for **telephone lines and DSL** |
| **F-type** | **Screws on** to RG-6 coax: **cable TV and cable modems** |
| **BNC** | **Bayonet twist-lock** coax connector: old Ethernet, video, test equipment |

**Tools:**
- A **crimper** attaches RJ45 plugs to cable ends.
- A **punchdown tool** pushes wires into **patch panels, keystone jacks, and 110 blocks**.
- A **cable stripper** removes the jacket.

## Fiber connectors

| Connector | How to recognize it |
|---|---|
| **LC** (Lucent Connector) | **Small**, **push-pull latching tab**, 1.25 mm ferrule. Usually **duplex** (a pair). The most common connector on **SFP/SFP+** optics |
| **SC** | **Square** body, **push-pull** snap-in, 2.5 mm ferrule |
| **ST** | **Round** metal, **bayonet twist-lock** ("stick and twist"). Older multimode installations |
| **MPO/MTP** | **Many fibers (12, 24…) in one rectangular ferrule**, for **40/100G parallel optics** and high-density trunks |

**End-face polish:**
- **UPC** connectors are usually **blue** (single-mode) or beige/aqua (multimode).
- **APC** connectors are **green**, polished at an **8° angle** to cut back-reflection.
- **Never mate APC with UPC**: the faces don't meet properly, causing high loss and possible damage.

**MPO polarity** (types A, B, C) must match the system so each transmit fiber lines up with the right receive fiber.

## Transceivers (form factors)

Transceivers are **hot-swappable modules** that slot into switch ports, so one port can use different media and distances.

| Form factor | Speed |
|---|---|
| GBIC | 1 Gbps (old, large; replaced by SFP) |
| **SFP** | 1 Gbps |
| **SFP+** | 10 Gbps |
| **SFP28** | 25 Gbps |
| **QSFP+** | 40 Gbps (4 × 10G lanes) |
| **QSFP28** | 100 Gbps (4 × 25G lanes) |

Each transceiver also has a **standard** that defines fiber type and reach:

| Standard | Fiber | Wavelength | Reach |
|---|---|---|---|
| 1000BASE-SX / 10GBASE-**SR** | Multimode | 850 nm | Short (hundreds of m) |
| 1000BASE-LX / 10GBASE-**LR** | Single-mode | 1310 nm | Long (~5–10 km) |
| 10GBASE-ER | Single-mode | 1550 nm | Extended (~40 km) |

## Making links work

For a fiber link to come up, **both ends must match**:
- **Same standard and wavelength:** an SR optic won't talk to an LR optic.
- **Same fiber type:** multimode with multimode, single-mode with single-mode.
- **Compatible speed:** a 1G SFP in a 10G link may only come up at 1G, or not at all.
- **Transmit to receive:** TX on one end must connect to RX on the other (correct **polarity**).
- **Supported module:** some switches reject third-party optics ("unsupported transceiver").

Helpful features:
- **BiDi (bidirectional) optics** send and receive over **one strand**, using two different wavelengths. Buy them as matched pairs.
- **DOM/DDM (digital optical monitoring)** reports transmit and receive light levels and temperature. It's great for spotting dirty or failing links.
- **Media converters** join different media, e.g. copper Ethernet to fiber, to extend a run.

## Common mix-ups

- **LC vs SC:** both push-pull. **LC is small** (half-size ferrule); **SC is square and larger**.
- **ST vs BNC:** both twist-lock bayonets. **ST is fiber**; **BNC is coax**.
- **RJ11 vs RJ45:** RJ11 is the **smaller phone/DSL** plug; RJ45 is **Ethernet**.
- **F-type vs BNC:** F-type **screws on** (cable TV/modems); BNC **twists to lock**.
- **SFP vs SFP+ vs QSFP:** SFP = 1G, SFP+ = 10G, QSFP+ = 40G, QSFP28 = 100G.
- **SR vs LR:** SR = **multimode, short**; LR = **single-mode, long**. Mixing them = **transceiver mismatch**.
- **APC vs UPC:** green angled (APC) vs flat (UPC). Don't mix them.

## Key terms

- **Ferrule:** the precise tube that holds and aligns the fiber in a connector.
- **Hot-swappable:** can be replaced while the device is powered on.
- **Duplex connector:** a pair of fibers (one transmit, one receive) joined together.
- **DOM:** digital optical monitoring of transceiver light levels.
- **Media converter:** a device that joins two different media types.

> **Exam tip:** Small push-pull fiber → **LC**. Square → **SC**. Round twist-lock fiber → **ST**. Many fibers in one → **MPO**. Screw-on coax → **F-type**. Phone line → **RJ11**.
