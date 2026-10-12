# Traffic types

Every packet has a destination, and the destination address decides **how many devices receive it**. Network+ tests four delivery types and where each is used.

## The four types

| Type | Delivery | Example addresses | In IPv6? |
|---|---|---|---|
| **Unicast** | One sender → **one** receiver | Any normal host address | Yes |
| **Broadcast** | One → **every** host on the local network | 255.255.255.255; MAC FF:FF:FF:FF:FF:FF | **No** |
| **Multicast** | One → a **group** of hosts that asked to receive it | 224.0.0.0 – 239.255.255.255 (Class D) | Yes (FF00::/8) |
| **Anycast** | One → the **nearest** of several hosts sharing one address | Public DNS resolvers, CDNs | Yes |

## Unicast

Ordinary one-to-one traffic: a web request from your laptop to a server, an SSH session, a file download. Most network traffic is unicast. If 500 people watch the same video by unicast, the server sends **500 separate copies**.

## Broadcast

- **What it is:** a broadcast reaches **every device in the broadcast domain**: all hosts in the same VLAN or subnet.
- **Where it stops:** **switches forward broadcasts** (within the VLAN); **routers do not**. So a router interface or VLAN boundary marks the edge of a broadcast domain.
- **Limited broadcast (255.255.255.255):** all hosts on the local segment; never routed.
- **Directed broadcast** (e.g. 192.168.5.255 for 192.168.5.0/24): all hosts on a *specific remote* subnet. Routers block these by default because they were abused in Smurf DoS attacks.
- **Who uses broadcast:**
  - **ARP requests:** "Who has 192.168.1.1?" The reply comes back **unicast**.
  - **DHCP Discover:** a client with no IP sends from 0.0.0.0 to 255.255.255.255.
- **Why it's a problem at scale:** every host must process every broadcast. Big flat networks waste bandwidth and CPU. Splitting them with **VLANs** shrinks broadcast domains.

## Multicast

- **How it works:** the sender transmits **one stream**; the network copies it only toward receivers that **joined the group**. Efficient for **IPTV, live video to many viewers**, and routing protocols (OSPF uses **224.0.0.5** and 224.0.0.6).
- **IGMP:** hosts use **IGMP** (Internet Group Management Protocol) to tell their router they want to join a group.
- **IGMP snooping:** switches watch IGMP messages and send multicast only to ports with interested receivers. **Without it, a switch floods multicast like broadcast.**
- **Multicast MAC addresses:** IPv4 multicast maps to MACs beginning **01:00:5E**; IPv6 multicast maps to **33:33**.

## Anycast

- **How it works:** the **same IP address is advertised from many locations** (using BGP). Normal routing delivers each user's traffic to the **topologically closest** one.
- **Benefits:** lower latency and resilience. If one site fails, routing sends users to the next closest.
- **Examples:** public DNS resolvers like 1.1.1.1 and 8.8.8.8, DNS root servers, and CDN edge networks.
- **IPv6:** anycast is a formal IPv6 address type.

## IPv6 and broadcast

IPv6 **has no broadcast at all**. Functions that used broadcast in IPv4 use multicast instead:
- **FF02::1:** all nodes on the link.
- **FF02::2:** all routers on the link.
- **Neighbor Discovery** (instead of ARP) uses solicited-node multicast.

## Common mix-ups

- **Multicast vs broadcast:** broadcast hits **everyone** on the segment; multicast reaches **only group members**.
- **Anycast vs multicast:** anycast delivers to **one** destination (the nearest); multicast delivers to **many**.
- **ARP:** the request is **broadcast**; the reply is **unicast**.
- **Broadcast domains vs routers:** routers **stop** broadcasts; switches **pass** them within a VLAN.
- **"Which type isn't in IPv6?"** → **broadcast**.
- **Directed vs limited broadcast:** directed targets a **remote subnet's** broadcast address; limited (255.255.255.255) stays **local**.

## Key terms

- **Broadcast domain:** the set of devices that receive each other's broadcasts (a VLAN or subnet).
- **IGMP:** the protocol hosts use to join IPv4 multicast groups.
- **IGMP snooping:** switch feature that limits multicast to interested ports.
- **Class D:** 224.0.0.0/4, the IPv4 multicast range.

> **Exam tip:** "Stream one video to many viewers efficiently" → multicast. "Same address served from many places; users reach the closest" → anycast. "Not supported in IPv6" → broadcast.
