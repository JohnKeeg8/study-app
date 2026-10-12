# Life-cycle management

Every device moves through **procure → deploy → operate/maintain → decommission/dispose**. Managing that life cycle keeps the network supported, patched, and budgeted.

## Vendor milestones

| Term | Meaning | Risk |
|---|---|---|
| **End of sale / EOL (end of life)** | The vendor stops selling the product and starts phasing it out | Plan replacements; spares get harder to find |
| **EOS (end of support)** | No more patches, bug fixes, or technical support | **Security risk**: new vulnerabilities won't be fixed |

Track these dates in the **asset inventory** so refreshes can be budgeted *before* devices go unsupported. If an EOS device has an unpatchable vulnerability, compensating controls (such as ACLs) only reduce risk short-term. **Replace it**.

## Software management

- **Read the release notes** first: known issues, required upgrade paths, feature changes.
- **Back up** the current configuration and image before upgrading.
- **Verify the file hash** (e.g. SHA-256) against the vendor's published value to confirm integrity.
- **Test in a lab**, then deploy through **change management** in a **maintenance window**, with a **rollback plan**.
- **Standardize versions** across devices. Vendors' "recommended" releases are usually more stable than the newest one.
- **Track licenses and subscriptions.** An expired license can disable features or security updates.

## Decommissioning

1. **Wipe or sanitize** configurations and storage (they hold credentials, SNMP strings, and topology details). For sensitive media, **destroy** it and keep a **certificate of destruction**.
2. **Remove leftovers:** accounts, certificates, firewall rules, VPN tunnels, and monitoring entries tied to the device.
3. **Update records:** asset inventory, diagrams, IPAM, and documentation.

> **Exam tip:** EOL = can't buy it. **EOS = no more security patches**, and that's the one that creates risk. Always back up and have a rollback plan before upgrades.
