// Subject definition. Topic names must match the `topic` in each question file.
module.exports = {
  id: "netplus",
  name: "CompTIA Network+",
  code: "N10-009",
  domains: [
    { id: 1, name: "Networking Concepts", weight: 23, topics: [
      "OSI model", "Networking appliances", "Cloud concepts", "Ports & protocols", "Traffic types",
      "Transmission media", "Transceivers & connectors", "Network topologies", "IPv4 addressing",
      "Modern network environments"
    ] },
    { id: 2, name: "Network Implementation", weight: 20, topics: [
      "Routing technologies", "Switching technologies", "Wireless devices", "Physical installations"
    ] },
    { id: 3, name: "Network Operations", weight: 19, topics: [
      "Documentation", "Life-cycle management", "Change management", "Configuration management",
      "Network monitoring", "Disaster recovery", "Network services", "Access & management"
    ] },
    { id: 4, name: "Network Security", weight: 14, topics: [
      "Logical security", "Physical security", "Deception technologies", "Security terminology",
      "Audits & compliance", "Network segmentation", "Types of attacks", "Security features & defense"
    ] },
    { id: 5, name: "Network Troubleshooting", weight: 24, topics: [
      "Troubleshooting methodology", "Cabling & physical interface issues", "Network services issues",
      "Performance issues", "Tools & protocols"
    ] }
  ]
};
