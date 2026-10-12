# Wireless devices

Wi-Fi (IEEE 802.11) sends data over radio. Designing and securing it means choosing **frequency bands and channels**, the **network type**, **encryption and authentication**, **antennas**, and the right **access points**.

## Frequency bands

| Band | Range and wall penetration | Non-overlapping channels | Watch out for |
|---|---|---|---|
| **2.4 GHz** | **Longest** range, best penetration | Only **3** (channels **1, 6, 11** in North America) | Crowded; **microwave ovens, Bluetooth, cordless phones** interfere |
| **5 GHz** | Medium | **Many** (about 20+ at 20 MHz) | **DFS** channels must move if **radar** is detected |
| **6 GHz** | **Shortest** range | Lots of clean spectrum | Only **Wi-Fi 6E and Wi-Fi 7** devices can use it |

**Rule of thumb:** higher frequency = more speed and channels, but **less range** and worse penetration through walls.

Keep 2.4 GHz enabled for older and IoT devices that only support it.

## Channels and channel width

- **2.4 GHz:** channels are 5 MHz apart but about 20–22 MHz wide, so **neighbors overlap**. Only **1, 6, and 11** are clear of each other. Use 20 MHz channels there.
- **Channel bonding:** combining channels into **40, 80, 160 (or 320) MHz** widths gives **more speed per client** but leaves **fewer non-overlapping channels**. Dense offices often use 20/40 MHz on 5 GHz for more total capacity.
- **Interference types:**
  - **Co-channel interference:** nearby APs on the **same** channel must take turns (share airtime).
  - **Adjacent-channel interference:** APs on **overlapping, different** channels (e.g. 3 and 5) corrupt each other's signals.
- **Band steering:** nudges dual-band clients onto 5/6 GHz.
- **Regulatory domain:** allowed channels and power levels **vary by country**; set the AP's country correctly.

## 802.11 standards

| Name | Standard | Bands | Key features |
|---|---|---|---|
| — | 802.11b / g | 2.4 GHz | Legacy (11 / 54 Mbps) |
| — | 802.11a | 5 GHz | Legacy (54 Mbps) |
| **Wi-Fi 4** | **802.11n** | 2.4 + 5 GHz | **MIMO** (multiple antennas/streams), 40 MHz channels |
| **Wi-Fi 5** | **802.11ac** | **5 GHz only** | Wider channels, downlink **MU-MIMO** |
| **Wi-Fi 6 / 6E** | **802.11ax** | 2.4/5 GHz; **6E adds 6 GHz** | **OFDMA** (serves many clients per transmission), uplink and downlink MU-MIMO, **Target Wake Time** (battery saving) |
| **Wi-Fi 7** | **802.11be** | 2.4/5/6 GHz | 320 MHz channels, **multi-link operation** |

- **MIMO:** multiple antennas send several data streams at once.
- **MU-MIMO:** the AP serves **multiple clients at the same time**.
- **Access method:** Wi-Fi uses **CSMA/CA** (collision *avoidance*), because radios can't detect collisions while transmitting. **RTS/CTS** helps with "hidden nodes".

## Network types and identifiers

- **Infrastructure mode:** clients connect **through an access point**. The normal setup.
  - **BSS:** one AP and its clients.
  - **ESS:** **multiple APs sharing one SSID** so clients can **roam** between them.
- **Ad hoc (IBSS):** clients connect **directly to each other**, with no AP.
- **Mesh:** some APs connect to other APs **wirelessly** (wireless backhaul). Useful where cabling is hard; each hop costs throughput.
- **Point-to-point / point-to-multipoint bridges:** link buildings with directional antennas.

**Identifiers:**
- **SSID:** the network **name** users see.
- **BSSID:** the **MAC address of an AP's radio** for that SSID. It distinguishes APs that broadcast the same SSID.
- **Hiding the SSID is not security:** the name still appears in client probes and analyzers.

**SSID planning:** you can map **several SSIDs to different VLANs** (Corp, Guest, IoT) over the AP's trunk uplink. Keep it to a few per radio, because each SSID sends its own beacons and wastes airtime.

## Encryption

| Option | Status |
|---|---|
| **WEP** | **Broken**; crackable in minutes. Never use |
| **WPA (TKIP)** | **Deprecated** |
| **WPA2** | **AES-CCMP** encryption. Still widely used |
| **WPA3** | Current best. **Personal mode uses SAE**; **Protected Management Frames** are required |
| **Enhanced Open (OWE)** | Encrypts **open** networks (e.g. a café) **without a password** |

