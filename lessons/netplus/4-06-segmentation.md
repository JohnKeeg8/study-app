# Network segmentation

Segmentation splits the network into zones (VLANs and subnets) and controls traffic between them with **firewalls and ACLs**. It **limits lateral movement**, contains breaches and malware, reduces compliance scope, and improves performance.

## Segments the exam expects

| Segment | Why isolate it |
|---|---|
| **IoT** | Smart TVs, cameras, sensors, and building systems are often poorly secured and rarely patched. Isolate them and allow only the flows they need |
| **IIoT** | Industrial IoT: connected sensors and devices in factories and utilities |
| **OT (operational technology)** | Hardware and software controlling physical processes. **Safety and availability** come first |
| **ICS (industrial control systems)** | Systems that control industrial processes, including SCADA, DCS, and **PLCs** |
| **SCADA** | Supervisory Control and Data Acquisition: monitoring and control over wide areas (power grids, water treatment) |
| **Guest** | Visitors get **internet-only** access on a separate SSID/VLAN with client isolation, and never reach internal systems |
| **BYOD** | Personal devices aren't fully managed. Use a separate segment plus **NAC and MDM** policies |

## OT/ICS considerations

- They often run **legacy protocols with no authentication or encryption** (e.g. Modbus, DNP3).
- A compromise can cause **physical damage or injury**.
- Separate IT and OT with an **industrial DMZ**: both sides talk only to systems in the DMZ, never directly to each other.
- Use **jump hosts** for controlled, audited engineer access.
- Some highly sensitive systems are **air-gapped**: physically isolated, though removable media can still bring threats in.

## Techniques

- **VLANs and subnets**, with **default-deny** firewall rules between zones that allow only required flows.
- **Micro-segmentation:** fine-grained policies down to individual workloads. A key part of **zero trust** (assume breach, limit lateral movement).
- **Trusted vs untrusted zones,** and a **screened subnet** for public-facing services.

> **Exam tip:** "Smart devices and cameras" → separate IoT segment. "Visitors" → guest network with internet-only access. "Personal phones" → BYOD segment with NAC/MDM. "Power plant controls" → OT/ICS/SCADA, isolated and protected.
