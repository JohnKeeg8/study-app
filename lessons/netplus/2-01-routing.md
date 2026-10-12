# Routing technologies

Routers forward packets between networks using a **routing table**. Each entry has a destination prefix, a next hop or exit interface, an administrative distance, and a metric.

## Static vs dynamic routing

- **Static routes:** entered by hand. Predictable, low overhead, but they don't adapt to failures.
  - A **default route** (0.0.0.0/0) is the "gateway of last resort".
  - A **floating static route** has a higher administrative distance and acts as a backup.
- **Dynamic routing protocols:** learn routes automatically and reconverge around failures.

| Protocol | Type | Metric | Notes |
|---|---|---|---|
| RIP | Distance vector | Hop count (max 15) | Slow and legacy |
| OSPF | Link state | Cost (from bandwidth) | Areas, with **Area 0** as the backbone; SPF algorithm; IP protocol 89 |
| EIGRP | Advanced distance vector (hybrid) | Bandwidth + delay | Cisco; DUAL algorithm with feasible successors for fast failover |
| BGP | Path vector | Path attributes (AS_PATH and others) | Routes **between autonomous systems** (the internet); TCP 179 |

- **IGP vs EGP:** OSPF, EIGRP, and RIP are **interior** gateway protocols (within one organization). BGP is the **exterior** protocol. eBGP runs between ASes and iBGP runs inside one.
- **Loop prevention:** distance vector uses **split horizon** and route poisoning. BGP rejects routes whose AS_PATH already contains its own AS.

## Route selection (in order)

1. **Longest prefix match.** The most specific route wins: /24 beats /16 beats /0.
2. **Administrative distance** (lower = more trusted) breaks ties between sources for the same prefix:

| Source | AD |
|---|---|
| Connected | 0 |
| Static | 1 |
| eBGP | 20 |
| EIGRP (internal) | 90 |
| OSPF | 110 |
| RIP | 120 |
| iBGP | 200 |

3. **Metric** decides within one protocol. Equal metrics can be load-shared with **ECMP**.

## NAT and PAT

- **Static NAT:** a permanent 1:1 mapping, used for servers that must be reachable.
- **Dynamic NAT:** maps from a pool of public addresses.
- **PAT (NAT overload):** many private hosts share **one** public IP, told apart by **source port**. This is how most homes and offices work.
- **Port forwarding:** a public IP and port map to an inside host and port.
- **Terminology:** *inside local* = private address; *inside global* = the public address it's translated to.

## FHRP and VIP

**First hop redundancy protocols** give hosts a **virtual IP (VIP)** as their default gateway, shared by two or more routers.
- **HSRP** (Cisco) uses active and standby routers.
- **VRRP** (open standard) uses master and backup routers.
- **GLBP** (Cisco) adds load balancing.
- **Preemption** lets a higher-priority router take back the active role.

## Subinterfaces

**Router-on-a-stick:** one physical router port carries many VLANs over an 802.1Q trunk, using one **subinterface** per VLAN (e.g. Gi0/0.10 with `encapsulation dot1Q 10`). A Layer 3 switch does the same job with **SVIs**.

> **Exam tip:** First check **prefix length**, then **AD**, then **metric**. "Many hosts, one public IP" → PAT. "Gateway survives a router failure" → FHRP/VIP.
