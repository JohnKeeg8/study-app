# Life-cycle management

Every piece of network equipment and software has a life: you **buy it, deploy it, run and maintain it, and eventually retire it**. Life-cycle management keeps everything **supported, patched, licensed, and budgeted**, and makes sure retired gear doesn't leak data or leave holes behind.

## The hardware life cycle

1. **Procure:** choose and buy (consider support terms and expected lifespan).
2. **Deploy:** install, configure from the baseline, document, and monitor.
3. **Operate and maintain:** patch, monitor, renew support, replace failed parts.
4. **Decommission and dispose:** remove securely and update every record.

Tracking each asset's stage and key dates in the **asset inventory** makes it possible to **budget refreshes ahead of time** instead of replacing things only after they fail.

## EOL and EOS

Vendors publish milestones as a product ages:

| Milestone | What it means | Why it matters |
|---|---|---|
| **End of sale / EOL (end of life)** | The vendor **stops selling** the product and begins phasing it out | Plan the replacement; spare parts get harder to find |
| **End of software maintenance** | No more bug-fix releases | Problems you hit won't be fixed |
| **EOS (end of support / end of service life)** | **No more patches, security fixes, repairs, or technical support** | **Security risk**: newly discovered vulnerabilities **will never be patched** |

If an EOS device has a serious vulnerability, **compensating controls** (e.g. ACLs limiting who can reach it) reduce risk **short-term**, but the real fix is **replacing it** with a supported model.

## Software management

Updating firmware and operating systems on network devices safely:

1. **Read the release notes:** known issues, **required upgrade paths** (sometimes you must go through an intermediate version), and feature changes.
2. **Back up** the current **configuration and software image** so you can roll back.
3. **Verify the file's integrity:** compare its **hash (e.g. SHA-256)** with the vendor's published value to prove it wasn't corrupted or tampered with.
4. **Test in a lab** or non-production environment first.
5. **Schedule through change management** in a **maintenance window**, with a **rollback plan**.
6. **Verify** after upgrading, and roll back if something breaks.

**Also part of software management:**
- **Version standardization:** run consistent, approved versions across devices of the same role. This simplifies support and vulnerability assessment. Vendors' **"recommended" or long-term releases** are usually more stable than the newest one.
- **Licensing:** track licenses and subscriptions (e.g. security feature subscriptions). **Expired licenses** can disable features, updates, or support access.

## Decommissioning

Retiring a device safely:

1. **Remove the data:**
   - **Wipe configurations and storage.** Configs contain credentials, SNMP strings, VPN keys, and network details attackers would love.
   - For media that held sensitive data, **sanitize** (overwrite, degauss) or **physically destroy** it, and obtain a **certificate of destruction**.
2. **Remove leftovers:** delete the device's **accounts, certificates, firewall rules, VPN tunnels, DNS entries, and monitoring entries**. Orphaned rules and credentials widen the attack surface.
3. **Update records:** asset inventory, network diagrams, IPAM, and documentation, so nobody wastes time chasing a device that no longer exists.

## Common mix-ups

- **EOL vs EOS:** **EOL = can't buy it anymore. EOS = no more patches or support.** EOS is the security risk.
- **Compensating controls vs replacement:** ACLs only buy time; **replacing EOS gear** is the fix.
- **Hash verification vs version check:** a hash proves the file is **authentic and uncorrupted**, not that it's the newest version.
- **Newest vs recommended release:** the newest isn't always the most stable; vendors mark recommended versions.
- **Formatting vs sanitizing:** a quick format may leave recoverable data. **Sanitize or destroy** sensitive media.
- **Decommissioning isn't just unplugging:** remove the rules, accounts, and records too.

## Key terms

- **EOL / EOS:** end of life (sale) / end of support.
- **Release notes:** vendor documentation of changes and known issues in a version.
- **Hash:** a fingerprint (e.g. SHA-256) used to verify file integrity.
- **Compensating control:** a temporary measure that reduces risk when the ideal fix isn't possible yet.
- **Certificate of destruction:** proof that media was destroyed.

> **Exam tip:** "Vendor will no longer release patches" → EOS, so replace it. Before any upgrade: **read release notes, back up, verify the hash, test, and have a rollback plan**.
