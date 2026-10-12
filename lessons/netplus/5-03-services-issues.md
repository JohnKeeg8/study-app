# Network services issues

When the cabling is fine but traffic still doesn't get where it should, the cause is usually in **switching, routing, or addressing**: a spanning tree problem, a port in the wrong VLAN, an ACL, a bad route, an exhausted DHCP pool, or a host with the wrong gateway, IP, or mask. This lesson teaches how each one behaves so you can recognize it from the symptoms.

## Spanning tree problems

**Spanning Tree Protocol (STP, 802.1D)** and **Rapid STP (RSTP, 802.1w)** stop Layer 2 loops when switches have redundant links. They do it by electing a **root bridge** and **blocking** some ports.

**Network loops:** without STP (or with it disabled), two cables between switches create a loop. Ethernet frames have **no TTL**, so broadcasts circle forever.
- Symptoms: a **broadcast storm**, links at **100% utilization**, **MAC address flapping** (the same MAC seen on different ports), a pegged switch CPU, and the whole segment grinding to a halt.
- Logs showing "MAC flapping" when a particular port is connected → the device on that port is creating a loop or bridging two segments.

**Root bridge selection:** the switch with the **lowest bridge ID** becomes root. Bridge ID = **priority** (default **32768**) + **MAC address**; on a tie, the **lowest MAC** wins, which is often the **oldest** switch.
- Problem: a **new or old access switch becomes root** (e.g. someone adds a switch with a lower priority). Traffic then takes **suboptimal paths** through it, causing congestion, and a topology change briefly disrupts the network.
- Fix and prevention: **deliberately set the priority** on the core/distribution switch (e.g. 4096), and enable **root guard** on ports facing access switches so they can't become root.

**Port roles:**

| Role | Meaning | Forwards data? |
|---|---|---|
| **Root port** | The **best path toward the root bridge**; one per non-root switch | Yes |
| **Designated port** | The forwarding port **for each segment**; all ports on the root bridge are designated | Yes |
| **Alternate / backup port** | A redundant path kept in reserve | **No (blocking/discarding)** |

**Port states:**

| 802.1D state | What happens | RSTP equivalent |
|---|---|---|
| **Blocking** | Receives BPDUs only; **no data passes** | Discarding |
| **Listening** | Building the topology; no data | Discarding |
| **Learning** | Learns MAC addresses; no data yet | Learning |
| **Forwarding** | Normal operation | Forwarding |
| **Disabled** | Administratively down | Discarding |

**Slow startup:** classic STP takes **30–50 seconds** to move a new port to forwarding. PCs booting after a power outage may get **DHCP timeouts** or APIPA. Fix: **PortFast** (with **BPDU guard**) on end-user access ports, or run **RSTP**.

A user's port stuck in **blocking** passes **no data** at all.

## Incorrect VLAN assignment

**Port in the wrong VLAN:** the user lands in the wrong subnet. They get a DHCP address from the **wrong range** and can't reach the resources they need (or can reach things they shouldn't). After fixing the port's VLAN, **renew the DHCP lease** on the client.

**VLAN missing or not allowed on a trunk:** a new VLAN was created on the core, but hosts on an access switch in that VLAN can only talk to each other. Check that the VLAN **exists on every switch** and is in the trunk's **allowed VLAN list**.

**Native VLAN mismatch:** the untagged VLAN differs on each end of a trunk. Traffic **leaks between VLANs**, and the switches log **native VLAN mismatch** errors (via CDP).

**Other VLAN-related problems:**
- **Voice VLAN:** a VoIP phone gets an address from the **data** VLAN → the voice VLAN isn't configured on the port or isn't advertised via **CDP/LLDP**.
- **SVI down/down:** a Layer 3 switch's VLAN interface stays down when **no active ports** are in that VLAN, or the VLAN doesn't exist.
- **Router-on-a-stick:** VLAN 10 routes but VLAN 20 doesn't → check the VLAN 20 **subinterface's encapsulation tag and IP**, and that VLAN 20 is **allowed on the trunk**.
- **802.1X:** a laptop lands in the **guest VLAN** → authentication **failed or timed out**, so the switch used the fallback VLAN.

## ACL problems

**Access control lists** filter traffic on routers, Layer 3 switches, and firewalls. They're read **top to bottom**, and the **first match wins**.

- **Implicit deny:** every ACL ends with an invisible **deny all**. A new ACL that only has deny lines, or that forgets to permit needed traffic, **blocks everything**. Symptom: all traffic through the interface stops right after the ACL is applied.
- **Rule order:** a broad rule above a specific one shadows it. `deny ip any any` as the first line means **nothing below it is ever reached**.
- **Wrong wildcard mask or subnet:** a rule meant to block **one host** blocks the **whole subnet** (or the reverse).
- **Wrong interface or direction:** applying an ACL inbound instead of outbound, or on the wrong interface, filters the wrong traffic.
- **Blocking ICMP:** ping and traceroute fail even though real traffic works, which can **mislead troubleshooting**.
- **Firewall default deny:** a new firewall drops expected traffic and logs show it hitting the **default deny** rule → add or correct an **allow rule above** it.

