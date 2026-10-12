# Access & management

## VPNs

| Type | Use |
|---|---|
| **Site-to-site** | Permanent tunnel joining two networks (branch ↔ HQ) via gateways; users need no client |
| **Client-to-site (remote access)** | One device tunnels into the corporate network using VPN client software |
| **Clientless** | Browser-based TLS portal to specific internal web apps |

- **Full tunnel:** *all* traffic goes through the VPN for corporate inspection and filtering.
- **Split tunnel:** only corporate-bound traffic uses the VPN. It saves bandwidth but loses visibility of internet traffic.
- **Protocols:**
  - **IPsec**: IKE on UDP 500/4500, then ESP for encryption. **Tunnel mode** wraps the whole packet (site-to-site); **transport mode** protects only the payload.
  - **SSL/TLS VPN** on TCP 443 passes through firewalls easily.
  - **WireGuard** is modern, fast, and UDP-based.
  - **L2TP** needs IPsec for encryption. **PPTP** is insecure.
- **Site-to-site IPsec:** encryption and hash algorithms, the authentication method (PSK or certificates), and the DH group **must match** on both ends.

## Management methods

| Method | Notes |
|---|---|
| **SSH** (TCP 22) | Encrypted CLI. Use **v2 only**, key-based authentication, and restrict VTY lines with ACLs. Never Telnet |
| **GUI** | Web interface. **HTTPS only**, reachable only from management networks |
| **API** | Programmatic access (REST with JSON/XML, NETCONF on 830 with YANG models). Authenticate with tokens or keys over HTTPS, least privilege |
| **Console** | Direct serial access via a **rollover/USB console cable** (classically 9600 baud, 8-N-1). Works with no IP configuration |

## In-band vs out-of-band

- **In-band:** manage devices over the production network. Convenient, but unreachable during outages.
- **Out-of-band (OOB):** a separate path, such as a **console server**, a dedicated management network, or a **cellular modem**. It lets you reach devices when the production network is down.

## Securing administrative access

- A **dedicated management VLAN or network** separates management traffic from user traffic.
- A **jump box (bastion host)** is a hardened, monitored entry point into secure zones.
- **Central AAA** with **TACACS+** gives per-command authorization and accounting. Keep a vaulted **local break-glass account** for when AAA servers are unreachable.
- Add **MFA** on VPN and admin logins.
- Don't expose **RDP (3389)** directly to the internet. Use a VPN or an RD gateway.

> **Exam tip:** "Reach the router when the WAN is down" → out-of-band (console server or cellular). "Only corporate traffic in the tunnel" → split tunnel. "Replace Telnet" → SSH.
