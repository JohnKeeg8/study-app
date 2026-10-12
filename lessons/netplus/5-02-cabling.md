# Cabling & physical interface issues

Most network problems start at **Layer 1**: the wrong cable, a bad termination, a dirty fiber, an overloaded PoE switch, or a mismatched optic. This lesson covers the cable, interface, and hardware problems N10-009 tests, the symptoms each one produces, and how to read **interface counters** and **port status** to find them.

## Incorrect cable type

Every cable has limits on **speed, distance, and environment**. Using the wrong one gives errors, slow links, or no link at all.

**Copper categories (twisted pair, 100 m max channel unless noted):**

| Category | Typical max speed | Notes |
|---|---|---|
| **Cat 5** | 100 Mbps | Obsolete; not for gigabit |
| **Cat 5e** | 1 Gbps at 100 m | Common desktop cabling; **not rated for 10GBASE-T** |
| **Cat 6** | 1 Gbps at 100 m; **10 Gbps up to about 55 m** | Better crosstalk performance |
| **Cat 6a** | **10 Gbps at 100 m** | The usual choice for 10GBASE-T |
| **Cat 7** | 10 Gbps at 100 m | Fully shielded; not a TIA standard |
| **Cat 8** | **25/40 Gbps up to 30 m** | Data center, short switch-to-server runs |

Scenario: an 80 m 10GBASE-T run built with Cat 5e shows errors → **incorrect cable type**; it needs Cat 6a.

**Fiber: single-mode vs multimode:**
- **Multimode (MMF):** wide core, **short distances** (hundreds of meters), cheaper **SR** optics (850 nm).
- **Single-mode (SMF):** narrow core, **long distances** (kilometers), **LR/ER** optics (1310/1550 nm).
- **Mixing single-mode and multimode** in one link causes huge loss, and the link usually fails. Fiber type and optic type must match.

**Shielding: STP vs UTP:**
- **UTP** is fine in offices. Near **motors, elevators, heavy machinery, or fluorescent lighting**, use **STP** (properly grounded) or fiber to resist **EMI**.

**Other wrong-cable problems:**
- **Jacket rating:** plenum-rated cable used **outdoors** isn't built for UV, moisture, or burial and degrades. Outdoor runs need outdoor or direct-burial cable.
- **Rollover (console) cable** used as a patch cable → no Ethernet link, because the pinout is fully reversed.
- **Crossover vs straight-through:** on modern switches **Auto-MDIX** fixes this automatically. On old devices without Auto-MDIX, the wrong one gives no link.

## Signal degradation

Signal degradation means the signal arrives **too weak or too noisy** to be read reliably. Symptoms are **CRC/FCS errors, retransmissions, slow speeds**, and intermittent drops.

| Problem | What it is | Common causes | Fix |
|---|---|---|---|
| **Attenuation** | Signal **loses strength over distance** | Copper run **over 100 m**, poor-quality or damaged cable, too many connectors, long tight coils | Shorten the run, add a switch, use fiber |
| **Crosstalk** | Signal from one pair **bleeds into another** | **Untwisting too much** (more than about 13 mm / half an inch) at terminations, split pairs, low-grade cable | Re-terminate properly; use a higher category |
| **Interference (EMI/RFI)** | Outside electrical noise corrupts the signal | Motors, elevators, fluorescent lights, power cables running alongside data | Reroute away from the source; use STP or fiber |

**Crosstalk types:** **NEXT** (near-end crosstalk) is measured at the transmitting end; **FEXT** is at the far end. Certifiers test both.

**Return loss:** signal **reflected back** toward the sender by **impedance changes**, often from mixing cable types or bad connectors.

Scenario: FCS errors spike **only when the elevator motor runs** → **EMI**. Reroute the cable away from the motor, or use shielded cable or fiber.

## Termination and wiring faults

**Improper termination** is one of the most common Layer 1 problems: a bad crimp, a loose punchdown, or pairs on the wrong pins.

