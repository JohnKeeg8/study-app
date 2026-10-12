# Network monitoring

Monitoring tells you what the network is doing **right now** and what is **normal**, so you can spot problems before users call. This lesson covers the monitoring solutions Network+ names, and the methods behind them: **SNMP**, **flow data**, **packet capture** with **port mirroring**, **baselines and alerts**, **log aggregation** (syslog and SIEM), and **API integration**.

## Monitoring solutions

Network+ groups monitoring into five jobs. Each answers a different question:

| Solution | Question it answers | Typical method |
|---|---|---|
| **Network discovery** | What devices are on the network, and how are they connected? | Scans, SNMP, LLDP/CDP; run **ad hoc** (one-off) or **scheduled** (regular) |
| **Traffic analysis** | Who is talking to whom, using which apps, and how much? | **Flow data** (NetFlow/IPFIX/sFlow), packet capture |
| **Performance monitoring** | Is the network fast and healthy? | SNMP counters: utilization, latency, jitter, loss, errors, CPU |
| **Availability monitoring** | Is it up? | **ICMP ping**, SNMP up/down status, service checks, **synthetic** transactions |
| **Configuration monitoring** | Has a device's config changed or drifted? | Config backups and **diffs** against the baseline |

- **Scheduled discovery** catches devices that appear later, such as a rogue switch or an unauthorized AP. **Ad hoc discovery** is a one-time scan, for example when you inherit an undocumented network.
- **Synthetic monitoring** simulates a user (logs in, loads a page) on a schedule, so you learn a service is broken even if the server still answers ping.
- A **network management system (NMS)** pulls these together on one dashboard with topology maps, status, and alerts.
- Put monitoring and management traffic on a **dedicated management network or VLAN** to protect it from user traffic.

## SNMP components and operations

**SNMP (Simple Network Management Protocol)** is the classic way an NMS reads device health.

- **Manager (NMS):** the monitoring server that asks for data and receives alerts.
- **Agent:** software on the managed device (switch, router, printer, UPS) that answers requests and sends alerts.
- **MIB (Management Information Base):** the "dictionary" that defines what a device can report or set.
- **OID (Object Identifier):** the unique numeric address of one value in the MIB tree, e.g. `1.3.6.1.2.1.2.2.1.10` is an interface's input octets.

**Operations:**

| Operation | Direction | Port | What it does |
|---|---|---|---|
| **Get / GetNext / GetBulk** | Manager → agent | UDP **161** | Read one value, the next value, or many values at once |
| **Walk** | Manager → agent | UDP 161 | Repeated GetNext/GetBulk to read a whole subtree; useful to see what a device exposes |
| **Set** | Manager → agent | UDP 161 | **Change** a writable value (needs read-write access) |
| **Trap** | Agent → manager | UDP **162** | **Unsolicited** alert (e.g. link down); fire-and-forget |
| **Inform** | Agent → manager | UDP 162 | Like a trap but **acknowledged**, and resent until it is |

**Polling vs traps:** polling every few minutes builds history (graphs), but you only learn of a failure at the next poll. Traps tell you **immediately** when something happens. Most NMSs use both.

## SNMP versions and security

| Version | Authentication | Encryption | Notes |
|---|---|---|---|
| **v1** | Community string, sent in **cleartext** | None | Original version |
| **v2c** | Community string, **cleartext** | None | Added **GetBulk** and **Informs**; still the most common |
| **v3** | **Usernames** with hashed authentication (e.g. SHA) | Yes (e.g. **AES**) | The **secure** version |

**Community strings** are shared passwords: a **read-only (RO)** string lets the manager read, and a **read-write (RW)** string also allows Set. **"public"** (RO) and **"private"** (RW) are well-known defaults that attackers try first. Anyone sniffing v1/v2c traffic can read the string.

**SNMPv3 security levels:**
- **noAuthNoPriv:** username only, no authentication or encryption.
- **authNoPriv:** authenticated, but data isn't encrypted.
- **authPriv:** **authenticated and encrypted**. This is what "secure SNMP" means.

**Hardening:** use SNMPv3 authPriv; if v2c is unavoidable, change the default strings, use **read-only** where possible, and restrict which manager IPs may query (ACLs).

## Flow data and traffic analysis

**Flow data** summarizes **conversations** instead of saving every packet. A **flow record** typically holds source and destination IP, source and destination port, protocol, **byte and packet counts**, timestamps, and the interface.

