# Configuration management

## Three kinds of configuration

- **Production configuration:** what's running on the device and serving live traffic. Change it only through change management.
- **Backup configuration:** saved copies used to restore after a failure or bad change. Back up **automatically on a schedule**, keep several versions, and **test restores**.
- **Baseline (golden) configuration:** the approved standard for a device role. New devices are built from it and running configs are compared against it.

## Running vs startup config

On most network devices:
- The **running configuration** lives in memory and is active now.
- The **startup configuration** lives in NVRAM and loads at boot.

Unsaved changes **disappear after a reboot**. Save with e.g. `copy running-config startup-config`.

## Configuration drift

**Drift** is when devices slowly diverge from the baseline through manual tweaks and forgotten emergency fixes. Detect it with **configuration management/compliance tools** that diff running configs against the baseline. Investigate unexplained differences: they could be unauthorized changes.

## Good practices

- **Storage:** keep backups **off the device**, in an access-controlled location with versioning (e.g. a Git repository).
- **Transfer:** move configs with **SCP or SFTP**, not TFTP or FTP.
- **Secrets:** never store passwords in plain text. Use hashed secrets and a password vault.
- **Consistency:** use **templates and automation** (infrastructure as code, Ansible) for consistent, hardened deployments. **Zero-touch provisioning** configures new devices automatically on first boot.
- **Troubleshooting:** **diff** the current config against the last known-good backup.
- **Safe changes:** commit-confirm or rollback timers revert a change automatically if you lose access.
- **Inventory:** a **CMDB** records configuration items and their dependencies, which helps assess change impact.
- **Time:** configure **NTP** so logs and change records have accurate timestamps.

> **Exam tip:** "Changes lost after reboot" → running config wasn't saved. "Devices no longer match the standard" → configuration drift; compare against the baseline.