- **SAE (Simultaneous Authentication of Equals)** replaces WPA2's pre-shared-key handshake. Attackers **can't capture a handshake and guess passwords offline**, and it provides **forward secrecy**.
- **802.11w (Protected Management Frames)** stops spoofed **deauthentication** attacks.
- **Disable WPS PIN mode:** the PIN can be brute-forced, revealing the passphrase.

## Authentication and guest networks

| Mode | How users authenticate | Best for |
|---|---|---|
| **Personal (PSK)** | **One shared passphrase** for everyone | Homes, small offices |
| **Enterprise (802.1X/EAP)** | **Individual credentials** checked by a **RADIUS** server (often backed by Active Directory) | Businesses. Disable one user without changing everyone's key |

**EAP methods:**
- **EAP-TLS:** certificates on **both** client and server. The **most secure**.
- **PEAP:** a TLS tunnel using only a **server** certificate; the user then logs in with a password (MSCHAPv2) inside it.

**Other controls:**
- **MAC filtering is weak:** MAC addresses are easy to spoof.
- **Captive portal:** a web page where users must accept terms or log in before getting access.

**Guest network best practice:**
- A **separate SSID and VLAN**.
- **Internet-only** firewall rules: no access to internal systems.
- **Client isolation**, so guests can't reach each other.
- Optionally a **captive portal**.

## Antennas

| Antenna | Pattern | Use |
|---|---|---|
| **Omnidirectional** | **360°** horizontally | General coverage from a ceiling AP |
| **Directional (Yagi, parabolic dish)** | Narrow, focused beam | **Long-distance links**, building-to-building, long hallways |
| **Patch / panel** | Semi-directional | Wall-mounted, covering an area in front |

- **Gain (dBi):** how much an antenna focuses energy. Higher gain = longer range in one direction but narrower coverage.
- **EIRP** = transmit power + antenna gain − cable loss. Regulations cap it.
- **Polarization** must match on both ends of a point-to-point link.

## Access points and controllers

- **Autonomous (thick) AP:** configured individually and works standalone.
- **Lightweight (thin) AP:** managed by a **wireless LAN controller (WLC)**, on-premises or cloud, using **CAPWAP**. The controller pushes configuration and firmware and handles **RF management** (channels and power).
- **Roaming:**
  - **802.11k** gives neighbor reports.
  - **802.11v** gives network-assisted roaming.
  - **802.11r** gives **fast BSS transition**, which matters for voice.
- **Placement:** ceiling-mounted near the center of the coverage area, away from metal.
- **Site surveys:** **predictive** (modeled before install), **passive** (listen), **active** (connect and test throughput). Validate after installation.
- **Transmit power:** more APs at **lower power** usually beats a few APs at maximum power.

## Common mix-ups

- **Co-channel vs adjacent-channel:** **same** channel = airtime sharing; **overlapping** channels = corruption.
- **SSID vs BSSID:** the **name** vs the **AP radio's MAC**.
- **WPA2-Personal vs WPA3-Personal:** PSK handshake vs **SAE** (resists offline cracking).
- **Personal vs Enterprise:** **one shared password** vs **per-user 802.1X/RADIUS**.
- **EAP-TLS vs PEAP:** **client + server certificates** vs **server certificate + password**.
- **Omni vs directional:** **everywhere around** vs **one focused direction**.
- **Thick vs thin AP:** **standalone** vs **controller-managed**.
- **Wi-Fi 5 vs Wi-Fi 6:** 802.11ac (**5 GHz only**) vs 802.11ax (**OFDMA**, 2.4 and 5 GHz, and 6 GHz for 6E).

## Key terms

- **DFS:** dynamic frequency selection; avoiding radar on certain 5 GHz channels.
- **OFDMA:** splitting a channel into resource units to serve many clients at once.
- **CAPWAP:** the protocol between lightweight APs and their controller.
- **Captive portal:** a login or terms page before network access.
- **Client isolation:** blocking wireless clients from talking to each other.

> **Exam tip:** 2.4 GHz → channels 1/6/11. "Strongest personal security" → WPA3 (SAE). "Each employee logs in with their own credentials" → Enterprise / 802.1X with RADIUS. "Link two buildings" → directional antennas.
