# Types of attacks

To defend a network you need to recognize how it's attacked. Network+ expects you to identify an attack from its **symptoms** and match it to its **defense**: denial of service, Layer 2 attacks (VLAN hopping, MAC flooding, ARP poisoning), DNS attacks, rogue devices and evil twins, on-path attacks, social engineering, and malware.

## Denial of service

A **denial-of-service (DoS)** attack tries to make a service **unavailable** to legitimate users by exhausting its bandwidth, CPU, memory, or connection tables. It attacks **availability**, the "A" in the CIA triad.
- **DoS:** comes from **one source**. Easier to block (filter that one IP).
- **DDoS (distributed DoS):** comes from **many sources at once**, usually a **botnet**: thousands of compromised computers and IoT devices controlled remotely by an attacker through **command-and-control (C2)** servers. Much harder to block, because the traffic comes from everywhere and looks partly legitimate.

Common types:
- **Volumetric:** floods the link with more traffic than it can carry (e.g. UDP floods).
- **SYN flood (protocol attack):** sends huge numbers of TCP **SYN** packets but **never completes the three-way handshake**. The server's table fills with **half-open connections** and it can't accept real ones. Mitigation: **SYN cookies**, rate limiting, firewalls.
- **Amplification / reflection:** the attacker sends **small requests with the victim's spoofed source IP** to open servers (**DNS**, **NTP**, **memcached**). The servers send **much larger responses to the victim**. A 60-byte query can trigger a response many times larger.
- **Application layer (Layer 7):** floods of legitimate-looking HTTP requests that exhaust a web server.

Defenses: ISP or cloud-based **DDoS scrubbing services**, CDNs, rate limiting, firewalls/IPS, and closing open resolvers so your servers can't be used for reflection.

> Scenario: a web server suddenly can't accept new connections; its connection table shows thousands of half-open sessions from random IPs. That's a SYN flood.

## VLAN hopping

**VLAN hopping** lets an attacker on one VLAN send traffic into another VLAN they shouldn't reach, bypassing the separation VLANs provide. There are two methods:

| Method | How it works | Defense |
|---|---|---|
| **Switch spoofing** | The attacker's device pretends to be a switch and uses **DTP** (Dynamic Trunking Protocol) to **negotiate a trunk**. A trunk carries all VLANs, so the attacker reaches every VLAN | **Disable DTP** and **hard-code user ports as access ports**; trunk only where needed |
| **Double tagging** | The attacker, on the **native VLAN**, sends a frame with **two 802.1Q tags**. The first switch strips the outer tag (native VLAN traffic is untagged on trunks) and forwards it; the next switch reads the **inner tag** and delivers it into the target VLAN | Set the **native VLAN to an unused VLAN**, **tag the native VLAN**, and keep user ports out of it |

Double tagging is **one-way only**: the attacker can send into the victim VLAN but replies don't come back, so it's mostly used for attacks like DoS.

## MAC flooding and STP manipulation

**MAC flooding:** a switch learns which MAC address is on which port and stores it in its **MAC address (CAM) table**, which has limited space. The attacker sends thousands of frames with **fake source MACs** until the table is full. The switch can no longer learn real addresses, so it **floods frames out all ports like a hub**, and the attacker can **sniff traffic** meant for others.
- Defense: **port security**, which **limits the number of MAC addresses allowed per port** and shuts down or restricts the port on a violation.

**STP manipulation:** Spanning Tree Protocol elects a **root bridge** using BPDUs. An attacker connects a device that sends **superior BPDUs** (a lower bridge priority) and becomes the **root bridge**. Traffic then flows through the attacker's device (letting them sniff it), or the topology keeps recalculating and causes outages.
- Defenses: **BPDU guard** on access ports (shuts the port if a BPDU arrives where no switch should be) and **root guard** on ports that should never lead to the root bridge.

## ARP and DNS poisoning

### ARP poisoning and ARP spoofing

**ARP** maps an IP address to a MAC address on the local network. It has **no authentication**: hosts accept ARP replies even if they never asked.
- **ARP spoofing:** the attacker sends **forged ARP replies** claiming "the gateway's IP is at **my** MAC".
- **ARP poisoning:** the result: victims' **ARP caches now hold the false mapping**, so they send their traffic to the attacker. (The terms are often used interchangeably; spoofing is the forging, poisoning is the corrupted cache.)

