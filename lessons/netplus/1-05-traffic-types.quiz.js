module.exports = {
  "The four types": [
    ["Which traffic type delivers to the nearest of several hosts sharing one address?",
      ["Anycast", "Multicast", "Broadcast", "Unicast"],
      "Routing sends anycast traffic to the topologically closest instance."],
    ["Which traffic type reaches only hosts that have joined a group?",
      ["Multicast", "Broadcast", "Anycast", "Unicast"],
      "Multicast is one-to-many, limited to group members."],
    ["Which IPv4 range is used for multicast?",
      ["224.0.0.0 – 239.255.255.255", "240.0.0.0 – 255.255.255.255", "169.254.0.0 – 169.254.255.255", "127.0.0.0 – 127.255.255.255"],
      "Class D (224.0.0.0/4) is multicast."]
  ],
  "Unicast": [
    ["An SSH session from a laptop to one server is which traffic type?",
      ["Unicast", "Broadcast", "Multicast", "Anycast"],
      "Ordinary one-to-one traffic is unicast."],
    ["If 500 users watch the same video by unicast, how many copies does the server send?",
      ["500 separate copies", "One copy for everyone", "One copy per switch", "None; the network copies it"],
      "Unicast needs a separate stream for each receiver, which is why multicast exists."],
    ["What makes up most everyday network traffic?",
      ["Unicast", "Broadcast", "Multicast", "Anycast"],
      "Web, email, and file transfers are all unicast."]
  ],
  "Broadcast": [
    ["Which device stops broadcasts from passing between networks?",
      ["Router", "Switch", "Hub", "Repeater"],
      "Routers don't forward broadcasts, so they mark the edge of a broadcast domain."],
    ["A client with no IP address sends a DHCP Discover. What source and destination addresses does it use?",
      ["Source 0.0.0.0, destination 255.255.255.255", "Source 127.0.0.1, destination 224.0.0.1", "Source 169.254.1.1, destination the router", "Source 255.255.255.255, destination 0.0.0.0"],
      "It has no address yet and doesn't know the server, so it broadcasts."],
    ["Why do routers block directed broadcasts by default?",
      ["They were abused in Smurf DoS attacks", "They are not supported at all in IPv4", "They flood every VLAN on the local switch", "They would loop endlessly between routers"],
      "A directed broadcast targets all hosts on a remote subnet."],
    ["What is the usual fix for excessive broadcast traffic on a large flat network?",
      ["Split it into smaller broadcast domains with VLANs", "Replace the switches with hubs to repeat frames faster", "Enable IGMP snooping so switches stop flooding ARP", "Disable ARP on hosts and use static MAC tables instead"],
      "Smaller broadcast domains mean each host processes fewer broadcasts."]
  ],
  "Multicast": [
    ["Which protocol do IPv4 hosts use to join a multicast group?",
      ["IGMP", "ICMP", "ARP", "DHCP"],
      "Internet Group Management Protocol handles group membership."],
    ["What happens to multicast on a switch without IGMP snooping?",
      ["It's flooded out every port like a broadcast", "It's dropped because no group has been joined", "It's sent only to the port facing the router", "It's converted into separate unicast copies"],
      "IGMP snooping limits multicast to interested ports."],
    ["OSPF hellos sent to 224.0.0.5 are which type of traffic?",
      ["Multicast", "Broadcast", "Anycast", "Unicast"],
      "224.0.0.5 is the All-OSPF-Routers multicast group."],
    ["IPv4 multicast frames use MAC addresses that begin with:",
      ["01:00:5E", "FF:FF:FF", "33:33", "00:00:0C"],
      "33:33 is used for IPv6 multicast."]
  ],
  "Anycast": [
    ["How does anycast deliver traffic to the closest server?",
      ["One IP is advertised from many sites; routing picks the nearest", "DNS hands each client a different IP address chosen at random", "The client broadcasts a request and the first server to reply wins", "Switches use IGMP to send traffic to the nearest group member"],
      "Normal routing selects the topologically closest advertisement."],
    ["Which service commonly uses anycast?",
      ["Public DNS resolvers like 1.1.1.1", "DHCP Discover from new clients", "OSPF hellos sent to 224.0.0.5", "ARP requests for the gateway's MAC"],
      "DNS root and public resolvers use anycast for speed and resilience. DHCP Discover and ARP requests are broadcast; OSPF hellos are multicast."],
    ["What happens to anycast users if one site fails?",
      ["Routing sends them to the next closest site", "All users of that address lose the service", "Their traffic is broadcast to every remaining site", "They must be given a new IP address by DHCP"],
      "Resilience is a key benefit of anycast."]
  ],
  "IPv6 and broadcast": [
    ["Which traffic type does IPv6 not support?",
      ["Broadcast", "Multicast", "Anycast", "Unicast"],
      "IPv6 replaces broadcast with multicast."],
    ["Which IPv6 address reaches all nodes on the local link?",
      ["FF02::1", "FF02::2", "::1", "FE80::1"],
      "FF02::1 = all nodes; FF02::2 = all routers."],
    ["What does IPv6 use instead of ARP?",
      ["Neighbor Discovery (multicast)", "ARP sent to FF:FF:FF:FF:FF:FF", "IGMP group membership reports", "DHCPv6 address leases only"],
      "Neighbor Discovery (over ICMPv6) replaces ARP."]
  ],
  "Common mix-ups": [
    ["In ARP, what traffic types are the request and the reply?",
      ["Request is broadcast; reply is unicast", "Both are broadcast", "Both are multicast", "Request is unicast; reply is broadcast"],
      "The asker doesn't know the MAC, so it broadcasts; the owner answers directly."],
    ["What is the key difference between anycast and multicast?",
      ["Anycast reaches the nearest one; multicast reaches all group members", "Anycast reaches every host on the link; multicast reaches the nearest", "Multicast reaches only the nearest host; anycast reaches every member", "Anycast exists only in IPv4; multicast exists only in IPv6 networks"],
      "Anycast = one of many; multicast = many."],
    ["Which statement about switches and broadcasts is correct?",
      ["Switches forward broadcasts within a VLAN; routers stop them", "Switches stop broadcasts at each port; routers forward them", "Routers forward broadcasts between VLANs by default", "Switches forward broadcasts only to IGMP-joined ports"],
      "VLANs and routers bound broadcast domains."]
  ],
  "Key terms": [
    ["What is a broadcast domain?",
      ["Devices that receive each other's broadcasts", "Hosts that joined the same multicast group", "All servers sharing a single anycast address", "Hosts on separate subnets joined by a router"],
      "Routers and VLAN boundaries separate broadcast domains."],
    ["What does IGMP snooping do?",
      ["Limits multicast to switch ports with interested receivers", "Lets hosts tell their router which multicast group to join", "Blocks rogue DHCP servers from answering client requests", "Converts multicast streams into separate unicast copies"],
      "Switches listen to IGMP joins to build multicast forwarding."],
    ["What is Class D address space used for?",
      ["Multicast", "Private addressing", "Loopback", "Experimental use"],
      "224.0.0.0/4 is multicast."]
  ]
};
