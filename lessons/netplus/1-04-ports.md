# Ports & protocols

Port numbers identify which application on a host should receive traffic (Layer 4).

**Port ranges:**
- **Well-known:** 0–1023
- **Registered:** 1024–49151
- **Dynamic/ephemeral:** 49152–65535 (clients use these as source ports)

## Ports you must know (N10-009)

| Port | Protocol | Transport | Purpose |
|---|---|---|---|
| 20/21 | FTP | TCP | File transfer, unencrypted (21 control, 20 active data) |
| 22 | SSH / SFTP | TCP | Encrypted remote CLI / file transfer |
| 23 | Telnet | TCP | Unencrypted remote CLI, replaced by SSH |
| 25 | SMTP | TCP | Send/relay email between servers |
| 53 | DNS | UDP and TCP | Name resolution (TCP for zone transfers) |
| 67/68 | DHCP | UDP | Address assignment (67 server, 68 client) |
| 69 | TFTP | UDP | Simple file transfer, no authentication |
| 80 | HTTP | TCP | Web, unencrypted |
| 123 | NTP | UDP | Time synchronization |
| 161/162 | SNMP | UDP | Device monitoring (161 polls, 162 traps) |
| 389 | LDAP | TCP/UDP | Directory queries |
| 443 | HTTPS | TCP | Web over TLS |
| 445 | SMB | TCP | Windows file and printer sharing |
| 514 | Syslog | UDP | Central logging |
| 587 (465) | SMTPS | TCP | Secure mail submission |
| 636 | LDAPS | TCP | LDAP over TLS |
| 1433 | SQL Server | TCP | Microsoft SQL Server |
| 3389 | RDP | TCP/UDP | Remote desktop |
| 5060/5061 | SIP | TCP/UDP | VoIP call signaling (5061 = TLS) |

## IP protocol types

These are protocol numbers in the IP header, not ports:

| Number | Protocol | Purpose |
|---|---|---|
| 1 | ICMP | Ping, error messages |
| 6 | TCP | Reliable transport |
| 17 | UDP | Connectionless transport |
| 47 | GRE | Unencrypted tunneling |
| 50 | ESP | IPsec encryption |
| 51 | AH | IPsec authentication only |

IPsec's **IKE** negotiates keys on UDP 500, and on UDP 4500 when NAT traversal is needed.

## TCP vs UDP

- **TCP:** connection-oriented. Three-way handshake (**SYN → SYN-ACK → ACK**), sequencing, acknowledgments, retransmission, and flow control. Closes with FIN, or aborts with RST.
- **UDP:** connectionless with low overhead. No guarantees, so it suits voice, video, DNS queries, DHCP, and TFTP.

## Secure replacements

Telnet → **SSH**; HTTP → **HTTPS**; FTP → **SFTP** or FTPS; LDAP → **LDAPS**; SMTP → **SMTPS**; SNMPv1/v2c → **SNMPv3**.

> **Exam tip:** Use the **Ports & protocols drill** to memorize these in both directions. Expect "which port should be opened" questions.
