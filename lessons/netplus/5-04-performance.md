# Performance issues

A network can be "up" and still be unusable. Performance troubleshooting is about measuring **how well** traffic flows: how much gets through, how long it takes, how consistent that delay is, and how much is lost. You'll match each symptom ("calls sound robotic", "slow every morning", "Wi-Fi drops in the warehouse") to the metric behind it and the fix that actually helps.

## Bandwidth, throughput, and capacity

These three words get used loosely, but the exam treats them precisely.

| Term | Meaning | Example |
|---|---|---|
| **Bandwidth** | The **theoretical maximum** rate a link can carry | A "1 Gbps" Ethernet port |
| **Throughput** | The rate **actually achieved** end to end, after overhead, errors, and retransmissions | A file copy that runs at 740 Mbps on that 1 Gbps link |
| **Capacity** | How much load a link or device can handle **before performance degrades**, including CPU, memory, and session limits | A firewall rated for 2 Gbps, but only 600 Mbps with IPS and TLS inspection on |

**Throughput is always lower than bandwidth** because of protocol headers, acknowledgments, and contention. A big gap with **no errors and low utilization** points somewhere else: a slow server or disk, a small TCP window over a long path, or an endpoint bottleneck.

**Measure, don't guess:**
- **Speed tester / iperf:** generate traffic between two points and report real throughput (iperf also reports jitter and loss with UDP). Use iperf to verify a new link really delivers its rated speed.
- **Utilization graphs (SNMP) and flow data (NetFlow/sFlow):** show how busy a link is over time and **which hosts ("top talkers")** are using it.
- **Interface status:** a gigabit link that **negotiated 100 Mbps** (bad pair, wrong cable category, or a hard-set speed) caps throughput at a tenth of what you expect.

**Baselines** matter: you only know 70% utilization is abnormal if you know normal is 20%.

## Congestion, contention, and bottlenecks

- **Congestion:** **demand exceeds capacity**, so packets wait in queues and, when queues fill, get **dropped**.
- **Contention:** many senders **competing for the same shared resource**: an uplink, a WAN circuit, or a Wi-Fi channel's airtime. Contention is *why* congestion happens on shared media.
- **Bottleneck:** the **lowest-capacity point** in a path. The whole path can go no faster than its narrowest part. Classic spots: a **10G link feeding a 1G link**, a busy **uplink** shared by 48 access ports, a **WAN circuit**, or an undersized **firewall**.

**Symptoms of congestion:** utilization near **100%**, rising latency, **output drops / discards** on interface counters, and slowness that follows a **time pattern** (every day at 9 a.m., every afternoon during backups).

**Common culprits:**
- **Bandwidth hogs:** one host streaming, downloading, or infected with malware. Flow analysis identifies the top talker.
- **Scheduled jobs:** backups or updates saturating the WAN during business hours.
- **Broadcast overhead:** a huge flat network where every host processes every broadcast. Segment it into smaller VLANs.
- **Switching loops:** broadcast storms can saturate links and CPUs in seconds (STP prevents this).
- **Overloaded devices:** a firewall or router with high CPU or session counts adds latency and drops connections.

**Fixes, from cheapest to most expensive:**
1. **Move or schedule** the heavy traffic (run backups off-hours).
2. **QoS:** **classify and mark** traffic (DSCP at Layer 3, 802.1p/CoS at Layer 2), then give voice a **priority queue** (LLQ) and protect business apps.
3. **Traffic shaping** (buffers excess traffic and sends it at a set rate, smoothing bursts) or **policing** (drops or re-marks traffic above a rate).
4. **Upgrade the bottleneck** or add links (e.g. link aggregation).

**QoS only matters when there's congestion.** On an idle link, every packet is sent immediately anyway, so QoS changes little. QoS also **doesn't create bandwidth**; it decides who waits when there isn't enough. Confirm QoS is working by checking **queue statistics** and measuring voice latency, jitter, and loss.

## Latency

**Latency** is the time a packet takes to get from source to destination (often measured as **round-trip time**, RTT, with ping). Total delay is the sum of four parts:

