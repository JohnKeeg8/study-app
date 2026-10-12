# Network segmentation

Segmentation splits one network into separate **zones** (VLANs and subnets) and controls what may pass between them with **firewalls and ACLs**. Its main security job is to **limit lateral movement**: if one device is compromised, the attacker or malware can't freely reach everything else. Network+ expects you to know which kinds of devices get their own segment and why: **IoT, IIoT, SCADA/ICS/OT, guest, and BYOD**.

## Why segment the network

On a **flat network**, every device can talk to every other device. One infected laptop, smart TV, or visitor's phone can scan and attack the whole organization. Segmentation fixes that:
- **Limits lateral movement:** an attacker who compromises a camera on the IoT segment can't reach the finance servers.
- **Contains malware outbreaks:** ransomware spreading on one segment is blocked at the firewall boundary.
- **Reduces compliance scope:** isolating the PCI cardholder data environment means fewer systems are audited.
- **Applies the right policy to each group:** strict rules for untrusted devices, broader access for managed corporate PCs.
- **Improves performance and troubleshooting:** smaller broadcast domains and clearer traffic flows.

This fits the **zero trust** mindset: **assume breach** and design so that a breach in one place can't spread.

## How segmentation is enforced

A VLAN by itself only separates traffic at Layer 2. **The security comes from the rules at the Layer 3 boundary** where segments meet.
- **VLANs and subnets:** each group gets its own VLAN and IP subnet.
- **Firewalls or ACLs between segments:** the router, Layer 3 switch, or firewall that routes between VLANs enforces what's allowed.
- **Default deny:** block everything between segments, then **allow only the specific flows required** (e.g. "cameras may send video to the NVR on TCP 554, nothing else").
- **Micro-segmentation:** very fine-grained policies down to **individual workloads, VMs, or applications**, usually enforced in software (hypervisor or host firewalls) in data centers and clouds. Two web servers in the same subnet can be prevented from talking to each other.
- **Physical separation / air gap:** for the most critical systems, no network connection at all.

> Scenario: IoT devices are on their own VLAN, but the core switch routes between all VLANs with no ACLs. The VLAN provides no real protection; add firewall rules on the Layer 3 boundary.

## IoT and IIoT

**IoT (Internet of Things)** devices are network-connected "things": smart TVs, IP cameras, printers, thermostats, door locks, building HVAC controllers, smart speakers, and medical devices such as infusion pumps.

Why they need their own segment:
- Often shipped with **default credentials** and **weak or no security**.
- **Rarely patched**, and vendors may stop releasing updates.
- Can't run endpoint security software.
- Common targets for **botnets** (compromised cameras have powered huge DDoS attacks).

Best practice: put them on a **dedicated IoT VLAN** with **default-deny rules** that allow only the flows each device needs (e.g. to its management server or cloud service), and block access from IoT into the corporate network. **Medical IoT** in hospitals gets the same treatment with strict access controls.

**IIoT (Industrial Internet of Things)** is IoT in **industrial settings**: connected sensors, meters, and actuators in factories, oil and gas, utilities, and logistics. IIoT devices often feed data from the plant floor to analytics systems, so they bridge into OT environments and need the same careful isolation.

## OT, ICS, and SCADA

These terms are related and the exam may ask you to tell them apart:

| Term | Meaning | Example |
|---|---|---|
| **OT (operational technology)** | The broad category: hardware and software that **monitor and control physical processes and equipment** | Factory machines, building systems, power equipment |
| **ICS (industrial control systems)** | Systems that **control industrial processes**. Includes **SCADA, DCS, and PLCs** | A manufacturing line's control system |
| **SCADA** | **Supervisory Control and Data Acquisition:** centrally monitors and controls equipment spread over **wide geographic areas** | Power grids, water treatment, pipelines |
| **DCS** | **Distributed control system:** controls a process within one site | A chemical plant or refinery |
| **PLC** | **Programmable logic controller:** a rugged industrial computer that directly controls machinery | Controlling a conveyor belt or valve |
| **HMI** | **Human-machine interface:** the screen operators use to view and control the process | A control room dashboard |

**IT vs OT priorities:** in IT, **confidentiality** usually comes first. In OT, **availability and safety** come first, because stopping a process or sending a wrong command could **damage equipment, harm people, or cut power or water**. That's why OT systems are patched cautiously and often run for decades.

## Protecting OT and ICS networks