| Fault | What happened | Symptom |
|---|---|---|
| **Open** | A conductor has **no continuity** end to end (broken wire, bad crimp) | No link, or link at lower speed |
| **Short** | Two conductors **touch** when they shouldn't | No link or errors |
| **Reversed pair** | The two wires **within one pair** are swapped (e.g. pins 1 and 2) | Wire map fault |
| **Crossed pair** | A **whole pair** is on the wrong pins at one end (e.g. 1/2 swapped with 3/6) | Accidental crossover |
| **Split pair** | Pins are right, but wires from **two different pairs** are twisted together | **Passes continuity**, but **severe crosstalk** |
| **Loose punchdown** | A conductor isn't seated in the patch panel or jack | **Intermittent** connectivity |

**Mixed standards:** T568A on one end and T568B on the other makes a **crossover** cable. Fine with Auto-MDIX; no link on an old device that needs straight-through.

**Bad pair, fallback speed:** gigabit uses **all four pairs**, 100 Mbps uses two. A link that negotiates only **100 Mbps instead of 1 Gbps** usually has **one damaged or badly terminated pair**.

**Fiber faults:**
- **TX/RX transposed (reversed polarity):** a new fiber link **stays down** even though both optics are good. **Swap the two connectors** (e.g. the LC pair) at one end.
- **Dirty or damaged connectors:** light is present but **RX power is low**. **Inspect with a fiber scope**, then clean.
- **Bend radius exceeded:** tight bends cause **macrobend loss** or break the fiber.
- **Polish mismatch:** connecting **UPC to APC** causes high insertion loss and back reflection.

**Testing tools for cabling:**

| Tool | What it tells you |
|---|---|
| **Cable tester (wire map)** | Continuity and pinout: opens, shorts, reversed and crossed pairs |
| **Cable certifier** | Whether the run **meets a category** (e.g. Cat 6a): NEXT, return loss, length. **Catches split pairs** |
| **TDR** | **Distance** to an open, short, or impedance change in copper |
| **OTDR** | Distance to breaks, bends, splices, and bad connectors in **fiber** |
| **Fiber inspection scope** | Dirt or damage on a connector end face |
| **Optical power meter / light meter** | How much light arrives, to compare against the loss budget |

A cable that **passes continuity** but **fails certification** almost always has **poor termination** (too much untwisting, cheap connectors).

## Interface counters

Interface counters tell you **what kind** of problem a link has. What matters is counters that are **increasing**, not old totals (clear them and watch).

| Counter | What it means | Usual cause |
|---|---|---|
| **CRC / FCS errors** | Frames arrived **corrupted** (checksum failed) | **Layer 1**: bad cable, EMI, dirty fiber, or **duplex mismatch** |
| **Runts** | Frames **smaller than 64 bytes** | Collisions, duplex mismatch, faulty NIC |
| **Giants** | Frames **larger than the max size** (1518 bytes, or the MTU) | **MTU / jumbo frame mismatch** |
| **Input errors** | Total of receive errors | CRC, runts, giants, alignment errors, **overruns** |
| **Output drops / discards** | Egress queue full, packets thrown away | **Congestion** |
| **Input queue drops** | Device couldn't process incoming packets fast enough | **High CPU** or traffic bursts |
| **Late collisions** | Collisions after the first 64 bytes | **Duplex mismatch** or a cable **too long** |
| **Broadcast/multicast counters** spiking | Huge volumes of broadcasts | A **switching loop** / broadcast storm |

**Duplex mismatch:** one side is full duplex and the other half duplex (often one side hard-coded, the other auto). The **half-duplex side** logs **late collisions**; the **full-duplex side** logs **CRC errors and runts**. Throughput collapses but the link stays up. Fix: set **both ends the same**, ideally **both auto-negotiate**. CDP/LLDP may log "duplex mismatch discovered."

**Speed mismatch:** if speeds don't match, there's usually **no link at all**. A 10G link that only comes up at 1G often has a **1G SFP** in one end or a port **hard-set to 1G**.

