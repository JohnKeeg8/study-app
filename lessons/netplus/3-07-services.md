# Network services

## DHCP

DHCP automatically gives clients an IP address, mask, gateway, DNS servers, and other settings.

- **DORA:**
  1. Client broadcasts **Discover** (from 0.0.0.0 to 255.255.255.255).
  2. Server sends an **Offer**.
  3. Client sends a **Request**.
  4. Server sends an **Acknowledge**.
- **Ports:** UDP **67** (server) and **68** (client).
- **Scope:** the address pool and options for one subnet.
  - **Exclusions** are addresses in the scope that are never handed out.
  - **Reservations** always give the same IP to a given MAC address.
- **Options:** **3** = default gateway, **6** = DNS servers, **15** = domain name, **66/150** = TFTP server for phones.
- **Lease:** clients renew at 50% (T1) and rebind at 87.5% (T2). Short leases help busy guest networks avoid **pool exhaustion**.
- **Relay (IP helper):** routers don't forward broadcasts, so a relay on the client's gateway forwards DHCP to a server on another subnet.
- **High availability:** DHCP **failover** pairs or split scopes.
- **No server reachable:** Windows clients self-assign an **APIPA** address (169.254.x.x).

## SLAAC (IPv6)

**Stateless address autoconfiguration:** hosts build their own address from the **router advertisement** prefix plus an interface ID (EUI-64 or random), with no server needed.
- **Stateless DHCPv6** can add extras such as DNS.
- **Stateful DHCPv6** assigns the addresses themselves. The router advertisement **M flag** says "use DHCPv6 for addresses"; the **O flag** says "get other settings".

## DNS

DNS resolves names to IP addresses on port **53** (UDP for queries, TCP for zone transfers).

| Record | Purpose |
|---|---|
| **A** | Name → IPv4 |
| **AAAA** | Name → IPv6 |
| **CNAME** | Alias → canonical name |
| **MX** | Mail server for a domain (lowest preference wins) |
| **PTR** | IP → name (reverse lookup) |
| **NS** | Authoritative name servers for a zone |
| **SOA** | Zone's primary server, serial number, timers |
| **SRV** | Host and port for a service (e.g. LDAP, SIP) |
| **TXT** | Text: SPF, DKIM, DMARC, domain verification |

- **Recursive resolver vs authoritative server:** a resolver finds answers for clients by asking root → TLD → authoritative servers; an authoritative server holds the actual records.
- **TTL:** how long answers are cached. Lower it before a migration.
- **Zone transfers:** copy a zone from primary to secondary servers. **Restrict them**, because they reveal every host.
- **Split-horizon DNS:** different answers for internal and external clients.
- **Security:**
  - **DNSSEC** signs records, which prevents spoofing and cache poisoning.
  - **DoT** (TCP **853**) and **DoH** (443) encrypt queries for privacy.

## Time: NTP, PTP, NTS

- **NTP** (UDP 123) synchronizes clocks.
  - **Stratum 0** is the reference clock (GPS, atomic); **stratum 1** servers attach directly to it.
  - Configure several servers.
- **NTS (Network Time Security)** adds cryptographic authentication to NTP, so time can't be spoofed.
- **PTP (IEEE 1588)** uses hardware timestamps for sub-microsecond accuracy (finance, telecom, industrial).
- **Why time matters:** log correlation, **Kerberos** (default 5-minute skew limit), and certificate validity all depend on accurate time.

> **Exam tip:** "Clients on another subnet get no DHCP address" → missing **relay/IP helper**. "Mail server record" → MX. "Reverse lookup" → PTR. "Secure, authenticated time" → NTS.
