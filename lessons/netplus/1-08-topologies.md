# Network topologies

## Physical and logical topologies

| Topology | Description | Pros / cons |
|---|---|---|
| **Star** | Every device connects to a central switch | Easy to manage; the central device is a single point of failure |
| **Hub and spoke** | WAN star: branches connect to HQ, not to each other | Cheap and simple; branch-to-branch traffic goes through the hub |
| **Full mesh** | Every node connects to every other node | Maximum redundancy; needs **n(n−1)/2** links |
| **Partial mesh** | Only critical nodes are meshed | Balances cost and redundancy |
| **Point-to-point** | A dedicated link between exactly two endpoints | Simple; leased lines, wireless bridges |
| **Point-to-multipoint** | One central site serves many remotes | Common in wireless |
| **Hybrid** | A mix of the above | Realistic for most networks |
| **Bus / ring** (legacy) | Shared backbone or a loop | One break can take down everything |

For example, 6 sites in a full mesh need 6 × 5 / 2 = **15** links.

## Three-tier hierarchical design (campus)

1. **Core:** fast, redundant backbone. Keep it simple, with no heavy policy.
2. **Distribution:** aggregates access switches, and applies routing between VLANs, ACLs, and QoS.
3. **Access:** where end devices connect (switch ports, APs, PoE).

**Collapsed core** merges core and distribution into one layer. It suits small and medium sites.

## Spine and leaf (data center)

- **Leaf** (top-of-rack) switches connect servers. **Every leaf connects to every spine**; spines don't connect to each other.
- Any server is the same number of hops from any other, giving predictable low latency for **east-west** traffic.
- Uses **ECMP** to spread traffic across all spines.
- **Scales out:** add leaves for more ports, add spines for more bandwidth.

## Traffic directions

- **North-south:** traffic entering or leaving the data center.
- **East-west:** traffic between servers inside it.

> **Exam tip:** "Highest redundancy" → full mesh. "Branches connect only to HQ" → hub and spoke. "Data center, predictable server-to-server latency" → spine and leaf. "Small campus combining layers" → collapsed core.
