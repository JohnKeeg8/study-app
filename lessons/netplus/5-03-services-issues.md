# Network services issues

## Switching issues

- **STP:**
  - **Loop or broadcast storm:** without STP, redundant links cause 100% utilization, MAC flapping, and a pegged CPU.
  - **Wrong root bridge:** a new switch with a lower priority takes over and paths become inefficient. Prevent it with root guard and deliberate priorities.
  - **Slow port startup:** classic STP takes about 30–50 seconds, so DHCP can time out at boot. Use **PortFast** and BPDU guard on edge ports, or RSTP.
  - **Blocking ports** pass no data.
- **VLAN assignment:**
  - A port in the **wrong VLAN** puts the user in the wrong subnet: wrong IP range, can't reach resources. After fixing it, renew the DHCP lease.
  - **VLAN not allowed on a trunk** or missing on a switch: hosts can't reach beyond the local switch.
  - **Native VLAN mismatch:** traffic leaks between VLANs and logs show mismatch errors.
- **ACLs:**
  - A new ACL with only deny lines blocks everything, because of the **implicit deny**.
  - **Rule order:** the first match wins, so a broad deny above a permit blocks the permitted traffic.
  - **Wrong wildcard mask:** a rule meant for one host blocks a whole subnet.

## Routing issues

- **Missing route:** the destination isn't in the routing table and there's no default route, so packets are **dropped** ("destination unreachable").
- **Wrong or missing default route:** internal traffic works but internet or remote traffic fails.
- **Routing loop:** traceroute shows the **same hops repeating** until the TTL expires (e.g. two static routes pointing at each other).
- **Missing return route:** A can reach B, but B has no path back.
- **Asymmetric routing:** return traffic bypasses the stateful firewall that saw the outbound traffic, so it gets dropped.
- **Neighbor flapping** (OSPF and others): mismatched timers, area, MTU, or authentication, or an unstable link.

## Address pool exhaustion

- **Symptom:** new devices get **APIPA (169.254.x.x)** while existing devices keep working.
- **Fix:** **shorten lease times** (especially on guest networks), **expand the scope**, and clear stale leases.
- **Related problems:**
  - A **rogue DHCP server** (e.g. a home router someone plugged in) hands out the wrong gateway. Fix with DHCP snooping.
  - A **missing DHCP relay** means a whole VLAN gets no addresses while other VLANs work.

## Incorrect host settings

| Misconfiguration | Symptom |
|---|---|
| **Wrong default gateway** (or one not on the host's subnet) | Local hosts reachable; **nothing off-subnet** works |
| **Wrong subnet mask** | Some remote hosts are wrongly treated as local (or the reverse); partial reachability |
| **Wrong IP** (wrong network) | Can't talk to anything |
| **Duplicate IP** | "IP address conflict" warnings and intermittent connectivity. Often a static IP inside the DHCP range; use exclusions or reservations |
| **Wrong DNS server** | Works by IP, **fails by name** |

> **Exam tip:** "Reach local, not remote" → default gateway. "Works by IP, not by name" → DNS. "New devices get 169.254.x.x" → DHCP scope exhausted (or DHCP unreachable). "Same hops repeat in traceroute" → routing loop.
