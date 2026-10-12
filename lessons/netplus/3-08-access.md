# Access & management

Network staff and remote users need secure ways **in**: users need **VPNs** to reach corporate resources, and administrators need **SSH, GUIs, APIs, and console access** to manage devices, ideally through **jump boxes** and **out-of-band** paths that still work when the network doesn't. This lesson covers each method, when to use it, and how to secure it.

## VPN types

A **VPN (virtual private network)** builds an **encrypted tunnel** across an untrusted network (usually the internet) so traffic is private and authenticated.

| Type | Who connects | How | Typical use |
|---|---|---|---|
| **Site-to-site** | **Two networks**, via their **gateways** (routers, firewalls, VPN concentrators) | A **permanent, always-on** tunnel; users need **no client** and don't know it's there | Branch office ↔ headquarters, office ↔ cloud VPC |
| **Client-to-site (remote access)** | **One device** to the corporate network | **VPN client software** on the laptop or phone connects on demand | Home workers and travelers |
| **Clientless** | One user, via a **web browser** | A **TLS (HTTPS) portal** that publishes **specific internal web apps**; nothing to install | Contractors or personal devices needing one or two apps |

- A **VPN concentrator** (or firewall feature) terminates many remote-access tunnels and usually authenticates users against a central directory with **RADIUS or LDAP**, plus **MFA**.
- Scenario: "A new branch must reach HQ servers at all times, and users shouldn't run any software" → **site-to-site**. "A contractor on a personal laptop needs only the intranet web app" → **clientless**.

## Full tunnel vs split tunnel

Once a remote-access VPN is up, which traffic goes through it?

| | **Full tunnel** | **Split tunnel** |
|---|---|---|
| What uses the VPN | **All** traffic, including internet browsing | **Only corporate-bound** traffic; internet traffic goes **directly** out the user's local connection |
| Security | Corporate firewalls, proxies, and DLP **inspect everything** | Internet traffic **bypasses corporate security controls** |
| Performance | Uses more corporate bandwidth; can add latency to internet traffic | **Saves** VPN and HQ bandwidth; faster internet for the user |

- **Choose full tunnel** when security and visibility matter most (e.g. regulated industries, or users must be protected by the corporate web filter).
- **Choose split tunnel** when bandwidth is limited and cloud apps (video calls, SaaS) should go straight out.
- Scenario: "Remote users' video calls saturate the HQ internet link" → split tunnel would relieve it. "Security wants to filter all remote users' web traffic" → full tunnel.

## VPN protocols

**IPsec** is the standard suite for site-to-site VPNs (and many remote-access VPNs).
- **IKE (Internet Key Exchange)** negotiates keys and settings on **UDP 500**, or **UDP 4500** with **NAT traversal** when a device sits behind NAT.
  - **IKE Phase 1** authenticates the peers and builds a secure **management channel** (the IKE SA).
  - **IKE Phase 2** uses that channel to negotiate the **IPsec SAs** that protect actual data.
- **ESP (Encapsulating Security Payload, IP protocol 50)** provides **encryption**, integrity, and authentication. **AH (Authentication Header, protocol 51)** provides integrity and authentication **but no encryption**, and breaks with NAT.
- **Tunnel mode** encrypts the **entire original packet** and adds a new IP header: used **site-to-site** between gateways.
- **Transport mode** protects **only the payload**, keeping the original IP header: used **host-to-host**.
- **Must match on both ends** of a site-to-site tunnel: **encryption and hash algorithms**, the **authentication method** (pre-shared key or certificates), the **Diffie-Hellman (DH) group**, and lifetimes. A mismatch means the tunnel **won't come up**.

**Other VPN protocols:**

