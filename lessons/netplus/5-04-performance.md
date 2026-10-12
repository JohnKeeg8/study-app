# Performance issues

## Key metrics

| Metric | Meaning | Hurts |
|---|---|---|
| **Bandwidth** | Theoretical link capacity | — |
| **Throughput** | Data rate actually achieved (always lower) | Big transfers |
| **Latency** | Delay from source to destination | Interactive apps, VoIP |
| **Jitter** | **Variation** in delay | VoIP and video (choppy, robotic audio) |
| **Packet loss** | Packets that never arrive | Real-time media, TCP throughput |

**VoIP targets:** one-way latency of **≤150 ms**, jitter under about 30 ms, loss under about 1%.

## Congestion

- **Cause:** demand exceeds capacity, typically at a **bottleneck** such as a slower WAN link or where a 10G link feeds a 1G link.
- **Symptoms:** utilization near 100%, rising latency, **output drops**, slowness at peak times.
- **Fixes:**
  - **QoS:** classify and mark traffic (DSCP, 802.1p), then give voice a **priority queue** (LLQ).
  - **Shaping** (buffer to a rate) or **policing** (drop above a rate).
  - Schedule backups and updates off-hours.
  - Upgrade the bottleneck link.
- QoS only matters **when there's congestion**. On an idle link it changes little.

## Latency

- **Components:** propagation (distance) + serialization + processing + queuing.
- **More bandwidth doesn't reduce propagation delay.** Geostationary satellite adds about 600 ms round trip.
- **Other causes:** overloaded devices (high CPU), deep queues (**bufferbloat**), and VPN hairpinning to distant concentrators.
- **TCP over long distances:** throughput is limited by window size ÷ round-trip time. Use window scaling or WAN optimization.

## Packet loss

- **Causes:** congestion, bad cables or optics (check CRC errors), overloaded devices, wireless interference.
- **Tools:**
  - **pathping** (Windows) and **mtr** show per-hop loss.
  - **iperf** tests throughput, jitter, and loss between two hosts.

## Wireless interference

| Problem | Cause | Fix |
|---|---|---|
| **Co-channel interference** | Nearby APs on the **same** channel share airtime | Channel plan, lower power, narrower channels |
| **Adjacent-channel interference** | **Overlapping** channels (e.g. 3 and 5 in 2.4 GHz) | Use 1, 6, 11 |
| **Non-Wi-Fi interference** | Microwaves, Bluetooth, cordless phones (2.4 GHz); radar on DFS channels (5 GHz) | Use a **spectrum analyzer**; move to 5/6 GHz |
| **Absorption / reflection / multipath** | Walls, water, metal shelving | Reposition APs, survey |
| **Weak signal / low SNR** | Too far from the AP | Add or move APs. Aim for SNR ≥ about 20–25 dB |
| **Overcrowding** | Too many clients per AP | More APs, 5/6 GHz, airtime fairness |
| **Sticky clients** | Clients hold on to a distant AP | 802.11k/v/r, right-size AP power |
| **Legacy clients** | Slow data rates eat airtime | Disable low data rates, separate SSID |

Calculating SNR: signal −65 dBm with noise −90 dBm → **25 dB**.

> **Exam tip:** "Robotic VoIP but downloads fine" → jitter, fix with QoS. "Slow every day at 9 a.m." → congestion at peak. "Microwave kills Wi-Fi at lunch" → 2.4 GHz interference.
