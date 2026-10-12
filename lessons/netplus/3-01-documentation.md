# Documentation

Good documentation makes troubleshooting, onboarding, audits, and change planning faster. It's only useful if it's **updated as part of every change**.

## Diagrams

| Type | Shows |
|---|---|
| **Physical diagram** | Actual devices, ports, cable runs, and locations |
| **Logical diagram** | IP subnets, VLANs, routing domains, and how traffic flows |
| **Rack diagram (elevation)** | What sits in each rack unit, front and back, including PDUs and patch panels |
| **Cable map / port map** | Which wall jack connects to which patch panel port and switch port |
| **Network diagram** | General term for any of the above; use a consistent legend and symbols |

## Records and inventories

- **Asset inventory:** hardware and software records, including model, **serial number**, firmware version, location, owner, warranty/support dates, and licenses. You can't protect or plan for what you don't know about.
- **IPAM (IP address management):** tracks subnets, static assignments, DHCP scopes, and DNS records. It prevents **overlaps and duplicate IPs** and shows when scopes are running out.
- **Baselines:** normal performance levels (utilization, latency, errors), so you can spot anomalies.
- **SOPs:** step-by-step procedures for routine tasks.

## Agreements

| Document | Purpose |
|---|---|
| **SLA** (service level agreement) | Measurable commitments: uptime %, response and repair times, penalties |
| **MOU** (memorandum of understanding) | Non-binding statement of shared intent |
| **NDA** | Legally protects confidential information |
| **SOW** (statement of work) | Specific tasks, deliverables, and timeline of a project |
| **AUP** (acceptable use policy) | What users may and may not do on company systems |

**Uptime math:**
- 99.9% ≈ **8.76 hours** of downtime per year
- 99.99% ≈ **52.6 minutes** per year
- 99.999% ("five nines") ≈ **5.26 minutes** per year

## Wireless surveys

- **Predictive:** software models coverage from floor plans *before* installing.
- **Passive:** walk the site and listen to existing APs (signal, noise, channels).
- **Active:** connect and measure real throughput, latency, and roaming.
- **Heat maps** visualize signal strength across the floor plan.
- **Re-survey** after renovations or major changes.

> **Exam tip:** "Which document shows VLANs and subnets?" → logical diagram. "Which shows what's in each U of a rack?" → rack diagram. "Uptime guarantee" → SLA.
