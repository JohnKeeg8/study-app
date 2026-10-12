# Documentation

Documentation is how a network is understood by people who didn't build it, and by the people who did, six months later. Good documentation makes **troubleshooting, onboarding, audits, and change planning** faster. It's only useful if it's **accurate**, so **update it as part of every change** and store it centrally with version history.

## Network diagrams

| Diagram | What it shows | Use it when… |
|---|---|---|
| **Physical diagram** | Actual **devices, ports, cable runs, rooms, and locations** | Tracing a cable, planning a move, replacing hardware |
| **Logical diagram** | **IP subnets, VLANs, routing domains**, and how traffic **flows** | Adding a VLAN, designing firewall rules, understanding paths |
| **Rack diagram (rack elevation)** | What sits in **each rack unit**, front and back, including PDUs and patch panels | Installing gear, finding free space, planning power |
| **Data flow diagram** | How data moves between systems, zones, and apps | Security design and application troubleshooting |

Good diagram habits: **consistent symbols, a legend, device names, and dates or version numbers**.

## Cable maps and port documentation

A **cable map** (port map) records **where every cable goes**: which **wall jack** connects to which **patch panel port** and which **switch port**. Combined with **labels on both ends of every cable**, it lets a technician find a user's switch port in seconds.

When a user moves desks and their jack doesn't work, first check that the new jack is **patched to an active switch port**.

Device records should include **hostname, management IP, role, location, and firmware version**. **Never** store passwords in plain text in documentation; use a password vault.

## Asset inventory and IPAM

**Asset inventory:** a record of every hardware and software asset:
- **Model and serial number.**
- **Firmware/software version.**
- **Location and owner.**
- **Purchase date, warranty and support contract dates.**
- **Licenses.**

It supports **lifecycle planning** (knowing when support ends), **audits**, support calls, and **security**: you can't protect what you don't know about.

**IPAM (IP address management):** one place to plan and track:
- Subnets and their **utilization**.
- **Static assignments** (servers, printers, network devices).
- **DHCP scopes** and **DNS records**.

IPAM prevents **overlapping subnets and duplicate IP addresses**, and utilization reports warn when a scope is close to running out.

## Agreements and policies

| Document | What it is |
|---|---|
| **SLA** (service level agreement) | **Measurable commitments** between a provider and customer: **uptime %**, response and repair times, and **penalties** if missed |
| **OLA** (operational level agreement) | An internal agreement between teams that supports an SLA |
| **MOU** (memorandum of understanding) | A **non-binding** statement of shared goals and responsibilities |
| **NDA** (non-disclosure agreement) | A **legally binding** promise to keep shared information confidential |
| **SOW** (statement of work) | The **specific tasks, deliverables, and timeline** for a contracted project |
| **AUP** (acceptable use policy) | What users **may and may not do** on company systems; users usually sign it |
| **SOP** (standard operating procedure) | **Step-by-step instructions** for doing a routine task the same way every time |

**Uptime to downtime per year:**

| SLA uptime | Allowed downtime per year |
|---|---|
| 99% | ~3.65 days |
| 99.9% | ~**8.76 hours** |
| 99.99% | ~**52.6 minutes** |
| 99.999% ("five nines") | ~**5.26 minutes** |

## Baselines

A **baseline** records what **normal** looks like: typical utilization, latency, error rates, CPU and memory, and traffic patterns at different times of day.
- Without a baseline, you can't tell whether "the network is slow" is unusual.
- With one, **anomalies stand out** and you can plan capacity from trends.

## Wireless surveys

| Survey | How | When |
|---|---|---|
| **Predictive** | **Software models** coverage from floor plans and building materials | **Before** installing, to plan AP count and placement |
| **Passive** | Walk the site **listening** to all APs: signal strength, noise, channel use | Checking existing coverage and interference |
| **Active** | **Connect** to the network and measure real **throughput, latency, packet loss, roaming** | Confirming user experience |
| **Validation** | Post-installation survey | Proving the design works as built |

Surveys produce **heat maps**: color-coded maps of signal strength or SNR over the floor plan. **Re-survey after renovations** or big changes, because new walls, furniture, and neighbors change RF conditions.

## Common mix-ups

- **Physical vs logical diagram:** physical = **where things are and how they're cabled**; logical = **subnets, VLANs, and traffic flow**.
- **Rack diagram vs physical diagram:** a rack diagram zooms in on **one rack's U positions**.
- **SLA vs MOU:** SLA = **measurable, enforceable** commitments; MOU = **non-binding** intent.
- **NDA vs AUP:** NDA protects **confidential information** between parties; AUP governs **user behavior** on systems.
- **SOW vs SOP:** SOW = **a project's deliverables**; SOP = **how to do a routine task**.
- **Passive vs active survey:** passive **listens**; active **connects and tests**.
- **Asset inventory vs IPAM:** inventory tracks **equipment and licenses**; IPAM tracks **addresses**.

## Key terms

- **Heat map:** a visual map of signal strength across a floor plan.
- **Baseline:** recorded normal performance used for comparison.
- **Cable map:** documentation of jack → patch panel → switch port connections.
- **Five nines:** 99.999% availability (~5 minutes of downtime a year).
- **Legend:** the key explaining a diagram's symbols.

> **Exam tip:** "Shows VLANs and subnets" → logical diagram. "What's in each U" → rack diagram. "Uptime guarantee with penalties" → SLA. "Predict AP placement before install" → predictive survey.
