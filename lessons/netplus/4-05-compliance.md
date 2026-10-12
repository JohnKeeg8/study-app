# Audits & compliance

Laws, regulations, and industry standards set **minimum** security and privacy requirements that an organization must meet. **Compliance** means meeting those requirements, and an **audit** is how you prove it with evidence. For Network+, focus on **PCI DSS**, **GDPR**, and **data locality**, plus the everyday network practices that make an audit go smoothly.

## Compliance, regulations, and audits

- A **regulation** or **law** is mandatory (e.g. GDPR, HIPAA). Breaking it can mean fines or legal action.
- An **industry standard** is required by contract or by an industry body (e.g. **PCI DSS**, required by the card brands for anyone who accepts cards).
- An internal **policy** is the organization's own rule set, written to satisfy those outside requirements.
- A **compliance audit** is an **independent review** that checks, using **evidence**, whether required controls exist and actually work. Audits can be **internal** (your own team, for self-checking) or **external** (an independent auditor or assessor, often required).

**Why "compliant" is not the same as "secure":** regulations describe a **minimum baseline** at a point in time. An organization can pass an audit and still be breached by a threat the standard doesn't cover, or by a control that drifted after the audit. Treat compliance as the floor, not the ceiling.

Non-compliance has real consequences: **fines**, loss of the right to process card payments, lawsuits, mandatory breach disclosures, and reputational damage.

## PCI DSS

The **Payment Card Industry Data Security Standard** applies to **any organization that stores, processes, or transmits credit/debit card data**, from a huge retailer to a small shop with one card terminal. It is an **industry standard** enforced by the card brands, not a government law.

The systems that handle card data form the **cardholder data environment (CDE)**. Network-related requirements include:
- **Install and maintain network security controls** (firewalls, router ACLs) that protect the CDE and deny all traffic not explicitly needed.
- **Secure configurations:** change **vendor default passwords** and remove unnecessary services.
- **Protect stored card data,** and **never store sensitive authentication data** (full magnetic-stripe track data, the **CVV/CVC** code, PINs) after authorization.
- **Encrypt cardholder data with strong cryptography** when it crosses **open or public networks** (internet, wireless, cellular).
- **Restrict access** on a need-to-know basis, with unique IDs and MFA for access into the CDE.
- **Log and monitor** all access to card data and network resources. Keep audit logs for at least **one year**, with the most recent **three months immediately available**.
- **Test regularly:** quarterly **vulnerability scans** and periodic **penetration tests**.

**Segmentation and scope:** any system that can connect to the CDE is "in scope" for PCI DSS. Isolating the CDE on its own segment, with firewalls allowing only required flows, **reduces the number of systems in scope**, which cuts cost and audit effort. Segmentation isn't strictly required, but without it the **whole flat network is in scope**.

> Scenario: a store's card terminals sit on the same flat VLAN as office PCs and guest Wi-Fi. Every one of those devices is now in PCI scope. Moving the terminals to an isolated CDE segment shrinks the audit dramatically.

## GDPR

The **General Data Protection Regulation** is a European Union **law** that protects the **personal data and privacy of individuals in the EU**. It applies to **any organization, anywhere in the world**, that offers goods or services to people in the EU or monitors their behavior. A US company with EU customers must comply.

**Personal data** is any information that identifies a person directly or indirectly: names, email addresses, IP addresses, location data, device IDs.

Key points:
- **Lawful basis** for processing (such as consent or a contract), and only collecting what's needed (**data minimization**).
- **Individual (data subject) rights:** access to their data, correction, objection, portability, and the **right to erasure** ("right to be forgotten"), meaning they can ask for their data to be deleted.
- **Breach notification:** a qualifying personal data breach must generally be reported to the **supervisory authority within 72 hours** of becoming aware of it. Affected individuals must be told without undue delay if the risk to them is high.
- **Data protection officer (DPO):** required for some organizations (public bodies, large-scale monitoring or sensitive data processing). The DPO **oversees data protection strategy and compliance** and is the contact point for regulators.
- **Privacy by design:** build protection (encryption, access control, pseudonymization) into systems from the start.
- **Penalties** can reach up to **4% of global annual turnover** or €20 million, whichever is higher.
- **International transfers** of personal data outside the EU are restricted unless adequate protection is in place.

## Data locality (data residency)

