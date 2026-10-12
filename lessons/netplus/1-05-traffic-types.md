# Traffic types

How many receivers a packet is meant for:

| Type | Delivery | IPv4 example | IPv6? |
|---|---|---|---|
| **Unicast** | One sender → one receiver | Normal web or SSH traffic | Yes |
| **Broadcast** | One → **all** hosts on the local segment | 255.255.255.255, MAC FF:FF:FF:FF:FF:FF | **No** |
| **Multicast** | One → a **group** of interested hosts | 224.0.0.0 – 239.255.255.255 | Yes (FF00::/8) |
| **Anycast** | One → the **nearest** of several hosts sharing an address | DNS root servers, CDNs | Yes |

## Broadcast

- Reaches every device in the **broadcast domain**. Routers don't forward it, but switches do (within a VLAN).
- Used by **ARP requests** and **DHCP Discover**. A client with no IP sends from 0.0.0.0 to 255.255.255.255.
- Too much broadcast traffic slows every host. Segment large networks with **VLANs**.
- A *directed broadcast* (e.g. 192.168.5.255) targets a remote subnet. Routers block these by default because of Smurf attacks.

## Multicast

- Sends one stream that the network copies only where needed. It's efficient for IPTV, video streaming, and routing protocol updates. OSPF uses 224.0.0.5 and 224.0.0.6.
- Hosts join groups with **IGMP**.
- **IGMP snooping** on switches forwards multicast only to ports that want it. Without it, multicast floods like broadcast.
- IPv4 multicast MAC addresses begin **01:00:5E**.

## Anycast

- The same IP is advertised from many locations (via BGP), and routing delivers to the **closest** one. This gives low latency and resilience.
- Examples: public DNS resolvers such as 1.1.1.1 and 8.8.8.8, and CDN edges.

## IPv6 note

IPv6 has **no broadcast**. It uses multicast groups such as **FF02::1** (all nodes) and **FF02::2** (all routers), plus anycast.

> **Exam tip:** "Most efficient way to stream one video to many viewers" → **multicast**. "Traffic goes to the closest server with that address" → **anycast**. "Not supported in IPv6" → **broadcast**.
