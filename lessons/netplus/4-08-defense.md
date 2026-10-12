# Security features & defense

## Device hardening

Reduce each device's attack surface:
- **Change default credentials.** Use strong passwords, central AAA, and MFA.
- **Disable unused services and ports.** Shut unused switch ports and put them in a parking VLAN.
- **Use secure protocols:** SSH instead of Telnet, HTTPS instead of HTTP, **SNMPv3** instead of v1/v2c.
- **Patch firmware** and verify signed images.
- **Restrict management access** with ACLs to admin subnets, and add a **login banner** (a legal warning).
- **Authenticate routing protocols** so rogue neighbors can't inject routes.

## Network access control (NAC)

NAC checks **who and what** connects before granting access:
- **802.1X** authentication via RADIUS, with **dynamic VLAN or ACL** assignment by role.
- **Posture assessment:** antivirus, patches, and configuration. Non-compliant devices go to a **quarantine/remediation VLAN**.
- **MAC authentication bypass (MAB):** for devices that can't do 802.1X, such as printers. Weaker, because MACs can be spoofed.
- **Agent-based vs agentless:** agentless NAC suits IoT and guest devices.

## Access control lists (ACLs)

- **Ordered rules** processed **top-down; the first match wins**. Every ACL ends with an **implicit deny**.
- **Order matters:** put specific rules before general ones.
- **Placement:** standard ACLs (source only) go near the destination; **extended ACLs** go **near the source**.
- **Wildcard masks:** 0.0.0.0 = one host; 0.0.0.255 = a /24.
- **Review rules regularly** and remove unused or overly broad ones.

## Filtering

- **URL filtering:** block or allow sites by category, reputation, or URL.
- **Content filtering:** inspect web, email, and files for malware, prohibited content, or data leaks (**DLP**).
- **Web application firewall (WAF):** protects web apps from SQL injection and XSS.
- **Egress filtering:** control *outbound* traffic to stop malware callbacks and data exfiltration.

## Zones and the screened subnet

- **Trusted zones** (internal LAN) and **untrusted zones** (internet), with firewalls enforcing **default deny** between them.
- A **screened subnet** (formerly DMZ) holds **public-facing servers** (web, mail relays, public DNS) between the internet and the internal network. A single "three-legged" firewall can create internet, screened subnet, and internal zones.

## Key management

Generate, store (HSM or vault), distribute, **rotate**, and revoke keys and certificates. Automate renewals to avoid expiry outages.

## Layer 2 protections

- **DHCP snooping:** only trusted ports may send DHCP offers.
- **Dynamic ARP Inspection:** validates ARP against the snooping table.
- **Port security, BPDU guard, root guard, storm control.**

> **Exam tip:** "Check device health before granting access" → NAC posture assessment. "Public web server location" → screened subnet. "Traffic not matched by any rule" → implicit deny.