Scenario: a storage port's **giants** counter climbs → **jumbo frames** arriving on a port without a larger MTU.

## Port status

Port status shows **where** the problem sits.

| Status | Meaning | What to do |
|---|---|---|
| **Up/up** | Layer 1 and Layer 2 working | Look elsewhere (Layer 3+) |
| **Down/down** | **Physical** problem: unplugged, bad cable, far end powered off | Check cable, jack patching, the far device |
| **Up/down** (line protocol down) | Layer 1 OK but **Layer 2 problem**: encapsulation or keepalive mismatch | Check Layer 2 settings on both ends |
| **Administratively down** | Someone **shut it down** with `shutdown` | Confirm it should be active, then `no shutdown` |
| **Err-disabled** | The switch **automatically disabled** it after a violation | Fix the cause, then `shut` / `no shut` (or errdisable recovery) |
| **Suspended** | A **link aggregation (LACP/EtherChannel) member** whose settings don't match the bundle, or the far end isn't negotiating | Match speed, duplex, VLANs, and LACP settings on all members |

**Common err-disabled triggers:**
- **Port security violation** (`psecure-violation`): an unknown MAC, or too many MACs, e.g. someone plugged in a hub or small switch.
- **BPDU guard:** a switch was plugged into a PortFast edge port.
- **Link flapping:** the link went up and down too many times (bad cable, optic, or NIC).

**Link flapping** itself (up/down/up/down) points to a faulty cable, transceiver, or NIC, or a speed/duplex negotiation problem.

**UDLD (Unidirectional Link Detection):** on fiber, one strand can fail so one side sees the link up and the other doesn't. UDLD detects this and disables the port, preventing loops.

Scenario: a user moves offices and the new desk jack shows no link → check that the jack is **patched to an active switch port**, and that the port isn't administratively down.

## Power over Ethernet issues

**PoE** sends power over the data cable to APs, phones, and cameras. Two things go wrong: the port can't supply **enough power for the device**, or the switch runs out of **total power**.

| Standard | Name | Max per port (at the switch) |
|---|---|---|
| **802.3af** | PoE | **15.4 W** |
| **802.3at** | PoE+ | **30 W** |
| **802.3bt** Type 3 | PoE++ | **60 W** |
| **802.3bt** Type 4 | PoE++ | **90 W** (100 W in some specs) |

**Incorrect standard:** the device needs more than the port's class provides, e.g. a **PoE+ AP on an 802.3af port**. Symptoms: the device **won't power on**, **keeps rebooting**, or runs with features disabled (fewer radios).

**Power budget exceeded:** each switch has a **total PoE budget**. Example: a 370 W switch with ten 30 W APs uses 300 W. Adding five more needs 450 W total, so **some ports get no power**. Symptom: **new** devices won't power on after more were added, while the old ones keep working.

**Other PoE problems:**
- A **faulty powered device** drawing more than its class allows → the switch repeatedly negotiates power, then shuts it off.
- An IP phone works but the **PC behind its passthrough port** has no link → check the phone's PC port and the cable between phone and PC.

**Check it:** `show power inline` shows per-port draw and the remaining budget. Fixes: move devices to another switch, add a **PoE injector**, upgrade to a higher-budget switch or power supply, or set port priorities.

## Transceiver and signal strength issues

**Transceiver mismatch:** both ends of a link must use **compatible optics**.
- **Wavelength/fiber type:** **SR on one end and LR on the other**, or **1000BASE-SX vs 1000BASE-LX**, won't work reliably; they use different wavelengths and fiber types.
- **Speed:** a **1G SFP** in one end of a 10G SFP+ link → link at 1G or no link.
- **Unsupported module:** the switch logs "**unsupported transceiver**" and keeps the port down; some vendors reject third-party optics.
- **DAC cables:** a direct attach copper cable may not work after a switch replacement if it's not supported, the wrong speed, or too long.