**Data locality** (also called **data residency** or data sovereignty) means **laws or contracts require data to be stored and processed within a specific country or region**. Examples: a government requiring its citizens' health records to stay in-country, or EU personal data that can't be freely sent abroad.

Why it matters to a network team:
- **Cloud services replicate data globally by default.** You must choose **cloud regions inside the required jurisdiction** and **restrict replication, backups, and failover** to those regions.
- **Backups and DR sites** count too. A disaster recovery copy in another country can break the rule.
- **CDNs, SaaS tools, and logging services** may store copies of data elsewhere, so check their data location options.
- Data in a country is subject to **that country's laws** (including government access), which is why regulators care.

> Scenario: a company must keep customer data in Germany, but its cloud storage is set to geo-redundant replication across continents. Fix: use a region in Germany (or the EU, if allowed) and limit replication to paired regions inside the boundary.

## Other regulations you may see

The Network+ objectives name PCI DSS and GDPR, but questions may use these as distractors, so know what each covers:

| Regulation | Covers |
|---|---|
| **PCI DSS** | Payment **card** data (industry standard) |
| **GDPR** | Personal data of people in the **EU** |
| **HIPAA** | US **patient health information** (PHI) |
| **SOX** (Sarbanes-Oxley) | Accuracy of **financial reporting** by US public companies |
| **GLBA** | Customer data at US **financial institutions** |
| **FERPA** | US **student education records** |
| **CCPA** | Personal data of **California** residents |

## Audit practices and evidence

Auditors don't take your word for it; they want **evidence**. Good network operations generate that evidence naturally:
- **Documented policies and procedures** (acceptable use, password, change management).
- **Change records** showing every change was requested, approved, and tested.
- **Configuration baselines** and proof that devices match them.
- **Logs** of access and security events, kept for the required **retention period**, with accurate timestamps from **NTP** so events can be correlated.
- **Access reviews** showing accounts and permissions are checked and stale ones removed.
- **Network diagrams and data flow diagrams** showing where regulated data travels.

**Firewall rule reviews:** rules accumulate over years. Periodic **internal audits of firewall rules** remove **unused, overly permissive (e.g. "any any"), or undocumented** rules. PCI DSS requires these reviews regularly.

**Log retention:** regulations require keeping logs for a set time so incidents can be investigated and audits completed. Too short and you can't investigate; logs must also be protected from tampering.

**Data classification:** labeling data by sensitivity (e.g. **public, internal, confidential, restricted**) tells everyone which protection and handling rules apply. You can't protect card data or personal data properly until you know where it is and how sensitive it is.

## Common mix-ups

- **Compliant vs secure:** compliance proves you meet a **minimum** at audit time; security is ongoing. You can be compliant and still breached.
- **PCI DSS vs GDPR:** PCI DSS = **card data**, an **industry standard**. GDPR = **EU personal data**, a **law**.
- **GDPR vs data locality:** GDPR is about **how personal data is handled and people's rights**; data locality is about **where data physically lives**.
- **GDPR applies where the data subject is, not where the company is:** a non-EU company serving EU residents must comply.
- **HIPAA vs GDPR:** HIPAA = **US health** information; GDPR = **EU personal** data of any kind.
- **72 hours vs one year:** 72 hours = GDPR **breach notification** deadline; one year = PCI DSS **log retention** (three months immediately available).
- **Segmentation doesn't make you compliant:** it **reduces PCI scope**; the in-scope systems still need every control.

## Key terms

- **Compliance:** meeting the requirements of laws, regulations, and standards.
- **Compliance audit:** an independent, evidence-based review of controls.
- **PCI DSS:** Payment Card Industry Data Security Standard.
- **CDE:** cardholder data environment, the systems that handle card data.
- **Scope:** the systems a standard's requirements apply to.
- **GDPR:** EU General Data Protection Regulation.
- **Right to erasure:** the GDPR right to have personal data deleted.
- **DPO:** data protection officer.
- **Data locality / data residency:** keeping data within a required geographic or legal boundary.
- **Data classification:** labeling data by sensitivity to drive protection rules.
- **Log retention:** keeping logs for a required period.

> **Exam tip:** Credit cards → **PCI DSS** (segment the CDE to reduce scope, encrypt over public networks, keep logs one year). EU personal data → **GDPR** (72-hour breach notice, right to erasure, DPO). "Data must stay in-country" → **data locality**: pick cloud regions inside the jurisdiction and restrict replication.