| Protocol | Notes |
|---|---|
| **SSL/TLS VPN** | Runs over **TCP 443**, so it **passes through almost any firewall** or hotel network; used for remote access and clientless portals |
| **WireGuard** | Modern, lightweight, fast, **UDP-based**, with state-of-the-art cryptography |
| **L2TP** | A tunneling protocol with **no encryption of its own**; paired with **IPsec** (L2TP/IPsec) |
| **PPTP** | Old and **insecure** (MS-CHAPv2/MPPE weaknesses); don't use it |
| **GRE** | Tunnels any protocol (including multicast and routing updates) but **doesn't encrypt**; often run inside IPsec |

## SSH and console connections

**SSH (Secure Shell, TCP 22)** is the standard way to reach a device's **command line (CLI)** remotely. It **encrypts the whole session**, including passwords.
- **Never use Telnet (TCP 23)**: it sends everything, including passwords, in **cleartext**.
- Use **SSH version 2 only**; SSHv1 has known cryptographic weaknesses.
- **Public key authentication** is stronger than passwords: the admin holds a private key and the device stores the public key.
- Restrict who can connect by applying an **ACL to the VTY lines** (the virtual terminal lines that accept remote sessions), allowing only management subnets.
- Set idle timeouts and log sessions.

**Console connection:** a **direct, physical serial connection** to a device's **console port**.
- Needs a **rollover (console) cable**, usually with a **USB-to-serial adapter**, or a USB console cable; then a terminal program (PuTTY, screen).
- Classic Cisco settings: **9600 baud, 8 data bits, no parity, 1 stop bit (8-N-1)**, no flow control.
- **Works with no IP configuration at all**, so it's used for **initial setup**, **password recovery**, and recovering a device whose network config is broken.
- Because anyone at the console can take control, **physical security** of devices and console servers matters.

## GUI and API management

**GUI (graphical user interface):** a **web interface** or management application for configuring and monitoring devices visually. Easier for occasional tasks and dashboards.
- Use **HTTPS only**, never plain HTTP.
- Make it reachable **only from management networks**, never the internet.
- Change default credentials and use strong authentication or MFA.

**API (application programming interface):** lets **software and automation tools** read and change device configuration and state **programmatically**. This is what makes it practical to change **200 switches consistently** instead of typing into each one.
- **REST APIs** run over **HTTPS** and exchange data as **JSON** (or XML). HTTP methods map to actions:

| Method | Action |
|---|---|
| **GET** | **Read** data without changing anything |
| **POST** | **Create** something new |
| **PUT / PATCH** | **Replace / update** existing data |
| **DELETE** | Remove something |

- **NETCONF** configures devices over **SSH (TCP 830)** using structured **YANG data models**, with transaction-style changes. **RESTCONF** offers the same YANG models over HTTPS.
- **Securing APIs:** authenticate with **tokens or API keys** over **HTTPS**, give each integration **least privilege**, rotate keys, and log API calls.
- **Automation tools** (Ansible, Python scripts) use APIs or SSH to push the same change to many devices quickly and consistently.

**Which method?** One quick change on one device → SSH. Visual monitoring or occasional configuration → GUI. Repeatable changes across many devices → API and automation. Device unreachable over the network → console.

## In-band vs out-of-band management

| | **In-band** | **Out-of-band (OOB)** |
|---|---|---|
| Path | The **same production network** that carries user traffic | A **separate, dedicated path** |
| Examples | SSH or HTTPS to a switch's IP over the LAN or WAN | **Console server** (terminal server), dedicated management network, **cellular (LTE/5G) modem**, dial-up modem |
| Pro | Convenient, no extra hardware | **Works when the production network is down** |
| Con | **Unreachable during the outages** when you need it most; management traffic shares the network with users | Extra cost and equipment to maintain |

- A **console server** connects to the **console ports of many devices** in a rack and gives admins remote access to them over its own separate link.
- Scenario: "A remote router's WAN link failed after a bad config change; how do you fix it without driving there?" → **out-of-band** through a console server with a **cellular** connection.
- Many devices have a dedicated **management port** that can attach to an OOB management network.

