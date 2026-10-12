# Change management

Most outages are caused by **changes**: a config tweak, a firmware upgrade, a moved cable. **Change management** is the process that controls **how changes are requested, reviewed, approved, scheduled, carried out, verified, and documented**, so they happen safely and leave a clear record.

## Why change management exists

- **Fewer unplanned outages:** changes are reviewed and tested first.
- **Coordination:** people affected are warned and changes don't collide.
- **A rollback plan** exists if something goes wrong.
- **An audit trail:** who changed what, when, why, and who approved it. This is essential for troubleshooting ("**what changed?**") and for **compliance audits**.

## The request process

1. **Submit a change request** (usually a ticket) that includes:
   - **What** will change and **why** (justification).
   - **Affected systems and users.**
   - **Risk and impact assessment:** what could go wrong and who would notice.
   - **Implementation steps and schedule.**
   - **Test plan:** how you'll prove it worked.
   - **Rollback (backout) plan:** how to undo it if it fails.
2. **Review and approval:** significant changes go to the **change advisory board (CAB)**, a group that weighs risk, timing, and readiness.
3. **Schedule** in an agreed **maintenance window** (a low-impact time), and **notify** affected users and stakeholders.
4. **Implement**, ideally after **testing in a lab or staging environment**.
5. **Verify** the change worked as intended. If it didn't, **execute the rollback plan**.
6. **Document and close:** record the outcome, update documentation and configuration backups, and hold a **post-implementation review** for lessons learned.

## Types of change

| Type | Description | Example |
|---|---|---|
| **Standard** | **Low-risk, routine, pre-approved**, with a documented procedure. No CAB review each time | Assigning a user's port to a VLAN using the SOP |
| **Normal** | Goes through the **full review and CAB approval** | Upgrading core switch firmware |
| **Emergency** | **Urgent** fix for an outage or critical vulnerability. **Expedited approval**, but **still documented and reviewed afterward** | Patching an actively exploited firewall flaw |

## Freezes, unauthorized changes, and tracking

- **Change freeze:** a period (e.g. year-end, a product launch) when **non-emergency changes aren't allowed** because the business can't risk disruption.
- **Unauthorized change:** any change made **outside the process**. It's a risk in itself and may point to a policy violation or even **compromise**. Configuration comparison tools help spot them.
- **Tracking:**
  - **Ticketing systems** track requests through each stage.
  - **Version-controlled configurations** show exactly what changed between versions and allow restoring earlier ones.

## Common mix-ups

- **Standard vs normal change:** standard = **pre-approved routine**; normal = **needs review each time**.
- **Emergency change ≠ no process:** it's **faster approval**, not skipping documentation.
- **Rollback plan vs test plan:** the test plan **proves success**; the rollback plan **undoes failure**.
- **Maintenance window vs change freeze:** a window is **when changes are allowed**; a freeze is **when they aren't**.
- **CAB:** approves changes; it doesn't implement them.

## Key terms

- **CAB:** change advisory board.
- **Rollback / backout plan:** steps to restore the previous state.
- **Maintenance window:** an agreed low-impact time for changes.
- **Post-implementation review:** a look back at a change's outcome and lessons.
- **Audit trail:** the recorded history of changes and approvals.

> **Exam tip:** Every change request needs a **rollback plan**. One of the first troubleshooting questions is **"What changed?"**, and change records answer it.
