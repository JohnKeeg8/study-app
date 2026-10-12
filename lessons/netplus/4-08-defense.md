# Security features & defense

This topic covers the controls you configure to stop the attacks in the previous lesson: **hardening devices**, controlling **who and what may connect** (NAC, 802.1X, port security, MAC filtering), **filtering traffic** with ACLs and URL/content filters, organizing the network into **trusted and untrusted zones** with a **screened subnet**, and **managing keys**. Good defense is layered: no single control stops everything.

## Device hardening

**Hardening** means **reducing a device's attack surface**: removing anything an attacker could use and securing what's left. Apply it to every switch, router, firewall, AP, and server.

- **Change default passwords and accounts.** Default credentials are published online and are the first thing attackers try. Use strong unique passwords, **central AAA** (RADIUS/TACACS+) for admin logins, and **MFA** where supported.
- **Disable unused ports.** Shut down (administratively disable) unused switch ports and place them in an unused **parking/black-hole VLAN**, so nobody can plug in an unauthorized device.
- **Disable unused services.** Turn off anything not needed: the HTTP server, Telnet, CDP/LLDP on edge ports facing untrusted networks, and legacy "small servers". Every running service is a possible vulnerability.
- **Use secure protocols:** **SSH** instead of Telnet, **HTTPS** instead of HTTP, **SFTP/SCP** instead of FTP/TFTP, and **SNMPv3** (with authPriv for authentication and encryption) instead of SNMPv1/v2c community strings.
- **Patch firmware** regularly and **verify firmware signatures/hashes** so only authentic, untampered vendor images run.
- **Restrict management access:** management ACLs so only admin subnets can reach SSH/HTTPS/SNMP, or a separate out-of-band management network.
- **Login banner:** a legal warning that unauthorized access is prohibited and activity may be monitored.
- **Authenticate routing protocols** (e.g. OSPF with SHA) so rogue neighbors can't inject false routes.
- **Log** to a central syslog/SIEM with NTP time, and keep **IPS signatures** updated so new threats are detected.

> Scenario: an auditor finds that a branch switch still accepts Telnet logins with the vendor's default "admin" password. Two hardening failures: insecure protocol and default credentials.

## Network access control (NAC)

**NAC** checks **who and what** is connecting **before** granting network access, then applies policy. It's how you stop rogue devices and unhealthy machines at the door.

**802.1X** is the standard for port-based authentication, on both wired and wireless networks. Three roles:
- **Supplicant:** the client device requesting access.
- **Authenticator:** the switch or AP, which blocks the port until authentication succeeds.
- **Authentication server:** usually **RADIUS**, which checks credentials or certificates.

Using **RADIUS attributes**, the server can tell the switch to place each user in a **dynamic VLAN** or apply an ACL based on role (e.g. staff VLAN vs contractor VLAN).

**Posture assessment** checks device health: antivirus running and current, OS patched, firewall enabled, disk encrypted. A device that **fails** is placed in a **quarantine/remediation VLAN** where it can only reach update servers until it's fixed.

**Agent-based vs agentless:**
- **Agent-based (persistent or dissolvable):** software on the device reports detailed posture. Best for managed corporate PCs.
- **Agentless:** identifies devices using **network scans, DHCP fingerprinting**, and other passive data. Suits IoT, printers, and guest devices that can't run an agent.

**MAC authentication bypass (MAB):** for devices that **can't do 802.1X** (printers, cameras, some phones), the switch sends the device's **MAC address** to RADIUS as its identity. Convenient, but weaker, because MACs can be **spoofed**.

## Port security and MAC filtering

**Port security** is a switch feature that controls **which and how many MAC addresses** may use an access port.
- **Limit MACs per port** (e.g. 1 or 2 for a PC plus an IP phone). This defeats **MAC flooding**.
- **Sticky learning:** the switch learns the first MAC(s) it sees and saves them as allowed.
- **Violation modes:** **shutdown** (port goes **err-disabled**, the default and most secure), **restrict** (drop and log), **protect** (drop silently).

**MAC filtering** allows or blocks devices by MAC address, on switches or wireless APs. It's easy to set up but **weak on its own**, because MAC addresses are visible on the network and **easily spoofed**. Treat it as one layer, never the only control.

**Other switch-level protections** that block Layer 2 attacks:
- **DHCP snooping:** only **trusted ports** (those facing legitimate DHCP servers) may send DHCP offers and acks, which stops rogue DHCP. It also builds a **binding table** of IP, MAC, port, and VLAN.
- **Dynamic ARP Inspection (DAI):** checks ARP packets against the DHCP snooping binding table, which stops ARP spoofing.
- **BPDU guard and root guard:** protect spanning tree from rogue switches.
- **Storm control:** limits broadcast/multicast floods.

## Access control lists (ACLs)

An **ACL** is an **ordered list of permit and deny rules** applied to an interface (inbound or outbound) that filters traffic by fields such as source/destination IP, protocol, and port.

How it's processed:
1. Rules are checked **top-down**.
2. The **first matching rule wins** and processing stops.
3. If nothing matches, the **implicit deny** at the end **blocks** the traffic, even though you can't see it.

**Order matters:** put **specific rules before general ones**. If "deny 10.1.1.0/24" sits above "permit host 10.1.1.50", the host is denied because the broader rule matches first.

> Scenario: an ACL contains only "deny host 10.1.1.9". Now nothing passes at all. Why? The implicit deny blocks everything not permitted; you need a permit rule too.

**Standard vs extended:**

| Type | Matches on | Placement |
|---|---|---|
| **Standard ACL** | **Source IP only** | **Near the destination**, so it doesn't block the source from reaching other places |
| **Extended ACL** | Source and destination IP, protocol, and port | **Near the source**, so unwanted traffic is dropped before it crosses the network |

