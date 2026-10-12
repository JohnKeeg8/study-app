# Network services

Every network depends on a few background services: **DHCP** hands out addresses, **SLAAC** lets IPv6 hosts address themselves, **DNS** turns names into addresses, and **NTP/PTP** keep clocks in sync. When one of these breaks, users usually just say "the internet is down", so knowing how each works is the key to troubleshooting it.

## DHCP and the DORA process

**DHCP (Dynamic Host Configuration Protocol)** automatically gives clients an **IP address, subnet mask, default gateway, DNS servers**, and other settings, so nobody has to type them in by hand. It uses **UDP 67** (server) and **UDP 68** (client).

**DORA**, the four-step lease process:
1. **Discover:** the client has no address, so it **broadcasts** from **0.0.0.0** to **255.255.255.255**: "Is there a DHCP server?"
2. **Offer:** a server offers an address and settings.
3. **Request:** the client requests the offered address (still broadcast, so other servers know their offers weren't chosen).
4. **Acknowledge (ACK):** the server confirms, and the client starts using the address.

**Lease and renewal:**
- A **lease** is how long the client may use the address.
- At **50% of the lease (T1)** the client **unicasts a DHCPREQUEST** to the server that issued it to **renew**.
- If that fails, at **87.5% (T2)** it **broadcasts** to **rebind** with any server.
- If the lease expires, the client must stop using the address and start DORA again.
- A **DHCPNAK** is the server **refusing** a request, e.g. a laptop that moved to another subnet asks to keep its old address. The client then starts over with Discover.
- **DHCPRELEASE:** the client gives the address back (e.g. `ipconfig /release`).

## DHCP scopes, reservations and options

A **scope** is the **pool of addresses and settings** a server hands out for **one subnet**, e.g. 192.168.10.100 to 192.168.10.200 /24.

- **Exclusions:** addresses **inside** the scope range that the server **won't hand out**, usually because statically configured devices (servers, printers, the router) already use them.
- **Reservations:** the server **always gives the same IP** to a specific client, identified by its **MAC address** (or client ID). The device still uses DHCP, so you manage it centrally, but its address never changes. Good for printers and cameras.
- **Lease time:** short leases (hours) for busy **guest Wi-Fi** free addresses quickly; long leases (days) for stable office desktops reduce DHCP traffic.

**Common DHCP options:**

| Option | Provides |
|---|---|
| **3** | **Default gateway** (router) |
| **6** | **DNS servers** |
| **15** | **Domain name** (DNS suffix) |
| **51** | Lease time |
| **66 / 150** | **TFTP server** address, used by **VoIP phones** to download their configuration |

Options can be set **server-wide** (apply to every scope) or **per scope** (e.g. each subnet's own gateway).

Scenario: clients get an IP address and can reach local hosts by IP but nothing off the subnet → check **option 3** (gateway). Clients reach sites by IP but not by name → check **option 6** (DNS).

## DHCP relay, redundancy and failures

**DHCP relay (IP helper):** Discover is a **broadcast**, and **routers don't forward broadcasts**. If the DHCP server sits on a different subnet, a **relay agent**, usually configured on the router interface that is the clients' **default gateway** (`ip helper-address` on Cisco), receives the broadcast and forwards it as **unicast** to the server. The server uses the relay's interface address to pick the right scope.

Scenario: a new VLAN is created and its clients get no address, while other VLANs work → the new VLAN's gateway interface is missing its **IP helper**.

**Redundancy:**
- **DHCP failover:** two servers share the lease database and can each serve the full scope.
- **Split scope:** each server holds part of the range, often **80/20**.

**When things go wrong:**
- **No server reachable:** Windows clients give themselves an **APIPA** address in **169.254.0.0/16**. They can talk only to other APIPA hosts on the local link. A 169.254.x.x address means **"DHCP failed"**.
- **Scope (pool) exhaustion:** every address is leased, so new clients get nothing. Fix it by **shortening the lease**, **enlarging the scope** (or subnet), or removing stale leases.
- **Rogue DHCP server:** an unauthorized server (a home router plugged in, or an attacker) hands out wrong gateways or DNS. **DHCP snooping** on switches only allows server replies from **trusted ports**.

## SLAAC and DHCPv6

IPv6 hosts have more ways to get an address.

**SLAAC (stateless address autoconfiguration):**
1. The host creates a **link-local** address (**fe80::/10**).
2. It receives a **Router Advertisement (RA)** from the local router, containing the network **prefix** (usually a /64).
3. It builds its own address: **prefix + interface ID**. The interface ID comes from **EUI-64** (the MAC split in half with **FFFE** inserted and the 7th bit flipped) or is **randomly generated** for privacy.
4. It checks for duplicates with **DAD** (duplicate address detection).

No server tracks who has which address, which is why it's "stateless". The router's link-local address becomes the default gateway.

**DHCPv6** uses **UDP 546** (client) and **547** (server). Clients send a **Solicit** to the multicast address **FF02::1:2** (all DHCP relay agents and servers); the exchange is **Solicit, Advertise, Request, Reply**.
- **Stateless DHCPv6:** SLAAC provides the address; DHCPv6 provides **extra settings** such as DNS servers.
- **Stateful DHCPv6:** the DHCPv6 server **assigns the addresses** and tracks them, like DHCP for IPv4.

**Router Advertisement flags tell hosts what to do:**

| Flag | Meaning |
|---|---|
| **M (managed)** = 1 | Get your **address** from **stateful DHCPv6** |
| **O (other)** = 1 | Get **other settings** (like DNS) from DHCPv6; use SLAAC for the address |
| Both 0 | SLAAC only (DNS can come from the RA itself via RDNSS) |

## How DNS resolution works

**DNS (Domain Name System)** resolves names to IP addresses on **port 53**: **UDP** for normal queries, **TCP** for zone transfers and large responses.

**What a client does when you type www.example.com:**
1. Checks its own **DNS cache** and the **hosts file** (a local text file of name-to-IP mappings that is checked before DNS; malware sometimes edits it to redirect sites).
2. Sends a **recursive query** to its configured **DNS resolver** (from DHCP option 6), meaning "give me the final answer".
3. If the resolver doesn't have it cached, it performs **iterative queries**: it asks a **root server** (which refers it to the **.com TLD servers**), then the **TLD server** (which refers it to example.com's **authoritative servers**), then the **authoritative server**, which returns the record.
4. The resolver **caches** the answer for the record's **TTL** and returns it to the client.

**Server roles:**
- **Authoritative server:** holds the **actual records** for a zone and gives the official answer.
- **Recursive resolver (caching server):** finds answers **for clients** by querying other servers, and caches them.
- **Non-authoritative answer:** an answer that came from a resolver's **cache**, not straight from the zone's authoritative server. `nslookup` labels these.
- **Forwarder:** a DNS server configured to send queries it can't answer to a **specific upstream resolver** (e.g. an ISP or public resolver) instead of walking the tree itself.

**TTL (time to live):** how long resolvers may **cache** a record. Before migrating a server to a new IP, **lower the TTL** in advance so clients pick up the change quickly.

**Clearing caches:** `ipconfig /flushdns` on Windows clears the local cache when a stale record causes trouble.

Scenario: a user reaches a website **by IP but not by name** → **DNS** is the problem.

## DNS record types

| Record | Purpose | Example |
|---|---|---|
| **A** | Name → **IPv4** address | www → 203.0.113.10 |
| **AAAA** | Name → **IPv6** address | www → 2001:db8::10 |
| **CNAME** | **Alias**: points one name to **another name** | shop → www.example.com |
| **MX** | **Mail server** for the domain, with a **preference**; **lower number = tried first** | 10 mail1, 20 mail2 |
| **PTR** | **IP → name** (reverse lookup) | 10.113.0.203.in-addr.arpa → www |
| **NS** | The **authoritative name servers** for a zone | example.com → ns1, ns2 |
| **SOA** | **Start of authority**: primary server, admin email, **serial number**, refresh and expiry timers | One per zone |
| **SRV** | **Host and port** for a service (e.g. **LDAP, Kerberos, SIP**); Active Directory clients use them to find domain controllers | _ldap._tcp |
| **TXT** | Free text: **SPF, DKIM, DMARC** email records and **domain verification** codes for SaaS providers | v=spf1 ... |

- A **CNAME** must point to a **name**, never an IP address.
- **PTR** records also help **mail servers** check that a sending server's IP resolves back to a sensible name (anti-spam).
- The **SOA serial number** must increase when the zone changes so secondary servers know to update.

## DNS zones, servers and security

**Zone types:**
- **Forward lookup zone:** **names → IPs** (A, AAAA, CNAME, MX...).
- **Reverse lookup zone:** **IPs → names** (PTR records), under **in-addr.arpa** (IPv4) or **ip6.arpa** (IPv6).

**Primary vs secondary servers:**
- The **primary** server holds the **editable master copy** of the zone.
- **Secondary** servers hold **read-only copies** received by **zone transfer** (AXFR full, IXFR incremental, over **TCP 53**). They add redundancy and spread the load.
- **Restrict zone transfers** to known secondary servers. An open transfer hands an attacker a **complete list of hostnames and IPs**.

**Other features:**
- **Split-horizon (split-brain) DNS:** the same name gets **different answers** for **internal** and **external** clients, e.g. an internal IP for staff and a public IP for everyone else.
- **Dynamic DNS (DDNS):** DHCP clients or the DHCP server **automatically update** DNS records when addresses change.

**DNS security:**

| Feature | What it protects | How |
|---|---|---|
| **DNSSEC** | **Integrity and authenticity**: prevents spoofed answers and **cache poisoning** | **Digitally signs** records; a **chain of trust** runs up to the signed **root zone**. It does **not encrypt** |
| **DoT** (DNS over TLS) | **Privacy**: hides queries from eavesdroppers | Encrypts DNS in TLS on **TCP 853** (easy to identify and block) |
| **DoH** (DNS over HTTPS) | **Privacy** | Encrypts DNS inside HTTPS on **TCP 443**, blending with web traffic |

## Time synchronization with NTP, NTS and PTP

**Why time matters:**
- **Log correlation:** you can't reconstruct an incident across devices if their clocks disagree.
- **Kerberos authentication** fails if client and server clocks differ by more than about **5 minutes** (the default).
- **Certificates** have validity dates; a wrong clock makes valid certificates look expired or not yet valid.
- Scheduled jobs, backups, and change records all rely on accurate timestamps.

**NTP (Network Time Protocol)** uses **UDP 123** and a hierarchy of **strata**:
- **Stratum 0:** the reference clock itself (**GPS**, atomic clock). Not on the network.
- **Stratum 1:** a server **directly connected** to a stratum 0 clock.
- **Stratum 2, 3...:** each level syncs from the one above. **Stratum 16** means **unsynchronized**.
- Configure **several NTP servers** so the client can detect and ignore one that gives **false time**.
- NTP typically achieves **millisecond** accuracy.

**NTS (Network Time Security)** adds **cryptographic authentication** to NTP so clients know the time really came from the trusted server. This prevents attackers from **spoofing time**.

**PTP (Precision Time Protocol, IEEE 1588)** uses **hardware timestamping** in network interfaces and switches to reach **sub-microsecond (nanosecond-level)** accuracy. The most accurate clock in the domain is the **grandmaster clock**. Used in **financial trading**, **telecom/5G**, power grids, and industrial control.

Scenario: users suddenly fail Kerberos logins and certificate warnings appear → check **time synchronization**.

## Common mix-ups

- **Exclusion vs reservation:** an exclusion is **never handed out**; a reservation is **always handed to the same MAC**.
- **Relay vs failover:** a relay **forwards DHCP across subnets**; failover provides a **second server**.
- **APIPA vs link-local IPv6:** both are self-assigned link-only addresses; **APIPA 169.254.x.x** signals **DHCP failure** on IPv4, while an IPv6 **fe80::** address is **always present** and normal.
- **SLAAC vs stateless DHCPv6 vs stateful DHCPv6:** SLAAC = host builds its own address; stateless DHCPv6 = SLAAC address **plus** DNS from a server; stateful = server **assigns the address**.
- **M vs O flag:** **M**anaged = address from DHCPv6; **O**ther = only other settings from DHCPv6.
- **A vs PTR:** A is **forward** (name → IP); PTR is **reverse** (IP → name).
- **CNAME vs A:** CNAME points to **another name**; A points to an **IP**.
- **Authoritative vs recursive:** authoritative **owns the records**; recursive **looks them up for clients**.
- **DNSSEC vs DoH/DoT:** DNSSEC **signs** (authenticity, no encryption); DoH/DoT **encrypt** (privacy).
- **NTP vs NTS vs PTP:** NTP syncs time; NTS **secures** NTP; PTP is **far more precise**.
- **Stratum numbers:** **lower is closer to the reference**, not "worse".

## Key terms

- **DORA:** Discover, Offer, Request, Acknowledge.
- **Scope:** a DHCP address pool and options for one subnet.
- **Reservation:** a fixed DHCP address tied to a MAC address.
- **IP helper / relay agent:** forwards DHCP broadcasts to a server on another subnet.
- **APIPA:** 169.254.0.0/16 self-assigned address after DHCP fails.
- **SLAAC:** IPv6 hosts building their own address from the RA prefix.
- **Router Advertisement (RA):** IPv6 router message carrying the prefix and M/O flags.
- **EUI-64:** method of building an IPv6 interface ID from the MAC address.
- **Hosts file:** local name-to-IP file checked before DNS.
- **TTL:** how long a DNS answer may be cached.
- **Forwarder:** a DNS server that sends unresolved queries to a chosen upstream resolver.
- **Zone transfer:** copying a zone from primary to secondary servers.
- **Split-horizon DNS:** different answers for internal and external clients.
- **DDNS:** automatic DNS updates when addresses change.
- **Stratum:** an NTP server's distance from the reference clock.
- **Grandmaster clock:** the most accurate clock in a PTP domain.

> **Exam tip:** "Clients on another subnet get no DHCP address" → missing **relay/IP helper**. "169.254.x.x" → **DHCP unreachable**. "Mail server record" → **MX**; "reverse lookup" → **PTR**; "service location for AD/SIP" → **SRV**; "domain verification/SPF" → **TXT**. "Signed DNS" → **DNSSEC**; "encrypted DNS" → **DoH (443) / DoT (853)**. "Secure, authenticated time" → **NTS**; "nanosecond accuracy" → **PTP**.