- **NetFlow** (Cisco origin): the router or switch (**exporter**) tracks flows and sends records to a **collector**; an **analyzer** turns them into reports.
- **IPFIX:** the IETF **standard** version, based on NetFlow v9.
- **sFlow:** **samples** packets statistically (e.g. 1 in 1,000) instead of tracking every flow, so it has **low overhead** on very fast links but is less precise.

**What it's good for:**
- Finding **top talkers** ("Who is eating the WAN link?").
- **Capacity planning** using historical trends.
- Spotting **anomalies**, such as a host suddenly sending large amounts of data at night (possible exfiltration) or scanning many ports.

**Limits:** flow data shows **who, when, and how much**, but **not the payload**. Port numbers alone can't always identify an app (most traffic is on 443), so **application-aware** analysis (deep packet inspection, Cisco NBAR) can classify traffic by app.

## Packet capture and port mirroring

**Packet capture** records **full packets**, headers and payload, for deep analysis in a **protocol analyzer** such as **Wireshark** or **tcpdump**. It lets you see TCP handshakes, retransmissions, DNS queries, and exact error messages that counters and flows can't show.

**Limits:** captures use **a lot of storage**, and **encrypted payloads (TLS)** can't be read without keys. Capture only what you need, using filters.

**Getting the traffic to the analyzer:** a switch only sends a frame out the port where the destination lives, so plugging a laptop into a random port sees almost nothing. You need a copy of the traffic:

| Method | How it works | Strengths | Weaknesses |
|---|---|---|---|
| **Port mirroring (SPAN)** | The switch **copies** traffic from chosen ports or VLANs to a monitor port | Free, configured in software | Can **drop frames** if the monitor port is **oversubscribed**; usually drops errored frames; uses switch CPU |
| **RSPAN / ERSPAN** | Sends the mirrored copy to a monitor port on **another switch** (RSPAN over a VLAN, ERSPAN in a GRE tunnel across routed networks) | Analyzer can be elsewhere | Same oversubscription risk |
| **Network TAP** | A **hardware** device inserted in the link that **passively copies everything** | Sees **all** traffic, **including errors**; no switch config needed | Costs money; installing it briefly breaks the link |

Scenario: a security team needs a permanent, lossless copy of the internet uplink for an IDS → **TAP**. A tech needs a quick capture of one user's port today → **SPAN**.

## Baselines, metrics and alerting

A **baseline** is a record of **normal** performance over time (e.g. two weeks, including business hours and backups). Without a baseline you can't tell whether 70% utilization is normal or a problem.

**Key metrics:**
- **Bandwidth vs throughput:** bandwidth is the **theoretical capacity** of the link (e.g. 1 Gbps); **throughput** is the **actual data rate achieved**. Utilization is throughput as a percentage of bandwidth.
- **Latency:** delay from source to destination (ms).
- **Jitter:** **variation** in latency between packets. Hurts voice and video.
- **Packet loss:** percentage of packets that never arrive.
- **Interface errors:** **CRC errors** and runts usually mean a **Layer 1** problem (bad cable, interference, duplex mismatch).
- **Discards (drops):** packets the device threw away even though they were valid, usually because of **congestion** (buffers full).
- **Device health:** **CPU, memory, temperature**, and **up/down status**. Sustained high CPU can point to a loop, an attack, or misconfiguration.

**Thresholds and alerting:** set thresholds (e.g. utilization over 80% for 10 minutes, any interface down) so the NMS **notifies** staff by email, text, or ticket. **Anomaly alerting** compares live data to the baseline and alerts on unusual behavior even when no fixed threshold is crossed. Tune alerts so staff don't suffer **alert fatigue** and start ignoring them.

**Trending:** months of utilization history show when a WAN link will need an upgrade (**capacity planning**).

## Logs, syslog and SIEM

**Syslog** sends log messages from devices to a central **syslog collector (server)**, traditionally on **UDP 514** (TCP or TLS can be used for reliability and security). Each message has a **facility** (source type) and a **severity**:

| Level | Name | Level | Name |
|---|---|---|---|
| 0 | Emergency | 4 | Warning |
| 1 | Alert | 5 | Notice |
| 2 | Critical | 6 | Informational |
| 3 | Error | 7 | Debug |

