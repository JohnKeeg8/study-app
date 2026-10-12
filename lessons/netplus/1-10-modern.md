# Modern network environments

This objective covers newer ways of building and securing networks: software-defined control, overlays, zero trust, cloud-delivered security, automation, and IPv6.

## SDN

**Software-defined networking** separates the decision-making from the forwarding hardware and centralizes the decisions in software. Every network device has three logical "planes":

| Plane | Job | Examples |
|---|---|---|
| **Control plane** | **Decides** where traffic should go | Routing protocols, routing tables, STP |
| **Data (forwarding) plane** | **Actually forwards** packets and frames | Switching ASICs forwarding traffic |
| **Management plane** | **Configures and monitors** the device | SSH, SNMP, web GUI, APIs |

In SDN, a central **SDN controller** runs the control plane for many devices and **programs** their forwarding through APIs:
- **Southbound APIs** (e.g. OpenFlow): controller → network devices.
- **Northbound APIs** (often REST): applications and orchestration tools → controller.

**Benefits:** centralized, network-wide view; automation; consistent policy.

## SD-WAN

**Software-defined WAN** manages several WAN links at once (MPLS, broadband internet, LTE/5G) from a **central controller**:
- **Application-aware routing:** steers each application over the best link (e.g. voice over the lowest-latency path, bulk backups over cheap broadband).
- **Cheaper links:** can replace or supplement expensive MPLS circuits with broadband while protecting critical apps.
- **Automatic overlays:** builds **encrypted tunnels** between sites and provides zero-touch branch deployment.

## VXLAN

**Virtual Extensible LAN** extends **Layer 2 networks across a Layer 3 network** by **encapsulating Ethernet frames inside UDP** (port **4789**).
- **Scale:** a 24-bit **VNI (VXLAN Network Identifier)** allows about **16 million** segments, vs **4,094** usable 802.1Q VLANs. That matters for large multi-tenant data centers.
- **VTEPs (VXLAN tunnel endpoints)**, on leaf switches or hypervisors, wrap and unwrap the traffic.
- **MTU:** encapsulation adds about **50 bytes**, so the **underlay MTU must be raised** (e.g. 1550+ or jumbo) to avoid fragmentation.

## Zero trust

Traditional networks trusted anything **inside** the perimeter. **Zero trust architecture (ZTA)** assumes the network is already compromised: **"never trust, always verify."**
- **Every request** is authenticated and authorized using **identity, device health (posture), and context** (location, time).
- **Least privilege:** access only to the specific resources needed.
- **Micro-segmentation** limits **lateral movement** if something is compromised.
- **ZTNA (zero trust network access)** grants access **per application** after verification. A traditional **VPN** places the user **on the network**.

## SASE and SSE

- **SSE (Security Service Edge):** **cloud-delivered security**, including:
  - **Secure web gateway (SWG):** web filtering.
  - **CASB (cloud access security broker):** controls use of SaaS apps.
  - **ZTNA.**
  - **Firewall as a service.**
- **SASE (Secure Access Service Edge):** **SSE + SD-WAN networking**, delivered together from the cloud. In short: **SASE = SD-WAN + SSE**.

These suit organizations whose users and apps are spread out (remote work, SaaS) instead of sitting behind one headquarters firewall.

## Infrastructure as code

**IaC** defines network and system configuration in **machine-readable files** (templates, playbooks) that tools like **Ansible** or **Terraform** apply automatically.
- **Benefits:** **repeatable, consistent deployments**, **less configuration drift** (re-applying code restores the intended state), faster changes.
- **Version control (Git)** keeps every change in history, enables **peer review**, and allows easy **rollback**.

## IPv6

**Format:** **128 bits**, written as eight groups of four hexadecimal digits. Two shortening rules:
1. Drop **leading zeros** in each group (0db8 → db8).
2. Replace **one** run of all-zero groups with **::** (only once per address).

Example: 2001:0db8:0000:0000:0000:ff00:0042:8329 → **2001:db8::ff00:42:8329**

**Address types:**

| Type | Prefix | Like IPv4… |
|---|---|---|
| **Global unicast** | 2000::/3 | Public addresses |
| **Unique local** | FC00::/7 (FD00::/8 in practice) | RFC 1918 private |
| **Link-local** | **FE80::/10** | APIPA; every interface has one |
| **Multicast** | FF00::/8 | Class D (and replaces broadcast) |
| **Loopback** | **::1** | 127.0.0.1 |
| **Unspecified** | :: | 0.0.0.0 |

**How IPv6 works differently:**
- **No broadcast:** uses **multicast** and **anycast** instead.
- **NDP (Neighbor Discovery Protocol)**, using ICMPv6, **replaces ARP** and discovers routers through router solicitations and advertisements.
- **SLAAC:** hosts **configure their own address** from the router advertisement prefix plus an interface ID.
  - **EUI-64** builds the 64-bit interface ID from the 48-bit MAC by inserting **FFFE** in the middle and flipping the 7th bit.
  - Many systems use random interface IDs for privacy instead.

**Transition methods:**
- **Dual stack:** devices run **IPv4 and IPv6 at the same time**. The most common approach.
- **Tunneling** (6to4, GRE…): carries **IPv6 inside IPv4** across IPv4-only networks.
- **NAT64** (with DNS64): translates so **IPv6-only clients can reach IPv4-only servers**.

## Common mix-ups

- **Control vs data vs management plane:** control **decides**, data **forwards**, management **configures**.
- **Northbound vs southbound:** northbound = **apps ↔ controller**; southbound = **controller ↔ devices**.
- **SD-WAN vs SDN:** SDN is the general concept (often in the data center); SD-WAN applies it to **branch WAN links**.
- **SASE vs SSE:** SSE is **security only**; SASE adds **SD-WAN** networking.
- **ZTNA vs VPN:** ZTNA grants **per-app** access after verification; a VPN typically gives **network-level** access.
- **VLAN vs VXLAN:** VLAN = **12-bit ID** (4,094), Layer 2 only. VXLAN = **24-bit VNI** (~16 million), Layer 2 **over** Layer 3.
- **IPv6 link-local vs unique local:** FE80 = link-only (like APIPA); FC00/FD00 = private, routable within the organization.
- **"::" rule:** it can appear **only once** in an address.

## Key terms

- **Overlay / underlay:** the virtual network (e.g. VXLAN) built on top of the physical routed network.
- **VTEP:** the VXLAN tunnel endpoint.
- **Micro-segmentation:** fine-grained isolation down to individual workloads.
- **Configuration drift:** devices slowly diverging from their intended configuration.
- **Dual stack:** running IPv4 and IPv6 together.

> **Exam tip:** "Never trust, always verify" → zero trust. "Steer apps across multiple WAN links" → SD-WAN. "Layer 2 over Layer 3, 16 million segments" → VXLAN. "SD-WAN + cloud security" → SASE.
