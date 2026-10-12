# Modern network environments

## SDN (software-defined networking)

SDN separates the network's "brain" from the forwarding hardware:

- **Control plane:** decides where traffic goes (routing protocols, tables). In SDN this is centralized in a **controller**.
- **Data plane:** actually forwards packets.
- **Management plane:** configuration and monitoring (SSH, SNMP, APIs).
- **APIs:**
  - **Northbound** APIs connect the controller to applications and orchestration.
  - **Southbound** APIs (e.g. OpenFlow) connect the controller to switches.

## SD-WAN

SD-WAN centrally manages several WAN links (MPLS, broadband, LTE/5G) and steers traffic **by application**. It can use cheaper internet links while protecting critical apps, and it builds encrypted overlays automatically.

## VXLAN

VXLAN extends **Layer 2 over a Layer 3** network by wrapping frames in **UDP (port 4789)**.
- Its 24-bit **VNI** allows about 16 million segments, compared with 4,094 VLANs.
- **VTEPs** (VXLAN tunnel endpoints) encapsulate and decapsulate the traffic.
- It adds about 50 bytes, so increase the underlay MTU.

## Zero trust architecture (ZTA)

**Never trust, always verify.** Being "inside" the network grants nothing. Every request is checked against identity, device health, and context, with **least privilege** and **micro-segmentation**. **ZTNA** grants access per application instead of placing users on the whole network the way a traditional VPN does.

## SASE and SSE

- **SSE (Security Service Edge):** cloud-delivered security, including a secure web gateway (SWG), CASB, ZTNA, and firewall-as-a-service.
- **SASE (Secure Access Service Edge):** SSE plus SD-WAN networking, delivered from the cloud.

## Infrastructure as code (IaC)

Define network and system configuration in version-controlled files and templates, using tools like Ansible or Terraform. The benefits are **repeatable deployments, less configuration drift, peer review, and easy rollback**.

## IPv6 essentials

- **Address size:** 128 bits, written in hex. Shorten it by dropping leading zeros and replacing **one** run of zero groups with `::`. Example: 2001:0db8:0000:0000:0000:ff00:0042:8329 → **2001:db8::ff00:42:8329**.
- **Address types:**

| Type | Prefix |
|---|---|
| Global unicast (public) | 2000::/3 |
| Unique local (private) | FC00::/7 (FD00::/8 in practice) |
| Link-local | FE80::/10 |
| Multicast | FF00::/8 |
| Loopback | ::1 |

- **No broadcast:** IPv6 uses multicast and anycast instead.
- **SLAAC:** hosts build their own address from the router advertisement prefix (using EUI-64 or a random interface ID).
- **NDP** (Neighbor Discovery Protocol, over ICMPv6) replaces ARP and finds routers.
- **Transition methods:**
  - **Dual stack** runs both protocols.
  - **Tunneling** carries IPv6 inside IPv4.
  - **NAT64** lets IPv6-only hosts reach IPv4 services.

> **Exam tip:** "Steer traffic across multiple WAN links by application" → SD-WAN. "Layer 2 over Layer 3, 16 million segments" → VXLAN. "Never trust, always verify" → zero trust.