| Delay type | Cause | Reduced by |
|---|---|---|
| **Propagation** | Distance; signals travel at a fixed fraction of light speed | Shorter path or closer server (not more bandwidth) |
| **Serialization** | Time to put the bits on the wire | Faster links (matters on slow links) |
| **Processing** | Device inspecting and forwarding the packet | Faster or less-loaded devices |
| **Queuing** | Waiting in buffers behind other packets | Less congestion, QoS |

**Key ideas:**
- **More bandwidth doesn't fix propagation delay.** A geostationary satellite link adds roughly **500–600 ms round trip** no matter how fast it is. (Low-earth-orbit satellite services have much lower latency.)
- **Bufferbloat:** oversized buffers on a congested device hold packets for a long time instead of dropping them, so latency balloons during heavy uploads or downloads.
- **VPN hairpinning:** traffic that's sent to a distant VPN concentrator and back out to the internet takes a long detour.
- **Overloaded devices:** high CPU on a router or firewall adds processing delay.
- **TCP over long distances:** a single TCP flow can only have one **window** of unacknowledged data in flight per round trip, so **throughput ≤ window size ÷ RTT**. A 64 KB window over 120 ms RTT is only about 4.4 Mbps, even on an idle 1 Gbps link. Fix with **TCP window scaling**, parallel streams, or **WAN optimization**.

**VoIP targets:** one-way latency **150 ms or less** (ITU-T G.114). Beyond that, people talk over each other.

**Troubleshooting:** latency only at certain times → **correlate monitoring data** (utilization, errors, routing changes) with those times. One hop in a traceroute jumping to 300 ms while later hops are back to 20 ms usually means that router just **deprioritizes replies to ICMP/TTL-expired** messages, not a real problem.

## Jitter

**Jitter** is the **variation in delay** between packets. If packets arrive 20 ms, 90 ms, 25 ms, 140 ms apart, the jitter is high even if the average latency looks acceptable.

- **Why it hurts real-time traffic:** voice and video need packets at a **steady rate**. Phones use a **jitter buffer** to smooth out small variations, but late packets beyond the buffer are discarded, causing **choppy, robotic, or clipped audio** and **frozen or pixelated video**.
- **Doesn't hurt bulk data much:** a file download just reassembles packets and doesn't care about timing, which is why "**VoIP is robotic but downloads are fine**" is the classic jitter scenario.
- **Causes:** congestion and **variable queuing**, no QoS, busy Wi-Fi (contention for airtime), and consumer broadband with bursty cross-traffic.
- **Target:** under about **30 ms**.
- **Fixes:** **QoS** with a priority queue for voice, reduce congestion, prefer wired over Wi-Fi for desk phones, and use Wi-Fi QoS (WMM).
- **Measure it:** **iperf** in UDP mode, VoIP monitoring tools, or call-quality reports (MOS scores).

Scenario: video calls are fine in the office but choppy from home, and the home speed test is high. A speed test measures raw throughput, not consistency, so the likely culprit is **jitter or packet loss** on the home connection or Wi-Fi.

## Packet loss

**Packet loss** is packets that **never arrive**. Even a few percent is very noticeable.

**Effects:**
- **Real-time media** (voice, video): gaps and dropouts, because there's no time to resend. Target under about **1%**.
- **TCP:** lost segments must be **retransmitted** and TCP **slows its sending rate**, so throughput collapses.

**Causes and where to look:**

| Cause | Evidence |
|---|---|
| **Congestion** | Output drops/discards, high utilization |
| **Bad cable, connector, or optic** | **CRC errors** and input errors on the interface |
| **Duplex mismatch** | Late collisions on the half-duplex side, CRC errors on the other |
| **Overloaded device** | High CPU, dropped sessions |
| **Wireless interference or collisions** | High **retry rate**, low SNR, high channel utilization |
| **MTU mismatch with ICMP blocked** | Small packets work, large ones silently vanish |

**MTU black hole:** if a link in the path has a smaller MTU and ICMP "fragmentation needed" messages are blocked, **path MTU discovery** fails. Small packets (pings, logins) work but large transfers **hang**. Fix by allowing that ICMP type or clamping the **TCP MSS**.