- **Lower number = more severe.** Setting a logging level sends **that level and everything more severe** (lower numbers). Level 3 sends Error, Critical, Alert, and Emergency.
- **Debug (7)** produces huge volumes and raises CPU; use it briefly on production devices.
- Memory aid: "**E**very **A**wesome **C**isco **E**ngineer **W**ill **N**eed **I**ce cream **D**aily."

**Log aggregation** collects logs from many devices into one place for **searching, correlation, and retention**. Logs stored only on a device are lost when it reboots or is compromised.

A **SIEM (security information and event management)** goes further: it **correlates** events from many sources (firewalls, servers, switches, authentication) to detect threats, e.g. many failed logins followed by one success from a new country. It also provides dashboards, alerts, and long-term retention for **compliance**.

**Time matters:** all devices must use **NTP** so timestamps line up. Without synchronized clocks, you can't put events from different devices in the right order.

## API integration and automation

Modern monitoring tools talk to other systems through **APIs**:
- **REST APIs** (usually **JSON** over HTTPS) let tools pull data or push changes. Example: the NMS calls the ticketing system's API to **open a ticket** automatically when a link goes down.
- **Webhooks** are "reverse APIs": when an event happens, the tool **sends an HTTP POST** to a URL you configured, e.g. posting an alert into a chat channel.
- **Enrichment:** a SIEM can call a threat-intelligence API to look up an IP address in an alert.
- **Automation:** an alert can trigger a script or playbook, such as gathering diagnostics or disabling a compromised port.

**Streaming telemetry** reverses SNMP polling: devices **push** structured data continuously (every few seconds) to a collector. It gives far more detail with less load than frequent polling.

Secure API access with **tokens or keys over HTTPS** and **least-privilege** permissions.

## Common mix-ups

- **Trap vs inform:** both are agent-initiated alerts on UDP 162; a **trap** is fire-and-forget, an **inform** is **acknowledged**.
- **Poll vs trap ports:** the manager polls agents on **UDP 161**; agents send traps to the manager on **UDP 162**.
- **MIB vs OID:** the **MIB** is the whole dictionary; an **OID** is one entry's address in it.
- **Flow data vs packet capture:** flows give **summaries** (who, how much) with little storage; captures give **full packets** (what exactly) with lots of storage.
- **SPAN vs TAP:** SPAN is a **switch feature** that can drop frames under load; a TAP is **hardware** that copies everything, even errors.
- **Bandwidth vs throughput:** **capacity** vs **actual achieved rate**.
- **Latency vs jitter:** **delay** vs **variation in delay**.
- **CRC errors vs discards:** CRC errors suggest **physical** problems; discards suggest **congestion**.
- **Syslog vs SIEM:** syslog **collects** logs; a SIEM **correlates and analyzes** them for security.
- **Syslog levels:** **0 is the most severe**, 7 the least. A higher number is not "worse".

## Key terms

- **NMS:** network management system; the central monitoring platform (SNMP manager).
- **Agent:** SNMP software on a managed device.
- **MIB / OID:** the SNMP object dictionary / one object's identifier.
- **Community string:** SNMPv1/v2c shared password, sent in cleartext.
- **authPriv:** SNMPv3 level with authentication and encryption.
- **Flow record:** a summary of one conversation (IPs, ports, protocol, bytes, time).
- **Top talkers:** the hosts or apps using the most bandwidth.
- **SPAN:** switch port mirroring. **RSPAN/ERSPAN:** mirroring to another switch.
- **TAP:** hardware that passively copies all traffic on a link.
- **Baseline:** recorded normal performance used for comparison.
- **Jitter:** variation in packet delay.
- **Syslog:** standard for sending logs to a central collector (UDP 514).
- **SIEM:** security information and event management; correlates logs to detect threats.
- **Webhook:** an HTTP callback a tool sends when an event happens.
- **Streaming telemetry:** devices pushing data continuously instead of being polled.

> **Exam tip:** "Who's using the bandwidth?" → **NetFlow/flow data**. "See the actual packets" → **packet capture** via **SPAN or a TAP** (TAP if nothing can be missed). "Secure SNMP" → **SNMPv3 authPriv**. "Alert immediately when a link goes down" → **SNMP trap**. "Correlate logs from many devices to find attacks" → **SIEM**. Syslog level **0 = Emergency**, the most severe.