Once the attacker's MAC is linked to the gateway's IP, the attacker is **on-path**: they can read, change, or drop the traffic, then forward it so nobody notices.
- Defense: **Dynamic ARP Inspection (DAI)**, which checks ARP packets against the **DHCP snooping binding table** and drops ones that don't match. Static ARP entries work for a few critical hosts.

### DNS poisoning and DNS spoofing

DNS turns names into IP addresses, so corrupting it sends users to the wrong place even when they type the correct name.
- **DNS cache poisoning:** the attacker **injects false records into a DNS resolver's cache**, so every user of that resolver gets the malicious IP for, say, the bank's website.
- **DNS spoofing:** more generally, **forging DNS responses** to a victim (e.g. answering faster than the real server, or from a rogue DNS server handed out by rogue DHCP).
- **Hosts file modification:** malware edits the local **hosts file**, which is checked before DNS, to redirect a site. Redirecting users to fake sites this way is often called **pharming**.
- Defenses: **DNSSEC** (digitally signs DNS records so forged answers fail validation), patched and locked-down resolvers, DNS filtering, and protecting the hosts file.

> Scenario: users type the correct bank URL but land on a lookalike site, and only users of one resolver are affected. Suspect DNS cache poisoning on that resolver.

## Rogue devices and evil twins

A **rogue device** is any **unauthorized** device attached to the network: an AP, switch, router, or server someone plugged in without approval, whether malicious or just convenient.

**Rogue DHCP server:** answers clients' DHCP requests and hands out a **malicious default gateway or DNS server**, putting the attacker on-path or redirecting users. Sometimes it's an accident (a home router plugged in backwards), causing clients to get wrong addresses.
- **DHCP starvation:** the attacker first requests every address in the real server's pool with spoofed MACs, **exhausting the pool** so legitimate clients can't get addresses (and the rogue server answers instead).
- Defense: **DHCP snooping** (only **trusted ports** facing real DHCP servers may send offers) and port security to stop starvation.

**Rogue access point:** an **unauthorized AP connected to the wired network**, creating a back door that bypasses perimeter security. Defenses: **NAC/802.1X on switch ports**, **wireless IDS/IPS (WIDS/WIPS)** scanning for unknown APs, and regular wireless surveys.