**Tools:**
- **ping** (continuous, e.g. `ping -t` on Windows) shows loss to one destination.
- **pathping** (Windows) and **mtr** (Linux) combine traceroute with **per-hop loss statistics**, so you can see *where* loss starts.
- **iperf** measures throughput, jitter, and loss between two hosts.
- **Interface counters** (`show interfaces`) show whether drops are errors or congestion.

## Wireless interference and channel overlap

Wi-Fi is a **shared, half-duplex** medium: only one device on a channel can transmit at a time, so anything that uses the channel's airtime slows everyone.

| Problem | Cause | Fix |
|---|---|---|
| **Co-channel interference (CCI)** | Nearby APs on the **same** channel must take turns | Channel plan, lower transmit power, narrower channels |
| **Adjacent-channel interference (ACI)** | **Overlapping** channels, e.g. 3 and 5 in 2.4 GHz | Use only **1, 6, 11** in 2.4 GHz |
| **Wide channels in 2.4 GHz** | A 40 MHz channel covers most of the band | Use **20 MHz** in 2.4 GHz |
| **Non-Wi-Fi interference** | Microwaves, Bluetooth, cordless phones, baby monitors (2.4 GHz); **radar on DFS channels** (5 GHz) | Find it with a **spectrum analyzer**; move to 5/6 GHz |
| **Hidden node** | Two clients can hear the AP but **not each other**, so they transmit at once and collide at the AP | Adjust AP placement, **RTS/CTS** |
| **Overcrowding (high client density)** | Too many clients per AP in a meeting room or lecture hall | More APs, 5/6 GHz, band steering, airtime fairness |

**Why channel overlap matters:** in 2.4 GHz, channels are only 5 MHz apart but about 20 MHz wide, so only **three don't overlap**. 5 GHz and 6 GHz have many more channels, which is why dense deployments use them with **20 or 40 MHz** widths instead of 80/160 MHz.

**DFS:** some 5 GHz channels are shared with **radar**. When an AP detects radar it must **leave the channel**, briefly disconnecting clients.

**Metrics a Wi-Fi tool shows:**
- **Channel utilization:** how busy the channel is from all sources. High values (e.g. over 50%) mean contention.
- **Retry rate:** the percentage of frames that had to be **resent**. High retries mean interference, collisions, or weak signal.

Scenario: the site survey shows good coverage everywhere, but throughput collapses during big meetings → **overcrowding/contention**, not coverage. A strong signal doesn't guarantee clean airtime.

## Signal degradation and coverage

**Signal degradation** is the weakening of RF as it travels and passes through or bounces off things.

| Effect | What happens | Typical culprit |
|---|---|---|
| **Attenuation / free-space path loss** | Signal weakens with distance | Clients far from the AP |
| **Absorption** | Material soaks up RF | Concrete, brick, **water** (people, fish tanks), and 2.4 GHz less affected than 5/6 GHz |
| **Reflection** | Signal bounces off a surface | **Metal** shelving, mirrors, elevators |
| **Multipath** | Reflected copies arrive at **different times** and distort each other (older standards) | Warehouses, metal-rich spaces |
| **Refraction / scattering** | Signal bends or breaks up | Glass, uneven surfaces |

**Measuring signal:**
- **RSSI** is received signal strength in **dBm** (negative numbers; closer to 0 is stronger). About **−67 dBm** is a common target for voice and video; around **−70 dBm** is acceptable for data; below **−80 dBm** is poor.
- **SNR (signal-to-noise ratio)** = signal − noise, in **dB**. Signal −65 dBm with noise −90 dBm → **25 dB**. Aim for at least about **20–25 dB**. SNR describes **quality**, not just strength.

**Insufficient coverage:** dead spots and weak edges cause **low data rates** (clients rate-shift down), retries, and drops. Fix with a **site survey** and **heat map**, adding or moving APs, using appropriate antennas, and designing for the band the clients actually use (5/6 GHz cells are smaller).

**Legacy and low data rates:** slow clients (old 802.11b/g) and low **basic data rates** (1, 2, 5.5, 11 Mbps) take much longer to send each frame, eating airtime. **Disabling low data rates** shrinks cells, frees airtime, and pushes clients to roam sooner.

