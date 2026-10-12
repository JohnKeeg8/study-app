# Switching technologies

Switches connect devices **within** a network. This lesson covers how switches forward frames, how VLANs and trunks divide them, how ports are configured, how spanning tree prevents loops, and what MTU and jumbo frames are.

## How a switch forwards frames

1. **Learn:** when a frame arrives, the switch records its **source MAC** and the **port** it came in on, in the **MAC address (CAM) table**. Entries age out after about 5 minutes without traffic.
2. **Forward:** if the **destination MAC** is in the table, the switch sends the frame **only out that port**.
3. **Flood:** if the destination is **unknown**, or the frame is a **broadcast**, the switch sends it **out every port in the VLAN** except the incoming one.

**Switching methods:**
- **Store-and-forward:** receives the whole frame and checks its FCS before forwarding. Corrupted frames are dropped.
- **Cut-through:** starts forwarding after reading the destination MAC. Lower latency, but can pass on bad frames.

## VLANs

A **VLAN (virtual LAN)** splits one physical switch into separate **broadcast domains**. Devices in different VLANs can't talk to each other **without a Layer 3 device** (a router or Layer 3 switch) routing between them.

- **Why use them:** security (separating departments, guests, voice, management), smaller broadcast domains, and flexible grouping regardless of physical location.
- **VLAN IDs:** **1–4094** are usable (0 and 4095 are reserved). **VLAN 1** is the default VLAN, and all ports start there. Best practice is to move users and the native VLAN **off VLAN 1**.
- **Voice VLAN:** an IP phone and a PC can share one port. The phone **tags** its traffic into the voice VLAN (learned via **CDP or LLDP-MED**) and the PC's traffic stays untagged in the data VLAN. This allows separate QoS and security.

## Access ports and trunks

| | **Access port** | **Trunk port** |
|---|---|---|
| VLANs | **One** data VLAN (plus an optional voice VLAN) | **Many** VLANs |
| Tagging | Sends **untagged** frames to the end device | Adds **802.1Q tags** |
| Connects to | PCs, printers, phones, APs | Other switches, routers, hypervisors, some APs |

**The 802.1Q tag** is **4 bytes** inserted into the Ethernet frame. It contains a **12-bit VLAN ID** and a **3-bit priority** (802.1p / CoS).

**Native VLAN:**
- Frames in the native VLAN cross a trunk **untagged**.
- The native VLAN **must match on both ends**. A **mismatch** leaks traffic between VLANs and logs errors.
- Set it to an **unused VLAN** (not 1), or **tag it too**, to block **double-tagging VLAN hopping**.

**Other trunk settings:**
- **Allowed VLAN list:** only carry the VLANs that are needed. A new VLAN must be **allowed on the trunk** or it won't reach other switches.
- **Disable DTP:** hard-code ports as access or trunk so attackers can't negotiate a trunk ("switch spoofing").

## Interface configuration

- **Speed and duplex:**
  - Set **both ends to auto-negotiate**, or **hard-code both identically**.
  - If one side is fixed (e.g. 100/full) and the other is on auto, auto-negotiation fails and the auto side falls back to **half duplex**. This is a **duplex mismatch**: **late collisions**, CRC errors, and very slow throughput.
  - Two ports hard-coded to **different speeds** won't link at all.
- **Link aggregation (802.3ad / LACP):** bundles several physical links into **one logical port channel** for more bandwidth and redundancy. STP treats it as one link, so all members forward.
  - **LACP modes:** **active** sends negotiation messages; **passive** only responds. Active–active or active–passive forms a bundle; **passive–passive never does**.
  - All members must match in **speed, duplex, and VLAN/trunk settings**.
- **Port security:** limits which or how many **MAC addresses** may use a port. On a violation the port can **shutdown** (err-disable), **restrict** (drop and log), or **protect** (drop silently).
- **Descriptions:** label every port (e.g. "Uplink to Core-SW1").
- **Unused ports:** **shut them down** and put them in an unused "parking" VLAN.
- **Port status:** **administratively down** = someone disabled it; **err-disabled** = the switch disabled it because of a violation.

