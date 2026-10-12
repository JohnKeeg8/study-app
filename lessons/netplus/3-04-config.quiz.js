module.exports = {
  "Production, backup, and baseline": [
    ["What is a baseline (golden) configuration?",
      ["The approved standard configuration for a device role", "The last config someone typed", "A config with no security", "The factory default"],
      "New devices are built from it and running configs are compared to it."],
    ["What is the production configuration?",
      ["The configuration currently running and serving live traffic", "A lab test config", "A backup on a file server", "A vendor template"],
      "Change it only through change management."],
    ["What makes a configuration backup strategy reliable?",
      ["Automatic scheduled backups, multiple versions, stored off-device, with tested restores", "One manual backup at install time", "Storing the only copy on the device itself", "Backing up only after outages"],
      "Untested or single backups often fail when needed."]
  ],
  "Running vs startup configuration": [
    ["A router reboots after a power cut and recent changes are gone. Why?",
      ["The running config wasn't saved to the startup config", "The router's MAC changed", "DHCP reset the router", "The ACL expired"],
      "Unsaved running-config changes are lost on reboot."],
    ["Where is the startup configuration stored?",
      ["NVRAM, loaded when the device boots", "RAM only", "On the DHCP server", "In the MAC table"],
      "The running config lives in RAM."],
    ["What does a 'commit confirmed' rollback timer protect against?",
      ["Locking yourself out with a bad change; it auto-reverts if not confirmed", "Power outages", "Slow DNS", "Spanning tree loops"],
      "If you lose access, the device reverts automatically."],
    ["What is a candidate configuration?",
      ["Staged changes that only become active when committed", "The factory default", "A neighbor's config", "A backup on TFTP"],
      "Used by commit-based platforms."]
  ],
  "Configuration drift": [
    ["What is configuration drift?",
      ["Devices gradually diverging from their approved baseline", "Packets moving between VLANs", "Wireless clients roaming", "Clock skew"],
      "One-off tweaks and undocumented fixes cause it."],
    ["How is drift best detected across hundreds of devices?",
      ["Configuration management/compliance tools that diff running configs against the baseline", "Reading every config by hand daily", "Ping sweeps", "Cable testers"],
      "Automated comparison scales."],
    ["A device's config differs from its last approved backup and there's no change ticket. What should you suspect?",
      ["An unauthorized change, possibly a compromise", "Normal behavior", "A DNS problem", "A cabling fault"],
      "Unexplained differences should be investigated."]
  ],
  "Backup and restore practices": [
    ["Which protocols should be used to transfer config backups?",
      ["SCP or SFTP", "TFTP or Telnet", "HTTP or FTP", "SNMPv1"],
      "Encrypted transfer protects sensitive config data."],
    ["Why keep backups from several dates?",
      ["To restore to a point before a problem started, even if it's noticed days later", "To use more storage", "Because devices require it", "To slow down restores"],
      "Multiple restore points are safer."],
    ["What's a fast way to find what changed when a device starts misbehaving?",
      ["Diff the current config against the last known-good backup", "Reboot it repeatedly", "Replace the cables", "Change the hostname"],
      "The diff often shows the cause immediately."],
    ["Why must config backups be access-controlled?",
      ["They contain password hashes, SNMP strings, and keys", "They're very large", "They contain user photos", "They're public anyway"],
      "Treat backups as sensitive data."]
  ],
  "Supporting tools and settings": [
    ["What is zero-touch provisioning?",
      ["New devices automatically download their configuration on first boot", "Configuring devices with no power", "Disabling device management", "A wireless roaming feature"],
      "It speeds up large deployments."],
    ["What does a CMDB record?",
      ["Configuration items and their relationships and dependencies", "User emails", "Routing tables only", "Wi-Fi passwords"],
      "Dependencies help assess change impact."],
    ["What should happen after an emergency configuration change?",
      ["Document it, back up the new config, and review it through change management", "Hide it", "Delete the logs", "Leave the baseline untouched forever without review"],
      "Emergency changes still need records."]
  ],
  "Common mix-ups": [
    ["Backup vs baseline: which is correct?",
      ["A backup is a copy of what a device had; a baseline is what it should have", "A baseline is an old backup", "They're identical", "A backup defines the standard"],
      "Drift is the gap between production and baseline."],
    ["Why not use TFTP for configuration backups?",
      ["It's unencrypted and unauthenticated", "It's too slow for small files", "It only works on IPv6", "It requires a license"],
      "Use SCP or SFTP."],
    ["Golden config vs golden image: which is correct?",
      ["Golden config = approved settings; golden image = approved OS/firmware version", "They're the same", "Golden image = settings", "Golden config = hardware model"],
      "Both are standards, for different things."]
  ],
  "Key terms": [
    ["What is a diff?",
      ["A comparison showing what changed between two configurations", "A type of backup", "A routing protocol", "A firewall rule"],
      "Diffs reveal changes line by line."],
    ["What does ZTP stand for?",
      ["Zero-touch provisioning", "Zone transfer protocol", "Zero trust policy", "Zonal traffic prioritization"],
      "Automatic configuration of new devices."],
    ["Why configure NTP as part of configuration management?",
      ["Accurate timestamps for logs and change records", "To assign IPs", "To encrypt configs", "To speed up backups"],
      "Correlating events needs synchronized time."]
  ]
};
