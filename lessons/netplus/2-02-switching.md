# Switching technologies

Switches learn **source MAC addresses** into a MAC (CAM) table and forward frames only to the right port. Unknown destinations and broadcasts are **flooded** within the VLAN.

## VLANs

A VLAN is a separate **broadcast domain** on shared switch hardware. VLANs improve security and performance, and need a **Layer 3 device** to route between them.

- **Access port:** belongs to one data VLAN and sends untagged frames to the end device. It can add a **voice VLAN** for an IP phone, which learns that VLAN via CDP or LLDP-MED.
- **Trunk port:** carries many VLANs between switches using **802.1Q tags**.
  - The tag is 4 bytes and holds a 12-bit VLAN ID (usable IDs 1–4094) and 802.1p priority (CoS).
  - The **native VLAN** is sent **untagged**. It must match on both ends, and best practice is an unused VLAN, not VLAN 1, to prevent VLAN hopping.
  - Limit the **allowed VLAN list** to what's needed.
- **Hardening:** hard-code access or trunk mode and disable **DTP** (prevents switch spoofing).

## Interface configuration

- **Speed and duplex:** set both sides to auto, or hard-code both identically.
  - A **duplex mismatch** gives late collisions and CRC errors, and slow throughput.
  - Fixed on one side with auto on the other → the auto side falls back to **half duplex**.
- **Link aggregation (802.3ad/LACP):** bundles links into one logical port channel for bandwidth and redundancy. Speed, duplex, and VLAN settings must match on all members. LACP modes: active–active or active–passive works; passive–passive doesn't.
- **Port security:** limits the number of MAC addresses on a port. Violation actions are shutdown, restrict, or protect.
- **Descriptions and unused ports:** label ports with descriptions; shut down unused ports and put them in a parking VLAN.

## Spanning Tree Protocol (STP)

Redundant Layer 2 paths cause **loops**, which lead to broadcast storms, MAC table flapping, and duplicate frames. Ethernet has no TTL to stop them. **STP (802.1D)** blocks redundant paths.

1. Elect a **root bridge**: lowest **bridge ID** (priority, default **32768**, then MAC address). Set the priority deliberately; otherwise the oldest switch may win.
2. Each non-root switch picks a **root port** (its best path to the root).
3. Each segment gets a **designated port**. Everything else **blocks**.

- **Port states (classic STP):** blocking → listening → learning → forwarding (about 30–50 seconds).
- **RSTP (802.1w):** converges in seconds.
- **PVST+ / MSTP (802.1s):** spanning-tree instances per VLAN or per group of VLANs.
- **Protection features:**
  - **PortFast** skips straight to forwarding on edge (host) ports.
  - **BPDU guard** err-disables an edge port that receives a BPDU.
  - **Root guard** stops a port from becoming the path to a new root.

## MTU and jumbo frames

- **Standard Ethernet MTU:** **1500 bytes** of payload (1518-byte frame, 1522 with a tag).
- **Jumbo frames:** about **9000 bytes**. They reduce overhead for storage traffic (iSCSI/NFS) and backups.
- **Every device in the path must support the larger MTU.** Otherwise oversized frames are dropped and show up as **giants**.
- **Tunnels:** VXLAN and other overlays need a larger underlay MTU.

> **Exam tip:** "Prevent switching loops" → STP. "Native VLAN mismatch" → traffic leaks between VLANs. "Combine links" → LACP. "Storage network performance" → jumbo frames end to end.
