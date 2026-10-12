# Routing technologies

Routers forward **packets between different IP networks**. For every packet, a router looks up the destination IP in its **routing table** and sends the packet toward the best match. This lesson covers how routes get into that table, how the router chooses between them, and the related technologies NAT, FHRP, and subinterfaces.

## The routing table

Each route entry contains:
- **Destination network and prefix**, e.g. 10.20.0.0/16.
- **Next hop** (the neighbor router's IP) and/or **exit interface**.
- **Administrative distance:** how trustworthy the route's source is.
- **Metric:** the cost of this path, as measured by its routing protocol.

**Where routes come from:**
- **Connected:** networks on the router's own interfaces.
- **Static:** typed in by an admin.
- **Dynamic:** learned from routing protocols.

**Default route:** **0.0.0.0/0**, the "gateway of last resort", matches every destination and is used when nothing more specific matches.

**No match and no default route:** the router **drops** the packet and usually sends an **ICMP Destination Unreachable** back to the source.

**TTL:** each router decreases the packet's **TTL** by 1. At 0, the packet is discarded and an ICMP **Time Exceeded** is sent back. This stops routing loops from circulating packets forever, and **traceroute** uses it to discover each hop.

## Static routing

An admin manually enters routes, e.g. "to reach 10.50.0.0/16, send to 192.168.1.2".
- **Pros:** predictable, no protocol overhead, secure (nothing to spoof).
- **Cons:** doesn't adapt to failures, and becomes unmanageable in big networks.
- **Good uses:** small networks, **stub networks** (one way in and out), and a branch's **default route to its ISP**.
- **Floating static route:** a static route with a **higher administrative distance** than the primary. It stays out of the table until the primary route disappears, then takes over as a **backup**.

## Dynamic routing protocols

Routers share route information automatically and **reconverge** around failures. **Convergence** is when all routers agree on the updated topology.

| | **RIP** | **OSPF** | **EIGRP** | **BGP** |
|---|---|---|---|---|
| Type | Distance vector | **Link state** | Advanced distance vector ("hybrid") | **Path vector** |
| Metric | **Hop count** (max 15; 16 = unreachable) | **Cost** (from bandwidth) | **Bandwidth + delay** | Path attributes (**AS_PATH**, local preference…) |
| Scope | Interior (IGP) | Interior (IGP) | Interior (IGP), Cisco origin | **Exterior** (EGP): between autonomous systems |
| Notes | Slow, legacy | Areas; **Area 0 = backbone**; SPF (Dijkstra) algorithm; fast convergence | DUAL algorithm; keeps **feasible successors** (pre-computed backups) | Runs the internet; **TCP 179** |

**How the types differ:**
- **Distance vector:** routers tell neighbors their routes and distances ("routing by rumor"). Loop prevention includes **split horizon** (don't advertise a route back out the interface it came from).
- **Link state:** every router learns the **full topology map** and calculates best paths itself, so it **converges faster**.
- **Path vector (BGP):** chooses routes by path attributes. It rejects any route whose **AS_PATH already contains its own AS number**, which prevents loops between ASes.

**OSPF details:**
- Routers discover neighbors with **hello** packets (multicast 224.0.0.5).
- Neighbors must agree on area, subnet, hello/dead timers, authentication, and MTU.
- Multi-area OSPF connects every area to **Area 0** through **area border routers (ABRs)**.
- On Ethernet segments a **designated router (DR)** reduces adjacencies.

**BGP details:**
- An **autonomous system (AS)** is a network under one routing policy, identified by an **ASN**.
- **eBGP** runs **between** ASes; **iBGP** runs **inside** one AS.
- You need BGP when **multihoming** to several ISPs with your own public address space. A single-homed office just needs a static default route.

## Route selection

When several routes could match a packet, the router decides **in this order**:

**1. Longest prefix match.** The **most specific** route wins, regardless of protocol. For 10.1.1.50, a route to 10.1.1.0/24 beats 10.1.0.0/16, which beats 10.0.0.0/8, which beats 0.0.0.0/0.

**2. Administrative distance (AD).** Only when routes to the **same prefix** come from **different sources**. **Lower AD wins.**

| Route source | Default AD |
|---|---|
| Directly connected | **0** |
| Static | **1** |
| eBGP | **20** |
| EIGRP (internal) | **90** |
| OSPF | **110** |
| RIP | **120** |
| iBGP | **200** |

**3. Metric.** Among routes from the **same protocol** to the same prefix, the **lowest metric** wins. If metrics tie, the router can **load-share** across them: **ECMP**, equal-cost multipath.

## NAT and PAT

**Network address translation** rewrites addresses as packets cross the edge, usually translating **private (RFC 1918) addresses to public ones**. It conserves IPv4 addresses and hides internal addressing (but it isn't a firewall).

| Type | Mapping | Typical use |
|---|---|---|
| **Static NAT** | **One-to-one, permanent** | A server that must always be reachable at the same public IP |
| **Dynamic NAT** | One-to-one, from a **pool** of public IPs, as needed | When the pool runs out, new hosts can't translate |
| **PAT** (NAT overload) | **Many-to-one**: many private hosts share **one public IP**, told apart by **unique source ports** | Almost every home and office internet connection |
| **Port forwarding** (static PAT) | Public IP:port → a specific inside host:port | Publishing an internal web server on 443 |

**Terminology:**
- **Inside local:** the host's real private address.
- **Inside global:** the public address it's translated to.

A full translation table (port exhaustion) blocks new outbound connections.

## FHRP and virtual IPs

Hosts have **one default gateway**. If that router fails, they're cut off. **First hop redundancy protocols** fix this by having two or more routers share a **virtual IP (VIP)** and virtual MAC. **Hosts use the VIP as their gateway**, and whichever router is currently active answers for it.

| Protocol | Roles | Notes |
|---|---|---|
| **HSRP** | Active / standby | Cisco-proprietary |
| **VRRP** | Master / backup | **Open standard** |
| **GLBP** | Several forwarders | Cisco; adds load balancing |

- **Priority** decides which router is active (highest wins).
- **Preemption** lets a higher-priority router **take back** the active role when it returns.
- **Failover** is invisible to hosts because the gateway IP never changes.

**VIP** also appears in **load balancing**: clients connect to one virtual IP that fronts a pool of servers.

## Subinterfaces

A **subinterface** is a logical interface carved out of one physical interface, e.g. **Gi0/0.10** and **Gi0/0.20**.
- **Router-on-a-stick:** one router port connects to a switch **trunk**. Each subinterface handles one VLAN (`encapsulation dot1Q 10`) and has an IP that serves as that VLAN's gateway. The router routes **between VLANs** over the single link.
- **On a Layer 3 switch:** the same job is done with **SVIs** (switched virtual interfaces, e.g. `interface vlan 10`).
- **If one VLAN doesn't route:** check that subinterface's **VLAN tag and IP**, and that the VLAN is **allowed on the trunk**.

## Common mix-ups

- **Prefix length vs AD:** prefix length is checked **first**. A /24 learned by RIP beats a /16 from OSPF, because they're different prefixes. AD only compares **identical** prefixes.
- **AD vs metric:** AD compares **different sources**; metric compares paths **within one protocol**.
- **Lower is better:** for both AD and metric.
- **Static NAT vs PAT:** static = **one-to-one**; PAT = **many-to-one using ports**.
- **HSRP vs VRRP:** HSRP is **Cisco** (active/standby); VRRP is the **open standard** (master/backup).
- **Interior vs exterior:** OSPF/EIGRP/RIP route **inside** an organization; BGP routes **between** organizations.
- **Link state vs distance vector:** link state knows the **whole map**; distance vector trusts **neighbors' summaries**.

## Key terms

- **Gateway of last resort:** the default route.
- **Convergence:** all routers agreeing on the topology after a change.
- **Autonomous system (AS):** a network under one routing policy, with an ASN.
- **Floating static route:** a backup static route with a higher AD.
- **ECMP:** load-sharing across equal-cost routes.
- **SVI:** a routed interface for a VLAN on a Layer 3 switch.

> **Exam tip:** Route selection = **longest prefix → lowest AD → lowest metric**. Memorize the AD table. "Many hosts, one public IP" → PAT. "Gateway survives a router failure" → FHRP with a VIP.
