# Security terminology

## Core terms

| Term | Definition | Example |
|---|---|---|
| **Vulnerability** | A **weakness** that could be exploited | Unpatched firmware, default password, open port |
| **Threat** | Anything that could **cause harm** by exploiting a vulnerability | Attacker, malware, insider, flood, fire |
| **Exploit** | Code or a technique that **takes advantage** of a vulnerability | A script that abuses a buffer overflow |
| **Risk** | The **likelihood** a threat exploits a vulnerability, combined with its **impact** | High risk = likely and damaging |

Risk ≈ likelihood × impact. Controls reduce one or both.

## The CIA triad

| Principle | Means | Violated by | Protected by |
|---|---|---|---|
| **Confidentiality** | Only authorized people can see data | Eavesdropping, data theft | Encryption, access control |
| **Integrity** | Data is accurate and unaltered | Tampering in transit | Hashing, digital signatures |
| **Availability** | Systems are usable when needed | DoS/DDoS, outages | Redundancy, backups, DDoS protection |

**Non-repudiation** means someone can't deny an action (digital signatures, audit logs).

## Other key terms

- **Zero-day:** a vulnerability unknown to the vendor or unpatched. Signatures don't exist yet.
- **CVE:** a public identifier for a known vulnerability (e.g. CVE-2024-12345).
- **CVSS:** a severity score from 0 to 10, used to prioritize patching.
- **Attack surface:** every point where an attacker could get in. Shrink it by disabling unused services, ports, and accounts.
- **Defense in depth:** layered controls (physical, network, host, application, data, people).
- **Insider threat:** a current or former employee or contractor misusing access.
- **Vulnerability scan vs penetration test:** a scan finds possible weaknesses; a pen test actively **exploits** them, with written authorization and rules of engagement.

## Risk responses

| Response | Meaning |
|---|---|
| **Mitigate** | Add controls to reduce risk |
| **Transfer** | Shift the financial impact to someone else (e.g. cyber insurance) |
| **Avoid** | Stop the risky activity entirely |
| **Accept** | Formally acknowledge the risk (usually the **residual risk** after controls) |

> **Exam tip:** Weakness = vulnerability. Bad actor or event = threat. The attack tool = exploit. DDoS hits **availability**; tampering hits **integrity**; eavesdropping hits **confidentiality**.