OT/ICS networks are isolated from corporate IT because:
- They use **legacy devices and protocols** (e.g. **Modbus, DNP3**) designed with **no authentication or encryption**. Anyone who can reach a PLC can often send it commands.
- Devices can't easily be patched or run security software.
- A compromise has **physical** consequences, not just data loss.

Key protections:
- **Industrial DMZ:** a buffer zone between IT and OT. IT systems talk only to servers in the DMZ (such as a data historian replica), and OT systems talk only to the DMZ, so there are **no direct connections between IT and OT**.
- **Jump host (jump box):** engineers coming from IT must log in to a hardened, **monitored and audited** jump host first, then reach OT systems from there. Use MFA on it.
- **Default-deny firewalls** allowing only specific industrial protocols between specific hosts.
- **Air gap:** the most critical systems may be **physically isolated** from all other networks, including the internet. Remember an air gap is not perfect: **USB drives and laptops** carried in can still introduce malware.
- **Monitoring** with OT-aware IDS that understand industrial protocols.

## Guest networks

Visitors need internet access but should **never reach internal systems**.
- Separate **SSID** mapped to a separate **guest VLAN/subnet**.
- Firewall rules allowing **internet access only**; deny all traffic to internal networks.
- **Client isolation** so guests can't attack each other on the same Wi-Fi.
- Often a **captive portal** for acceptance of terms, plus bandwidth limits and time-limited access.

> Scenario: a visitor on guest Wi-Fi can ping the internal file server. The guest VLAN is missing deny rules toward internal subnets.

## BYOD

**BYOD (bring your own device)** means employees use **personal phones, tablets, and laptops** for work. The organization doesn't own or fully manage them, so it can't guarantee they're patched or malware-free.

Controls:
- Place BYOD devices on a **separate segment** with limited access (e.g. email and specific web apps, not the whole internal network).
- **NAC (network access control)** checks identity and device posture before granting access, and can assign the BYOD VLAN automatically.
- **MDM (mobile device management)** enforces policies on the device: screen lock, encryption, and the ability to **remotely wipe corporate data**. Containerization keeps work data separate from personal data.
- A clear **BYOD policy** users agree to.

Related models: **CYOD** (choose your own device from an approved list) and **COPE** (corporate-owned, personally enabled) give the company more control.

## Common mix-ups

- **IoT vs IIoT:** IoT = **consumer and office** smart devices; IIoT = **industrial** sensors and devices.
- **OT vs ICS vs SCADA:** OT is the **umbrella** for systems controlling physical processes; ICS is **industrial control** within OT; SCADA is a type of ICS that spans **wide geographic areas**.
- **SCADA vs DCS:** SCADA = **wide area** (grid, pipeline); DCS = **one site** (plant).
- **IT vs OT priorities:** IT usually prioritizes **confidentiality**; OT prioritizes **availability and safety**.
- **Guest vs BYOD:** guest = **visitors, internet only**; BYOD = **employees' personal devices** needing some corporate access, controlled with NAC/MDM.
- **VLAN vs segmentation policy:** a VLAN alone doesn't block traffic; **firewall/ACL rules** between segments do.
- **Segmentation vs micro-segmentation:** segmentation = **zones of many devices**; micro-segmentation = policy per **individual workload**.
- **Industrial DMZ vs screened subnet:** both are buffer zones; the industrial DMZ sits between **IT and OT**, the screened subnet sits between the **internet and the internal network**.

## Key terms

- **Lateral movement:** an attacker moving from one compromised system to others.
- **IoT:** Internet of Things.
- **IIoT:** Industrial Internet of Things.
- **OT:** operational technology.
- **ICS:** industrial control system.
- **SCADA:** Supervisory Control and Data Acquisition.
- **PLC:** programmable logic controller.
- **Industrial DMZ:** buffer zone that prevents direct IT-to-OT connections.
- **Jump host:** a hardened, monitored system used as the controlled entry point into a protected segment.
- **Air gap:** physical isolation from other networks.
- **BYOD:** bring your own device.
- **MDM:** mobile device management.
- **Micro-segmentation:** fine-grained, per-workload isolation.

> **Exam tip:** "Smart devices, cameras, HVAC" → separate **IoT** segment with default-deny rules. "Visitors" → **guest** network, internet only. "Personal phones" → **BYOD** segment with **NAC/MDM**. "Power grid / water plant controls" → **SCADA/ICS/OT**, isolated with an industrial DMZ and jump host, where **availability and safety** come first.