**Evil twin:** a malicious AP that **imitates a legitimate SSID** (same network name, often a stronger signal) to lure users into connecting, so the attacker can **capture credentials and traffic**. Unlike a rogue AP, it usually isn't connected to your network at all.
- Attackers often send spoofed **deauthentication frames** to kick users off the real AP so they reconnect to the evil twin. Defense: **802.11w Protected Management Frames (PMF)**, which WPA3 requires.
- Defenses: **802.1X/EAP with server certificate validation** (clients refuse an AP that can't prove its identity), WIPS, and user training (beware of free open Wi-Fi with a familiar name).

## On-path attacks

An **on-path attack** (formerly **man-in-the-middle**) places the attacker **secretly between two parties** so they can **intercept, read, and alter** the communication while both sides think they're talking directly.

Ways an attacker gets on-path:
- **ARP poisoning** on the local network.
- **Rogue DHCP** handing out the attacker as the gateway.
- **DNS spoofing** sending the victim to the attacker's server.
- **Evil twin / rogue AP** carrying the victim's wireless traffic.

What they can do: steal credentials and session cookies, inject malware into downloads, or **downgrade** connections to unencrypted versions.

Defense: **encryption with proper certificate validation**, such as **TLS/HTTPS**, VPNs, and SSH. Even if the attacker is in the path, they can't read or alter encrypted traffic, and a fake certificate triggers a warning, which users **must not click through**. HSTS helps stop HTTPS-to-HTTP downgrades.

## Social engineering

**Social engineering** manipulates **people** rather than technology into giving up information or access. It exploits trust, urgency, fear, authority, and helpfulness.

| Attack | Description |
|---|---|
| **Phishing** | Fraudulent emails or messages that trick users into revealing information or running malware |
| **Spear phishing** | Phishing **targeted at a specific person or group** using personalized details |
| **Whaling** | Spear phishing aimed at **senior executives** |
| **Vishing** | Phishing by **voice** call (e.g. fake "IT support" asking for a password) |
| **Smishing** | Phishing by **SMS** text message |
| **Dumpster diving** | Searching **trash** for documents, notes, or old drives with useful information |
| **Shoulder surfing** | **Watching** someone type a password or read sensitive data |
| **Tailgating** | Following an authorized person through a secure door **without their knowledge** |
| **Piggybacking** | Following an authorized person through **with their consent** (they hold the door) |
| **Pretexting** | Inventing a **believable scenario** ("I'm the auditor, I need...") to extract information |
| **Baiting** | Leaving **infected USB drives** or offers for victims to pick up and use |
| **Watering hole** | Compromising a **website the target group frequently visits** |

Defenses: **security awareness training**, phishing simulations, verification procedures (call back on a known number), email filtering, shredding, privacy screens, and physical controls such as **access control vestibules (mantraps)**, badges, and guards.

## Malware and password attacks

**Malware** is malicious software. Types to recognize:
- **Virus:** attaches to a file and spreads when the file is run.
- **Worm:** **self-replicates across the network** without user action, exploiting vulnerabilities. Segmentation and patching limit it.
- **Trojan:** disguised as legitimate software.
- **Ransomware:** **encrypts data and demands payment** for the key. Defenses: **offline/immutable backups**, patching, segmentation, and least privilege.
- **Spyware / keyloggers:** secretly collect activity and keystrokes.
- **Rootkit:** hides deep in the OS to keep privileged access.
- **Botnet agent:** turns the device into a remotely controlled bot for DDoS or spam.

**Password attacks:**
- **Brute force:** tries **many combinations** against an account until one works. Stopped by **account lockout**, long passwords, and MFA.
- **Dictionary attack:** tries common words and leaked passwords.
- **Password spraying:** tries **a few common passwords against many accounts**, staying under each account's lockout threshold. Stopped by **MFA**, banned-password lists, and monitoring for many failed logins across accounts.
- **Credential stuffing:** reusing username/password pairs leaked from other sites.

**Spoofing:** **IP spoofing** forges the **source IP** in packets (used in reflection attacks and to bypass IP-based rules). **MAC spoofing** changes a device's MAC to impersonate another device (used to bypass MAC filtering or MAB).

## Common mix-ups

- **DoS vs DDoS:** one source vs **many** (botnet).
- **SYN flood vs amplification:** SYN flood exhausts **half-open connections**; amplification uses **third-party servers** to send big responses to a **spoofed** victim.
- **Switch spoofing vs double tagging:** switch spoofing **negotiates a trunk via DTP**; double tagging uses **two 802.1Q tags** and the **native VLAN**.
- **MAC flooding vs ARP poisoning:** MAC flooding fills the **switch's CAM table** (defense: port security); ARP poisoning corrupts **hosts' ARP caches** (defense: DAI).
- **ARP poisoning vs DNS poisoning:** ARP maps **IP to MAC** on the LAN; DNS maps **names to IPs**.
- **Rogue AP vs evil twin:** a rogue AP is **unauthorized and plugged into your network**; an evil twin **impersonates your SSID** to lure users.
- **Rogue DHCP vs DHCP starvation:** rogue DHCP **hands out bad settings**; starvation **exhausts the real pool**.
- **Tailgating vs piggybacking:** tailgating is **without** the employee's knowledge; piggybacking is **with** consent.
- **Brute force vs password spraying:** brute force = **many passwords, one account**; spraying = **few passwords, many accounts**.
- **Phishing variants:** spear = targeted; whaling = executives; vishing = voice; smishing = SMS.

## Key terms

- **Botnet:** a network of compromised devices controlled remotely by an attacker.
- **C2 (command and control):** servers attackers use to direct bots or malware.
- **SYN flood:** a DoS using half-open TCP connections.
- **Amplification attack:** small spoofed requests causing large responses to a victim.
- **VLAN hopping:** reaching another VLAN via switch spoofing or double tagging.
- **CAM table:** the switch's MAC address table.
- **DAI:** Dynamic ARP Inspection.
- **DNSSEC:** DNS Security Extensions, which sign DNS records.
- **Rogue device:** any unauthorized device on the network.
- **Evil twin:** a fake AP impersonating a legitimate SSID.
- **On-path attack:** intercepting traffic between two parties (formerly man-in-the-middle).
- **Pharming:** redirecting users from a legitimate site to a fake one.
- **Social engineering:** manipulating people to gain information or access.

> **Exam tip:** Match each attack to its defense: MAC flooding → **port security**; ARP spoofing → **DAI**; rogue DHCP → **DHCP snooping**; switch spoofing → **disable DTP**; double tagging → **change/tag the native VLAN**; rogue STP root → **BPDU/root guard**; DNS poisoning → **DNSSEC**; evil twin → **802.1X with certificate validation and WIPS**; on-path → **TLS with certificate validation**.
