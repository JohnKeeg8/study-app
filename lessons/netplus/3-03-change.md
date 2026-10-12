# Change management

Change management controls **how changes are requested, reviewed, approved, scheduled, carried out, and documented**. The goal is fewer unplanned outages and a clear record of what changed.

## The request process

1. **Submit a change request:** what, why (justification), affected systems, risk and impact, schedule, **test plan**, and **rollback (backout) plan**.
2. **Assess risk and impact:** who and what could be affected?
3. **Approval:** significant changes go to the **change advisory board (CAB)**.
4. **Schedule** in a **maintenance window** and **notify** affected users.
5. **Implement**, ideally after testing in a lab or staging environment.
6. **Verify** the change worked. If it didn't, **roll back**.
7. **Document** the outcome and update records. Hold a **post-implementation review** for lessons learned.

## Types of change

| Type | Meaning |
|---|---|
| **Standard** | Low-risk, routine, pre-approved with a documented procedure (e.g. moving a user port to a VLAN) |
| **Normal** | Goes through full review and CAB approval |
| **Emergency** | Urgent (outage, critical vulnerability). Fast-tracked approval, but still documented and reviewed afterward |

## Other terms

- **Change freeze:** a period, such as year-end, when non-emergency changes aren't allowed.
- **Unauthorized change:** anything made outside the process. It's a risk and may indicate a policy violation or compromise.
- **Tracking:** a ticketing system and version-controlled configs provide an **audit trail**.

## Why it matters for troubleshooting

One of the first troubleshooting questions is **"What changed?"** Change records answer it quickly, because many outages follow recent changes.

> **Exam tip:** Every change request needs a **rollback plan**. Emergency changes skip the wait, not the documentation.
