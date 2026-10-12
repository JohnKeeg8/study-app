# Ports & protocols

An IP address gets traffic to the right **host**. A **port number** (Layer 4) gets it to the right **application** on that host. A server listens on a well-known port (e.g. 443 for HTTPS). A client connects from a temporary high-numbered **ephemeral** port, so one PC can hold many connections at once.

## Port ranges and how connections work

| Range | Name | Used for |
|---|---|---|
| 0–1023 | **Well-known** | Standard services (22, 53, 80, 443…) |
| 1024–49151 | **Registered** | Vendor applications (1433 SQL Server, 3389 RDP) |
| 49152–65535 | **Dynamic / ephemeral** | Temporary client source ports |

A connection is identified by **source IP + source port + destination IP + destination port + protocol**. Example: your laptop 192.168.1.20:**51544** → web server 93.184.216.34:**443**/TCP.

## TCP and UDP

| | **TCP** | **UDP** |
|---|---|---|
| Connection | **Connection-oriented**: three-way handshake first | **Connectionless**: just sends |
| Reliability | Sequence numbers, **acknowledgments**, **retransmission**, in-order delivery, flow control (windowing) | None. Lost packets stay lost |
| Overhead / speed | Higher overhead | Low overhead, fast |
| Used by | Web, email, file transfer, SSH, RDP | **Voice/video**, DNS queries, DHCP, TFTP, SNMP, syslog, NTP |

- **Three-way handshake:** client **SYN** → server **SYN-ACK** → client **ACK**.
- **Ending:** **FIN** closes gracefully; **RST** aborts immediately (often meaning "nothing is listening on that port").
- **Why real-time traffic uses UDP:** a retransmitted voice packet arrives too late to be useful. Small losses are better than delay.

## Ports you must know

| Port | Protocol | TCP/UDP | What it does |
|---|---|---|---|
| **20, 21** | FTP | TCP | File transfer, **unencrypted**. 21 = control; 20 = data in active mode |
| **22** | SSH | TCP | **Encrypted** remote command line |
| **22** | SFTP | TCP | Encrypted file transfer **inside SSH** |
| **23** | Telnet | TCP | **Unencrypted** remote command line (insecure) |
| **25** | SMTP | TCP | **Sends/relays** email between mail servers |
| **53** | DNS | UDP + TCP | Name resolution. UDP for queries, TCP for zone transfers |
| **67, 68** | DHCP | UDP | Address assignment. 67 server, 68 client |
| **69** | TFTP | UDP | Simple file transfer, **no authentication** (device configs, firmware) |
| **80** | HTTP | TCP | Web, unencrypted |
| **123** | NTP | UDP | Clock synchronization |
| **161, 162** | SNMP | UDP | Monitoring. 161 = manager polls agent; 162 = agent sends **traps** |
| **389** | LDAP | TCP/UDP | Directory queries (Active Directory) |
| **443** | HTTPS | TCP | Web over **TLS** |
| **445** | SMB | TCP | Windows file and printer sharing |
| **514** | Syslog | UDP | Sends logs to a central server |
| **587** (also 465) | SMTPS | TCP | **Secure** email submission |
| **636** | LDAPS | TCP | LDAP over TLS |
| **1433** | SQL Server | TCP | Microsoft SQL Server database |
| **3389** | RDP | TCP/UDP | Graphical **remote desktop** |
| **5060, 5061** | SIP | TCP/UDP | **VoIP call setup**. 5061 = SIP over TLS |

Commonly tested extras: POP3 **110** / POP3S **995**, IMAP **143** / IMAPS **993**, Kerberos **88**, TACACS+ **49**, RADIUS **1812/1813**, BGP **179**, IKE **500**.

## IP protocol types

Some protocols sit directly on IP and have a **protocol number** in the IP header, **not a port**:

| Protocol number | Protocol | Purpose |
|---|---|---|
| **1** | **ICMP** | Ping (echo) and error messages (unreachable, time exceeded) |
| **6** | **TCP** | Reliable transport |
| **17** | **UDP** | Connectionless transport |
| **47** | **GRE** | Generic Routing Encapsulation: **tunnels** other traffic (even multicast) **without encryption** |
| **50** | **ESP** | IPsec Encapsulating Security Payload: **encrypts** (and authenticates) |
| **51** | **AH** | IPsec Authentication Header: **authenticates, does not encrypt** |

IPsec's **IKE** negotiates the keys and settings on **UDP 500**, switching to **UDP 4500** (NAT traversal) when a NAT device is in the path.

## Secure vs insecure protocols

| Insecure | Secure replacement |
|---|---|
| Telnet (23) | **SSH (22)** |
| HTTP (80) | **HTTPS (443)** |
| FTP (20/21) | **SFTP (22)** or FTPS (FTP over TLS) |
| LDAP (389) | **LDAPS (636)** |
| SMTP (25) for submission | **SMTPS (587/465)** |
| SNMPv1/v2c | **SNMPv3** (same ports, adds encryption) |
| TFTP (69) | SFTP/SCP |

Insecure protocols send **credentials in cleartext**, so anyone capturing traffic can read them.

## Common mix-ups

- **SFTP vs FTPS:** **SFTP runs over SSH (port 22)**. **FTPS** is old FTP with TLS added.
- **SMTP vs IMAP/POP3:** SMTP **sends**; IMAP and POP3 **retrieve**. IMAP keeps mail on the server and syncs devices; POP3 downloads it.
- **SNMP 161 vs 162:** 161 = the manager **asks** (polls); 162 = the agent **tells** (traps).
- **DHCP 67 vs 68:** server **67**, client **68**.
- **SIP vs RTP:** SIP **sets up** the call; **RTP** carries the actual audio and video.
- **Ports vs protocol numbers:** ICMP, GRE, ESP, and AH have **protocol numbers** (1, 47, 50, 51), not ports.
- **DNS is both:** queries over UDP 53, zone transfers over TCP 53.
- **TFTP vs FTP:** TFTP uses **UDP 69 with no login**; FTP uses TCP 20/21 with a login.

## Key terms

- **Ephemeral port:** a temporary high port the client picks as its source port.
- **Socket:** an IP address plus a port.
- **Three-way handshake:** SYN, SYN-ACK, ACK.
- **Cleartext:** data sent unencrypted and readable if captured.
- **NAT traversal (NAT-T):** IPsec moving to UDP 4500 to pass through NAT.

> **Exam tip:** Use the **Ports & protocols drill** until you can answer instantly in both directions (port → protocol and protocol → port).
