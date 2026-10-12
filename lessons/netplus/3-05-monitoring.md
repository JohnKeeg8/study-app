# Network monitoring

## SNMP

**SNMP** lets a **manager** (NMS) collect data from **agents** on devices.
- Each value is an **OID**, defined in a **MIB**.
- The manager **polls** with Get/GetNext/GetBulk/Walk on **UDP 161** and changes values with **Set**.
- Agents send unsolicited **traps** to the manager on **UDP 162**. **Informs** are traps that require an acknowledgment.

| Version | Security |
|---|---|
| v1 / v2c | Community strings in **cleartext** ("public"/"private" are well-known defaults) |
| **v3** | Users with **authentication and encryption** (authPriv) |

## Flow data

**NetFlow / IPFIX / sFlow** export conversation summaries: source and destination IP, ports, protocol, bytes, and time. Use them to find **top talkers**, plan capacity, and spot unusual traffic. **sFlow samples** packets, which keeps overhead low on fast links.

## Packet capture

Full packets (headers and payload) for deep analysis with **Wireshark** or **tcpdump**. Captures need a lot of storage and can't read encrypted payloads.

Getting the traffic:
- **Port mirroring (SPAN):** the switch copies traffic to a monitor port. It can drop frames if oversubscribed. **RSPAN/ERSPAN** send the copy to another switch.
- **Network TAP:** a hardware device that passively copies everything, including errors.

## Baselines and metrics

Record what's normal so problems stand out:
- **Utilization:** compare against bandwidth vs **throughput** (what's actually achieved).
- **Latency, jitter, packet loss.**
- **Interface errors and discards:** CRC errors point to Layer 1 problems; discards usually mean congestion.
- **CPU, memory, and up/down status.**

Set **thresholds and alerts** on these.

## Logs

- **Syslog** (UDP 514) sends device logs to a central server. Severity levels run from 0 to 7:

| Level | Name | Level | Name |
|---|---|---|---|
| 0 | Emergency | 4 | Warning |
| 1 | Alert | 5 | Notice |
| 2 | Critical | 6 | Informational |
| 3 | Error | 7 | Debug |

Setting a level sends that level and everything more severe.
- **Log aggregation / SIEM:** centralizes and **correlates** logs across devices, alerts on security events, and retains logs for compliance. Accurate **NTP** time is essential.

## API integration

Modern tools exchange data through **REST APIs** and **webhooks**: monitoring can open tickets, enrich alerts, or trigger automation. **Streaming telemetry** pushes data from devices instead of waiting to be polled.

> **Exam tip:** "Who's using the bandwidth?" → NetFlow. "See the actual packets" → packet capture via SPAN or a TAP. "Secure SNMP" → SNMPv3.
