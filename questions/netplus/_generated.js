// Calculated questions (subnetting, address classes, port numbers). Answers are computed, not hand-typed,
// and a fixed seed keeps the output identical on every build so question ids stay stable.

function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(9009);
const int = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
const pickN = (arr, n, exclude) => {
  const pool = arr.filter((x) => !exclude.includes(x));
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(int(0, pool.length - 1), 1)[0]);
  return out;
};

const toInt = (ip) => ip.split(".").reduce((a, o) => a * 256 + Number(o), 0);
const toIp = (n) => [24, 16, 8, 0].map((s) => Math.floor(n / 2 ** s) % 256).join(".");
const maskOf = (p) => toIp(p === 0 ? 0 : (2 ** 32 - 2 ** (32 - p)));
const netOf = (ip, p) => { const size = 2 ** (32 - p); return Math.floor(toInt(ip) / size) * size; };
const usable = (p) => (p >= 31 ? 0 : 2 ** (32 - p) - 2);

const items = [];
const add = (t, q, c, e) => items.push({ d: 1, t, q, c, a: 0, e });

// --- CIDR prefix -> mask
for (let p = 8; p <= 30; p++) {
  if (p === 27) continue; // already a hand-written question
  const wrong = pickN([p - 2, p - 1, p + 1, p + 2].filter((x) => x >= 8 && x <= 32), 3, []);
  const octetBits = p % 8 === 0 ? 8 : p % 8;
  add("IPv4 addressing", `What is the dotted-decimal subnet mask for a /${p} prefix?`,
    [maskOf(p), ...wrong.map(maskOf)],
    `/${p} means ${p} network bits set to 1. ${p % 8 === 0 ? `That is ${p / 8} full octet(s) of 255.` : `${Math.floor(p / 8)} full octet(s) of 255, then ${octetBits} bit(s) in the next octet = ${256 - 2 ** (8 - octetBits)}.`} Mask: ${maskOf(p)}.`);
}

// --- mask -> CIDR
for (const p of [12, 18, 20, 21, 22, 23, 25, 26, 28, 29]) {
  const wrong = pickN([p - 2, p - 1, p + 1, p + 2], 3, []);
  add("IPv4 addressing", `Subnet mask ${maskOf(p)} is equivalent to which CIDR prefix?`,
    [`/${p}`, ...wrong.map((x) => `/${x}`)],
    `Count the 1 bits: ${maskOf(p).split(".").map((o) => (Number(o).toString(2).match(/1/g) || []).length).join(" + ")} = ${p}.`);
}

// --- usable hosts
for (let p = 17; p <= 30; p++) {
  if (p === 26) continue; // hand-written
  const h = 32 - p;
  add("IPv4 addressing", `How many usable host addresses does a /${p} subnet provide?`,
    [String(usable(p)), String(2 ** h), String(usable(p + 1)), String(2 ** (h + 1) - 2)],
    `${h} host bits: 2^${h} = ${2 ** h} addresses, minus the network and broadcast addresses = ${usable(p)} usable.`);
}

// --- network / broadcast / first-last host for random addresses
const privateBase = () => {
  const r = int(0, 2);
  if (r === 0) return [10, int(0, 255), int(0, 255), int(1, 254)];
  if (r === 1) return [172, int(16, 31), int(0, 255), int(1, 254)];
  return [192, 168, int(0, 255), int(1, 254)];
};
for (let i = 0; i < 12; i++) {
  const p = int(20, 29);
  const ip = privateBase().join(".");
  const net = netOf(ip, p), size = 2 ** (32 - p);
  if (toInt(ip) === net || toInt(ip) === net + size - 1) { i--; continue; }
  add("IPv4 addressing", `A host is configured as ${ip}/${p}. What is its network (subnet) ID?`,
    [toIp(net), toIp(net + size), toIp(net - size), toIp(net + size - 1)],
    `A /${p} has a block size of ${size} addresses. ${ip} falls in the block starting at ${toIp(net)} and ending at ${toIp(net + size - 1)}.`);
}
for (let i = 0; i < 12; i++) {
  const p = int(20, 29);
  const ip = privateBase().join(".");
  const net = netOf(ip, p), size = 2 ** (32 - p);
  if (toInt(ip) === net || toInt(ip) === net + size - 1) { i--; continue; }
  add("IPv4 addressing", `What is the broadcast address for the subnet containing ${ip}/${p}?`,
    [toIp(net + size - 1), toIp(net), toIp(net + size), toIp(net + size - 2)],
    `The block for /${p} is ${size} addresses: ${toIp(net)} – ${toIp(net + size - 1)}. The last address is the broadcast.`);
}
for (let i = 0; i < 8; i++) {
  const p = int(24, 29);
  const ip = privateBase().join(".");
  const net = netOf(ip, p), size = 2 ** (32 - p);
  add("IPv4 addressing", `What is the range of usable host addresses in the subnet ${toIp(net)}/${p}?`,
    [`${toIp(net + 1)} – ${toIp(net + size - 2)}`, `${toIp(net)} – ${toIp(net + size - 1)}`,
     `${toIp(net + 1)} – ${toIp(net + size - 1)}`, `${toIp(net + 1)} – ${toIp(net + size / 2 - 2)}`],
    `Network ID ${toIp(net)}, broadcast ${toIp(net + size - 1)}. Usable hosts are everything in between.`);
}

// --- smallest prefix that fits N hosts
for (const n of [5, 12, 25, 50, 100, 200, 500, 1000]) {
  let p = 30; while (usable(p) < n) p--;
  add("IPv4 addressing", `Which is the smallest subnet (longest prefix) that can hold ${n} hosts?`,
    [`/${p}`, `/${p + 1}`, `/${p - 1}`, `/${p + 2}`],
    `/${p} gives ${usable(p)} usable hosts. /${p + 1} gives only ${usable(p + 1)}, which is not enough. /${p - 1} works but wastes more addresses.`);
}

