# Deception technologies

Deception technologies plant **fake targets** that no legitimate user should ever touch. Because real users have no reason to interact with them, any interaction is a strong, **low-false-positive** sign of an intruder, and watching the intruder shows defenders their tools and methods. N10-009 names **honeypots** and **honeynets**; you should also know honeyfiles, honeytokens, DNS sinkholes, and tarpits.

## Why deception works

Most detection tools look for **known bad** behavior: an IDS signature, a malware hash, a known malicious IP. An attacker using a new technique or legitimate admin tools can slip past them.

Deception flips the logic: instead of recognizing the attack, you create something that **should never be touched**.
- **No legitimate purpose = no normal traffic.** A decoy server isn't in DNS for users, isn't in any application, and isn't advertised. If someone connects to it, they're scanning or exploring.
- **High-fidelity alerts:** very few false positives, so the security team trusts and acts on them.
- **Detects unknown (zero-day) techniques:** it doesn't matter what tool the attacker uses; touching the decoy *is* the alert.
- **Intelligence:** watching what the attacker does on the decoy reveals their tools, techniques, and goals.
- **Wastes attacker time** that would otherwise be spent on real systems.

Deception **complements** firewalls, IDS/IPS, and endpoint protection. It doesn't replace them, and it doesn't **prevent** attacks on real systems.

## Honeypots

A **honeypot** is a **single decoy system**, such as a fake file server, database, web server, or an exposed SSH or RDP service, set up to attract attackers and record what they do.

Honeypots differ in how much of a real system they offer:

| Interaction level | What it is | Pros | Cons |
|---|---|---|---|
| **Low-interaction** | **Emulates** a few services and canned responses (e.g. a fake SSH login prompt) | Easy to deploy, **low risk**, little maintenance | Gathers **limited intelligence**; skilled attackers may spot it |
| **High-interaction** | A **real operating system** and services the attacker can fully use | **Rich intelligence**: commands, tools, malware samples | **Higher risk**: a compromised real system could be used to attack others; needs careful isolation and monitoring |

- A good honeypot looks **believable**: realistic hostname (e.g. `FIN-DB02`), plausible services, maybe some fake data.
- Scenario: "The security team wants to see which exploits attackers try against SSH, with minimal risk" → a **low-interaction** honeypot. "Researchers want to capture the full toolkit an intruder installs" → a **high-interaction** honeypot, carefully isolated.

## Honeynets

A **honeynet** is a **network of honeypots**: several decoy systems (servers, workstations, maybe network devices) connected together to simulate a **realistic environment**.

- Lets defenders watch **multi-step behavior**: initial access, **lateral movement** between hosts, privilege escalation, and data staging.
- More convincing than a lone honeypot, so attackers stay longer.
- Typically sits behind a **controlled gateway** (sometimes called a honeywall) that captures all traffic and limits what can leave, so the honeynet can't be used to attack the outside world.
- Costs more to build and maintain.

Rule of thumb: **one decoy → honeypot; many decoys forming a fake network → honeynet.**

## Honeyfiles and honeytokens

Deception doesn't have to be a whole system. Small pieces of fake data work too.

| Technique | What it is | What triggers the alert | Example |
|---|---|---|---|
| **Honeyfile** | A **fake document** with an attractive name | The file is **opened** or copied | `passwords.xlsx` or `2025-salaries.docx` on a file share |
| **Honeytoken** | **Fake data** planted where an attacker would find it | The data is **used** | A **bogus admin credential**, a fake **API key**, a fake **database record** or customer, a fake email address |

- If a honeytoken credential ever tries to log in, someone **stole it** from wherever it was planted (a config file, a password manager, a database dump).
- A fake customer record with a unique email address: if that address ever receives spam or appears in a breach dump, the database was **exfiltrated**.
- A honeyfile is really a type of honeytoken in file form.

## DNS sinkholes and tarpits

**DNS sinkhole:** the DNS server returns a **controlled address** for **known-malicious or decoy domain names** instead of the real one.
- Infected machines trying to reach a malware command-and-control domain are sent to a harmless internal server, which **blocks** the connection and **reveals which hosts are infected** (they're the ones querying it).
- **Fake DNS records** can also point attackers toward decoy systems to lure them into monitored honeypots.

**Tarpit:** a service that **deliberately slows down malicious connections**, such as port scanners, worms, or spam bots. It accepts the connection and then responds extremely slowly, **wasting the attacker's time and resources**.

Scenario: "Several workstations keep trying to resolve a known botnet domain" → a **DNS sinkhole** both stops the traffic and identifies the infected hosts.

## Placement and isolation

Where you put a decoy decides what it can catch:

| Placement | Detects |
|---|---|
| **Internet-facing** (e.g. in a screened subnet / DMZ) | **External** scanning and attack trends; generates lots of noise because the internet is constantly scanned |
| **Internal segments, alongside real servers** | Attackers **already inside** performing **lateral movement**, and malicious insiders; very few false alarms |

- **Isolation is essential.** If a honeypot isn't segmented, an attacker who compromises it can use it as a **launch point** into real systems. Put decoys in their own segment, restrict outbound traffic, and monitor them closely.
- Don't let a decoy hold **real data** or real credentials.
- Make sure decoy alerts reach the **SIEM** or security team, or nobody will notice the attacker.

Scenario: "We already have edge IDS; we want to know if an attacker gets past it and starts exploring" → put honeypots on **internal** segments.

## Legal and operational considerations

- Deception is for **observation and alerting**. Never use a honeypot to **"hack back"** or attack the attacker's systems; that is illegal in most places.
- **Monitoring and data capture have legal implications** (privacy, wiretapping and data-protection laws). Consult **legal and policy** teams before deploying, and document the purpose.
- Decoys need **maintenance**: patch what should be patched, keep fake data believable, and tune alerts.
- Don't create real vulnerabilities by accident: a high-interaction honeypot that attacks other organizations could create liability.

## Common mix-ups

- **Honeypot vs honeynet:** honeypot = **one** decoy system; honeynet = a **network** of decoys.
- **Honeyfile vs honeytoken:** honeyfile = a fake **document** that alerts when **opened**; honeytoken = fake **data** (credential, key, record) that alerts when **used**.
- **Low vs high interaction:** low = **emulated** services, safe, less intel; high = **real** system, rich intel, more risk.
- **DNS sinkhole vs tarpit:** a sinkhole **redirects** name lookups to a controlled address; a tarpit **slows down** connections.
- **Deception vs IDS:** an IDS recognizes **known patterns** on real traffic; deception alerts on **any contact** with a fake target.
- **Deception vs prevention:** a honeypot **detects and observes**; it doesn't block attacks on real systems.

## Key terms

- **Honeypot:** a single decoy system that attracts attackers.
- **Honeynet:** a network of honeypots simulating a realistic environment.
- **Honeyfile:** a bait document that alerts when opened.
- **Honeytoken:** fake data, such as a bogus credential, that alerts when used.
- **DNS sinkhole:** DNS that returns a controlled address for malicious or decoy names.
- **Tarpit:** a service that deliberately slows malicious connections.
- **Lateral movement:** an attacker moving from one internal system to another.

> **Exam tip:** One decoy → honeypot. Many decoys forming a fake network → honeynet. Fake credential that triggers an alert → honeytoken. Fake "passwords.xlsx" → honeyfile. Catch attackers already inside → internal honeypots. Biggest risk → poor isolation lets attackers pivot to real systems.