Scenario: routing between two VLANs is correct, but traffic between them fails → suspect an **ACL or firewall rule**.

## Route selection and routing tables

A router forwards each packet using its **routing table**. When several routes match, it chooses in this order:

1. **Longest prefix match:** the **most specific** route wins (a /24 beats a /16 beats the /0 default route).
2. **Administrative distance (AD):** if prefixes are equal length, the most **trusted source** wins: connected 0, static 1, eBGP 20, OSPF 110, RIP 120.
3. **Metric:** within the same routing protocol, the lowest metric (cost, hop count) wins.

**Default route** (0.0.0.0/0, the **gateway of last resort**) catches everything with no more specific match. Branch routers usually send internet traffic this way.

| Problem | Symptom |
|---|---|
| **Missing route** and no default route | Packets **dropped**; "destination unreachable" |
| **Wrong or missing default route** | **Internal traffic works**, but internet or remote traffic fails |
| **Routing loop** (e.g. two static routes pointing at each other) | Traceroute shows the **same hops repeating** until the **TTL expires** |
| **Missing return route** | A can reach B, but B has **no path back** (data center can't reach a remote subnet) |
| **Asymmetric routing** | Return traffic takes a different path, **bypassing the stateful firewall** that saw the outbound session, so it's dropped |
| **Static route with the wrong mask** | Part of the intended network takes the wrong path or fails |
| **Wrong more-specific route** redistributed | **Longest prefix match** pulls traffic to the wrong place (route hijacking) |
| **Neighbor flapping** (OSPF and others) | Routes appear and disappear; caused by mismatched timers, area, MTU, authentication, or an unstable link |

**Other routing-related problems:**
- **Overlapping subnets:** a VPN user's home network uses the same range as the office (e.g. both 192.168.1.0/24), so corporate resources are unreachable.
- **NAT/PAT table exhausted:** **new** outbound connections fail while **existing** ones keep working.
- **Missing inbound NAT/port forward** after a firewall replacement: users reach the internet, but outsiders can't reach the public web server.
- **Traceroute shows `* * *`** after a certain hop: a missing route on the next router, or a firewall blocking the traffic or ICMP.

## Address pool exhaustion

A DHCP **scope** has a limited number of addresses. When every address is leased, **new** clients get nothing.

- **Symptom:** **new** devices get **APIPA (169.254.x.x)** addresses, while **existing** devices keep working (they already have leases).
- **Common cause:** **long lease times** in a busy area (guest Wi-Fi, conference rooms), so departed devices hold addresses for days.
- **Fixes:** **shorten lease times**, **expand the scope** (or use a larger subnet), and **clear stale leases**.

**Related DHCP problems:**
- **Missing DHCP relay:** one VLAN gets no addresses while other VLANs work. The DHCP server is on another subnet and the VLAN's router interface lacks an **IP helper / DHCP relay**.
- **Rogue DHCP server:** someone plugs in a home router. Clients get addresses from an **unexpected subnet** with the rogue's gateway and lose connectivity intermittently. Prevent with **DHCP snooping**.
- **Two uncoordinated DHCP servers** on one subnet → conflicting or duplicate assignments.
- **Wrong scope options:** a bad **option 3 (router)** breaks off-subnet access; a bad **option 6 (DNS)** breaks name resolution.
- **DHCPDECLINE** messages in server logs → clients found the offered address **already in use** (a conflict).

**Checking it:** `ipconfig /all` (Windows) shows the lease times and DHCP server. A **packet capture** showing Discover/Offer, or the **server logs**, proves whether the server answers.

## Incorrect default gateway

The **default gateway** is the router a host sends all **off-subnet** traffic to.

- **Symptom:** the host reaches **local** hosts but **nothing on other subnets** or the internet.
- **Gateway not on the host's subnet:** e.g. a host at 192.168.1.50/24 with gateway 192.168.2.1. The host can't ARP for it, so remote traffic fails.
- **Gateway interface shut down** or failed: same symptom; ARP for the gateway fails.
- **DHCP handing out the wrong gateway** (option 3): every client in the scope can reach local hosts only.
- **Multiple default gateways** on a server with two NICs: unpredictable routing and intermittent connectivity. Use **one** default gateway and static routes for other networks.

**Testing it:** ping the gateway. If it fails while other local hosts answer, check the gateway address, the gateway's interface, and the ARP table.

**DNS vs gateway:** if the host can **ping remote servers by IP** but **names don't resolve**, the gateway is fine; the problem is **DNS** (wrong DNS server, a bad hosts file entry, or stale **cached records** that haven't reached their TTL).

## Incorrect IP address and duplicate IPs

**Wrong IP address (wrong network):** a static IP from the wrong subnet means the host **can't communicate with anything** (except perhaps itself), because nothing local is on its network and it can't reach its gateway.

