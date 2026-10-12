# Security terminology

Security questions are full of words that sound alike: vulnerability, threat, exploit, risk. They mean different things, and the exam often tests whether you can tell them apart in a scenario. This lesson defines the core terms, the **CIA triad**, how vulnerabilities are tracked and scored, and how organizations assess and respond to risk.

## Vulnerability, threat, and exploit

| Term | Definition | Ask yourself | Examples |
|---|---|---|---|
| **Vulnerability** | A **weakness** that could be exploited | "What's wrong with *our* system?" | Unpatched firmware, **default password**, open unused port, misconfigured firewall rule, unencrypted protocol (Telnet) |
| **Threat** | Anything that **could cause harm** by exploiting a vulnerability | "Who or what could hurt us?" | Hacker, malware, **insider**, competitor, flood, fire, power outage |
| **Exploit** | The **code or technique** that **takes advantage** of a vulnerability | "How would they do it?" | A script that abuses a buffer overflow, a login attempt with the vendor's default password |

- A **threat actor** is the person or group behind a threat: cybercriminals, nation-states, hacktivists, script kiddies, and **insiders**.
- **Insider threat:** a current or former employee, contractor, or partner who **misuses legitimate access**, maliciously (a disgruntled employee) or accidentally (someone who clicks a phishing link). Insiders are dangerous because they're already past perimeter controls.
- **Threats aren't only people.** Natural disasters and equipment failures are threats too.

How they fit together: a **threat** uses an **exploit** against a **vulnerability**. Example: an attacker (threat) runs a public script (exploit) against a VPN appliance with missing patches (vulnerability).

You **control vulnerabilities** (patch, harden, configure). You usually **can't control threats** (you can't stop hackers existing), which is why most security work focuses on removing vulnerabilities and reducing impact.

## Risk

**Risk** is the **likelihood** that a threat exploits a vulnerability, combined with the **impact** if it does.

Risk ≈ **likelihood × impact**

| Situation | Likelihood | Impact | Risk |
|---|---|---|---|
| Internet-facing server with a known, actively exploited flaw holding customer data | High | High | **High**: fix first |
| Same flaw on an isolated lab PC with no data | Medium | Low | Lower |
| A meteor strike on the data center | Very low | Very high | Low overall |

- No vulnerability → no risk from that threat. No threat → no risk from that vulnerability. Risk needs both.
- **Controls reduce likelihood** (patching, firewalls, MFA) **or impact** (backups, redundancy, encryption, segmentation).
- **Residual risk** is the risk that **remains after controls** are applied. It's never zero.
- **Risk appetite/tolerance:** how much risk the organization is willing to accept.

## The CIA triad

The **CIA triad** is the three goals of information security. Every attack harms at least one of them, and every control protects at least one.

| Principle | Means | Violated by | Protected by |
|---|---|---|---|
| **Confidentiality** | Only **authorized people can see** the data | Eavesdropping, sniffing, data theft, shoulder surfing | **Encryption**, access control, MFA |
| **Integrity** | Data is **accurate and unaltered**, changed only by authorized people | **Tampering** in transit or storage, on-path attacks altering data | **Hashing**, **digital signatures**, change control, file integrity monitoring |
| **Availability** | Systems and data are **usable when needed** | **DoS/DDoS**, ransomware locking files, power or hardware failure, deleted data | **Redundancy** (links, power, servers), **backups**, UPS, DDoS protection, load balancing |

Scenarios:
- "An attacker reads the payroll file" → **confidentiality**.
- "An attacker changes transaction amounts in transit" → **integrity**.
- "A DDoS takes the website offline" → **availability**.
- Ransomware can hit several: files are unusable (**availability**), and if they are also stolen and leaked, **confidentiality**.

## Non-repudiation and authenticity

Two related goals often appear alongside CIA:
- **Authenticity:** proof that data or a user is **genuinely who or what it claims** to be.
- **Non-repudiation:** assurance that someone **can't deny** having performed an action, such as sending a message or approving a change.

**How it's achieved:** **digital signatures** (only the holder of the private key could have signed) and **audit logs** tied to individual accounts.
- Shared accounts (everyone logs in as "admin") destroy non-repudiation: you can't prove which person made a change.
- A symmetric shared key doesn't give non-repudiation either, because either party could have created the message.

Scenario: "A manager claims they never approved a firewall change" → **digitally signed approvals** and **per-user audit logs** provide non-repudiation.

## Zero-days, CVE, and CVSS

| Term | What it is | Why it matters |
|---|---|---|
| **Zero-day** | A vulnerability **unknown to the vendor**, or with **no patch available yet** | Signatures and patches don't exist yet, so defenders rely on layered controls and behavior-based detection |
| **CVE (Common Vulnerabilities and Exposures)** | A **public identifier** for a known vulnerability, e.g. `CVE-2024-12345` | Everyone (vendors, scanners, admins) refers to the same flaw by the same ID |
| **CVSS (Common Vulnerability Scoring System)** | A **severity score from 0.0 to 10.0** | Helps **prioritize** patching |

CVSS ratings:

| Score | Rating |
|---|---|
| 0.0 | None |
| 0.1–3.9 | Low |
| 4.0–6.9 | Medium |
| 7.0–8.9 | High |
| 9.0–10.0 | Critical |

