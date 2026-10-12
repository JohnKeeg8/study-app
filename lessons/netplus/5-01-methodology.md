# Troubleshooting methodology

CompTIA's troubleshooting methodology is a **7-step process** that keeps you from guessing, making things worse, or "fixing" the wrong thing. The exam loves "what should the technician do **next**?" questions, so you need to know the **order** of the steps and **what belongs in each one**.

## Why follow a methodology

Without a method, technicians tend to jump straight to a fix ("just replace the switch"), change several things at once, and never write down what happened. That wastes money, causes new outages, and means the same problem is solved from scratch next time.

The 7 steps, in order:

1. **Identify the problem**
2. **Establish a theory of probable cause**
3. **Test the theory to determine the cause**
4. **Establish a plan of action to resolve the problem and identify potential effects**
5. **Implement the solution or escalate as necessary**
6. **Verify full system functionality and, if applicable, implement preventive measures**
7. **Document findings, actions, outcomes, and lessons learned**

> **Memory tip:** **I**dentify, **E**stablish, **T**est, **P**lan, **I**mplement, **V**erify, **D**ocument. Try "**I** **E**at **T**acos, **P**lease **I**nvite **V**ery **D**elightful friends."

Notice the shape: steps 1–3 find the **cause**, steps 4–5 **fix** it safely, and steps 6–7 **confirm and record** the result. Documentation is **always last**, and you never implement a fix before you've identified the problem and tested a theory.

## Step 1: Identify the problem

You can't fix what you don't understand. This step is all about **gathering information** before forming any opinions.

- **Gather information:** read the ticket, check **logs**, **monitoring dashboards**, and alerts. Logs and monitoring let you learn a lot **without bothering users**.
- **Question users:** ask open questions. "What exactly fails? Since when? Does it happen all the time? Can you show me the error?"
- **Identify symptoms:** "the internet is down" might really mean one website fails, or only email fails. Pin down the actual symptom.
- **Determine if anything has changed:** recent **patches, configuration changes, moved equipment, new devices**, or a user's own actions. Check **change logs**. Recent changes are one of the most common causes of new problems.
- **Duplicate the problem, if possible:** reproducing it **confirms the symptoms** and gives you a way to **prove a fix works** later.
- **Approach multiple problems individually:** if you find three unrelated issues, treat them as **three separate problems**. Mixing them makes it impossible to know which fix solved what.

**Determine the scope:** ask whether **other users** are affected.
- **One user** → likely a local cause (their PC, cable, port, settings).
- **Many users or a whole site** → likely shared infrastructure (a switch, DHCP, DNS, WAN link, firewall).

Scenario: a user says "the internet is down." The best first move is to ask which sites or applications fail, since when, and whether anything changed, not to reboot the router.

## Step 2: Establish a theory of probable cause

Now you form a hypothesis: "I think the cause is X."

- **Question the obvious:** check the simple things first: **power, cables, link lights**, whether the device is on, whether the user is on the right Wi-Fi. Many "complex" problems are an unplugged cable.
- **Consider multiple approaches:** work through the OSI model **top-to-bottom** or **bottom-to-top**, or use **divide and conquer** (see Troubleshooting approaches below).
- **Use references:** **vendor documentation**, **knowledge bases**, and **logs** help with unusual error messages.

A theory is still only a guess. You haven't changed anything yet; you've decided **what to test**.

## Step 3: Test the theory to determine the cause

You test the theory to prove or disprove it, for example by swapping a suspected bad patch cable, pinging the gateway, or checking the port's VLAN.

- **If the theory is confirmed:** determine the **next steps to resolve the problem** (which leads to step 4, the plan).
- **If the theory is not confirmed:** **establish a new theory or escalate**. These are the only two options. Don't keep guessing randomly.

**Change one thing at a time** while testing. If you change the cable, the port, and the VLAN together and it starts working, you don't know which one was the cause.

Scenario: a technician suspects a bad patch cable, swaps it, and the problem goes away. That swap was **testing the theory** (step 3). It also happens to resolve the issue, but you still continue through verification and documentation.

## Steps 4 and 5: Plan, then implement or escalate

**Step 4: Establish a plan of action to resolve the problem and identify potential effects.**
Before touching production, think about what your fix could break.
- Follow **change management** (get approval for changes that affect others).
- Schedule a **maintenance window** if the fix causes downtime, and **notify users** of planned downtime.
- Prepare a **rollback plan** in case the fix fails.
- Identify **potential effects**: will rebooting this switch drop the whole floor? Will the firmware upgrade reset settings?

**Step 5: Implement the solution or escalate as necessary.**
- Carry out the plan.
- **Escalate** when the fix is beyond your **knowledge, authority, or scope**. Example: the fix needs a firmware upgrade on a core switch you don't have permission to change, so you escalate to the network engineering team (or the vendor, or the ISP).

