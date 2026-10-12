# Tools & protocols

## Protocol analyzers

**Wireshark** and **tcpdump** capture and decode packets. You can see handshakes, retransmissions, errors, and exactly where a conversation fails.
- Get traffic from a **SPAN** port or a **TAP**.
- **Display filters** (Wireshark): `dns`, `http`, `tcp.port == 443`, `ip.addr == 10.1.1.5`.
- **Capture filters** (tcpdump, BPF syntax): `host 10.0.0.5 and port 53`. Write to a file with `-w capture.pcap`.
- **What to look for:**
  - **SYN with no reply:** host unreachable or a firewall is dropping traffic.
  - **Immediate RST:** nothing is listening on that port.
  - **Many retransmissions:** packet loss.

## Command-line tools

| Tool | Use |
|---|---|
| **ping** | Reachability and round-trip time over ICMP. Windows options: `-t` continuous, `-n` count, `-l` size, `-f` don't fragment (MTU testing) |
| **tracert** (Windows) / **traceroute** (Linux) | Each hop to a destination, using increasing TTLs. Linux sends UDP probes by default |
| **pathping** / **mtr** | Traceroute plus per-hop loss statistics |
| **ipconfig /all** / **ip addr** | IP, mask, gateway, DNS, MAC, DHCP lease |
| `ipconfig /release` + `/renew` | Get a new DHCP lease |
| `ipconfig /flushdns`, `/displaydns` | Clear or view the DNS cache |
| **nslookup** / **dig** | Query DNS. Query a specific server with e.g. `nslookup host 8.8.8.8` |
| **arp -a** / **ip neigh** | IP-to-MAC table, for duplicate IPs and spoofing |
| **netstat -ano** / **ss -tulnp** | Active connections, listening ports, owning process |
| **route print** / **ip route** | Routing table and default gateway |
| **nmap** | Discover hosts and open ports (only with authorization) |
| **tcpdump** | Command-line packet capture |
| **iperf** | Throughput, jitter, and loss between two endpoints |
| **Test-NetConnection -Port** / **nc -zv** | Test whether a specific TCP port is reachable |

## Device commands (Cisco-style)

- `show ip interface brief`: interface IPs and up/down status.
- `show interfaces`: counters (CRC, collisions, drops). `show interfaces status`: speed, duplex, VLAN, err-disabled.
- `show vlan brief`, `show interfaces trunk`: VLAN membership and trunk allowed or native VLANs.
- `show mac address-table`: which port a MAC was learned on.
- `show ip route`, `show arp`: routing and ARP tables.
- `show spanning-tree`: root bridge, port roles and states.
- `show cdp neighbors` / `show lldp neighbors`: directly connected devices.
- `show logging`: device logs.

## Hardware tools

| Tool | Use |
|---|---|
| **Cable tester** (wire map) | Opens, shorts, reversed and crossed pairs |
| **Cable certifier** | Proves a run meets its category spec (NEXT, loss, length) |
| **TDR / OTDR** | Distance to a fault in copper / fiber |
| **Toner and probe** | Find a specific cable in a bundle or at a patch panel |
| **Optical power meter** | Measure fiber light levels and loss |
| **Fiber inspection scope** | Check end faces before connecting |
| **Loopback plug** | Test that a port or NIC can send and receive |
| **Multimeter / PoE tester** | Voltage and PoE power |
| **Punchdown tool / crimper** | Re-terminate jacks, panels, RJ45 plugs |

## Wi-Fi analyzers

- **Wi-Fi analyzer:** decodes 802.11. Shows SSIDs, BSSIDs, channels, RSSI and SNR, and security settings. Use it for site surveys and channel planning.
- **Spectrum analyzer:** shows **raw RF energy**, including **non-Wi-Fi interference** (microwaves, Bluetooth, radar) that a Wi-Fi analyzer can't see.

> **Exam tip:** "Ping works by IP, not name" → nslookup/dig. "Find which cable in the bundle" → toner. "Locate a fiber break" → OTDR. "Microwave interference" → spectrum analyzer.
