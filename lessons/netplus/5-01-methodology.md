# Troubleshooting methodology

CompTIA's 7-step method. **Know the order.** Many questions ask "what should you do next?"

## The steps

1. **Identify the problem**
   - Gather information and question users.
   - Identify symptoms and **determine whether anything has changed**.
   - Duplicate the problem if possible.
   - Approach multiple problems **individually**.
2. **Establish a theory of probable cause**
   - **Question the obvious** (power, cables, link lights).
   - Consider multiple approaches: **top-to-bottom** or **bottom-to-top** through the OSI model, or **divide and conquer**.
3. **Test the theory to determine the cause**
   - If confirmed, determine the next steps to resolve the problem.
   - If not confirmed, **establish a new theory or escalate**.
4. **Establish a plan of action to resolve the problem and identify potential effects**
   - Include change management, a maintenance window, and a rollback plan.
5. **Implement the solution or escalate as necessary**
   - Escalate when the fix is beyond your knowledge, authority, or scope.
6. **Verify full system functionality and, if applicable, implement preventive measures**
   - Check the user's real workflow, not just the original symptom.
   - Add monitoring, redundancy, or training to prevent recurrence.
7. **Document findings, actions, outcomes, and lessons learned**
   - **Always the last step.**

> **Memory tip:** **I**dentify, **E**stablish, **T**est, **P**lan, **I**mplement, **V**erify, **D**ocument.

## Approaches

| Approach | When to use |
|---|---|
| **Bottom-up** (Layer 1 → 7) | Total loss of connectivity: check cables and link lights first |
| **Top-down** (Layer 7 → 1) | One application fails but the network seems fine |
| **Divide and conquer** | Start in the middle (e.g. ping, Layer 3) and go up or down based on the result |
| **Follow the path** | Trace traffic hop by hop from source to destination |
| **Spot the difference** | Compare a working system with a failing one |

## Good habits

- **Change one thing at a time** so you know what fixed it.
- **Ask "what changed?"** Check change logs, patches, and moves.
- **Determine scope:** one user (local cause) or many users (shared infrastructure)?
- **Intermittent problems:** gather data over time with logs and monitoring, and note exact times.
- **Don't skip ahead.** Replacing hardware before identifying the problem wastes time and money.

> **Exam tip:** After a theory is confirmed → **establish a plan of action**. After implementing → **verify full functionality**. The final step is always **document**.
