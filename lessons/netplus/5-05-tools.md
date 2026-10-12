# Tools & protocols

Troubleshooting goes faster when you reach for the right tool first. This lesson covers the software tools (packet capture, command-line utilities, scanners, discovery protocols), the device `show` commands, and the hardware tools CompTIA expects you to match to a symptom.

## Protocol analyzers and packet capture

A **protocol analyzer** (packet analyzer) such as **Wireshark** or **tcpdump** captures packets and **decodes every header**, so you can see exactly what was sent, what came back, and where a conversation fails. It's the tool of last resort when other tests disagree, and the tool of proof when you need evidence.

**Getting the traffic:** a switch only sends a port the traffic meant for it, so to capture someone else's traffic you need:
- **Port mirroring (SPAN):** the switch copies traffic from one or more ports or VLANs to the port where your analyzer sits. Cheap and flexible, but the switch can drop copies when busy.
- **Network TAP:** a hardware device placed **inline** on a link that copies **every** frame (including errored ones) to a monitor port. More reliable, but you have to break the link briefly to install it.

**Wireshark display filters** (applied after capture to hide what you don't need): `dns`, `http`, `tcp.port == 443`, `ip.addr == 10.1.1.5`, `tcp.analysis.retransmission`.

**tcpdump** is a command-line capture tool (Linux/macOS). It uses **capture filters** (BPF syntax) that decide what gets recorded: `tcpdump -i eth0 host 10.0.0.5 and port 53`. Use `-w capture.pcap` to **write a file** for later analysis in Wireshark.

**What to look for in a capture:**

| Capture shows | Meaning |
|---|---|
| **SYN, SYN, SYN** with no reply | Host unreachable or a **firewall silently dropping** traffic |
| **SYN answered by RST** | Host is up but **nothing is listening** on that port (or a firewall rejecting) |
| Many **retransmissions** / duplicate ACKs | **Packet loss** somewhere in the path |
| DNS query with no response | DNS server unreachable or down |
| DHCP Discover with no Offer | DHCP server or relay problem |
| TLS handshake fails after Client Hello | Certificate or protocol/cipher mismatch |

Capturing traffic can expose passwords and personal data, so do it **only with authorization** and protect capture files.

## Connectivity and path testing

**ping** sends **ICMP echo requests** and reports replies and round-trip time. It answers "can I reach it, and how fast?"
- Windows options: `-t` (continuous until stopped), `-n` (count), `-l` (packet size), `-f` (**don't fragment**). `ping -f -l 1472 host` tests whether a 1500-byte packet fits (1472 data + 28 bytes of headers).
- Linux equivalent MTU test: `ping -M do -s 1472 host`. Linux pings continuously by default; `-c` sets a count.
- No reply doesn't always mean down: many firewalls **block ICMP**.

**traceroute** (Linux/macOS) and **tracert** (Windows) list **every router hop** to a destination by sending probes with **TTL 1, 2, 3...**. Each router that decrements TTL to zero sends back an ICMP "time exceeded," revealing itself.
- **tracert (Windows) uses ICMP echo**; **traceroute (Linux) uses UDP** by default (with `-I` for ICMP or `-T` for TCP).
- `* * *` means a hop didn't reply, which may just be a filter. Where the trace **stops** is where to look.
- A single slow middle hop with fast hops after it is usually just that router deprioritizing replies.

**Combined tools:**
- **pathping** (Windows) and **mtr** (Linux): traceroute plus **per-hop loss and latency statistics** over time.
- **tracepath** (Linux): traces the path and **discovers the path MTU** without needing root.

**Testing a specific port:** ping only proves ICMP works. To check that a service port is open, use **Test-NetConnection server -Port 443** (PowerShell), **nc -zv server 443** (netcat), or `telnet server 443` in a pinch.

## Host configuration commands

| Task | Windows | Linux |
|---|---|---|
| Show IP, mask, gateway, DNS, MAC | `ipconfig /all` | `ip addr` (older: `ifconfig`) |
| Renew DHCP lease | `ipconfig /release` then `/renew` | `dhclient` (or the network manager) |
| View / clear DNS cache | `ipconfig /displaydns`, `/flushdns` | `resolvectl` (systemd) |
| IP-to-MAC table | `arp -a` | `ip neigh` (or `arp -n`) |
| Connections and listening ports | `netstat -ano` | `ss -tulnp` (older: `netstat`) |
| Routing table, default gateway | `route print` | `ip route` |
| Computer's name | `hostname` | `hostname` |

**What each helps you find:**
- **ipconfig / ip addr:** a **169.254.x.x (APIPA)** address means DHCP failed; a wrong mask or gateway explains "can reach local hosts but not remote ones."
- **arp -a:** two IPs showing the **same MAC** can reveal **ARP spoofing**; a duplicate IP shows a MAC you don't expect. An entry for the gateway proves Layer 2 reachability to it.
- **netstat -ano:** `-a` all connections, `-n` numeric addresses, `-o` the **owning process ID**, so you can spot unexpected listeners or malware connections. GUI alternatives: **Resource Monitor** or **TCPView**.
- **route print / ip route:** a missing or wrong **default route** explains traffic that never leaves the subnet.
- **Other Windows tools:** **nbtstat** shows NetBIOS over TCP/IP name tables (legacy name resolution); **netsh** configures network settings and the firewall (e.g. `netsh wlan show interfaces`, `netsh advfirewall`).

## DNS lookup tools

When "it works by IP but not by name," the problem is name resolution, and these tools test DNS directly.

- **nslookup** (Windows, Linux, macOS): `nslookup www.example.com` uses your configured DNS server; `nslookup www.example.com 8.8.8.8` queries a **specific server**, which tells you whether your internal DNS or the record itself is the problem. Use `set type=mx` (or other types) to query specific records.
- **dig** (Linux/macOS): more detailed output, including **TTLs, flags, and the answering server**. `dig example.com MX`, `dig @8.8.8.8 example.com`, and `dig +trace example.com` to follow the delegation from the root down.

**Typical uses:**
- Confirm a hostname **resolves to the expected IP** after a change.
- Compare answers from two servers to spot **stale records** or propagation delays (check the TTL).
- An **NXDOMAIN** answer means the name doesn't exist on that server; a **timeout** means the server isn't responding.

## Discovery, scanning, and speed tools

- **nmap:** discovers live hosts, **open ports**, running services and versions, and operating systems. The default privileged scan is the **SYN ("half-open") scan, `-sS`**: it sends a SYN, notes the reply, and never completes the handshake. `-sT` is a full connect scan, `-sU` scans UDP, `-sn` is a ping sweep with no port scan, `-sV` detects service versions. **Only scan networks you're authorized to scan.**
- **LLDP and CDP:** Layer 2 **discovery protocols** where devices advertise their name, model, port, IP, and capabilities to directly connected neighbors. **LLDP is vendor-neutral** (IEEE 802.1AB); **CDP is Cisco-proprietary**. Use them to map "which switch port is this AP plugged into?" or to find a mis-patched link.
- **Speed tester:** a web or app-based test of throughput (and usually latency) to an internet server. Good for checking an ISP's delivered speed, but it doesn't test your internal links or measure consistency well.
- **iperf:** runs a **client and server on two endpoints** you control and measures maximum TCP or UDP **throughput**, plus **jitter and loss** in UDP mode. Best for verifying a specific internal link (e.g. a new 10 Gbps link).

Scenario: users can't reach a new web server on port 443. ping works. `Test-NetConnection -Port 443` fails, and nmap shows 443 as **filtered** → a firewall is blocking it. If nmap shows it **closed**, the host is reachable but the service isn't running.

## Network device commands

CompTIA lists these Cisco-style commands; other vendors have equivalents.

| Command | Shows | Use it when |
|---|---|---|
| `show interfaces` (`show interface`) | Status, speed/duplex, **counters**: CRC, input errors, collisions, drops | Suspecting a bad cable, duplex mismatch, or congestion |
| `show ip interface brief` | Each interface's IP and **up/down** status at a glance | Quick health check |
| `show interfaces status` | Speed, duplex, VLAN, **err-disabled** ports | Port won't come up |
| `show mac address-table` | Which **MAC was learned on which port** and VLAN | Finding where a device is plugged in |
| `show vlan` (`show vlan brief`) | VLANs and their **assigned access ports** | User in the wrong VLAN |
| `show interfaces trunk` | Trunk ports, **allowed and native VLANs** | VLAN traffic not crossing a link |
| `show ip route` (show route) | The **routing table** | Remote network unreachable |
| `show arp` (`show ip arp`) | The device's **IP-to-MAC cache** | Duplicate IPs, gateway issues |
| `show running-config` (show config) | The **active configuration** | Verifying settings or a recent change |
| `show power inline` (show power) | **PoE** budget and power per port | Phone or AP not powering up |
| `show cdp neighbors` / `show lldp neighbors` | Directly connected devices, model, port | Mapping the topology |
| `show spanning-tree` | Root bridge, port roles and states | Loops or blocked ports |
| `show logging` | Messages in the log buffer | Finding what happened and when |
| `show ip dhcp binding` | Leased IPs and the MACs they went to | DHCP scope exhaustion or conflicts |
| `show ip dhcp snooping binding` | MAC, IP, VLAN, and port bindings learned by snooping | DHCP snooping, DAI, and IP source guard issues |

## Hardware tools

| Tool | What it does | Typical scenario |
|---|---|---|
| **Cable tester** | Checks **wire map**: opens, shorts, reversed, crossed, and split pairs | A newly crimped cable doesn't work |
| **Cable certifier** | Proves a run meets its **category spec** (length, attenuation, NEXT) | Documenting a new install, or proving a run is within the 100 m limit |
| **TDR** | Finds the **distance to a fault** on copper | Where is the break in this cable? |
| **OTDR** | Finds the distance to breaks, bends, and bad splices on **fiber** | Locating a fiber break inside a wall or conduit |
| **Visual fault locator (VFL)** | Shines a **bright red laser** into fiber; light leaks at breaks and sharp bends | Finding a break or tracing a fiber in a short run or patch panel |
| **Optical power meter / light meter** | Measures received light level (dBm) and loss | Fiber link up but erroring; is the signal too weak? |
| **Fiber inspection scope** | Magnifies the connector end face | Check for dirt before connecting |
| **Toner and probe** | Puts a tone on a wire; the inductive probe finds it at the other end | Which cable in the bundle or which patch panel port? |
| **Network TAP** | Inline copy of all traffic to an analyzer | Capturing traffic reliably |
| **Loopback plug** | Feeds a port's transmit back to its receive | Proving a NIC or switch port works |
| **Multimeter / PoE tester** | Measures voltage; a PoE tester shows whether and how much PoE is present | AP won't power up |
| **Punchdown tool** | Terminates wires into **110 blocks**, keystone jacks, and patch panels | Re-terminating a damaged jack |
| **Crimper** | Attaches RJ45 plugs to cable | Making a patch cable |
| **Fusion splicer** | **Melts two fiber strands together** for a permanent, low-loss joint | Repairing a cut fiber |

## Wi-Fi analyzers and spectrum analyzers

- **Wi-Fi analyzer:** decodes **802.11** frames and shows **SSIDs, BSSIDs, channels, channel width, RSSI and SNR**, security settings, and channel utilization. Use it for **site surveys, heat maps, channel planning**, and spotting **rogue APs**.
- **Spectrum analyzer:** shows **raw RF energy** across a band, whether or not it's Wi-Fi. It's the only way to see **non-Wi-Fi interference** such as microwaves, Bluetooth, cordless phones, video senders, or jammers.

A Wi-Fi analyzer can tell you **which network** is on channel 6 but not that a microwave is flooding it. A spectrum analyzer shows the microwave's energy but can't tell you SSIDs.

## Common mix-ups

- **Cable tester vs cable certifier:** a tester checks **wiring/continuity**; a certifier proves the run **meets the category's performance spec**.
- **TDR vs OTDR:** TDR = **copper**; OTDR = **fiber**. Both report **distance to a fault**.
- **OTDR vs visual fault locator:** an OTDR measures distance over long runs; a VFL is a **red light** you see leaking at a break, good for short runs.
- **Toner vs cable tester:** a toner **finds** a cable; a tester **checks** it.
- **SPAN vs TAP:** SPAN is a **switch feature** that copies traffic (may drop under load); a TAP is **inline hardware** that copies everything.
- **Display filter vs capture filter:** display filters **hide** already-captured packets (Wireshark); capture filters decide what's **recorded** at all (tcpdump/BPF).
- **tracert vs traceroute:** Windows tracert uses **ICMP**; Linux traceroute uses **UDP** by default.
- **netstat vs nbtstat:** netstat shows **connections and ports**; nbtstat shows **NetBIOS names**.
- **CDP vs LLDP:** CDP is **Cisco-only**; LLDP is the **open standard**.
- **Wi-Fi analyzer vs spectrum analyzer:** Wi-Fi analyzer sees **networks**; spectrum analyzer sees **all RF energy**.

## Key terms

- **Protocol analyzer:** software that captures and decodes packets (Wireshark, tcpdump).
- **SPAN:** switch port mirroring.
- **TAP:** inline hardware that copies all traffic on a link.
- **TTL:** the hop counter that traceroute increments to reveal each router.
- **APIPA:** a 169.254.x.x address a host assigns itself when DHCP fails.
- **NXDOMAIN:** a DNS response meaning the name doesn't exist.
- **SYN scan:** nmap's half-open scan that never completes the handshake.
- **OTDR:** optical time-domain reflectometer.
- **VFL:** visual fault locator, a red laser for finding fiber breaks.
- **Wire map:** a test of which pin connects to which on a cable.

> **Exam tip:** "Ping works by IP, not name" → nslookup/dig. "Find which cable in the bundle" → toner and probe. "Locate a fiber break" → OTDR (or VFL for short runs). "Microwave interference" → spectrum analyzer. "Which port is that MAC on?" → `show mac address-table`. "Phone won't power on" → `show power inline` or a PoE tester.
