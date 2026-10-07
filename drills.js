// Memorization decks: ports & protocols, and IPv4 address classes.
// Each deck has CARDS (facts) and TYPES (ways to ask about a card). The app tracks every card+type pair
// with spaced repetition. Every question has the correct choice first; the app shuffles.
// Exposes window.Drills = { ports, classes, normalize }.
(function () {
  "use strict";

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const rint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  // Three distinct wrong answers drawn from `pool`, never equal to `correct`.
  function others(correct, pool, n) {
    const out = [];
    const cand = pool.filter((x) => x !== correct);
    while (out.length < (n || 3) && cand.length) {
      const x = cand.splice(Math.floor(Math.random() * cand.length), 1)[0];
      if (!out.includes(x)) out.push(x);
    }
    return out;
  }
  // Typed answers: lower case; ignore spaces, commas, and dash style; drop a leading "class".
  const normalize = (s) => String(s).toLowerCase().replace(/[–—]/g, "-").replace(/[\s,]/g, "").replace(/^class/, "");

  // ======================= Ports & protocols =======================
  // core: listed in the N10-009 objectives (1.4). ports: the port(s) to memorize; alt: other accepted answers.
  // kind "ip": an IP protocol number rather than a TCP/UDP port.
  const PORTS = [
    { id: "ftp", name: "FTP", full: "File Transfer Protocol", ports: [20, 21], tx: "TCP", core: true,
      use: "transfers files without encryption (21 = control, 20 = active-mode data)", secure: ["sftp"], aka: ["ftp"] },
    { id: "sftp", name: "SFTP", full: "SSH File Transfer Protocol", ports: [22], tx: "TCP", core: true,
      use: "transfers files encrypted, running inside SSH", aka: ["sftp"] },
    { id: "ssh", name: "SSH", full: "Secure Shell", ports: [22], tx: "TCP", core: true,
      use: "provides encrypted remote command-line access", aka: ["ssh", "secureshell"] },
    { id: "telnet", name: "Telnet", full: "Telnet (Teletype Network)", ports: [23], tx: "TCP", core: true,
      use: "provides unencrypted remote command-line access", secure: ["ssh"], aka: ["telnet"] },
    { id: "smtp", name: "SMTP", full: "Simple Mail Transfer Protocol", ports: [25], tx: "TCP", core: true,
      use: "sends and relays email between mail servers", secure: ["smtps"], aka: ["smtp"] },
    { id: "dns", name: "DNS", full: "Domain Name System", ports: [53], tx: "TCP/UDP", core: true,
      use: "resolves hostnames to IP addresses (UDP for queries, TCP for zone transfers)", aka: ["dns"] },
    { id: "dhcp", name: "DHCP", full: "Dynamic Host Configuration Protocol", ports: [67, 68], tx: "UDP", core: true,
      use: "automatically assigns IP addresses and settings to clients (67 = server, 68 = client)", aka: ["dhcp"] },
    { id: "tftp", name: "TFTP", full: "Trivial File Transfer Protocol", ports: [69], tx: "UDP", core: true,
      use: "transfers files with no authentication, often device configs and firmware", aka: ["tftp"] },
    { id: "http", name: "HTTP", full: "Hypertext Transfer Protocol", ports: [80], tx: "TCP", core: true,
      use: "carries unencrypted web traffic", secure: ["https"], aka: ["http"] },
    { id: "ntp", name: "NTP", full: "Network Time Protocol", ports: [123], tx: "UDP", core: true,
      use: "synchronizes device clocks", aka: ["ntp"] },
    { id: "snmp", name: "SNMP", full: "Simple Network Management Protocol", ports: [161, 162], tx: "UDP", core: true,
      use: "monitors and manages network devices (161 = polling, 162 = traps)", aka: ["snmp"] },
    { id: "ldap", name: "LDAP", full: "Lightweight Directory Access Protocol", ports: [389], tx: "TCP/UDP", core: true,
      use: "queries and updates directory services such as Active Directory", secure: ["ldaps"], aka: ["ldap"] },
    { id: "https", name: "HTTPS", full: "Hypertext Transfer Protocol Secure", ports: [443], tx: "TCP", core: true,
      use: "carries encrypted web traffic (HTTP over TLS)", aka: ["https"] },
    { id: "smb", name: "SMB", full: "Server Message Block", ports: [445], tx: "TCP", core: true,
      use: "shares files and printers on Windows networks", aka: ["smb", "cifs"] },
    { id: "syslog", name: "Syslog", full: "System Logging Protocol", ports: [514], tx: "UDP", core: true,
      use: "sends log messages to a central log server", aka: ["syslog"] },
    { id: "smtps", name: "SMTPS", full: "Simple Mail Transfer Protocol Secure", ports: [587], alt: [[465]], tx: "TCP", core: true,
      use: "submits email securely using TLS (587; 465 is also used)", aka: ["smtps"] },
    { id: "ldaps", name: "LDAPS", full: "Lightweight Directory Access Protocol over SSL/TLS", ports: [636], tx: "TCP", core: true,
      use: "queries directory services encrypted with TLS", aka: ["ldaps"] },
    { id: "sql", name: "SQL Server", full: "Microsoft SQL Server", ports: [1433], tx: "TCP", core: true,
      use: "connects clients to Microsoft SQL Server databases", aka: ["sqlserver", "mssql", "sql", "microsoftsqlserver", "mssqlserver"] },
    { id: "rdp", name: "RDP", full: "Remote Desktop Protocol", ports: [3389], tx: "TCP/UDP", core: true,
      use: "provides graphical remote desktop access to Windows systems", aka: ["rdp", "remotedesktop"] },
    { id: "sip", name: "SIP", full: "Session Initiation Protocol", ports: [5060, 5061], tx: "TCP/UDP", core: true,
      use: "sets up, manages, and ends VoIP calls (5061 = SIP over TLS)", aka: ["sip"] },
    // IP protocol numbers (objective 1.4 "IP protocol types")
    { id: "icmp", name: "ICMP", full: "Internet Control Message Protocol", ports: [1], kind: "ip", core: true,
      use: "carries ping and network error messages", aka: ["icmp"] },
    { id: "tcp", name: "TCP", full: "Transmission Control Protocol", ports: [6], kind: "ip", core: true,
      use: "provides reliable, connection-oriented transport", aka: ["tcp"] },
    { id: "udp", name: "UDP", full: "User Datagram Protocol", ports: [17], kind: "ip", core: true,
      use: "provides fast, connectionless transport", aka: ["udp"] },
    { id: "gre", name: "GRE", full: "Generic Routing Encapsulation", ports: [47], kind: "ip", core: true,
      use: "tunnels other protocols (including multicast) without encryption", aka: ["gre"] },
    { id: "esp", name: "ESP", full: "Encapsulating Security Payload", ports: [50], kind: "ip", core: true,
      use: "is the IPsec protocol that encrypts and authenticates packets", aka: ["esp"] },
    { id: "ah", name: "AH", full: "Authentication Header", ports: [51], kind: "ip", core: true,
      use: "is the IPsec protocol that authenticates packets without encrypting them", aka: ["ah"] },
    // Other commonly tested ports
    { id: "ike", name: "IKE", full: "Internet Key Exchange", ports: [500], tx: "UDP", core: true,
      use: "negotiates IPsec security associations and keys", aka: ["ike", "isakmp"] },
    { id: "pop3", name: "POP3", full: "Post Office Protocol v3", ports: [110], tx: "TCP",
      use: "downloads email from a server to a client", secure: ["pop3s"], aka: ["pop3", "pop"] },
    { id: "imap", name: "IMAP", full: "Internet Message Access Protocol", ports: [143], tx: "TCP",
      use: "reads email kept on the server, synced across devices", secure: ["imaps"], aka: ["imap", "imap4"] },
    { id: "imaps", name: "IMAPS", full: "IMAP over SSL/TLS", ports: [993], tx: "TCP",
      use: "reads email on the server over an encrypted connection", aka: ["imaps"] },
    { id: "pop3s", name: "POP3S", full: "POP3 over SSL/TLS", ports: [995], tx: "TCP",
      use: "downloads email over an encrypted connection", aka: ["pop3s", "pops"] },
    { id: "kerberos", name: "Kerberos", full: "Kerberos", ports: [88], tx: "TCP/UDP",
      use: "provides ticket-based authentication in Active Directory", aka: ["kerberos"] },
    { id: "tacacs", name: "TACACS+", full: "Terminal Access Controller Access-Control System Plus", ports: [49], tx: "TCP",
      use: "provides AAA for device administration and encrypts the entire payload", aka: ["tacacs+", "tacacs", "tacacsplus"] },
    { id: "radius", name: "RADIUS", full: "Remote Authentication Dial-In User Service", ports: [1812, 1813], tx: "UDP",
      use: "provides AAA for network access (1812 = authentication, 1813 = accounting)", aka: ["radius"] },
    { id: "bgp", name: "BGP", full: "Border Gateway Protocol", ports: [179], tx: "TCP",
      use: "exchanges routes between autonomous systems", aka: ["bgp"] },
    { id: "mysql", name: "MySQL", full: "MySQL database", ports: [3306], tx: "TCP",
      use: "connects clients to MySQL databases", aka: ["mysql"] },
    { id: "h323", name: "H.323", full: "H.323", ports: [1720], tx: "TCP",
      use: "is legacy VoIP and video-conferencing call signaling", aka: ["h.323", "h323"] },
    { id: "netbios", name: "NetBIOS", full: "NetBIOS over TCP/IP", ports: [137, 138, 139], tx: "TCP/UDP",
      use: "provides legacy Windows name, datagram, and session services", aka: ["netbios", "nbt"] }
  ];
  PORTS.forEach((p) => { p.core = !!p.core; p.kind = p.kind || "port"; });
  const portById = Object.fromEntries(PORTS.map((p) => [p.id, p]));
  const portLabel = (p) => p.ports.join("/");
  const unitOf = (p) => (p.kind === "ip" ? "IP protocol number" : p.ports.length > 1 ? "ports" : "port");

  // Names that aren't acronyms (or whose "full name" isn't an expansion) are left out of "what does X stand for?".
  const NO_EXPANSION = ["telnet", "sql", "kerberos", "mysql", "h323", "netbios", "imaps", "pop3s"];

  const PORT_TYPES = [
    { id: "p2n", name: "Protocol → port", typed: true, applies: () => true, gen(p, cards) {
      const pool = cards.filter((x) => x.kind === p.kind).map(portLabel);
      const multi = p.ports.length > 1;
      return {
        q: p.kind === "ip" ? `What is the IP protocol number for ${p.name}?` : `What port${multi ? "s" : ""} does ${p.name} use${multi ? " (give all of them)" : ""}?`,
        c: [portLabel(p), ...others(portLabel(p), pool)],
        e: `${p.name} (${p.full}) ${p.kind === "ip" ? `is IP protocol number ${p.ports[0]}. It` : `uses ${p.tx} ${portLabel(p)}. It`} ${p.use}.${p.alt ? ` Port ${p.alt.map((a) => a.join("/")).join(", ")} is also accepted.` : ""}`,
        acceptNums: [p.ports, ...(p.alt || [])]
      };
    } },
    { id: "n2p", name: "Port → protocol", typed: true, applies: () => true, gen(p, cards) {
      const label = portLabel(p);
      // Every protocol sharing a number counts (22 = SSH or SFTP).
      const same = cards.filter((x) => x.kind === p.kind && portLabel(x) === label);
      const pool = cards.filter((x) => x.kind === p.kind && portLabel(x) !== label).map((x) => x.name);
      const shared = same.length > 1 ? ` ${same.map((x) => x.name).join(" and ")} both use ${label}.` : "";
      return {
        q: p.kind === "ip" ? `Which protocol is IP protocol number ${label}?` : `Which protocol uses ${p.ports.length > 1 ? "ports" : "port"} ${label} by default?`,
        c: [p.name, ...others(p.name, pool)],
        e: `${label} = ${p.name} (${p.full}), which ${p.use}.${shared}`,
        accept: same.flatMap((x) => [x.name, ...x.aka])
      };
    } },
    { id: "use", name: "What it does", typed: true, applies: () => true, gen(p, cards) {
      const pool = cards.filter((x) => x.kind === p.kind).map((x) => x.name);
      return {
        q: `Which protocol ${p.use}?`,
        c: [p.name, ...others(p.name, pool)],
        e: `${p.name} (${p.full}) ${p.use}. ${p.kind === "ip" ? `IP protocol number ${portLabel(p)}.` : `It uses ${p.tx} ${portLabel(p)}.`}`,
        accept: [p.name, ...p.aka]
      };
    } },
    { id: "tx", name: "TCP or UDP?", typed: false, applies: (p) => p.kind === "port", gen(p) {
      const opts = { TCP: "TCP", UDP: "UDP", "TCP/UDP": "Both TCP and UDP" };
      return {
        q: `Which transport protocol does ${p.name} (${portLabel(p)}) use?`,
        c: [opts[p.tx], ...Object.values(opts).filter((x) => x !== opts[p.tx])],
        e: `${p.name} uses ${p.tx === "TCP/UDP" ? "both TCP and UDP" : p.tx} on ${portLabel(p)}. ${p.tx === "UDP" ? "UDP suits quick, connectionless exchanges." : p.tx === "TCP" ? "TCP gives reliable, ordered delivery." : ""}`.trim()
      };
    } },
    { id: "secure", name: "Secure replacement", typed: true, applies: (p) => !!p.secure, gen(p, cards) {
      const sec = p.secure.map((id) => portById[id]);
      const names = cards.filter((x) => x.kind === "port" && !p.secure.includes(x.id) && x.id !== p.id).map((x) => x.name);
      const s0 = sec[0];
      return {
        q: `What is the secure replacement for ${p.name} (${portLabel(p)})?`,
        c: [s0.name, ...others(s0.name, names)],
        e: `${p.name} sends data unencrypted. ${sec.map((s) => `${s.name} (${portLabel(s)})`).join(" or ")} ${s0.use}.${p.id === "ftp" ? " FTPS (FTP over TLS) is also an option." : ""}`,
        accept: sec.flatMap((s) => [s.name, ...s.aka]).concat(p.id === "ftp" ? ["ftps"] : [])
      };
    } },
    { id: "full", name: "Acronym → name", typed: false, applies: (p) => !NO_EXPANSION.includes(p.id), gen(p, cards) {
      const pool = cards.filter((x) => !NO_EXPANSION.includes(x.id)).map((x) => x.full);
      return {
        q: `What does ${p.name} stand for?`,
        c: [p.full, ...others(p.full, pool)],
        e: `${p.name} = ${p.full}. It ${p.use}.`
      };
    } }
  ];

  function portRows(cards) {
    return cards.map((p) => ({ port: portLabel(p), name: p.name, tx: p.kind === "ip" ? "IP proto" : p.tx, use: p.use }));
  }

  const ports = {
    id: "ports",
    title: "Ports & protocols",
    icon: "🔌",
    objective: "Networking Concepts > Ports & protocols",
    topic: "1|Ports & protocols",
    blurb: "Memorize every port and protocol on the exam: numbers both ways, TCP vs UDP, what each one does, and secure replacements.",
    CARDS: PORTS,
    TYPES: PORT_TYPES,
    cards: (settings) => PORTS.filter((p) => settings.scope === "all" || p.core),
    rows: portRows
  };

  // ======================= IPv4 address classes =======================
  const CLASSES = [
    { id: "A", kind: "class", range: [1, 126], altRange: [[0, 127]], bits: "0", mask: "255.0.0.0", prefix: 8,
      priv: "10.0.0.0 – 10.255.255.255", privCidr: "10.0.0.0/8", hosts: 16777214,
      use: "Unicast addressing for very large networks" },
    { id: "B", kind: "class", range: [128, 191], bits: "10", mask: "255.255.0.0", prefix: 16,
      priv: "172.16.0.0 – 172.31.255.255", privCidr: "172.16.0.0/12", hosts: 65534,
      use: "Unicast addressing for medium-sized networks" },
    { id: "C", kind: "class", range: [192, 223], bits: "110", mask: "255.255.255.0", prefix: 24,
      priv: "192.168.0.0 – 192.168.255.255", privCidr: "192.168.0.0/16", hosts: 254,
      use: "Unicast addressing for small networks" },
    { id: "D", kind: "class", range: [224, 239], bits: "1110",
      use: "Multicast (one-to-many delivery to a group of hosts)" },
    { id: "E", kind: "class", range: [240, 255], altRange: [[240, 254]], bits: "1111",
      use: "Experimental (reserved for future use, not assigned to hosts)" },
    { id: "loopback", kind: "special", name: "Loopback", block: "127.0.0.0/8", example: "127.0.0.1",
      accept: ["127.0.0.0/8", "127.0.0.1", "127.0.0.0", "127.x.x.x", "127.0.0.0-127.255.255.255", "127"],
      use: "Loopback: testing the local TCP/IP stack without leaving the host" },
    { id: "apipa", kind: "special", name: "APIPA (link-local)", block: "169.254.0.0/16", example: "169.254.10.20",
      accept: ["169.254.0.0/16", "169.254.0.0", "169.254.x.x", "169.254.0.0-169.254.255.255", "169.254", "169.254.0.1-169.254.255.254"],
      use: "APIPA (link-local): self-assigned when a host can't reach a DHCP server" },
    { id: "bcast", kind: "special", name: "Limited broadcast", block: "255.255.255.255", example: "255.255.255.255",
      accept: ["255.255.255.255"],
      use: "Limited broadcast: reaches every host on the local network and is never routed" },
    { id: "zero", kind: "special", name: "Unspecified / default route", block: "0.0.0.0", example: "0.0.0.0",
      accept: ["0.0.0.0", "0.0.0.0/0", "0.0.0.0/8"],
      use: "Unspecified address: a host with no IP yet (DHCP source address); as 0.0.0.0/0 it means the default route" }
  ];
  const classCards = CLASSES.filter((c) => c.kind === "class");
  const unicast = classCards.filter((c) => c.mask);
  const allUses = CLASSES.map((c) => c.use);
  const octet = (lo, hi) => {
    let o;
    do { o = rint(lo, hi); } while (o === 127 || o === 0);
    return o;
  };
  const ipIn = (c) => [octet(c.range[0], c.range[1]), rint(0, 255), rint(0, 255), rint(1, 254)].join(".");
  const fmt = (n) => n.toLocaleString("en-US");

  const CLASS_TYPES = [
    { id: "octet", name: "Which class is this IP?", typed: true, applies: (c) => c.kind === "class", gen(c) {
      const ip = ipIn(c);
      return {
        q: `Which class does ${ip} belong to?`,
        c: [`Class ${c.id}`, ...others(`Class ${c.id}`, classCards.map((x) => `Class ${x.id}`))],
        e: `The first octet is ${ip.split(".")[0]}. Class ${c.id} covers first octets ${c.range[0]}–${c.range[1]}${c.id === "A" ? " (127 is reserved for loopback)" : ""}.`,
        accept: [c.id]
      };
    } },
    { id: "range", name: "First-octet range", typed: true, applies: (c) => c.kind === "class", gen(c) {
      const label = (x) => `${x.range[0]}–${x.range[1]}`;
      return {
        q: `What is the first-octet range for Class ${c.id} addresses?`,
        c: [label(c), ...others(label(c), classCards.map(label))],
        e: `Class ${c.id}: ${label(c)}${c.id === "A" ? ". 0 is reserved and 127 is loopback, so usable Class A networks are 1–126 (0–127 is also accepted)" : c.id === "E" ? " (some sources say 240–254, since 255.255.255.255 is the limited broadcast)" : ""}. Leading bits: ${c.bits}.`,
        acceptNums: [c.range, ...(c.altRange || [])], parts: ["From", "To"]
      };
    } },
    { id: "bits", name: "Leading bits", typed: true, applies: (c) => c.kind === "class", gen(c) {
      return {
        q: `What leading (high-order) bits identify a Class ${c.id} address?`,
        c: [c.bits, ...others(c.bits, classCards.map((x) => x.bits))],
        e: `Class A starts with 0, B with 10, C with 110, D with 1110, E with 1111. That's why Class ${c.id} starts at ${c.range[0]} (${c.range[0].toString(2).padStart(8, "0")} in binary).`,
        accept: [c.bits]
      };
    } },
    { id: "mask", name: "Default mask", typed: true, applies: (c) => !!c.mask, gen(c) {
      return {
        q: `What is the default subnet mask for a Class ${c.id} network?`,
        c: [`${c.mask} (/${c.prefix})`, ...unicast.filter((x) => x !== c).map((x) => `${x.mask} (/${x.prefix})`), "255.255.255.255 (/32)"].slice(0, 4),
        e: `Class ${c.id} uses ${c.mask}, which is /${c.prefix}. Classes D and E have no default mask because they aren't used for host networks.`,
        accept: [c.mask, `/${c.prefix}`, String(c.prefix)]
      };
    } },
    { id: "private", name: "Private range", typed: true, applies: (c) => !!c.priv, gen(c) {
      const decoys = { A: ["10.0.0.0 – 10.0.255.255", "10.0.0.0 – 10.127.255.255"],
        B: ["172.16.0.0 – 172.16.255.255", "172.16.0.0 – 172.32.255.255"],
        C: ["192.168.0.0 – 192.168.0.255", "192.0.0.0 – 192.168.255.255"] }[c.id];
      const otherPriv = unicast.filter((x) => x !== c).map((x) => x.priv);
      return {
        q: `What is the RFC 1918 private address range in Class ${c.id}? (CIDR or first – last both work)`,
        c: [c.priv, decoys[0], decoys[1], pick(otherPriv)],
        e: `Class ${c.id}'s private range is ${c.priv} (${c.privCidr}). The three RFC 1918 ranges are 10.0.0.0/8, 172.16.0.0/12, and 192.168.0.0/16. They aren't routed on the internet, so NAT is used to reach it.`,
        accept: [c.privCidr, c.priv.replace(" – ", "-")]
      };
    } },
    { id: "hosts", name: "Hosts per network", typed: true, applies: (c) => !!c.hosts, gen(c) {
      const h = 32 - c.prefix;
      return {
        q: `How many usable hosts can one Class ${c.id} network have with its default mask?`,
        c: [fmt(c.hosts), ...unicast.filter((x) => x !== c).map((x) => fmt(x.hosts)), fmt(c.hosts + 2)],
        e: `Class ${c.id} (/${c.prefix}) leaves ${h} host bits: 2^${h} − 2 = ${fmt(c.hosts)}.`,
        accept: [String(c.hosts)]
      };
    } },
    { id: "use", name: "What the class is for", typed: false, applies: (c) => c.kind === "class", gen(c) {
      return {
        q: `What is Class ${c.id} used for?`,
        c: [c.use, ...others(c.use, allUses)],
        e: `Class ${c.id} (${c.range[0]}–${c.range[1]}): ${c.use}.${c.id === "D" ? " For example, OSPF uses 224.0.0.5." : ""}`
      };
    } },
    { id: "which", name: "Which class does this?", typed: true, applies: (c) => c.kind === "class", gen(c) {
      const desc = c.use.charAt(0).toLowerCase() + c.use.slice(1);
      return {
        q: `Which address class is used for ${desc}?`,
        c: [`Class ${c.id}`, ...others(`Class ${c.id}`, classCards.map((x) => `Class ${x.id}`))],
        e: `Class ${c.id} (first octet ${c.range[0]}–${c.range[1]}) is used for ${desc}.`,
        accept: [c.id]
      };
    } },
    { id: "special", name: "Special addresses", typed: false, applies: (c) => c.kind === "special", gen(c) {
      return {
        q: `What is ${c.example} (${c.block}) used for?`,
        c: [c.use, ...others(c.use, allUses)],
        e: `${c.block}: ${c.use}.`
      };
    } },
    { id: "specialAddr", name: "Name the special range", typed: true, applies: (c) => c.kind === "special", gen(c) {
      const desc = c.use.split(":")[1].trim();
      return {
        q: `Which address or range is used for this purpose: ${desc}?`,
        c: [c.block, ...others(c.block, CLASSES.filter((x) => x.kind === "special").map((x) => x.block).concat(["10.0.0.0/8", "224.0.0.0/4"]))],
        e: `${c.name}: ${c.block}. ${c.use.split(":")[1].trim().replace(/^./, (m) => m.toUpperCase())}.`,
        accept: c.accept
      };
    } },
    { id: "kind", name: "Private, public, or special?", typed: false, applies: (c) => ["A", "B", "C", "D", "loopback", "apipa"].includes(c.id), gen(c) {
      let ip, ans, why;
      const pub = Math.random() < 0.5;
      if (c.id === "A") { ip = pub ? ipIn(c).replace(/^10\./, "11.") : `10.${rint(0, 255)}.${rint(0, 255)}.${rint(1, 254)}`; }
      if (c.id === "B") { ip = pub ? `172.${pick([rint(32, 191), rint(128, 171)])}.${rint(0, 255)}.${rint(1, 254)}` : `172.${rint(16, 31)}.${rint(0, 255)}.${rint(1, 254)}`; }
      if (c.id === "C") { ip = pub ? `${rint(193, 223)}.${rint(0, 255)}.${rint(0, 255)}.${rint(1, 254)}` : `192.168.${rint(0, 255)}.${rint(1, 254)}`; }
      if (c.priv) {
        ans = pub ? "Public" : "Private (RFC 1918)";
        why = pub ? `${ip} is outside every private range (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), so it's public.` : `${ip} is inside ${c.privCidr}, a private RFC 1918 range.`;
      } else if (c.id === "D") { ip = ipIn(c); ans = "Multicast"; why = `${ip} starts with ${ip.split(".")[0]}, inside 224–239 (Class D), which is multicast.`; }
      else if (c.id === "loopback") { ip = `127.${rint(0, 255)}.${rint(0, 255)}.${rint(1, 254)}`; ans = "Loopback"; why = `All of 127.0.0.0/8 is loopback, not just 127.0.0.1.`; }
      else { ip = `169.254.${rint(1, 254)}.${rint(1, 254)}`; ans = "APIPA (link-local)"; why = `169.254.0.0/16 is APIPA: the host gave itself an address because DHCP failed.`; }
      const opts = ["Private (RFC 1918)", "Public", "Loopback", "APIPA (link-local)", "Multicast"];
      return { q: `How is ${ip} best described?`, c: [ans, ...others(ans, opts)], e: why };
    } }
  ];

  const classes = {
    id: "classes",
    title: "IP address classes",
    icon: "🏷️",
    objective: "Networking Concepts > IPv4 addressing (address classes)",
    topic: "1|IPv4 addressing",
    blurb: "Learn Classes A–E: their ranges, leading bits, default masks, private ranges, what each class is for, and the special addresses.",
    CARDS: CLASSES,
    TYPES: CLASS_TYPES,
    cards: () => CLASSES,
    classRows: () => classCards,
    specialRows: () => CLASSES.filter((c) => c.kind === "special")
  };

  window.Drills = { ports, classes, normalize };
})();
