module.exports = {
  "Why change management exists": [
    ["What is the main goal of change management?",
      ["Reducing unplanned outages by controlling how changes are made", "Stopping all changes", "Speeding up changes by skipping approval", "Assigning blame after outages"],
      "Reviewed, tested, scheduled changes are safer."],
    ["How do change records help troubleshooting?",
      ["They answer 'what changed?', since many outages follow recent changes", "They replace monitoring tools", "They fix problems automatically", "They're not useful for troubleshooting"],
      "Recent changes are a prime suspect."],
    ["Why do auditors care about change management?",
      ["It provides an audit trail of who changed what, when, why, and who approved it", "It encrypts configurations", "It speeds up networks", "It assigns IP addresses"],
      "Compliance requires evidence of controlled change."]
  ],
  "The request process": [
    ["What must every change request include in case the change fails?",
      ["A rollback (backout) plan", "A press release", "An NDA", "A new SSID"],
      "The rollback plan restores the previous state."],
    ["Which group reviews and approves significant changes?",
      ["Change advisory board (CAB)", "Help desk", "End users", "The ISP"],
      "The CAB weighs risk, timing, and readiness."],
    ["Why are changes scheduled in a maintenance window?",
      ["To minimize the impact on users and the business", "Because devices only accept changes at night", "To avoid documentation", "To bypass approval"],
      "Windows are agreed low-impact times."],
    ["What should happen right after a change is implemented?",
      ["Verify it worked as intended, and roll back if not", "Close the ticket immediately", "Start another change", "Delete the request"],
      "Verification comes before closing."],
    ["Who should be told before a change that will cause a brief outage?",
      ["Affected users and stakeholders", "Nobody", "Only the vendor", "Only the CEO"],
      "Notification lets people plan around downtime."]
  ],
  "Types of change": [
    ["Which change type is low-risk, routine, and pre-approved?",
      ["Standard change", "Normal change", "Emergency change", "Unauthorized change"],
      "Standard changes follow a documented procedure without CAB review each time."],
    ["What is true of an emergency change?",
      ["Approval is expedited, but it's still documented and reviewed afterward", "It skips documentation forever", "It needs a month of CAB review", "It's always unauthorized"],
      "Speed doesn't remove accountability."],
    ["Upgrading core switch firmware is typically which change type?",
      ["Normal change", "Standard change", "Unauthorized change", "No change at all"],
      "Significant changes go through full review."]
  ],
  "Freezes, unauthorized changes, and tracking": [
    ["What is a change freeze?",
      ["A period when non-emergency changes aren't allowed", "A device that stopped responding", "A frozen DHCP scope", "A spanning tree failure"],
      "Freezes protect critical business periods."],
    ["What is an unauthorized change?",
      ["Any change made outside the change management process", "A change approved by the CAB", "A pre-approved standard change", "A documented emergency change"],
      "It's risky and may indicate a violation or compromise."],
    ["How does version control help with changes?",
      ["It shows exactly what changed between config versions and allows restoring earlier ones", "It blocks all changes", "It encrypts traffic", "It assigns VLANs"],
      "Diffs make changes visible."]
  ],
  "Common mix-ups": [
    ["Standard vs normal change: which is correct?",
      ["Standard is pre-approved routine; normal needs review each time", "Normal is pre-approved; standard needs CAB review", "They're identical", "Standard changes are emergencies"],
      "Routine low-risk changes are standard."],
    ["Test plan vs rollback plan: which is correct?",
      ["The test plan proves success; the rollback plan undoes a failure", "Both undo failures", "The rollback plan proves success", "They're the same document"],
      "You need both."],
    ["Maintenance window vs change freeze: which is correct?",
      ["A window is when changes are allowed; a freeze is when they aren't", "A freeze is when changes are allowed", "They mean the same", "Both ban emergency changes"],
      "Freezes still allow true emergencies."]
  ],
  "Key terms": [
    ["What is a post-implementation review?",
      ["A look back at a change's outcome and lessons learned", "A pre-change approval meeting", "A wireless survey", "A penetration test"],
      "It improves future changes."],
    ["What is a rollback (backout) plan?",
      ["Steps to restore the previous state if a change fails", "A plan to buy new hardware", "A marketing plan", "A list of users"],
      "Every change needs one."],
    ["What does CAB stand for?",
      ["Change advisory board", "Central access bridge", "Configuration audit baseline", "Cable assignment book"],
      "The CAB reviews and approves changes."]
  ]
};