**Duplicate IP address:** two devices use the same IP.
- **Symptoms:** "**IP address conflict**" warnings and **intermittent** connectivity for both devices, as switches and hosts update ARP entries back and forth.
- **Most common cause:** a device (often a new **printer** or server) given a **static IP inside the DHCP range**, which DHCP then also leases to someone else.
- **Find it:** ping the IP, then `arp -a` to see which **MAC** answers; look up the MAC in the switch's MAC table to find the port.
- **Prevent it:** **exclude** static ranges from the DHCP scope, or use **DHCP reservations**. DHCP servers can also **ping before offering** (conflict detection).

**Stale ARP:** after a server's NIC is replaced, traffic to it fails until the router's **old ARP entry** times out or is cleared.

**"Destination host unreachable" from your own IP:** the host **couldn't ARP** for the destination or its gateway, which is a local reachability problem.

## Incorrect subnet mask

The subnet mask tells the host **which addresses are local** (delivered directly via ARP) and which are **remote** (sent to the gateway).

- **Mask too short (too big a network):** e.g. 10.1.1.20 with **255.255.0.0** when the VLAN uses 255.255.255.0. The host thinks every 10.1.x.x address is **local**, ARPs for them directly, and **fails to reach** them because they're actually behind the gateway.
- **Mask too long (too small a network):** the host thinks some **local** hosts are **remote** and sends their traffic to the gateway. It may work inefficiently or fail.
- **Gateway with a different mask** than the hosts (e.g. hosts /24, router /16): routing and reachability errors for some destinations.

The result is **partial reachability**: some destinations work and some don't, which makes the mask easy to overlook.

**Putting host settings together:**

| Setting wrong | Typical symptom |
|---|---|
| **Default gateway** | Local hosts OK; **nothing off-subnet** |
| **Subnet mask** | **Some** remote or local hosts unreachable; partial reachability |
| **IP address** (wrong network) | **Nothing** reachable |
| **Duplicate IP** | **Conflict** warnings; **intermittent** connectivity |
| **DNS server** | Works **by IP**, fails **by name** |
| **No DHCP response** | **APIPA** 169.254.x.x address |

## Common mix-ups

- **Pool exhaustion vs DHCP unreachable:** exhaustion = **new** clients get APIPA but **existing** ones are fine; unreachable server or missing relay = **everyone** on that VLAN fails to get an address.
- **Rogue DHCP vs pool exhaustion:** rogue = clients get a **valid-looking address from the wrong subnet**; exhaustion = clients get **169.254.x.x**.
- **Wrong gateway vs wrong DNS:** gateway = **can't leave the subnet** at all; DNS = **IP works, names don't**.
- **Wrong subnet mask vs wrong IP:** mask = **partial** reachability; wrong-network IP = **nothing** works.
- **Duplicate IP vs wrong IP:** duplicate = **intermittent** with **conflict warnings**; wrong IP = **consistently** broken.
- **Routing loop vs missing route:** loop = traceroute **repeats the same hops** until TTL expires; missing route = packets **dropped** with "unreachable."
- **Missing return route vs asymmetric routing:** missing return = **no path back** at all; asymmetric = a path back exists but **bypasses the stateful firewall**.
- **Root port vs designated port:** root port = **toward the root bridge** (one per switch); designated = **forwarding port for a segment**.
- **Implicit deny vs rule order:** implicit deny = traffic **not matched** by any permit is dropped; rule order = an **earlier** rule matched first.
- **Longest prefix match vs administrative distance:** prefix length is checked **first**; AD only breaks ties between equally specific routes.

## Key terms

- **Root bridge:** the STP reference switch with the lowest bridge ID.
- **Bridge ID:** priority (default 32768) plus MAC address.
- **Root guard:** stops a port's neighbor from becoming root bridge.
- **PortFast:** puts an edge port straight into forwarding.
- **Native VLAN:** the untagged VLAN on an 802.1Q trunk; must match on both ends.
- **Implicit deny:** the invisible deny-all at the end of every ACL.
- **Longest prefix match:** the most specific matching route is used.
- **Administrative distance:** trustworthiness of a route source; lower wins.
- **Gateway of last resort:** the default route (0.0.0.0/0).
- **APIPA:** 169.254.x.x self-assigned address when DHCP fails.
- **DHCP relay (IP helper):** forwards DHCP broadcasts to a server on another subnet.
- **DHCP snooping:** blocks rogue DHCP servers on untrusted ports.
- **DHCP reservation:** a fixed IP always given to a specific MAC.

> **Exam tip:** "Reach local, not remote" → default gateway. "Works by IP, not by name" → DNS. "New devices get 169.254.x.x, existing ones fine" → DHCP scope exhausted. "One VLAN gets no DHCP" → missing relay. "Same hops repeat in traceroute" → routing loop. "All traffic stopped after a new ACL" → implicit deny. "Broadcast storm and MAC flapping" → STP loop.
