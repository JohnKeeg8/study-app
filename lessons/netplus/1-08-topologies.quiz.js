module.exports = {
  "Star and hub-and-spoke": [
    ["What is the main weakness of a star topology?",
      ["The central switch is a single point of failure", "One cable break takes down every device on the LAN", "It needs more cabling than any other topology", "Adding a device means rewiring the existing ones"],
      "If the center fails, everything connected to it loses connectivity."],
    ["In a hub-and-spoke WAN, how does traffic get from one branch to another?",
      ["Through the hub site", "Directly over a branch-to-branch link", "Through the internet only", "It can't"],
      "Spokes connect only to the hub, so branch traffic hairpins through it."],
    ["Why might a company choose hub and spoke for its WAN?",
      ["It's cheap and simple, with central control", "It gives the most redundancy of any WAN design", "Branches can reach each other with no extra latency", "It removes the hub as a single point of failure"],
      "Fewer links and central management keep costs down."]
  ],
  "Mesh": [
    ["How many links does a full mesh of 6 sites need?",
      ["15", "6", "12", "30"],
      "n(n−1)/2 = 6 × 5 / 2 = 15."],
    ["Which topology gives the highest redundancy?",
      ["Full mesh", "Star", "Hub and spoke", "Bus"],
      "Every node has a direct link to every other node."],
    ["A company meshes only its three data centers and connects small offices to one of them. What is this?",
      ["Partial mesh", "Full mesh", "Point-to-multipoint", "Ring"],
      "Only critical nodes are meshed."],
    ["How many links does a full mesh of 4 sites need?",
      ["6", "4", "8", "12"],
      "4 × 3 / 2 = 6."]
  ],
  "Point-to-point and point-to-multipoint": [
    ["A leased line connecting exactly two offices is which topology?",
      ["Point-to-point", "Point-to-multipoint", "Full mesh", "Hybrid"],
      "Point-to-point links join exactly two endpoints."],
    ["One central wireless antenna serves several remote buildings. Which topology is this?",
      ["Point-to-multipoint", "Point-to-point", "Wireless full mesh", "Bus"],
      "One site talking to many remotes is point-to-multipoint."],
    ["A wireless bridge between two buildings is an example of:",
      ["A point-to-point link", "A bus topology", "A spine and leaf fabric", "A collapsed core"],
      "It connects exactly two endpoints."]
  ],
  "Hybrid and legacy topologies": [
    ["A network uses a star in each building and a mesh between buildings. What's the overall topology?",
      ["Hybrid", "Bus", "Ring", "Point-to-point"],
      "Combining topologies makes a hybrid."],
    ["In a bus topology, what happens if the shared cable breaks?",
      ["The whole segment goes down", "Only the device nearest the break is affected", "Traffic reroutes around the break automatically", "The terminators keep the segment running"],
      "Everything shares one cable, so a single break is fatal."],
    ["Which describes most real-world networks?",
      ["Hybrid topologies", "Pure bus topologies", "Pure ring topologies", "Pure full mesh"],
      "Real networks mix stars, meshes, and point-to-point links."]
  ],
  "Three-tier and collapsed core": [
    ["Which layer of a three-tier design is where end devices plug in?",
      ["Access", "Distribution", "Core", "Spine"],
      "The access layer connects PCs, phones, and APs."],
    ["Which layer applies policy such as inter-VLAN routing and ACLs?",
      ["Distribution", "Core", "Access", "Top-of-rack"],
      "Distribution aggregates access switches and applies policy."],
    ["Why should the core layer avoid heavy filtering and policy?",
      ["It needs to stay fast, redundant, and simple", "Core switches can't route between subnets", "It's where end devices and APs plug in", "ACLs only work on access-layer ports"],
      "The core's job is high-speed transport."],
    ["What is a collapsed core?",
      ["The core and distribution layers merged into one", "The access layer removed", "Spine and leaf merged into one switch", "A network with no redundancy"],
      "It suits smaller networks that don't need a separate core."]
  ],
  "Spine and leaf": [
    ["In spine and leaf, how are leaf switches connected?",
      ["Every leaf connects to every spine", "Leaves connect only to each other", "Each leaf connects to one spine", "Leaves form a ring"],
      "Full leaf-to-spine connectivity gives equal paths."],
    ["Where do servers connect in a spine-and-leaf fabric?",
      ["Leaf (top-of-rack) switches", "Spine switches", "Core routers", "Distribution switches"],
      "Spines are the backbone; servers attach to leaves."],
    ["Server-to-server traffic inside the data center is called:",
      ["East-west", "North-south", "Hub-and-spoke", "Point-to-point"],
      "North-south traffic enters or leaves the data center."],
    ["A fabric has 4 spines. How many uplinks does each leaf have (one per spine)?",
      ["4", "1", "2", "8"],
      "Each leaf connects once to every spine."]
  ],
  "Common mix-ups": [
    ["What's the usual difference between 'star' and 'hub and spoke'?",
      ["Star is a LAN around a switch; hub and spoke is WAN sites around HQ", "Star is a WAN of branches; hub and spoke is a LAN around a switch", "Hub and spoke links every branch directly to every other branch", "Star links every device to two central switches for redundancy"],
      "Same shape, different context."],
    ["Which design is built for a campus and which for a data center?",
      ["Three-tier for campus; spine and leaf for data center", "Spine and leaf for campus; three-tier for data center", "Both are only for WANs", "Neither applies to campus networks"],
      "Spine and leaf is optimized for east-west data center traffic."],
    ["In spine and leaf, which of these links should NOT exist?",
      ["Spine to spine", "Leaf to spine", "Server to leaf", "Leaf uplinks to every spine"],
      "Spines connect only to leaves."]
  ],
  "Key terms": [
    ["In network design, what is a single point of failure?",
      ["One component whose failure takes the whole service down", "A link that only carries traffic once the primary fails", "A pair of devices that share load and back each other up", "The one site where all backups for the network are kept"],
      "Good design removes single points of failure."],
    ["What does 'dual-homed' mean for an access switch?",
      ["It uplinks to two distribution switches", "It carries exactly two VLANs on each trunk", "It has two power supplies but a single uplink", "It connects directly to two separate ISPs"],
      "If one uplink or switch fails, the other keeps it connected."],
    ["What does ECMP do in a spine-and-leaf fabric?",
      ["Spreads traffic across several equal-cost paths", "Encrypts all traffic passing between leaves", "Assigns each server port to a VLAN", "Blocks redundant spine links, like STP"],
      "Equal-cost multipath uses all spine links together."]
  ]
};