- CVSS measures **severity of the flaw**, not your actual **risk**. A critical CVE on a device that's isolated may matter less than a high CVE on an internet-facing server. Combine the score with your own exposure and asset value.
- Scenario: "A scanner reports 200 findings; where do we start?" → sort by **CVSS** and exposure, and patch critical, internet-facing systems first.

## Attack surface and defense in depth

**Attack surface** is **every point where an attacker could try to get in or get data out**: open ports, running services, user accounts, web apps, wireless networks, remote access, physical entrances, and even employees (phishing).
- **Shrink it** by **hardening**: disable unused services, close unused ports, remove default and unused accounts, shut unused switch ports, and remove unneeded software.
- Every new service, device, or cloud resource **adds** to the attack surface.

**Defense in depth** means **multiple layers of controls**, so if one fails, another still stops or detects the attacker.

| Layer | Examples |
|---|---|
| **Physical** | Locks, badges, cameras |
| **Network perimeter** | Firewalls, IPS, screened subnet |
| **Internal network** | Segmentation, VLANs, NAC/802.1X |
| **Host** | Patching, endpoint protection, host firewall |
| **Application** | Secure coding, input validation, WAF |
| **Data** | Encryption, access control, backups |
| **People and policy** | Training, least privilege, change management |

Scenario: "The firewall was misconfigured, but the attacker was still stopped by MFA and segmentation" → **defense in depth** working.

## Assessing risk: risk assessments, scans, and pen tests

- **Risk assessment:** identify **assets** (what you're protecting), the **threats** and **vulnerabilities** they face, estimate likelihood and impact, then **prioritize** risks for treatment. Results are often kept in a **risk register**.
- **Vulnerability scan:** an **automated** tool checks systems for **known weaknesses** (missing patches, weak configurations, open ports) and reports **potential** issues. It doesn't break in. Run it regularly.
   - **Credentialed** scans log in for a deeper, more accurate view; **non-credentialed** scans see what an outside attacker sees.
   - Scans can produce **false positives** that need verification.
- **Penetration test:** a skilled tester **actively exploits** weaknesses to **prove real impact**, simulating an attacker. Requires **written authorization** and agreed **rules of engagement** (scope, timing, what's off-limits).

| Aspect | Vulnerability scan | Penetration test |
|---|---|---|
| Method | Automated, finds and reports | Manual and automated, **exploits** |
| Answers | "What weaknesses might exist?" | "What could an attacker actually do?" |
| Frequency | Often (weekly, monthly) | Periodically (e.g. yearly) |
| Risk to systems | Low | Higher; needs authorization |

## Risk responses

After assessing a risk, the organization picks a response:

| Response | Meaning | Example |
|---|---|---|
| **Mitigate** (reduce) | Add **controls** to lower likelihood or impact | Patch, add a firewall rule, enable MFA |
| **Transfer** (share) | Shift the **financial impact** to someone else | **Cyber insurance**, outsourcing to a provider under contract |
| **Avoid** | **Stop the risky activity** entirely | Decide not to launch a risky service; retire an insecure legacy system |
| **Accept** | **Formally acknowledge** the risk and take no further action | Accept the **residual risk** when the cost of more controls exceeds the benefit |

- Acceptance should be a **documented decision** by someone with authority, not just ignoring the risk.
- Transfer moves the **cost**, not the responsibility: if customer data leaks, the company's reputation still suffers.

## Common mix-ups

- **Vulnerability vs threat:** the vulnerability is the **weakness**; the threat is **who or what** could use it.
- **Threat vs exploit:** the threat is the **actor or event**; the exploit is the **tool or technique**.
- **Risk vs vulnerability:** a vulnerability is a fact about a system; risk adds **likelihood and impact**.
- **Integrity vs confidentiality:** reading data harms **confidentiality**; changing it harms **integrity**.
- **CVE vs CVSS:** CVE is the **ID**; CVSS is the **severity score**.
- **Vulnerability scan vs pen test:** a scan **finds possible** weaknesses; a pen test **exploits** them to prove impact.
- **Transfer vs avoid:** transfer **keeps the activity** but shifts the cost (insurance); avoid **stops the activity**.
- **Residual risk vs accepted risk:** residual risk is what **remains after controls**; accepting it is the **decision** to live with it.

## Key terms

- **Attack surface:** all points where an attacker could get in or get data out.
- **CIA triad:** confidentiality, integrity, availability.
- **CVE:** Common Vulnerabilities and Exposures, a public ID for a known flaw.
- **CVSS:** a 0–10 severity score for vulnerabilities.
- **Defense in depth:** layered security controls.
- **Exploit:** code or technique that takes advantage of a vulnerability.
- **Insider threat:** someone with legitimate access who misuses it.
- **Non-repudiation:** inability to deny having performed an action.
- **Residual risk:** risk remaining after controls.
- **Threat:** anything that could cause harm by exploiting a vulnerability.
- **Vulnerability:** a weakness that could be exploited.
- **Zero-day:** a flaw unknown to the vendor or without a patch.

> **Exam tip:** Weakness = vulnerability. Bad actor or event = threat. The attack tool = exploit. Likelihood × impact = risk. DDoS hits **availability**; tampering hits **integrity**; eavesdropping hits **confidentiality**. Insurance = transfer; stop doing it = avoid.