## Spanning tree

Redundant links between switches create **Layer 2 loops**. Ethernet frames have **no TTL**, so a loop causes:
- **Broadcast storms:** broadcasts multiply until links and CPUs are saturated.
- **MAC address table instability (flapping):** the same MAC appears on different ports.
- **Duplicate frames.**

**Spanning Tree Protocol (STP, 802.1D)** blocks redundant paths so there's exactly one active path, and **unblocks a backup** if the active one fails.

**How STP builds the tree:**
1. **Elect the root bridge:** the switch with the **lowest bridge ID** wins. The bridge ID is **priority** (default **32768**) followed by the **MAC address**.
   - If priorities tie, the **lowest MAC** wins, which is often the oldest, slowest switch.
   - So **set the priority deliberately**, lower and in steps of 4096, on a core or distribution switch.
2. **Each non-root switch picks one root port:** its lowest-cost path to the root. Port **cost** depends on link speed; faster = lower.
3. **Each segment gets one designated port** (forwarding). **All other ports block.**

**Port states:**
- Classic STP moves ports through **blocking → listening → learning → forwarding**, which takes about **30–50 seconds**.
- **RSTP (802.1w)** converges in a few seconds.
- **PVST+ / Rapid PVST+** run a tree **per VLAN**. **MSTP (802.1s)** maps groups of VLANs to instances.

**Protecting STP:**
- **PortFast** skips straight to forwarding on **edge (host) ports**, so PCs get DHCP quickly.
- **BPDU guard** **err-disables** an edge port that receives a BPDU, which stops someone plugging in a rogue switch.
- **Root guard** stops a port from becoming the path to a **new root bridge**.

## MTU and jumbo frames

- **MTU (maximum transmission unit):** the largest payload a frame can carry. Standard Ethernet MTU = **1500 bytes**. The full frame is 1518 bytes, or 1522 with an 802.1Q tag.
- **Jumbo frames:** frames with an MTU around **9000 bytes**. Fewer, larger frames mean **less overhead and CPU load**, so they're used for **storage (iSCSI/NFS)**, backups, and VM migration.
- **Every device in the path** (servers, switches, routers) **must support the same larger MTU**. Switches **don't fragment**; they **drop** oversized frames, which show up as **giants**.
- **Tunnels and overlays** (VXLAN, GRE, IPsec) add headers, so either raise the underlay MTU or lower the MTU/MSS inside the tunnel.

## Common mix-ups

- **Access vs trunk:** access = **one VLAN, untagged**; trunk = **many VLANs, tagged**.
- **Native VLAN:** it's the **untagged** VLAN on a **trunk**, not the access VLAN.
- **Collision vs broadcast domain:** each **switch port** is its own collision domain. Each **VLAN** is one broadcast domain.
- **Root bridge election:** the **lowest** bridge ID wins, not the highest.
- **STP vs LACP:** STP **blocks** redundant links to prevent loops; LACP **combines** links so they all forward as one.
- **Duplex mismatch symptoms:** **late collisions** on the half-duplex side; CRC/runt errors on the full-duplex side.
- **Admin down vs err-disabled:** a human did it vs the switch did it.
- **Jumbo frames:** must be enabled **end to end**, not just on servers.

## Key terms

- **CAM / MAC address table:** the switch's map of MAC → port.
- **802.1Q:** the VLAN tagging standard.
- **BPDU:** bridge protocol data unit, the message STP uses.
- **Root bridge / root port / designated port:** STP roles.
- **Port channel:** a logical bundle of aggregated links.
- **Giant:** a frame larger than the allowed MTU.

> **Exam tip:** "Prevent loops" → STP. "Untagged traffic on a trunk" → native VLAN. "Combine links for bandwidth" → LACP. "Storage network performance" → jumbo frames end to end. "Late collisions" → duplex mismatch.
