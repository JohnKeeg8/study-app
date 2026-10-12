module.exports = {
  "Production, backup, and baseline": [
    ["What is a baseline (golden) configuration?",
      ["The approved standard configuration for a device role", "The config saved in NVRAM and loaded at each boot", "The copy of a device's config taken in last night's backup", "The settings a device ships with from the factory"],
      "New devices are built from it and running configs are compared to it."],
    ["What is the production configuration?",
      ["The config currently running and serving live traffic", "The approved standard config for each device role", "The staged config waiting for someone to commit it", "The newest saved copy stored off the device"],
      "Change it only through change management."],
    ["What makes a configuration backup strategy reliable?",
      ["Scheduled, versioned, off-device backups with tested restores", "One full backup at install, kept safely on the device's own flash", "Nightly backups over TFTP that overwrite the previous night's copy", "Manual backups taken after each outage, stored on the admin's laptop"],
      "Untested, single, or on-device backups often fail when needed."]
  ],
  "Running vs startup configuration": [
    ["A router reboots after a power cut and recent changes are gone. Why?",
      ["The running config wasn't saved to startup", "The startup config was never loaded into RAM", "The candidate config was committed too early", "The baseline config overwrote the running one"],
      "Unsaved running-config changes are lost on reboot."],
    ["Where is the startup configuration stored?",
      ["NVRAM, loaded when the device boots", "RAM, active the moment you type it", "On the TFTP server the device boots from", "In the CMDB, pushed down at boot time"],
      "The running config lives in RAM; startup lives in NVRAM."],
    ["What does a 'commit confirmed' rollback timer protect against?",
      ["Locking yourself out; it reverts unless confirmed", "Losing unsaved changes when the power fails", "Drift as other admins change the device later", "Backups being transferred unencrypted over TFTP"],
      "If you lose access, the device reverts automatically."],
    ["What is a candidate configuration?",
      ["Staged changes that become active only when committed", "The approved baseline that new devices are built from", "The config saved in NVRAM and loaded at the next boot", "A backup kept as a fallback if a restore test fails"],
      "Used by commit-based platforms."]
  ],
  "Configuration drift": [
    ["What is configuration drift?",
      ["Devices gradually diverging from their approved baseline", "A running config that's lost on reboot because it wasn't saved", "Device clocks slowly diverging when NTP isn't configured", "Backups growing out of date because none are scheduled"],
      "One-off tweaks and undocumented fixes cause it."],
    ["How is drift best detected across hundreds of devices?",
      ["Compliance tools that diff running configs against the baseline", "Engineers reading each device's running config by hand every day", "Comparing each device's startup config to its own running config", "SNMP polling of interface counters to spot unusual traffic levels"],
      "Automated comparison against the baseline scales; startup vs running only shows unsaved changes."],
    ["A device's config differs from its last approved backup and there's no change ticket. What should you suspect?",
      ["An unauthorized change, possibly a compromise", "A standard change that didn't need a ticket", "A failed nightly backup job on that device", "Normal drift that will correct itself at boot"],
      "Unexplained differences should be investigated."]
  ],
  "Backup and restore practices": [
    ["Which protocols should be used to transfer config backups?",
      ["SCP or SFTP", "TFTP or Telnet", "HTTP or FTP", "SNMPv1"],
      "Encrypted transfer protects sensitive config data."],
    ["Why keep backups from several dates?",
      ["To restore to before a problem began, even if noticed days later", "So each version can be applied to a different device role", "Because a diff needs at least three backups to compare", "So restores finish faster by using the smallest copy"],
      "Multiple restore points are safer."],
    ["What's a fast way to find what changed when a device starts misbehaving?",
      ["Diff the current config against the last known-good backup", "Reload the startup config and see if the problem returns", "Compare the device's firmware hash to the vendor's value", "Check the CMDB for which devices depend on this one"],
      "The diff often shows the cause immediately."],
    ["Why must config backups be access-controlled?",
      ["They hold password hashes, SNMP strings, and keys", "Read access lets anyone push them to live devices", "Opening a backup deletes the older versions", "Auditors require backups to be kept secret"],
      "Treat backups as sensitive data."]
  ],
  "Supporting tools and settings": [
    ["What is zero-touch provisioning?",
      ["New devices download their config automatically on first boot", "Devices keep running configs without ever saving them to NVRAM", "A tool that diffs every device against its baseline each night", "Changes that apply without CAB approval because they're routine"],
      "It speeds up large deployments."],
    ["What does a CMDB record?",
      ["Configuration items and their dependencies", "Every config line, diffed between versions", "Subnets, DHCP scopes, and DNS records", "Approval history for each change ticket"],
      "Dependencies help assess change impact."],
    ["What should happen after an emergency configuration change?",
      ["Document it, back up the new config, and review it via change management", "Revert it at the next maintenance window so the device matches baseline", "Immediately copy it into the baseline so every device gets the fix", "Leave it undocumented, since emergency changes are exempt from review"],
      "Emergency changes still need records; whether to update the baseline is decided through change management."]
  ],
  "Common mix-ups": [
    ["Backup vs baseline: which is correct?",
      ["A backup is what a device had; a baseline is what it should have", "A baseline is what a device had; a backup is what it should have", "A backup is the running config; a baseline is the startup config", "Both are the same file, just kept in two different locations"],
      "Drift is the gap between production and baseline."],
    ["Why not use TFTP for configuration backups?",
      ["It's unencrypted and unauthenticated", "It's too slow for small files", "It only works on IPv6", "It requires a license"],
      "Use SCP or SFTP."],
    ["Golden config vs golden image: which is correct?",
      ["Golden config = approved settings; golden image = approved OS version", "Golden image = approved settings; golden config = approved OS version", "Golden config = running config; golden image = startup config", "Golden config = a backup; golden image = the hardware model to buy"],
      "Both are standards, for different things."]
  ],
  "Key terms": [
    ["What is a diff?",
      ["A comparison showing what changed between two configs", "A staged config that waits for a commit", "A scheduled copy of the config off the device", "A record of items and their dependencies"],
      "Diffs reveal changes line by line."],
    ["What does ZTP stand for?",
      ["Zero-touch provisioning", "Zone transfer protocol", "Zero trust policy", "Zonal traffic prioritization"],
      "Automatic configuration of new devices."],
    ["Why configure NTP as part of configuration management?",
      ["Accurate timestamps for logs and change records", "Automatic rollback when changes aren't confirmed", "Scheduling nightly backups to run on time", "Encrypting configs during SCP transfer"],
      "Correlating events needs synchronized time."]
  ]
};
