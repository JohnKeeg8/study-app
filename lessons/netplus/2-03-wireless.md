# Wireless devices

## Frequency bands and channels

| Band | Range and penetration | Channels | Notes |
|---|---|---|---|
| **2.4 GHz** | Longest | Only **1, 6, 11** don't overlap (20 MHz) | Crowded; microwaves and Bluetooth interfere |
| **5 GHz** | Medium | Many non-overlapping channels | **DFS** channels must give way to radar |
| **6 GHz** | Shortest | Lots of clean spectrum | Wi-Fi 6E/7 clients only |

- **Channel width:** wider channels (40/80/160 MHz) are faster per client but give fewer non-overlapping channels. Dense deployments often use 20/40 MHz.
- **Co-channel interference:** APs on the **same** channel share airtime.
- **Adjacent-channel interference:** **overlapping** channels (e.g. 3 and 5) corrupt each other.
- **Band steering:** nudges dual-band clients to 5/6 GHz.

## 802.11 standards

| Name | Standard | Bands | Key features |
|---|---|---|---|
| — | 802.11a / b / g | 5 / 2.4 / 2.4 GHz | Legacy |
| Wi-Fi 4 | 802.11n | 2.4 and 5 GHz | MIMO |
| Wi-Fi 5 | 802.11ac | 5 GHz | Downlink MU-MIMO, wider channels |
| Wi-Fi 6 / 6E | 802.11ax | 2.4/5 (+6 for 6E) | **OFDMA**, uplink and downlink MU-MIMO, Target Wake Time |
| Wi-Fi 7 | 802.11be | 2.4/5/6 | 320 MHz channels, multi-link operation |

## Network types

- **Infrastructure:** clients connect through APs. A **BSS** is one AP; an **ESS** is many APs sharing one SSID so clients can roam.
- **Ad hoc (IBSS):** client to client with no AP.
- **Mesh:** APs relay traffic wirelessly to each other.
- **Point-to-point and point-to-multipoint bridges:** link buildings.
- **Identifiers:** the **SSID** is the network name; the **BSSID** is the AP radio's MAC. Hiding the SSID is **not** real security.

## Encryption and authentication

| Option | Notes |
|---|---|
| WEP / WPA-TKIP | Broken; never use |
| **WPA2** | AES-CCMP; Personal (PSK) or Enterprise (802.1X) |
| **WPA3-Personal** | **SAE** replaces the PSK handshake and resists offline dictionary attacks |
| **WPA3-Enterprise** | 802.1X; optional 192-bit mode |
| **Enhanced Open (OWE)** | Encrypts open networks without a password |

- **Enterprise (802.1X/EAP + RADIUS):** each user has their own credentials.
  - **EAP-TLS** uses certificates on both client and server, and is the strongest.
  - **PEAP** uses a server certificate plus a password (MSCHAPv2) inside a tunnel.
- **Personal (PSK):** one shared passphrase.
- **Disable WPS PIN:** it can be brute-forced.
- **MAC filtering** is weak because MAC addresses can be spoofed.
- **802.11w (PMF)** protects management frames against deauthentication attacks.

## Guest networks

Put guests on a **separate SSID and VLAN** with **internet-only** firewall rules and **client isolation**. Optionally add a **captive portal** for terms or login.

## Antennas and APs

- **Omnidirectional:** 360° coverage.
- **Directional** (Yagi, parabolic): long, narrow links. **Patch/panel** antennas are semi-directional, wall-mounted.
- **Gain** is measured in dBi. **EIRP** = transmit power + antenna gain − cable loss, and regulations cap it.
- **Autonomous (thick) APs** hold their own configuration. **Lightweight (thin) APs** are managed by a **wireless LAN controller** over CAPWAP, which also handles RF management (channels and power).
- **Roaming:** 802.11k gives neighbor lists, 802.11v gives roaming hints, and **802.11r** gives fast transition.
- **Site surveys:** **predictive** (modeled), **passive** (listen), and **active** (connect and measure throughput).

> **Exam tip:** 2.4 GHz → channels 1/6/11. "Strongest home Wi-Fi security" → WPA3-Personal (SAE). "Each employee logs in with directory credentials" → WPA2/3-Enterprise with 802.1X/RADIUS.