## Jump boxes and securing administrative access

**Jump box (jump host / bastion host):** a **hardened, closely monitored** server that admins must log into **first**, and from which they reach devices in secure zones. Benefits:
- **One controlled entry point** instead of management access from every desktop.
- Strong authentication (**MFA**) and **session logging/recording** in one place.
- Device ACLs only need to allow the jump box's IP.

**Other key practices:**
- **Dedicated management VLAN or network:** separates management interfaces from user traffic and limits who can even reach them.
- **Central AAA:** use **TACACS+** (separates authentication, **per-command authorization**, and **accounting** of every command) or RADIUS so admin accounts are managed centrally and every action is logged.
- **Local break-glass account:** a vaulted local account for **emergency use only, when AAA servers are unreachable**.
- **MFA** on VPN, jump box, and admin logins.
- **Least privilege:** give each admin only the access their job requires (e.g. read-only for help desk).
- **Never expose RDP (TCP 3389)** directly to the internet. Use a VPN or an **RD gateway**, which carries RDP inside **HTTPS** with authentication.
- **Disable insecure protocols:** Telnet, HTTP, SNMPv1/v2c, and SSHv1.

## Common mix-ups

- **Site-to-site vs client-to-site:** site-to-site joins **networks** through gateways with no user client; client-to-site connects **one device** using client software.
- **Client-to-site vs clientless:** clientless needs **only a browser** and exposes **specific web apps**; client-based gives full network access.
- **Full vs split tunnel:** full = **all traffic** through the VPN (more security); split = **only corporate** traffic (saves bandwidth, loses visibility).
- **Tunnel vs transport mode:** tunnel encrypts the **whole packet** (site-to-site); transport encrypts **only the payload** (host-to-host).
- **ESP vs AH:** ESP **encrypts**; AH only authenticates.
- **IKE Phase 1 vs Phase 2:** Phase 1 builds the **secure management channel**; Phase 2 builds the **data tunnels**.
- **SSH vs Telnet:** both give a CLI; only **SSH encrypts**.
- **Console vs in-band SSH:** console is a **direct physical** connection that needs no IP; SSH needs a working network.
- **In-band vs out-of-band:** in-band uses the **production network**; OOB uses a **separate path** that survives outages.
- **Jump box vs VPN:** a VPN gets you **onto the network**; a jump box is the **controlled hop** into secure management zones.

## Key terms

- **VPN concentrator:** device that terminates many VPN tunnels.
- **Split tunnel / full tunnel:** only corporate traffic vs all traffic through the VPN.
- **IKE:** IPsec key exchange (UDP 500, or 4500 with NAT traversal).
- **ESP:** IPsec protocol that encrypts data.
- **NAT traversal (NAT-T):** wrapping IPsec in UDP 4500 so it passes through NAT.
- **VTY lines:** virtual terminal lines that accept remote SSH sessions.
- **Rollover cable:** console cable used to reach a device's serial console port.
- **REST API:** HTTPS-based interface using methods like GET and POST with JSON data.
- **NETCONF / YANG:** device configuration protocol over SSH (830) / the data models it uses.
- **Console server:** gives remote access to many devices' console ports.
- **Out-of-band management:** device access over a path separate from production.
- **Jump box (bastion host):** hardened, monitored entry point into secure zones.
- **TACACS+:** AAA protocol with per-command authorization and accounting.
- **Break-glass account:** emergency local account for when AAA is down.
- **RD gateway:** carries RDP inside HTTPS so RDP isn't exposed directly.

> **Exam tip:** "Reach the router when the WAN is down" → **out-of-band** (console server or cellular modem). "Only corporate traffic in the tunnel" → **split tunnel**. "Browser only, no client" → **clientless**. "Replace Telnet" → **SSH**. "Tunnel won't form" → check that **IKE/IPsec settings match** on both ends. "Single monitored entry point for admins" → **jump box**.