**Wildcard masks** (Cisco) are inverted subnet masks: **0.0.0.0** matches one exact host; **0.0.0.255** matches a /24.

**Firewall rules** follow the same logic. The most secure approach for inbound internet traffic is **default deny**, explicitly allowing only required services. Review rules periodically and remove unused or overly broad ones so risk doesn't build up.

## URL and content filtering

**URL filtering** blocks or allows websites by **category** (e.g. gambling, malware), **reputation score**, or **specific URL**. It's usually done by a proxy, next-generation firewall, or DNS filtering service.

**Content filtering** goes further and **inspects the content** of web traffic, email, and files to block **malware, prohibited material, or sensitive data leaving** the network.
- **Data loss prevention (DLP)** is content filtering focused on **outbound** data: it detects things like **credit card or national ID numbers** and blocks or alerts.
- Inspecting HTTPS content requires **TLS inspection** (decrypt, inspect, re-encrypt) with a trusted certificate on clients.

Related filtering:
- **Web application firewall (WAF):** protects **web applications** from application-layer attacks such as **SQL injection and cross-site scripting (XSS)**.
- **Egress filtering:** controls **outbound** traffic to block malware callbacks to C2 servers, data exfiltration, and packets with spoofed source addresses leaving your network.

## Trusted zones, untrusted zones, and the screened subnet

Firewalls divide the network into **zones** with different trust levels:
- **Trusted zone:** the **internal network**, with a higher level of trust and protection.
- **Untrusted zone:** the **internet** and anything you don't control.
- Traffic from untrusted to trusted is **denied by default**; only specific, required traffic is allowed. Outbound from trusted is usually allowed more freely (but still filtered).

**Screened subnet** (formerly called the **DMZ**, demilitarized zone): a separate zone for **public-facing servers** such as **web servers, mail relays, public DNS, and reverse proxies**. Internet users can reach these servers, but the servers can only reach the internal network in tightly limited ways. If a public server is compromised, the attacker is still outside the trusted zone.

Common designs:
- **Three-legged firewall:** one firewall with **three interfaces/zones**: internet (untrusted), screened subnet, and internal (trusted).
- **Dual firewall:** an outer firewall between the internet and the screened subnet, and an inner firewall between the screened subnet and the internal network, often from different vendors.

> Scenario: the company web server is on the internal LAN with a port forward from the internet. If it's hacked, the attacker is inside. Move it to the screened subnet.

## Key management

Encryption is only as strong as the protection of its **keys**. **Key management** covers the whole lifecycle:
- **Generate** strong keys with good randomness.
- **Store** them securely: a **hardware security module (HSM)**, TPM, or a secrets **vault**, never in plain text in scripts or configs.
- **Distribute** them securely to the systems that need them.
- **Rotate** keys and certificates periodically, which **limits the damage if a key is compromised** and how much data one key protects.
- **Revoke** compromised keys and certificates (CRL or OCSP for certificates).
- **Destroy** retired keys securely.
- **Track expiry and automate renewal**, because an expired certificate causes outages (VPNs, websites, and 802.1X fail).

Network examples: SSH host keys, TLS certificates on web servers and VPN gateways, 802.1X server certificates, Wi-Fi pre-shared keys, and SNMPv3/routing authentication keys.

## Common mix-ups

- **NAC vs port security:** NAC checks **identity and health** (802.1X, posture) and assigns policy; port security just limits **which/how many MACs** use a port.
- **802.1X vs MAB:** 802.1X authenticates with **credentials or certificates**; MAB uses only the **MAC address** for devices that can't do 802.1X.
- **MAC filtering vs real authentication:** MAC filtering is **easily spoofed**; don't rely on it alone.
- **Standard vs extended ACL placement:** standard (source only) → **near the destination**; extended → **near the source**.
- **Explicit vs implicit deny:** explicit is a rule you write; **implicit deny** is the invisible final rule blocking everything else.
- **URL filtering vs content filtering:** URL filtering decides by **site/category**; content filtering **inspects what's inside** traffic and files.
- **WAF vs network firewall:** a WAF understands **HTTP and web app attacks**; a network firewall filters by IP, port, and protocol (or app identity, for NGFWs).
- **Ingress vs egress filtering:** ingress controls traffic **coming in**; egress controls traffic **going out**.
- **Screened subnet vs internal network:** public servers belong in the **screened subnet**, never on the trusted LAN.

## Key terms

- **Hardening:** reducing a device's attack surface.
- **Attack surface:** all the ways a system can be attacked.
- **NAC:** network access control.
- **802.1X:** port-based network access control using supplicant, authenticator, and authentication server.
- **Posture assessment:** checking device health before granting access.
- **Quarantine VLAN:** a restricted VLAN for non-compliant devices.
- **MAB:** MAC authentication bypass.
- **Port security:** limiting MAC addresses on a switch port.
- **Implicit deny:** the hidden final rule that blocks unmatched traffic.
- **DLP:** data loss prevention.
- **WAF:** web application firewall.
- **Screened subnet:** a zone for public-facing servers (formerly DMZ).
- **HSM:** hardware security module for storing keys.
- **Key rotation:** replacing keys periodically.

> **Exam tip:** "Check device health before granting access" → **NAC posture assessment**; failures go to a **quarantine VLAN**. "Printer can't do 802.1X" → **MAB**. "Too many MACs on a port" → **port security**. "Traffic not matched by any rule" → **implicit deny**. "Public web server location" → **screened subnet**. "Stop card numbers leaving" → **DLP**.
