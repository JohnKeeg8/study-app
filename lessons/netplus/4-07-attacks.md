# Types of attacks

## Denial of service

- **DoS:** one source overwhelms a target. **DDoS:** many sources, usually a **botnet**. Both attack **availability**.
- **SYN flood:** half-open TCP connections exhaust the server (mitigation: SYN cookies).
- **Amplification/reflection:** small spoofed requests to open DNS, NTP, or memcached servers produce large responses aimed at the victim.

## Layer 2 attacks

| Attack | How it works | Defense |
|---|---|---|
| **VLAN hopping: switch spoofing** | Attacker negotiates a trunk via DTP and reaches all VLANs | Hard-code access ports, disable DTP |
| **VLAN hopping: double tagging** | Two 802.1Q tags; the outer (native VLAN) tag is stripped and the inner tag reaches another VLAN | Unused native VLAN, tag the native VLAN |
| **MAC flooding** | Fake MACs fill the CAM table, so the switch floods frames like a hub and the attacker can sniff | **Port security** (limit MACs per port) |
| **ARP poisoning/spoofing** | Forged ARP replies link the attacker's MAC to another IP (often the gateway), putting the attacker on-path | **Dynamic ARP Inspection (DAI)** |
| **STP manipulation** | Superior BPDUs make the attacker's device the root bridge | BPDU guard, root guard |

## Spoofing and rogue services

- **DNS poisoning/spoofing:** false DNS records in a resolver cache (or a modified hosts file) send users to malicious sites. Defense: **DNSSEC**.
- **Rogue DHCP server:** hands out a malicious gateway or DNS server. Defense: **DHCP snooping**. **DHCP starvation** exhausts the address pool first.
- **Rogue devices:** unauthorized APs, switches, or routers plugged into the network. Defenses: NAC, port security, wireless IDS/IPS.
- **Evil twin:** a fake AP using the **same SSID** as the real one to capture credentials. Defenses: 802.1X with server certificate validation, WIPS. **Deauthentication** attacks often push users onto it (defense: 802.11w PMF).
- **IP and MAC spoofing:** forging source addresses.

## On-path attack

Formerly "man-in-the-middle". The attacker secretly sits between two parties, intercepting or altering traffic. ARP poisoning, rogue APs, and DNS spoofing are common ways in. Defense: **encryption with proper certificate validation** (TLS, VPN).

## Social engineering

| Attack | Description |
|---|---|
| **Phishing** | Fraudulent messages that steal information or deliver malware |
| Spear phishing / whaling | Targeted at specific people / at executives |
| Vishing / smishing | By voice call / by SMS |
| **Dumpster diving** | Searching trash for documents and devices |
| **Shoulder surfing** | Watching someone type or read sensitive information |
| **Tailgating / piggybacking** | Following an authorized person through a secure door |
| Pretexting | A made-up scenario to extract information |
| Baiting | Leaving infected USB drives for someone to plug in |

Other attacks to know: **brute force** and **password spraying** (defense: MFA, lockout) and **ransomware** (defense: offline backups, patching, segmentation).

> **Exam tip:** Match each attack to its Layer 2 defense: MAC flooding → port security; ARP spoofing → DAI; rogue DHCP → DHCP snooping; double tagging → change the native VLAN.