Escalating is not failure. It's the correct step when you can't or shouldn't make the change yourself.

## Steps 6 and 7: Verify, then document

**Step 6: Verify full system functionality and, if applicable, implement preventive measures.**
- **Verify full functionality**, not just the original symptom. Check the **user's real workflow** (email, file shares, the business app), because the fix might have solved one part and broken another.
- Confirm the fix **didn't break anything else**.
- **Preventive measures** stop the problem recurring: add **monitoring** or alerts, add **redundancy**, keep **spare parts** (e.g. spare SFPs), apply patches, or **train users**.

**Step 7: Document findings, actions, outcomes, and lessons learned.**
- Record the **symptoms, root cause, steps taken, the fix, and lessons learned**.
- Update the **ticket**, the **knowledge base**, and any affected network documentation (e.g. a changed VLAN assignment).
- Good documentation lets the next technician solve the same problem in minutes.

Scenario: a technician changes a user's port VLAN and the user can now connect. Before closing the ticket, they should **verify full functionality** and **document the change and outcome**.

## Troubleshooting approaches

These are ways to **form and test theories** (step 2 and 3).

| Approach | How it works | When to use it |
|---|---|---|
| **Bottom-to-top** (Layer 1 → 7) | Start with cables and link lights, then addressing, then applications | Total loss of connectivity; a physical cause is likely |
| **Top-to-bottom** (Layer 7 → 1) | Start at the **Application layer** and work down | One application fails but the network otherwise seems fine |
| **Divide and conquer** | Start in the **middle** (usually Layer 3, e.g. ping) and move **up or down** based on the result | You have no strong hunch; it halves the search quickly |
| **Follow the path** | Trace traffic **hop by hop** from source to destination | Multi-hop problems, e.g. one remote site unreachable |
| **Spot the difference** (comparison) | Compare a **working** system with a **failing** one | One PC fails while an identical one works |

Example of divide and conquer: a ping to the server succeeds, so Layers 1–3 work; you move **up** and check the port, service, or application. If the ping fails, you move **down** and check addressing, the link, and cabling.

## Good habits and common mistakes

**Good habits:**
- **Change one thing at a time** so you know what fixed (or broke) it.
- **Ask "what changed?"** early: change logs, updates, moves, new devices.
- **Determine scope** first: one user versus many changes your whole theory.
- **Intermittent problems:** if you can't reproduce it, **gather data over time** with logs and monitoring, and ask users to **note exact times** it happens.
- Keep the user informed and set expectations.

**Common mistakes the exam describes:**
- **Skipping steps:** a user reports slow file transfers and the technician immediately replaces the switch. They skipped **identifying the problem** and **testing a theory**.
- **Implementing without a plan:** a disruptive change during business hours with no rollback plan.
- **Closing the ticket at "it works now"** without verifying full functionality or documenting.
- **Fixing several problems with one big change**, instead of approaching them individually.

## Common mix-ups

- **Test the theory vs implement the solution:** testing **proves the cause** (step 3); implementing is the **planned fix** (step 5). A quick swap to confirm a suspicion is a test.
- **Establish a plan vs implement:** the **rollback plan, change approval, maintenance window, and impact analysis** belong to **step 4**, before implementation.
- **Theory not confirmed vs theory confirmed:** not confirmed → **new theory or escalate**; confirmed → **plan of action**.
- **Verify vs document:** verify (step 6) = **check it works and prevent recurrence**; document (step 7) = **write it all down**. Document is always last.
- **Top-to-bottom vs bottom-to-top:** top-to-bottom **starts at the Application layer**; bottom-to-top **starts at the Physical layer** (cables).
- **Divide and conquer vs follow the path:** divide and conquer **starts in the middle of the OSI model**; follow the path **traces the route through devices**.
- **Escalate vs give up:** escalation is a **legitimate step** when the problem exceeds your knowledge, authority, or scope.

## Key terms

- **Probable cause:** your best theory of what's causing the problem.
- **Question the obvious:** check simple causes (power, cables, link lights) first.
- **Scope:** how many users, devices, or sites are affected.
- **Duplicate (reproduce) the problem:** make it happen again to confirm symptoms and later test the fix.
- **Escalation:** handing the problem to someone with more knowledge, authority, or access.
- **Rollback plan:** how to undo a change if it fails.
- **Preventive measures:** actions that stop the problem recurring, such as monitoring or redundancy.
- **Divide and conquer:** start in the middle of the OSI model and move up or down.
- **Spot the difference:** compare a working system with a failing one.
- **Lessons learned:** what to do differently next time, recorded in documentation.

> **Exam tip:** After a theory is **confirmed** → **establish a plan of action**. Theory **not confirmed** → **new theory or escalate**. After implementing → **verify full functionality** (and add preventive measures). The final step is always **document**.
