module.exports = {
  "Why change management exists": [
    ["What is the main goal of change management?",
      ["Fewer unplanned outages by controlling how changes are made", "Blocking every change unless the CAB meets in person first", "Recording who caused an outage so they can be held to account", "Speeding up changes by letting engineers skip formal testing"],
      "Reviewed, tested, scheduled changes are safer."],
    ["How do change records help troubleshooting?",
      ["They answer 'what changed?', since outages often follow changes", "They alert on interface errors and high CPU as they happen", "They automatically roll back any change that causes alerts", "They record normal performance so anomalies stand out"],
      "Recent changes are a prime suspect. Recording normal performance is a baseline, not a change record."],
    ["Why do auditors care about change management?",
      ["It records who changed what, when, why, and who approved it", "It proves the network meets its SLA uptime percentage", "It shows every device is still within vendor support", "It encrypts config backups so auditors can't alter them"],
      "Compliance requires evidence of controlled change: an audit trail."]
  ],
  "The request process": [
    ["What must every change request include in case the change fails?",
      ["A rollback (backout) plan", "A post-implementation review", "A test plan proving success", "A change freeze exception"],
      "The rollback plan restores the previous state. The test plan proves success; it doesn't undo failure."],
    ["Which group reviews and approves significant changes?",
      ["Change advisory board (CAB)", "The engineer making the change", "The help desk ticket queue", "The affected end users"],
      "The CAB weighs risk, timing, and readiness."],
    ["Why are changes scheduled in a maintenance window?",
      ["To minimize the impact on users and the business", "Because devices only accept changes at night", "To avoid documentation", "To bypass approval"],
      "Windows are agreed low-impact times."],
    ["What should happen right after a change is implemented?",
      ["Verify it worked as intended, and roll back if not", "Close the ticket, then review it at the next CAB meeting", "Schedule the next change while the window is still open", "Submit the change request for CAB approval afterward"],
      "Verification comes before closing."],
    ["Who should be told before a change that will cause a brief outage?",
      ["Affected users and stakeholders", "Only the CAB that approved it", "Only the device vendor's support", "Only the engineer on call that night"],
      "Notification lets people plan around downtime."]
  ],
  "Types of change": [
    ["Which change type is low-risk, routine, and pre-approved?",
      ["Standard change", "Normal change", "Emergency change", "Unauthorized change"],
      "Standard changes follow a documented procedure without CAB review each time."],
    ["What is true of an emergency change?",
      ["Approval is expedited, but it's documented and reviewed afterward", "It bypasses the process, so no record or review is required at all", "It must wait for the next scheduled CAB meeting like a normal change", "It's pre-approved and follows an SOP, so it never needs review"],
      "Speed doesn't remove accountability."],
    ["Upgrading core switch firmware is typically which change type?",
      ["Normal change", "Standard change", "Unauthorized change", "No change at all"],
      "Significant changes go through full review."]
  ],
  "Freezes, unauthorized changes, and tracking": [
    ["What is a change freeze?",
      ["A period when non-emergency changes aren't allowed", "An agreed low-impact time when changes are allowed", "A lock that stops a device saving its running config", "A period when even emergency changes are forbidden"],
      "Freezes protect critical business periods but still allow true emergencies."],
    ["What is an unauthorized change?",
      ["Any change made outside the change management process", "An emergency change approved on an expedited basis", "A pre-approved standard change done without a CAB vote", "A change the CAB approved but users weren't told about"],
      "It's risky and may indicate a violation or compromise."],
    ["How does version control help with changes?",
      ["It shows what changed between config versions and can restore old ones", "It stops devices from accepting any change that lacks a CAB ticket", "It schedules each change into the next available maintenance window", "It pushes the newest vendor firmware to every device automatically"],
      "Diffs make changes visible, and earlier versions can be restored."]
  ],
  "Common mix-ups": [
    ["Standard vs normal change: which is correct?",
      ["Standard is pre-approved routine; normal needs review each time", "Normal is pre-approved; standard needs CAB review", "They're identical", "Standard changes are emergencies"],
      "Routine low-risk changes are standard."],
    ["Test plan vs rollback plan: which is correct?",
      ["The test plan proves success; the rollback plan undoes failure", "The rollback plan proves success; the test plan undoes failure", "Both are written after the change, in the post-implementation review", "Only normal changes need a test plan; only emergencies need rollback"],
      "You need both."],
    ["Maintenance window vs change freeze: which is correct?",
      ["A window is when changes are allowed; a freeze is when they aren't", "A freeze is when changes are allowed; a window is when they aren't", "Both are periods when even emergency changes are forbidden", "A window is for emergencies only; a freeze is for standard ones"],
      "Freezes still allow true emergencies."]
  ],
  "Key terms": [
    ["What is a post-implementation review?",
      ["A look back at a change's outcome and lessons learned", "The CAB meeting that approves a change before it starts", "The test that proves a change worked before ticket close", "The plan that restores the old state if a change fails"],
      "It improves future changes."],
    ["What is a rollback (backout) plan?",
      ["Steps to restore the previous state if a change fails", "Steps to prove that a change worked as intended", "A list of users to notify before a change begins", "The CAB's record of who approved the change"],
      "Every change needs one."],
    ["What does CAB stand for?",
      ["Change advisory board", "Central access bridge", "Configuration audit baseline", "Cable assignment book"],
      "The CAB reviews and approves changes."]
  ]
};