// --- address classes and special ranges
const classOf = (o) => (o < 128 ? "A" : o < 192 ? "B" : o < 224 ? "C" : o < 240 ? "D" : "E");
const classInfo = { A: "1–126 (127 is loopback)", B: "128–191", C: "192–223", D: "224–239, multicast", E: "240–255, experimental" };
const firstOctets = [12, 45, 99, 130, 150, 186, 199, 210, 223, 225, 233, 245];
for (const o of firstOctets) {
  const ip = [o, int(0, 255), int(0, 255), int(1, 254)].join(".");
  const cls = classOf(o);
  add("IPv4 addressing", `Which classful address class does ${ip} belong to?`,
    [`Class ${cls}`, ...pickN(["A", "B", "C", "D", "E"], 3, [cls]).map((x) => `Class ${x}`)],
    `The first octet is ${o}. Class ${cls} covers first octets ${classInfo[cls]}.`);
}
const kinds = [
  ["10." + int(0, 255) + "." + int(0, 255) + "." + int(1, 254), "Private (RFC 1918)", "10.0.0.0/8 is an RFC 1918 private range."],
  ["172.20." + int(0, 255) + "." + int(1, 254), "Private (RFC 1918)", "172.16.0.0/12 (172.16–172.31) is RFC 1918 private."],
  ["172.32." + int(0, 255) + "." + int(1, 254), "Public", "172.32.x.x is just outside the 172.16.0.0/12 private block, so it is public."],
  ["192.168." + int(0, 255) + "." + int(1, 254), "Private (RFC 1918)", "192.168.0.0/16 is RFC 1918 private."],
  ["169.254." + int(1, 254) + "." + int(1, 254), "APIPA (link-local)", "169.254.0.0/16 is APIPA, self-assigned when DHCP fails."],
  ["127.0.0.1", "Loopback", "127.0.0.0/8 is reserved for loopback."],
  ["8.8.8.8", "Public", "8.8.8.8 is outside all reserved ranges. It is a public address (Google DNS)."],
  ["192.169." + int(0, 255) + "." + int(1, 254), "Public", "Only 192.168.0.0/16 is private. 192.169.x.x is public."],
  ["172.15." + int(0, 255) + "." + int(1, 254), "Public", "The private block starts at 172.16.0.0, so 172.15.x.x is public."],
  ["127.10.20.30", "Loopback", "The entire 127.0.0.0/8 block is loopback, not just 127.0.0.1."]
];
for (const [ip, ans, e] of kinds) {
  add("IPv4 addressing", `How is the IPv4 address ${ip} best classified?`,
    [ans, ...["Private (RFC 1918)", "Public", "APIPA (link-local)", "Loopback"].filter((x) => x !== ans)], e);
}

// --- ports
const ports = [
  ["FTP data and control", "20/21", "FTP uses TCP 21 for control and TCP 20 for active-mode data."],
  ["Telnet", "23", "Telnet uses TCP 23 and sends everything in cleartext."],
  ["SMTP", "25", "SMTP server-to-server relay uses TCP 25."],
  ["SMTP with TLS (SMTPS / submission)", "465/587", "Secure SMTP uses 465 (implicit TLS) or 587 (submission with STARTTLS)."],
  ["TFTP", "69", "TFTP uses UDP 69 and has no authentication."],
  ["HTTP", "80", "HTTP uses TCP 80."],
  ["HTTPS", "443", "HTTPS (HTTP over TLS) uses TCP 443."],
  ["SNMP (agent polling)", "161", "Managers poll SNMP agents on UDP 161. Traps go to UDP 162."],
  ["LDAP", "389", "LDAP uses port 389. LDAPS uses 636."],
  ["Syslog", "514", "Syslog uses UDP 514 by default."],
  ["Microsoft SQL Server", "1433", "Microsoft SQL Server listens on TCP 1433."],
  ["SIP", "5060/5061", "SIP uses 5060 (unencrypted) and 5061 (SIP over TLS)."],
  ["SFTP", "22", "SFTP runs inside SSH, so it uses TCP 22."],
  ["POP3", "110", "POP3 uses TCP 110. POP3S uses 995."],
  ["IMAP", "143", "IMAP uses TCP 143. IMAPS uses 993."],
  ["DNS", "53", "DNS uses port 53 (UDP for most queries, TCP for zone transfers)."],
  ["SSH", "22", "SSH uses TCP 22."],
  ["RDP", "3389", "RDP uses 3389."],
  ["NTP", "123", "NTP uses UDP 123."],
  ["DHCP", "67/68", "DHCP servers use UDP 67 and clients use UDP 68."],
  ["SMB", "445", "SMB uses TCP 445."],
  ["LDAPS", "636", "LDAPS uses TCP 636."]
];
const allPorts = ports.map((p) => p[1]);
// protocol -> port (skip ones the hand-written set already asks this way)
for (const [name, port, e] of ports.slice(0, 15)) {
  add("Ports & protocols", `What is the default port for ${name}?`, [port, ...pickN([...new Set(allPorts)], 3, [port])], e);
}
// port -> protocol
for (const [name, port, e] of ports) {
  if (port === "22") continue; // ambiguous (SSH and SFTP)
  const others = pickN(ports.filter((p) => p[1] !== port && p[1] !== "22").map((p) => p[0]), 3, [name]);
  add("Ports & protocols", `Which protocol uses port ${port} by default?`, [name, ...others], e);
}

module.exports = { items };