**Optical signal strength (DOM):** **Digital optical monitoring** reports TX/RX power and temperature (e.g. `show interfaces transceiver`). Compare **RX power** with the receiver's sensitivity range.
- **Too weak** (e.g. RX −30 dBm when the sensitivity is −14 dBm): a **break**, **dirty connector**, excessive bends, or the **wrong fiber type**.
- **Slowly falling** over weeks with rising errors: a **failing optic** or gradually **contaminated or damaged fiber**.
- **Too strong:** long-reach optics on a **very short** run **saturate the receiver**. Add an **optical attenuator**.
- **Loss budget:** if measured loss is higher than calculated, inspect and clean connectors, check splices and bends, and test with an **OTDR**.

**Wireless signal strength:**
- Measure **RSSI** and **SNR** at the client's location. Weaker than about **−70 dBm** RSSI, or SNR under about **25 dB**, gives low data rates, retries, and disconnects at the edge of coverage.
- Hardware causes: **detached, damaged, or wrong antennas**, or wrong antenna **orientation**, can give poor signal even near the AP.
- Fix by adjusting AP **placement, power, or antennas**.

Scenario: after a storm, several ports in a building show errors and one is dead → possible **power surge or lightning damage** to ports or cabling.

## Common mix-ups

- **Attenuation vs crosstalk:** attenuation = signal **gets weaker with distance**; crosstalk = signal **leaks between pairs** (usually from untwisting).
- **Crosstalk vs EMI:** crosstalk comes from **inside the cable**; EMI comes from **outside sources** like motors and lights.
- **Reversed pair vs crossed pair vs split pair:** reversed = two wires swapped **within one pair**; crossed = **whole pairs** on the wrong pins; split = pins right but **twists mixed**, which only a **certifier** catches.
- **Cable tester vs certifier:** a tester checks **continuity and pinout**; a certifier proves the run **meets a category's performance**.
- **TDR vs OTDR:** TDR is for **copper**; OTDR is for **fiber**.
- **Runts vs giants:** runts are **too small** (under 64 bytes, collisions); giants are **too big** (MTU mismatch).
- **CRC errors vs output drops:** CRC = **corruption** (Layer 1); output drops = **congestion** (queues full).
- **Down/down vs administratively down vs err-disabled:** down/down = **physical fault**; admin down = **someone shut it**; err-disabled = **the switch shut it** after a violation.
- **PoE budget exceeded vs incorrect standard:** budget = the **whole switch** is out of power; incorrect standard = **one port's class** is too low for the device.
- **RX too weak vs too strong:** weak = dirt, breaks, wrong fiber; strong = **receiver saturation**, add an attenuator.

## Key terms

- **Attenuation:** loss of signal strength over distance.
- **Crosstalk (NEXT/FEXT):** signal bleeding between pairs, measured at the near or far end.
- **EMI:** electromagnetic interference from outside sources.
- **Split pair:** a wiring fault that passes continuity but causes heavy crosstalk.
- **TX/RX transposed:** fiber strands swapped so transmit doesn't meet receive.
- **CRC/FCS error:** a frame whose checksum failed, meaning it was corrupted.
- **Runt / giant:** a frame below 64 bytes / above the maximum size.
- **Err-disabled:** a port automatically shut down by the switch after an error or violation.
- **Suspended:** an aggregation member port held out of the bundle because of a mismatch.
- **PoE budget:** total power a switch can supply to all PoE ports.
- **DOM:** digital optical monitoring of transceiver power and temperature.
- **Auto-MDIX:** automatic correction for straight-through vs crossover cabling.
- **UDLD:** detects a fiber link that works in only one direction.

> **Exam tip:** "CRC errors rising" → Layer 1 (cable, EMI, dirty fiber) or duplex. "Late collisions" → duplex mismatch. "Giants" → MTU mismatch. "Output drops" → congestion. "New fiber link down, optics good" → TX/RX transposed. "New PoE devices won't power on" → PoE budget exceeded. "Port err-disabled after a hub was plugged in" → port security or BPDU guard.
