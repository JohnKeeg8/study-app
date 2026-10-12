# Networking appliances

A networking appliance is a device, physical or virtual, that does one networking job: connecting, forwarding, protecting, distributing, or storing. For each one, know **what it does, which OSI layer it works at, and when you'd choose it**.

## Switches and routers

**Switch (Layer 2):**
- Connects devices **within** a network.
- Learns which **MAC address** is on which port by reading the *source* MAC of incoming frames, storing it in its **MAC (CAM) table**.
- Forwards a frame **only out the port** where its destination lives.
- **Unknown destinations and broadcasts are flooded** out every port in the VLAN (except the one they came in on).
- **Each switch port is its own collision domain.** All ports in the same VLAN share **one broadcast domain**.

**Router (Layer 3):**
- Connects **different IP networks** and forwards **packets** using a **routing table** of destination networks.
- **Does not forward broadcasts by default**, so **each router interface is a separate broadcast domain**.
- Often also does NAT and acts as the default gateway for its subnets.

**Layer 3 (multilayer) switch:** switches at Layer 2 *and* routes between VLANs at Layer 3. Common at the distribution and core layers.

**Hub / repeater (Layer 1):** repeats signals out every port with no address awareness. Everything shares one collision domain. Obsolete, but still on the exam.

## Firewalls

A firewall enforces rules about which traffic may pass between **zones** of different trust (e.g. internet ↔ internal LAN).

| Type | How it decides |
|---|---|
| **Stateless packet filter** | Checks each packet on its own (IP, port, protocol), with no memory of connections |
| **Stateful firewall** | Tracks connections in a **state table** and automatically allows the **return traffic** of sessions it saw start |
| **Next-generation firewall (NGFW)** | Stateful, plus **application awareness** (identifies apps regardless of port), built-in **IPS**, URL filtering, and threat intelligence |
| **Host-based firewall** | Software on one endpoint protecting only that host |

## IDS and IPS

Both look for attacks using:
- **Signature-based detection:** matches known attack patterns. Accurate for known threats; misses brand-new (zero-day) attacks.
- **Anomaly/behavior-based detection:** alerts on deviations from a learned **baseline**. Can catch unknown attacks but produces more **false positives**.

| | IDS (intrusion detection system) | IPS (intrusion prevention system) |
|---|---|---|
| Placement | **Out of band**, watching a copy of traffic from a **SPAN port or TAP** | **Inline**, in the traffic path |
| Action | **Detects and alerts** | **Detects and blocks/drops** |
| Risk | Misses being stopped | A false positive **blocks legitimate traffic** |

## Load balancers and proxies

**Load balancer:**
- Spreads client requests across a **pool of servers** behind one **virtual IP (VIP)**, for performance and availability.
- **Methods:** **round-robin** (take turns), **least connections** (send to the least busy server), weighted.
- **Health checks** remove failed servers from the pool automatically.
- **Session persistence / sticky sessions** keep a user on the same server (e.g. a shopping cart).
- **TLS/SSL offload:** the load balancer does the encryption work instead of the servers.

**Proxy server:** makes requests *on behalf of* clients.
- **Forward proxy:** serves **internal users** going out to the internet. Caching, **URL/content filtering**, logging.
- **Reverse proxy:** sits **in front of servers**, receiving outside requests and passing them in. Protects servers and does caching and TLS termination.

## Storage: NAS and SAN

| | **NAS** (network-attached storage) | **SAN** (storage area network) |
|---|---|---|
| Access type | **File-level** (shared folders) | **Block-level** (servers see raw disks) |
| Protocols | **SMB** (Windows), **NFS** (Linux/Unix) | **Fibre Channel**, **iSCSI**, **FCoE** |
| Network | The normal LAN | Usually a dedicated, high-speed storage network |

- **iSCSI:** carries SCSI disk commands over normal **TCP/IP**.
- **FCoE:** carries Fibre Channel frames directly over **Ethernet**. Not routable, and needs lossless Ethernet.

## Wireless devices

- **Wireless access point (AP):** bridges wireless clients onto the wired LAN (Layer 2).
- **Autonomous (thick) AP:** configured individually and works alone.
- **Lightweight (thin) AP:** managed centrally by a **wireless LAN controller (WLC)**, which handles configuration, firmware, RF tuning, and roaming.
- **Wireless bridge:** links two sites point-to-point over the air.

## Other appliances to recognize

- **VPN concentrator / headend:** terminates large numbers of VPN tunnels.
- **UTM (unified threat management):** one box combining firewall, antivirus, content filtering, and VPN, popular with small businesses.
- **Content delivery network (CDN):** servers worldwide cache content close to users.
- **Modem:** converts between the provider's medium (cable, DSL) and your Ethernet.
- **WAN optimizer:** deduplication, compression, and caching to speed up WAN links.
- **VoIP gateway:** connects an IP phone system to the traditional phone network.

## Common mix-ups

- **IDS vs IPS:** IDS **watches and alerts** (passive, out of band). IPS **blocks** (inline). "Inline" or "drops traffic" → IPS.
- **Collision vs broadcast domains:** switches break up **collision** domains (per port). **Routers** (and VLANs) break up **broadcast** domains.
- **Forward vs reverse proxy:** forward = protects and controls **clients**; reverse = protects and fronts **servers**.
- **NAS vs SAN:** NAS = **files** over the LAN (SMB/NFS); SAN = **blocks** over a storage network (FC/iSCSI).
- **Stateful vs stateless:** stateful **remembers connections** and allows replies automatically; stateless needs explicit rules both ways.
- **Load balancer vs proxy:** a load balancer's main job is **spreading load across servers**; a forward proxy's main job is **acting for clients**.

## Key terms

- **MAC (CAM) table:** a switch's map of MAC addresses to ports.
- **Flooding:** sending a frame out all ports when the destination is unknown or it's a broadcast.
- **State table:** a stateful firewall's list of active connections.
- **False positive:** legitimate activity wrongly flagged as an attack.
- **Health check:** a load balancer's probe that tests whether a server is responding.
- **VIP:** the single virtual address clients use to reach a load-balanced service.

> **Exam tip:** "Alert only" → IDS. "Inline and blocks" → IPS. "Different networks" → router. "Spread traffic across web servers" → load balancer. "File shares" → NAS. "Block storage" → SAN.
