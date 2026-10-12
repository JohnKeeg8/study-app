# Networking appliances

Know what each appliance does, which OSI layer it works at, and when you'd choose it.

## Core devices

| Device | Layer | What it does |
|---|---|---|
| Hub / repeater | 1 | Repeats signals out every port; one shared collision domain |
| Switch | 2 | Learns MAC addresses and forwards frames only to the right port. Each port is its own collision domain, and a VLAN is one broadcast domain |
| Router | 3 | Connects different IP networks and forwards packets using a routing table. Each interface is its own broadcast domain |
| Layer 3 switch | 2–3 | Switching plus routing between VLANs (SVIs) |
| Wireless access point | 2 | Bridges wireless clients onto the wired LAN |
| Wireless LAN controller | – | Centrally manages lightweight APs (config, RF, roaming) |

## Security appliances

- **Firewall:** permits or denies traffic between zones using rules.
  - *Stateless* filters judge each packet on its own.
  - *Stateful* firewalls track connections and allow return traffic.
  - *Next-generation (NGFW)* firewalls add application awareness, IPS, and URL filtering.
- **IDS (intrusion detection system):** passive. It watches a copy of traffic from a SPAN port or TAP and **alerts**.
- **IPS (intrusion prevention system):** inline. It can **block** traffic, so a false positive drops legitimate traffic.
- **Detection methods:** *signature-based* catches known attacks; *anomaly-based* compares against a baseline, catching unknown attacks but with more false positives.

## Traffic distribution

- **Load balancer:** spreads requests across a server pool. Methods include round-robin, least connections, and weighted.
  - Uses **health checks** to skip failed servers.
  - **Session persistence** ("sticky sessions") keeps a user on one server.
  - Can do **TLS offload**.
- **Proxy server:** makes requests on behalf of clients.
  - A **forward proxy** serves internal users, with caching and URL filtering.
  - A **reverse proxy** sits in front of web servers, protecting and offloading them.

## Storage

| | NAS | SAN |
|---|---|---|
| Access | File-level (SMB, NFS) | Block-level (looks like a local disk) |
| Network | Regular LAN | Dedicated storage network (Fibre Channel, iSCSI, FCoE) |

- **iSCSI** carries SCSI commands over IP.
- **FCoE** carries Fibre Channel over Ethernet. It isn't routable and needs lossless Ethernet.

## Other appliances

- **VPN concentrator:** terminates many VPN tunnels.
- **UTM:** all-in-one security box for small offices.
- **Content delivery network (CDN):** caches content close to users.

> **Exam tip:** IDS = detect and alert (out of band). IPS = detect and **prevent** (inline). Routers break up broadcast domains; switches break up collision domains.
