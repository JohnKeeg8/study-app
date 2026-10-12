# Deception technologies

Deception technologies plant **fake targets** that no legitimate user should ever touch. Any interaction is a strong, low-false-positive sign of an intruder, and it shows defenders the attacker's tools and methods.

## Types

| Technology | What it is |
|---|---|
| **Honeypot** | A single decoy system (fake server or service) that attracts attackers |
| **Honeynet** | A **network** of honeypots that simulates a realistic environment for deeper observation |
| **Honeyfile** | A tempting fake document (e.g. "passwords.xlsx") that alerts when opened |
| **Honeytoken** | Fake data, such as a bogus credential, API key, or database record, that alerts when used |
| **DNS sinkhole / fake records** | Redirects malicious or decoy names to a controlled address |

## Interaction levels

- **Low-interaction:** emulates a few services. Easy and safe, but gathers less intelligence.
- **High-interaction:** a real system attackers can fully use. Richer intelligence, but more risk.

## Placement and use

- **Internet-facing** honeypots study external attacks.
- **Internal** honeypots catch **lateral movement** after a breach.
- **Isolate them carefully** (segmentation, monitoring) so attackers can't use a honeypot to reach real systems.
- Deception only **observes and alerts**. Never use it to "hack back". Involve legal and policy teams, because monitoring has legal implications.
- **Tarpits** deliberately slow down malicious connections, such as scanners and spam bots.

## Why use it

Signature-based tools need to recognize an attack. Deception doesn't: touching the decoy *is* the alert. That makes it effective against **unknown (zero-day)** techniques.

> **Exam tip:** One decoy → honeypot. Many decoys forming a fake network → honeynet. Fake credential that triggers an alert → honeytoken.
