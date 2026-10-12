# Cabling & physical interface issues

## Cable problems

| Issue | Symptoms / cause | Fix |
|---|---|---|
| **Incorrect cable type** | Cat 5e on a 10G run, multimode where single-mode is needed, wrong jacket rating | Use the right category, fiber type, and rating |
| **Signal degradation: attenuation** | Signal fades over distance; copper over **100 m** gives errors | Shorten the run, add a switch, or use fiber |
| **Signal degradation: crosstalk** | Signal bleeds between pairs, often from **untwisting too much** at terminations | Re-terminate properly |
| **Signal degradation: EMI** | Interference from motors, lights, power cables | Reroute, use STP or fiber |
| **Improper termination** | Opens, shorts, split pairs, reversed or crossed pairs, loose punchdowns | Re-crimp or re-punch; test with a cable tester or certifier |
| **TX/RX transposed** | A new fiber link stays down even though the optics are fine | **Swap the two fibers** at one end (polarity) |
| **Dirty or damaged fiber** | Low RX light, errors | Inspect with a fiber scope, clean, check bend radius |
| **Kinked or crushed cable** | Errors, slow speed, or no link | Replace the cable |

A **split pair** passes continuity tests but has severe crosstalk. Only a cable **certifier** catches it.

## Interface counters and status

| Counter / status | Usually means |
|---|---|
| **CRC / FCS errors** increasing | Physical problem: bad cable, EMI, or duplex mismatch |
| **Runts** (frames under 64 bytes) | Collisions or a faulty NIC |
| **Giants** (frames over MTU) | MTU or jumbo frame mismatch |
| **Late collisions** | **Duplex mismatch** or a cable that's too long |
| **Output drops / discards** | Congestion (queues full) |
| **Input queue drops** | Device can't keep up (CPU) or traffic bursts |
| **Up/up** | Working |
| **Down/down** | Physical: unplugged, bad cable, far end off |
| **Up/down** (line protocol down) | Layer 2 problem: encapsulation or keepalive mismatch |
| **Administratively down** | Shut down deliberately (`shutdown`) |
| **Err-disabled** | Auto-disabled for a violation (port security, BPDU guard, link flapping). Fix the cause, then `shut`/`no shut` |

## Hardware issues

- **PoE:**
  - The device needs more power than the port's class provides (e.g. a PoE+ AP on an 802.3af port), or the switch's **total PoE budget** is exhausted.
  - Symptoms: devices won't power on or keep rebooting.
  - Check with `show power inline`.
- **Transceiver mismatch:**
  - SR on one end and LR on the other, wrong speed (an SFP in an SFP+ link), or an unsupported third-party module.
  - Optics must match on both ends.
- **Signal strength:**
  - **Fiber:** check **DOM** RX power against receiver sensitivity. Too weak means dirt, breaks, or wrong fiber; too strong saturates the receiver (add an **attenuator** on short long-reach links).
  - **Wireless:** low **RSSI** (e.g. weaker than −70 dBm) or low SNR causes slow, dropping connections.
- **Speed/duplex fallback:** a gigabit link that negotiates only 100 Mbps often has one bad pair.

> **Exam tip:** "CRC errors rising" → Layer 1 (cable/EMI). "Late collisions" → duplex mismatch. "New fiber link down, optics good" → TX/RX swapped. "Port err-disabled after a hub was plugged in" → port security or BPDU guard.
