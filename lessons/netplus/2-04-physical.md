# Physical installations

Network equipment has to live somewhere: closets, racks, and data centers. This objective covers **where** equipment goes, **how it's powered**, and the **environment** it needs.

## Installation locations

- **Demarc (demarcation point):** where the **service provider's responsibility ends and yours begins**, usually where the carrier's line enters the building. Problems on the provider side of the demarc are theirs to fix. A **demarc extension** carries the handoff to your equipment room if it's far away.
- **MDF (main distribution frame):** the **central wiring location**. It typically holds the **core equipment**, the **demarc connection**, and links to every IDF.
- **IDF (intermediate distribution frame):** a wiring **closet serving a floor or area**. It holds **access switches and patch panels** and **uplinks to the MDF**. Place IDFs so **horizontal cable runs stay within 90 meters** (100 m including patch cords).
- **Patch panel:** horizontal cables from wall jacks **punch down** to the back of the panel; short **patch cables** connect the front to switch ports.

## Racks and cabling practice

- **Size:** standard network racks are **19 inches wide**. Height is measured in **rack units**: **1U = 1.75 inches**, and a full rack is often 42U.
- **Rack types:**
  - **2-post or 4-post open-frame** racks give easy access and good airflow, but **no physical security**. Use them in locked rooms.
  - **Enclosed, locking cabinets** **protect equipment and console ports** in shared or open spaces.
- **Good practice:**
  - **Heaviest equipment** (UPS units, batteries) goes at the **bottom** for stability.
  - Install **blanking panels** in empty spaces so hot exhaust doesn't recirculate to the front.
  - Use **horizontal and vertical cable managers** and **hook-and-loop (Velcro) straps**, not tight zip ties that crush cables.
  - Respect the **bend radius** (about 4× the cable diameter for UTP; fiber has its own minimum).
  - **Label both ends of every cable**, matching your cable map.
  - **Separate data cables from power cables** (EMI), or cross them at 90°.
  - **Ground and bond** racks for safety and to protect shielded cabling.
  - Check **floor load ratings** for heavy racks.

## Power

| Device | What it does | How long |
|---|---|---|
| **UPS** (uninterruptible power supply) | **Immediate battery power** during an outage, plus **power conditioning** for sags and surges | **Minutes**: enough to ride through a blip, start a generator, or shut down gracefully |
| **Generator** | Powers the site during **extended** outages | **Hours to days** (starts after a delay, so a UPS bridges the gap) |
| **PDU** (power distribution unit) | Distributes power to devices in a rack. **Managed/switched PDUs** report per-outlet use and can remotely power-cycle devices | — |
| **Surge protector** | Clamps **voltage spikes** only | **No runtime** at all |

**UPS types:**
- **Online (double-conversion):** always runs the load from its inverter. **Cleanest power, zero transfer time.**
- **Line-interactive / standby:** switch to battery only when power fails.

**Planning:**
- **Size** UPSs and circuits in **VA and watts**, with growth headroom. Keep **continuous load at or below about 80%** of a circuit's rating.
- **Redundant power:** connect a device's **two power supplies to different PDUs on different circuits** (A and B feeds), so one failure doesn't take it down.
- **Voltage:** about **120 V** in North America and **230 V** in Europe. Most network power supplies auto-switch. Telecom gear often uses **−48 V DC**.
- **Don't daisy-chain** power strips. Use **locking power cords** in racks.

**PoE (Power over Ethernet):**

| Standard | Name | Power at the switch port |
|---|---|---|
| 802.3af | PoE | ~15.4 W |
| 802.3at | PoE+ | ~30 W |
| 802.3bt | PoE++ | ~60 W (Type 3) / ~90–100 W (Type 4) |

- **Power budget:** a switch has a **total PoE budget** shared by all ports. Adding devices beyond it leaves some unpowered.
- **PoE injector:** adds power to a single link when the switch has no PoE.

## Environmental factors

- **Temperature:** about **18–27 °C (64–81 °F)** at equipment air intakes (ASHRAE guidance). Overcooling wastes energy; overheating causes failures.
- **Humidity:** about **40–60% relative humidity**.
  - **Too low** → **electrostatic discharge (ESD)** risk.
  - **Too high** → **condensation and corrosion**.
- **Airflow and hot aisle / cold aisle:** racks face each other so equipment **intakes share a cold aisle** and **exhausts share a hot aisle**. **Containment** keeps the two from mixing. Check each device's **airflow direction** (front-to-back vs back-to-front) matches the layout.
- **Fire suppression:**
  - **Clean-agent gas** systems (e.g. FM-200, inert gases) put out fires **without water or residue**, so electronics survive.
  - **Pre-action sprinklers** keep pipes **dry until a detector triggers**, so a broken sprinkler head alone won't flood the room.
- **Monitoring sensors:** temperature, humidity, **water/leak**, and smoke sensors that alert staff before damage occurs.
- **Outdoor equipment:** weatherproof (IP-rated) enclosures, wide temperature tolerance, and **surge/lightning protection**.

## Common mix-ups

- **UPS vs generator:** UPS = **instant, short-term** battery. Generator = **long-term**, starts after a delay. They work together.
- **UPS vs surge protector:** a surge protector gives **no backup power**.
- **MDF vs IDF:** MDF = **main/central** (core, demarc). IDF = **per floor or area** (access switches).
- **Demarc:** the **provider/customer boundary**, not the MDF itself.
- **Low vs high humidity:** low = **static (ESD)**; high = **condensation/corrosion**.
- **Hot aisle vs cold aisle:** intakes face the **cold** aisle; exhausts face the **hot** aisle.
- **PoE vs PoE+:** 802.3af ~15.4 W vs **802.3at ~30 W**.

## Key terms

- **Rack unit (U):** 1.75 inches of rack height.
- **Blanking panel:** a cover for empty rack space that preserves airflow.
- **Online UPS:** double-conversion UPS with zero transfer time.
- **PoE budget:** the total power a switch can supply across its ports.
- **Clean agent:** a gas fire suppressant safe for electronics.

> **Exam tip:** "Short outage / graceful shutdown" → UPS. "Hours-long outage" → generator. "Low humidity risk" → ESD. "Above the drop ceiling" → plenum cable. "Where provider responsibility ends" → demarc.
