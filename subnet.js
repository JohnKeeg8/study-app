// Subnetting question generator. Every answer and distractor is computed, never hand-typed.
// Exposes window.Subnet = { TYPES, LEVELS, generate(typeId, level), normalize, cheatSheet() }.
(function () {
  "use strict";

  // ---------- IPv4 math (addresses are unsigned 32-bit integers) ----------
  const toIp = (n) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
  const maskInt = (p) => (p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0);
  const maskOf = (p) => toIp(maskInt(p));
  const wildOf = (p) => toIp(~maskInt(p) >>> 0);
  const size = (p) => 2 ** (32 - p);
  const usable = (p) => size(p) - 2;
  const netOf = (ip, p) => (ip & maskInt(p)) >>> 0;
  const fmt = (n) => n.toLocaleString("en-US");
  const ORD = ["1st", "2nd", "3rd", "4th"];

  const rint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Difficulty = which prefix lengths show up.
  const LEVELS = {
    easy: { label: "Easy", note: "/24 – /30", lo: 24, hi: 30 },
    medium: { label: "Medium", note: "/16 – /30", lo: 16, hi: 30 },
    hard: { label: "Hard", note: "/8 – /30", lo: 8, hi: 30 }
  };

  // A realistic address for the prefix: private ranges mostly, sometimes public.
  function baseAddress(p) {
    const r = Math.random();
    let a, b;
    if (p < 12) { a = r < 0.6 ? 10 : rint(1, 126); if (a === 10 && r >= 0.6) a = 11; b = rint(0, 255); }
    else if (p < 16) { a = r < 0.5 ? 10 : 172; b = a === 172 ? rint(16, 31) : rint(0, 255); }
    else if (r < 0.35) { a = 192; b = 168; }
    else if (r < 0.6) { a = 172; b = rint(16, 31); }
    else if (r < 0.85) { a = 10; b = rint(0, 255); }
    else { a = pick([23, 45, 64, 98, 131, 150, 198, 203]); b = rint(0, 255); }
    return ((a << 24) | (b << 16) | (rint(0, 255) << 8) | rint(0, 255)) >>> 0;
  }
  // A host address (not the network or broadcast) inside a random /p block.
  function hostIn(p) {
    const net = netOf(baseAddress(p), p);
    return net + rint(1, size(p) - 2);
  }

  // Four unique choices with the correct one first; fills gaps from `more()` if candidates collide.
  function choices(correct, candidates, more) {
    const out = [correct];
    for (const c of candidates) if (c != null && !out.includes(c)) out.push(c);
    let guard = 0;
    while (out.length < 4 && guard++ < 50) { const c = more(); if (!out.includes(c)) out.push(c); }
    return out.slice(0, 4);
  }

  // ---------- Explanation helpers ----------
  function maskSteps(p) {
    const full = Math.floor(p / 8), bits = p % 8;
    if (!bits) return `/${p} = ${p} one-bits = ${full} full octet${full > 1 ? "s" : ""} of 255. Mask: ${maskOf(p)}.`;
    const vals = [128, 64, 32, 16, 8, 4, 2, 1].slice(0, bits);
    return `/${p} = ${p} one-bits: ${full} full octet${full !== 1 ? "s" : ""} of 255, then ${bits} bit${bits > 1 ? "s" : ""} in the next octet (${vals.join(" + ")} = ${256 - 2 ** (8 - bits)}). Mask: ${maskOf(p)}.`;
  }
  // The "interesting octet" method: block size = 256 − the mask value in the last octet that has network bits.
  function blockInfo(p) {
    const k = Math.ceil(p / 8); // 1..4
    const maskOct = (maskInt(p) >>> (8 * (4 - k))) & 255;
    return { k, maskOct, block: 256 - maskOct };
  }
  function blockSteps(ip, p) {
    const net0 = netOf(ip, p), bc0 = net0 + size(p) - 1;
    if (p % 8 === 0) {
      const keep = p / 8;
      return `/${p} → mask ${maskOf(p)}, which falls on an octet boundary: keep the first ${keep === 1 ? "octet" : keep + " octets"} of ${toIp(ip)} and set the rest to 0 for the network ID (${toIp(net0)}) or to 255 for the broadcast (${toIp(bc0)}).`;
    }
    const { k, maskOct, block } = blockInfo(p);
    const v = (ip >>> (8 * (4 - k))) & 255;
    const start = Math.floor(v / block) * block;
    const net = netOf(ip, p), bc = net + size(p) - 1;
    return `/${p} → mask ${maskOf(p)}. The interesting octet is the ${ORD[k - 1]} (mask value ${maskOct}), so subnets go up in blocks of 256 − ${maskOct} = ${block}. ` +
      `${toIp(ip)} has ${v} in that octet, which falls in the block ${start}–${start + block - 1}. ` +
      `So the network ID is ${toIp(net)} and the broadcast is ${toIp(bc)}.`;
  }
  const hostSteps = (p) => `/${p} leaves ${32 - p} host bits: 2^${32 - p} = ${fmt(size(p))} addresses, minus 2 (network and broadcast) = ${fmt(usable(p))} usable.`;

  const prefixIn = (lv, lo, hi) => rint(Math.max(lv.lo, lo == null ? 0 : lo), Math.min(lv.hi, hi == null ? 32 : hi));

  // ---------- Question types ----------
  // Each gen returns { q, c: [correct, ...wrong], e, typed: accepted answers or null (multiple choice only) }.
  const TYPES = [
    { id: "mask", name: "CIDR → mask", gen(lv) {
      const p = prefixIn(lv);
      return { q: `What is the subnet mask for a /${p}?`,
        c: choices(maskOf(p), [p - 1, p + 1, p - 2, p + 2].filter((x) => x >= 1 && x <= 32).map(maskOf), () => maskOf(rint(8, 30))),
        e: maskSteps(p), typed: [maskOf(p)] };
    } },
    { id: "cidr", name: "Mask → CIDR", gen(lv) {
      const p = prefixIn(lv);
      return { q: `Subnet mask ${maskOf(p)} is which CIDR prefix?`,
        c: choices(`/${p}`, [p - 1, p + 1, p + 2, p - 2].filter((x) => x >= 1 && x <= 32).map((x) => `/${x}`), () => `/${rint(8, 30)}`),
        e: maskSteps(p), typed: [String(p)] };
    } },
    { id: "wildcard", name: "Wildcard masks", gen(lv) {
      const p = prefixIn(lv);
      return { q: `What is the wildcard mask for a /${p} (as used in ACLs and OSPF)?`,
        c: choices(wildOf(p), [maskOf(p), wildOf(p + 1), wildOf(p - 1)], () => wildOf(rint(8, 30))),
        e: `A wildcard mask is the inverse of the subnet mask: 255.255.255.255 − ${maskOf(p)} = ${wildOf(p)}. A 0 bit means "must match", a 1 bit means "don't care".`,
        typed: [wildOf(p)] };
    } },
    { id: "hosts", name: "Usable hosts", gen(lv) {
      const p = prefixIn(lv);
      return { q: `How many usable host addresses are in a /${p} subnet?`,
        c: choices(fmt(usable(p)), [fmt(size(p)), fmt(usable(p + 1)), fmt(usable(p - 1)), fmt(size(p) - 1)].filter((x) => x !== "0" && x !== "-1"), () => fmt(2 ** rint(2, 24) - 2)),
        e: hostSteps(p), typed: [String(usable(p))] };
    } },
    { id: "network", name: "Network ID", gen(lv) {
      const p = prefixIn(lv), ip = hostIn(p), net = netOf(ip, p), sz = size(p);
      return { q: `What is the network ID of ${toIp(ip)}/${p}?`,
        c: choices(toIp(net), [toIp(net + sz), net >= sz ? toIp(net - sz) : null, toIp(net + sz - 1), toIp(netOf(ip, Math.min(p + 1, 30)) === net ? net + sz / 2 : netOf(ip, Math.max(p - 1, 1)))], () => toIp(net + sz * rint(2, 4))),
        e: blockSteps(ip, p), typed: [toIp(net)] };
    } },
    { id: "broadcast", name: "Broadcast address", gen(lv) {
      const p = prefixIn(lv), ip = hostIn(p), net = netOf(ip, p), sz = size(p), bc = net + sz - 1;
      return { q: `What is the broadcast address of the subnet containing ${toIp(ip)}/${p}?`,
        c: choices(toIp(bc), [toIp(net), toIp(bc + 1), toIp(bc - 1), net >= sz ? toIp(net - 1) : null], () => toIp(bc + sz * rint(1, 3))),
        e: blockSteps(ip, p) + " The broadcast is the last address in the block.", typed: [toIp(bc)] };
    } },
    { id: "first", name: "First usable host", gen(lv) {
      const p = prefixIn(lv, null, 29), ip = hostIn(p), net = netOf(ip, p), bc = net + size(p) - 1;
      return { q: `What is the first usable host address in the subnet containing ${toIp(ip)}/${p}?`,
        c: choices(toIp(net + 1), [toIp(net), toIp(net + 2), toIp(bc - 1), toIp(bc + 2)], () => toIp(net + rint(3, 9))),
        e: blockSteps(ip, p) + ` The first usable host is the network ID + 1 = ${toIp(net + 1)}.`, typed: [toIp(net + 1)] };
    } },
    { id: "last", name: "Last usable host", gen(lv) {
      const p = prefixIn(lv, null, 29), ip = hostIn(p), net = netOf(ip, p), bc = net + size(p) - 1;
      return { q: `What is the last usable host address in the subnet containing ${toIp(ip)}/${p}?`,
        c: choices(toIp(bc - 1), [toIp(bc), toIp(bc - 2), toIp(net + 1), toIp(bc + 1)], () => toIp(bc - rint(3, 9))),
        e: blockSteps(ip, p) + ` The last usable host is the broadcast − 1 = ${toIp(bc - 1)}.`, typed: [toIp(bc - 1)] };
    } },
    { id: "range", name: "Host range", typedOk: false, gen(lv) {
      const p = prefixIn(lv, null, 29), ip = hostIn(p), net = netOf(ip, p), sz = size(p), bc = net + sz - 1;
      const r = (a, b) => `${toIp(a)} – ${toIp(b)}`;
      return { q: `What is the usable host range for ${toIp(ip)}/${p}?`,
        c: choices(r(net + 1, bc - 1), [r(net, bc), r(net + 1, bc), r(net + sz + 1, bc + sz - 1), r(net + 1, net + sz / 2 - 2)], () => r(net + 2, bc - 2)),
        e: blockSteps(ip, p) + ` Usable hosts are everything between them: ${r(net + 1, bc - 1)}.`, typed: null };
    } },
    { id: "same", name: "Same subnet?", typedOk: false, gen(lv) {
      const p = prefixIn(lv, null, 29), a = hostIn(p), net = netOf(a, p), sz = size(p);
      const same = Math.random() < 0.5;
      let b;
      if (same) { do { b = net + rint(1, sz - 2); } while (b === a); }
      else { const other = net + sz * (Math.random() < 0.5 && net >= sz ? -1 : 1); b = other + rint(1, sz - 2); }
      const nb = netOf(b, p);
      return { q: `With a /${p} mask, are ${toIp(a)} and ${toIp(b)} in the same subnet?`,
        c: same ? ["Yes", "No"] : ["No", "Yes"],
        e: `${toIp(a)}/${p} is in network ${toIp(net)}; ${toIp(b)}/${p} is in network ${toIp(nb)}. ` +
          (same ? "Same network ID, so they're on the same subnet." : "Different network IDs, so traffic between them must be routed.") +
          (p % 8 ? ` (Block size ${blockInfo(p).block} in the ${ORD[blockInfo(p).k - 1]} octet.)` : ""),
        typed: null, yesno: true };
    } },
    { id: "fit", name: "Right-size a subnet", gen(lv) {
      const p = prefixIn(lv);
      const lowN = p < 30 ? usable(p + 1) + 1 : 2;
      const n = rint(lowN, usable(p));
      const opts = [p + 1, p - 1, p + 2, p - 2].filter((x) => x >= 1 && x <= 30).map((x) => `/${x}`);
      return { q: `What is the smallest subnet (longest prefix) that can hold ${fmt(n)} hosts?`,
        c: choices(`/${p}`, opts, () => `/${rint(8, 30)}`),
        e: `You need 2^h − 2 ≥ ${fmt(n)}. ${p < 30 ? `${31 - p} host bits give only ${fmt(usable(p + 1))}, which is too few; ` : ""}${32 - p} host bits give ${fmt(usable(p))}. 32 − ${32 - p} = /${p}.`,
        typed: [String(p)] };
    } },
    { id: "subnets", name: "Counting subnets", gen(lv) {
      const p = rint(Math.max(lv.lo, 8), Math.min(28, lv.hi - 2));
      const q = rint(p + 1, Math.min(30, p + 10));
      const n = 2 ** (q - p);
      return { q: `How many /${q} subnets fit in one /${p} network?`,
        c: choices(fmt(n), [fmt(n * 2), fmt(n / 2), fmt(q - p), fmt(n - 2)].filter((x) => x !== "0" && x !== "0.5" && x !== "-1"), () => fmt(2 ** rint(1, 12))),
        e: `Going from /${p} to /${q} borrows ${q - p} bit${q - p > 1 ? "s" : ""}: 2^${q - p} = ${fmt(n)} subnets.`,
        typed: [String(n)] };
    } },
    { id: "borrow", name: "Subnets needed → prefix", gen(lv) {
      const p = rint(Math.max(lv.lo, 8), Math.min(27, lv.hi - 3));
      const bits = rint(1, Math.min(6, 30 - p - 2));
      const n = rint(2 ** (bits - 1) + 1, 2 ** bits);
      const net = netOf(baseAddress(p), p);
      const np = p + bits;
      return { q: `You need to split ${toIp(net)}/${p} into at least ${n} equal subnets, borrowing as few bits as possible. What prefix will each subnet use?`,
        c: choices(`/${np}`, [`/${np - 1}`, `/${np + 1}`, `/${np + 2}`], () => `/${rint(p + 1, 30)}`),
        e: `Borrow the fewest bits b where 2^b ≥ ${n}: 2^${bits - 1} = ${2 ** (bits - 1)} is too few, 2^${bits} = ${2 ** bits} works. /${p} + ${bits} = /${np}, giving ${2 ** bits} subnets of ${fmt(usable(np))} usable hosts each.`,
        typed: [String(np)] };
    } },
    { id: "nth", name: "Nth subnet", gen(lv) {
      const p = rint(Math.max(lv.lo, 8), Math.min(28, lv.hi - 2));
      const q = rint(p + 1, Math.min(30, p + 8));
      const count = 2 ** (q - p);
      const n = rint(2, Math.min(count, 8));
      const net = netOf(baseAddress(p), p), sz = size(q);
      const ans = net + (n - 1) * sz;
      return { q: `${toIp(net)}/${p} is split into /${q} subnets. Counting the first subnet as #1, what is the network ID of subnet #${n}?`,
        c: choices(toIp(ans), [toIp(net + n * sz), toIp(net + (n - 2) * sz), toIp(ans + 1), toIp(net + (n - 1) * size(Math.min(q + 1, 30)))], () => toIp(net + rint(0, count - 1) * sz + 1)),
        e: `Each /${q} is a block of ${fmt(sz)} addresses${blockInfo(q).block !== sz ? ` (block size ${blockInfo(q).block} in the ${ORD[blockInfo(q).k - 1]} octet)` : ""}. Subnet #1 starts at ${toIp(net)}, so subnet #${n} starts ${n - 1} blocks later: ${toIp(ans)}.`,
        typed: [toIp(ans)] };
    } }
  ];
  TYPES.forEach((t) => { if (t.typedOk === undefined) t.typedOk = true; });

  function generate(typeId, level) {
    const t = TYPES.find((x) => x.id === typeId);
    const item = t.gen(LEVELS[level] || LEVELS.medium);
    return Object.assign({ type: t.id, name: t.name, a: 0 }, item);
  }

  // Typed answers: ignore spaces, commas and slashes, so "/26", "26" and "8,190" all work.
  const normalize = (s) => String(s).toLowerCase().replace(/[\s,\/]/g, "");

  function cheatSheet() {
    const rows = [];
    for (let p = 16; p <= 30; p++) {
      const { k, block } = blockInfo(p);
      rows.push({ p, mask: maskOf(p), block: `${block} (${ORD[k - 1]})`, hosts: fmt(usable(p)) });
    }
    return rows;
  }

  window.Subnet = { TYPES, LEVELS, generate, normalize, cheatSheet,
    _math: { toIp, maskOf, wildOf, size, usable, netOf } };
})();