**Transmit power:** cranking **every AP to maximum power** in a dense office increases co-channel interference and creates **sticky clients**, because clients can hear far-away APs but the AP can't hear the weaker client well.

## Client disassociation and roaming

**Client disassociation issues:** clients keep dropping off the Wi-Fi.
- **Weak signal or interference:** the client loses the AP at the cell edge.
- **Authentication problems:** 802.1X/RADIUS timeouts, expired certificates, or a wrong pre-shared key cause repeated disconnects.
- **Mismatched settings:** security mode or band settings a client doesn't support (e.g. WPA3-only with older clients).
- **AP load balancing or band steering** that's too aggressive kicks clients off.
- **DFS radar events** force the AP to change channels.
- **Deauthentication attacks:** forged deauth frames from an attacker (802.11w **protected management frames** helps).
- **Power-saving drivers** on the client put the NIC to sleep.

**Roaming** is a client moving from one AP to another without dropping the session. The **client** decides when to roam.

| Roaming problem | Cause | Fix |
|---|---|---|
| **Sticky client** | Client holds on to a distant AP | Lower AP power, raise minimum data rates, **802.11k/v** to guide clients |
| **Calls drop while walking** | Full re-authentication at each AP takes too long | **802.11r fast BSS transition** (and 802.11k/v) |
| **Session or IP changes after roaming** | APs place the SSID in **different VLANs/subnets** | Same SSID mapped to the same VLAN (or a controller that handles it) |
| **Client won't roam at all** | APs use **different SSIDs or security settings** | Identical SSID, security, and settings on every AP |
| **Gaps between cells** | Not enough overlap | Design about **15–20% cell overlap** |

**802.11k** gives clients a list of neighbor APs, **802.11v** lets the network suggest a better AP, and **802.11r** speeds up the security handshake during the move.

## Common mix-ups

- **Bandwidth vs throughput:** bandwidth is the **rated maximum**; throughput is what you **actually get**.
- **Latency vs jitter:** latency is **how long** a packet takes; jitter is **how much that delay varies**. Robotic voice with fine downloads → jitter.
- **Congestion vs bottleneck:** congestion is the **condition** (too much demand); the bottleneck is the **location** where it happens (the narrowest link).
- **Shaping vs policing:** shaping **buffers and delays** excess traffic; policing **drops or re-marks** it.
- **Co-channel vs adjacent-channel interference:** co-channel = **same** channel, APs take turns; adjacent = **overlapping** channels, frames get corrupted.
- **RSSI vs SNR:** RSSI is **raw strength**; SNR is strength **compared to the noise floor**, the better quality measure.
- **Wi-Fi analyzer vs spectrum analyzer:** a Wi-Fi analyzer sees **802.11 networks**; a spectrum analyzer sees **all RF energy**, including microwaves.
- **Coverage problem vs capacity problem:** weak signal in an area → coverage; good signal but slow when crowded → capacity/contention.

## Key terms

- **Bottleneck:** the lowest-capacity point in a path.
- **Contention:** multiple senders competing for the same link or airtime.
- **Bufferbloat:** excessive buffering that causes high latency under load.
- **Jitter buffer:** a buffer in phones that smooths out variation in packet arrival.
- **QoS:** classifying, marking, and prioritizing traffic during congestion.
- **LLQ:** low-latency queuing, a strict priority queue for voice.
- **Retry rate:** the percentage of wireless frames retransmitted.
- **Channel utilization:** how busy a wireless channel is.
- **DFS:** dynamic frequency selection; 5 GHz channels shared with radar.
- **Sticky client:** a client that won't roam to a closer AP.
- **802.11k/v/r:** neighbor reports, network-assisted transitions, and fast roaming.
- **PMTUD black hole:** large packets silently dropped because ICMP is blocked.

> **Exam tip:** "Robotic VoIP but downloads fine" → jitter, fix with QoS. "Slow every day at 9 a.m." → congestion at peak; check utilization. "Microwave kills Wi-Fi at lunch" → 2.4 GHz interference; use a spectrum analyzer. "Fast link but slow transfer over a long distance" → latency and the TCP window. "Calls drop when walking between APs" → roaming; use 802.11r.
