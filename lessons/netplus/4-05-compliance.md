# Audits & compliance

Regulations and standards set **minimum** security requirements. **Audits** check, with evidence, that controls are in place. Remember: being compliant doesn't automatically mean being secure.

## PCI DSS

The **Payment Card Industry Data Security Standard** applies to anyone who **stores, processes, or transmits credit card data**. Key network requirements:

- **Network security controls** (firewalls) protecting the **cardholder data environment (CDE)**.
- **Segmentation** that isolates the CDE, which **shrinks audit scope**.
- **Strong encryption** for card data sent over open or public networks.
- Secure configurations: change vendor defaults and harden systems.
- **Logging and monitoring.** Keep audit logs for at least **one year**, with three months immediately available.
- Regular vulnerability scans and penetration tests.
- Never store sensitive authentication data (such as full track data or the CVV) after authorization.

## GDPR

The **General Data Protection Regulation** protects the **personal data of people in the EU**. It applies to any organization handling that data, wherever the organization is based.

- Lawful basis and consent for processing.
- Individual rights: access, correction, and the **right to erasure** ("right to be forgotten").
- **Breach notification** to the supervisory authority generally within **72 hours**.
- Some organizations must appoint a **data protection officer (DPO)**.

## Data locality (data residency)

Laws may require data to be **stored and processed within a specific country or region**. In the cloud, choose **regions in the required jurisdiction** and restrict replication to them.

## Other regulations

- **HIPAA:** US patient health information.
- **SOX:** financial reporting.
- **GLBA:** financial institutions.
- **FERPA:** student records.

## Audit practices

- **Evidence:** auditors need documented policies, change records, configuration baselines, access reviews, and logs.
- **Firewall rule reviews:** periodically remove unused or overly permissive rules.
- **Log retention:** meet each regulation's retention period, with accurate time (NTP).
- **Data classification:** labels such as public, internal, confidential, and restricted drive protection requirements.

> **Exam tip:** Credit cards → **PCI DSS**. EU personal data → **GDPR**. "Data must stay in-country" → **data locality**. Segmenting the CDE reduces PCI scope.
