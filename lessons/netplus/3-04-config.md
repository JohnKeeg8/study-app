# Configuration management

Configuration management keeps every device's settings **known, consistent, backed up, and recoverable**. Network+ focuses on three configurations: **production**, **backup**, and **baseline**.

## Production, backup, and baseline

| Configuration | What it is | Key practices |
|---|---|---|
| **Production** | What's **running on the device and serving live traffic** right now | Change it **only through change management**; protect access to it |
| **Backup** | **Saved copies** of configurations used to **restore** after a failure or bad change | **Automatic, scheduled** backups; **multiple versions**; stored **off the device**; **test restores** |
| **Baseline ("golden")** | The **approved standard configuration** for a device role (e.g. "access switch") | Build new devices from it; **compare running configs against it**; review it periodically |

## Running vs startup configuration

On most network devices, such as Cisco IOS:
- **Running configuration:** in **memory (RAM)**, active right now. Your changes take effect here immediately.
- **Startup configuration:** saved in **NVRAM** and **loaded when the device boots**.

If you make changes and **don't save them**, they're **lost on reboot**: the device comes back with the old startup config. After verifying a change, save it (e.g. `copy running-config startup-config`).

**Commit-based systems:** some platforms stage changes in a **candidate configuration** that only becomes active when you **commit** it. **Commit confirmed** / rollback timers **automatically revert** a change if you don't confirm it in time, which protects you from locking yourself out.

## Configuration drift

**Drift** happens when devices gradually **diverge from their baseline**: one-off tweaks, emergency fixes that were never documented, forgotten test settings.
- **Problems it causes:** unpredictable behavior, security gaps, and harder troubleshooting.
- **Detection:** **configuration management/compliance tools** compare (**diff**) running configs against the baseline across hundreds of devices and report differences.
- **Investigation:** a difference with **no matching change ticket** could be an **unauthorized change**, or even a compromise.
- **Automation:** templates, infrastructure as code, and tools like Ansible deploy and re-apply the baseline consistently.

## Backup and restore practices

- **Schedule** automatic backups (e.g. nightly) so a recent copy always exists.
- **Keep several versions** so you can restore to a point **before** a problem started, even if it's noticed days later.
- **Store backups off the device**, in an **access-controlled** location with **versioning** (e.g. a Git repository).
- **Transfer securely** with **SCP or SFTP**, not TFTP or FTP.
- **Protect secrets:** configs contain password hashes, SNMP strings, and keys. Use hashed or encrypted secrets and restrict who can read backups.
- **Test restores** in a lab periodically. An untested backup may be incomplete when you need it.
- **Troubleshooting:** **diff** the current config against the **last known-good backup**. It often reveals the cause immediately.

## Supporting tools and settings

- **Templates and zero-touch provisioning (ZTP):** new devices **download their configuration automatically** on first boot, so large deployments are fast and consistent.
- **CMDB (configuration management database):** records configuration items and their **relationships and dependencies**, which helps assess the impact of a change.
- **NTP:** synchronized time gives accurate timestamps for logs and change records.
- **After an emergency change:** **document it, back up the new config**, and decide through change management whether to update the baseline.

## Common mix-ups

- **Running vs startup:** running = **active in RAM**; startup = **saved, loaded at boot**. Unsaved changes vanish after a reboot.
- **Backup vs baseline:** a backup is **a copy of what a device had**; a baseline is **what it should have**.
- **Production vs baseline:** production is **what's actually running**; drift is the gap between production and baseline.
- **TFTP vs SCP/SFTP for backups:** TFTP is **unencrypted and unauthenticated**; use SCP/SFTP.
- **Golden config vs golden image:** config = **settings**; image = **approved OS/firmware version**.

## Key terms

- **Golden configuration:** the approved baseline config.
- **Configuration drift:** divergence from the baseline over time.
- **Diff:** a comparison showing what changed between two configs.
- **Candidate configuration:** staged changes awaiting commit.
- **ZTP:** zero-touch provisioning.
- **CMDB:** configuration management database.

> **Exam tip:** "Changes disappeared after a reboot" → running config wasn't saved. "Devices no longer match the standard" → configuration drift; compare against the baseline. Back up with SCP/SFTP and keep multiple versions.
