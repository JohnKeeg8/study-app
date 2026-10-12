# Network topologies

A topology is the **shape of a network**: how devices and sites connect. The **physical** topology is how cables actually run. The **logical** topology is how traffic flows. The exam asks you to recognize each topology from a description and pick the right one for a scenario (cost, redundancy, scale).

## Star and hub-and-spoke

- **Star:** every device connects to **one central device**, usually a switch. It's how almost every LAN is built.
  - **Pros:** easy to add devices and troubleshoot; one bad cable affects only one device.
  - **Con:** the **central switch is a single point of failure**.
- **Hub and spoke:** the WAN version of a star. **Branch sites (spokes) connect to a central site (hub)**, usually headquarters, and **not to each other**.
  - **Pros:** cheap and simple, with central control.
  - **Cons:** **branch-to-branch traffic must pass through the hub**, adding latency and load. If the hub fails, branches lose contact with each other.

## Mesh

- **Full mesh:** **every node connects directly to every other node**. **Maximum redundancy**: there's always another path and no single point of failure. But the number of links grows fast.

**Full mesh links = n × (n − 1) ÷ 2**

| Sites | Links |
|---|---|
| 4 | 6 |
| 6 | 15 |
| 10 | 45 |

- **Partial mesh:** only **critical sites** get redundant interconnections; smaller sites connect to one or two others. A balance of cost and redundancy.
- **Wireless mesh:** access points relay traffic for each other over the air and reroute around failures. Useful where running cable to every AP is hard.

## Point-to-point and point-to-multipoint

- **Point-to-point:** a **dedicated link between exactly two endpoints**, e.g. a leased line between two offices or a wireless bridge between two buildings.
- **Point-to-multipoint:** **one central site communicates with several remote sites**, common in wireless (one central antenna serving many buildings).

## Hybrid and legacy topologies

- **Hybrid:** a **combination** of topologies, e.g. a star in each building plus a mesh between building switches. Most real networks are hybrids.
- **Bus** (legacy): all devices on **one shared cable** with terminators at each end. One break or missing terminator takes the whole segment down.
- **Ring** (legacy): devices form a loop. A break can disrupt the ring unless it's dual-ring.

## Three-tier and collapsed core

Large campuses use a **hierarchical, three-tier** design so each layer has one clear job:

| Layer | Role | Typical devices and features |
|---|---|---|
| **Core** | **High-speed backbone** connecting distribution blocks. Keep it fast, redundant, and **simple**, with no heavy filtering | Fast Layer 3 switches/routers |
| **Distribution** | **Aggregates access switches**. Applies **policy**: inter-VLAN routing, ACLs, QoS, route summarization | Layer 3 switches |
| **Access** | Where **end devices connect** (PCs, phones, APs). PoE, port security, VLAN assignment | Access switches |

Access switches are usually **dual-homed** (uplinked to two distribution switches) for redundancy.

**Collapsed core:** **core and distribution merged into one layer**. It suits **small and medium networks** (e.g. a single building) where a separate core isn't needed, saving cost and complexity.

**Why use a hierarchy:** it scales in modules, isolates faults, and makes troubleshooting predictable.

## Spine and leaf

The modern **data center** design:

- **Leaf switches** (often **top-of-rack**) connect servers and storage.
- **Spine switches** form the backbone.
- **Every leaf connects to every spine.** **Spines don't connect to each other**, and leaves don't connect to each other.
- Any server reaches any other in the same number of hops (leaf → spine → leaf), so **latency is predictable**. Links are used together with **ECMP** (equal-cost multipath).
- **Scales out:** add **leaves** for more server ports and **spines** for more bandwidth. With 4 spines, each leaf has **4 uplinks**.

**Traffic directions:**
- **East-west:** server-to-server traffic **inside** the data center. Spine and leaf is built for this.
- **North-south:** traffic **entering or leaving** the data center (users ↔ servers).

## Common mix-ups

- **Star vs hub and spoke:** same shape. "Star" usually means a **LAN around a switch**; "hub and spoke" means **WAN sites around HQ**.
- **Full vs partial mesh:** full = **every** node to every node; partial = only some.
- **Three-tier vs spine and leaf:** three-tier is a **campus** design (north-south heavy). Spine and leaf is a **data center** design (east-west heavy).
- **Collapsed core:** **core + distribution** combined, not access + distribution.
- **Spine and leaf links:** leaf↔spine only, never spine↔spine.
- **Physical vs logical topology:** a network can be cabled as a star but behave logically differently.

## Key terms

- **Single point of failure:** one component whose failure takes everything down.
- **Dual-homed:** connected to two upstream devices for redundancy.
- **Top-of-rack (ToR):** a switch in each rack that servers connect to.
- **ECMP:** spreading traffic over several equal-cost paths.
- **East-west / north-south:** inside the data center / in and out of it.

> **Exam tip:** "Highest redundancy" → full mesh. "Branches connect only through HQ" → hub and spoke. "Data center with predictable server-to-server latency" → spine and leaf. "Small campus, fewer layers" → collapsed core.
