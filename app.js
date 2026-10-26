(function () {
  "use strict";

  const STORAGE_KEY = "studyapp.v1";
  const THEME_KEY = "studyapp.theme";
  const PASS_PCT = 80; // Network+ passes at 720/900; ~80% is a good practice target.
  const EXAM_COUNTS = [25, 50, 90];
  const GOALS = [10, 20, 30, 50];
  const LETTERS = "ABCDEFGH";
  const XP_CORRECT = 10;
  const XP_WRONG = 1;
  const COMBO_BONUS_AT = 5;  // from the 5th correct answer in a row, each correct answer earns bonus XP
  const COMBO_BONUS = 5;
  const REVIEW_SHARE = 0.5;  // share of practice questions drawn from reviews that are due (incl. earlier misses)
  const INTERVALS = [1, 3, 7, 16, 35, 90]; // spaced repetition: days until the next review after each correct answer
  const RECENT = 20;         // how many recent answers per objective decide how well you know it

  const subject = window.SUBJECTS[0];
  const app = document.getElementById("app");

  // ---------- Questions & objectives ----------
  function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }
  const topicKey = (d, t) => d + "|" + t;
  const questions = subject.questions.map((q) => ({ ...q, id: q.d + "-" + hash(q.q), tk: topicKey(q.d, q.t) }));
  const byId = Object.fromEntries(questions.map((q) => [q.id, q]));
  const domainName = (id) => (subject.domains.find((d) => d.id === id) || {}).name || "";
  const allTopics = subject.domains.flatMap((d) => d.topics.map((t) => ({ d: d.id, t, tk: topicKey(d.id, t) })));
  const questionsByTopic = {};
  questions.forEach((q) => (questionsByTopic[q.tk] = questionsByTopic[q.tk] || []).push(q));

  // ---------- Dates (local time) ----------
  function dayKey(date) {
    date = date || new Date();
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  }
  function addDays(key, n) {
    const [y, m, d] = key.split("-").map(Number);
    return dayKey(new Date(y, m - 1, d + n));
  }

  // ---------- Storage ----------
  function defaults() {
    return {
      stats: {},   // qid -> { c: correct count, w: wrong count, last: 1|0 }
      topics: {},  // topicKey -> { c, w, r: recent results as a "1"/"0" string, newest last }
      flagged: {}, // qid -> true
      daily: {},   // "YYYY-MM-DD" -> { n: answered, c: correct, xp, met: hit the goal that day }
      xp: 0,
      bestStreak: 0,
      // Drill sections. picked: the user chose the answer style themselves; types/cards: { c, w, r } records.
      subnet: { level: "medium", input: "type", picked: false, types: {} },
      ports: { input: "type", picked: false, scope: "core", types: {}, cards: {} },
      classes: { input: "type", picked: false, types: {}, cards: {} },
      learn: {},   // topicKey -> { read, best, last, passed, passedAt, attempts } for lessons and mini tests
      srs: {},     // spaced repetition: question id or drill key -> { box: 0–6, due: "YYYY-MM-DD" } // types: id -> { c, w, r } like topics
      settings: { domains: subject.domains.map((d) => d.id), offTopics: [], goal: 20, examCount: 90 },
      session: null,
      history: []  // { at, mode, score, total }
    };
  }
  function load() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")[subject.id] || {}; } catch (e) { /* ignore */ }
    const s = Object.assign(defaults(), saved);
    s.settings = Object.assign(defaults().settings, saved.settings || {});
    ["subnet", "ports", "classes"].forEach((k) => {
      s[k] = Object.assign(defaults()[k], saved[k] || {});
      if (!s[k].picked) s[k].input = "type"; // fill in the blank is the default unless you switched it yourself
    });
    if (!saved.topics) backfillTopics(s);
    backfillSchedule(s);
    // Discard a saved session from an older app version or a changed question bank.
    if (s.session && (s.session.v !== 2 || s.session.ids.some((id) => !byId[id]))) s.session = null;
    return s;
  }
  // Questions answered correctly before spaced repetition existed have no review date. Schedule them as if
  // reviewed today (more correct answers = longer interval) instead of treating them all as due at once.
  function backfillSchedule(s) {
    const today = dayKey();
    Object.entries(s.stats).forEach(([id, st]) => {
      if (st.last !== 1 || s.srs[id]) return;
      const box = Math.min(st.c, 3);
      s.srs[id] = { box, due: addDays(today, INTERVALS[box - 1]) };
    });
  }

  // Older saves only tracked individual questions; rebuild per-objective records from them.
  function backfillTopics(s) {
    Object.entries(s.stats).forEach(([id, st]) => {
      const q = byId[id];
      if (!q) return;
      const ts = s.topics[q.tk] || (s.topics[q.tk] = { c: 0, w: 0, r: "" });
      ts.c += st.c;
      ts.w += st.w;
      ts.r = (ts.r + (st.last ? "1" : "0")).slice(-RECENT);
    });
  }
  function save() {
    store.savedAt = Date.now();
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      all[subject.id] = store;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) { /* storage unavailable (private mode); progress just won't persist */ }
    markChanged();
  }
  let store = load();

  // ---------- Sync with the server ----------
  // Progress is saved on this device first (so the app works offline), then copied to the server's sync service
  // (server/sync.py, reached at api/state). Every device that opens the app picks up the server's copy. The
  // server counts revisions: if another device saved since this one last synced, the two copies are merged
  // (keeping the most progress from each) before saving. Without a sync service the app just stays on-device.
  const SYNC_KEY = "studyapp.sync"; // { rev: server revision this device last matched, dirty: unsynced changes, at: last sync time }
  const API_STATE = "api/state";
  const sync = { available: null, busy: false, again: false, timer: null, changes: 0, error: "" };
  function syncMeta() {
    try { const m = JSON.parse(localStorage.getItem(SYNC_KEY) || "null"); if (m) return m; } catch (e) { /* ignore */ }
    return { rev: 0, dirty: true, at: 0 }; // never synced: whatever is on this device still needs uploading
  }
  function setSyncMeta(m) { try { localStorage.setItem(SYNC_KEY, JSON.stringify(m)); } catch (e) { /* ignore */ } }
  function localAll() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {}; } catch (e) { return {}; } }
  const hasProgress = (all) => Object.values(all || {}).some((x) => x && (x.xp > 0 || Object.keys(x.stats || {}).length || Object.keys(x.learn || {}).length || Object.keys(x.srs || {}).length));

  function markChanged() {
    sync.changes++;
    const m = syncMeta();
    if (!m.dirty) setSyncMeta(Object.assign(m, { dirty: true }));
    clearTimeout(sync.timer);
    if (sync.available !== false) sync.timer = setTimeout(syncNow, 1500);
  }

  // Merge two saves of one subject, keeping the most progress from each. Counters keep whichever record has
  // more attempts; settings and the open session come from the copy saved most recently.
  function mergeSubject(a, b) {
    const newer = (b.savedAt || 0) > (a.savedAt || 0) ? b : a;
    const out = JSON.parse(JSON.stringify(newer));
    const tries = (r) => (r ? (r.c || 0) + (r.w || 0) : -1);
    const keys = (x, y) => [...new Set(Object.keys(x || {}).concat(Object.keys(y || {})))];
    const byTries = (x = {}, y = {}) => Object.fromEntries(keys(x, y).map((k) => [k, tries(y[k]) > tries(x[k]) ? y[k] : x[k]]));
    out.stats = byTries(a.stats, b.stats);
    out.topics = byTries(a.topics, b.topics);
    out.flagged = Object.assign({}, a.flagged, b.flagged);
    out.daily = Object.fromEntries(keys(a.daily, b.daily).map((k) => {
      const x = (a.daily || {})[k], y = (b.daily || {})[k];
      if (!x || !y) return [k, x || y];
      const pick = (y.n || 0) > (x.n || 0) ? y : x;
      return [k, Object.assign({}, pick, { met: !!(x.met || y.met) })];
    }));
    out.xp = Math.max(a.xp || 0, b.xp || 0);
    out.bestStreak = Math.max(a.bestStreak || 0, b.bestStreak || 0);
    ["subnet", "ports", "classes"].forEach((d) => {
      if (!a[d] || !b[d]) return;
      out[d].types = byTries(a[d].types, b[d].types);
      if (a[d].cards || b[d].cards) out[d].cards = byTries(a[d].cards, b[d].cards);
    });
    out.learn = Object.fromEntries(keys(a.learn, b.learn).map((k) => {
      const x = (a.learn || {})[k], y = (b.learn || {})[k];
      if (!x || !y) return [k, x || y];
      const ratio = (r) => (r.best || 0) / (r.of || 10);
      const best = ratio(y) > ratio(x) ? y : x;
      const latest = (y.attempts || 0) > (x.attempts || 0) ? y : x;
      return [k, {
        read: !!(x.read || y.read), best: best.best || 0, of: best.of, last: latest.last,
        passed: !!(x.passed || y.passed), passedAt: [x.passedAt, y.passedAt].filter(Boolean).sort()[0],
        attempts: Math.max(x.attempts || 0, y.attempts || 0)
      }];
    }));
    // A question's review schedule goes with whichever answer record was kept; otherwise the later review wins.
    out.srs = Object.fromEntries(keys(a.srs, b.srs).map((k) => {
      const x = (a.srs || {})[k], y = (b.srs || {})[k];
      if (!x || !y) return [k, x || y];
      if ((a.stats || {})[k] || (b.stats || {})[k]) return [k, out.stats[k] === (b.stats || {})[k] ? y : x];
      return [k, (y.due || "") > (x.due || "") ? y : x];
    }));
    const seen = new Set();
    out.history = (a.history || []).concat(b.history || [])
      .filter((h) => { const id = [h.at, h.mode, h.score, h.total].join("|"); return !seen.has(id) && seen.add(id); })
      .sort((x, y) => x.at - y.at).slice(-50);
    out.savedAt = Math.max(a.savedAt || 0, b.savedAt || 0);
    return out;
  }
  function mergeAll(server, local) {
    const out = Object.assign({}, server, local);
    Object.keys(server || {}).forEach((k) => { if (local && local[k] && server[k]) out[k] = mergeSubject(server[k], local[k]); });
    return out;
  }

  // Replace this device's saved progress with `all` and redraw if it changed. A quiz in progress on this device is kept.
  function adopt(all, rev, dirty) {
    const before = localStorage.getItem(STORAGE_KEY) || "{}";
    if (screen === "session" && store.session && all[subject.id]) all[subject.id].session = store.session;
    const after = JSON.stringify(all);
    try { localStorage.setItem(STORAGE_KEY, after); } catch (e) { /* ignore */ }
    setSyncMeta({ rev, dirty: !!dirty, at: Date.now() });
    if (after !== before) { store = load(); render(); }
  }

  async function putState(all, baseRev, backup) {
    const res = await fetch(API_STATE, {
      method: "PUT", cache: "no-store", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseRev, data: all, backup: !!backup })
    });
    if (res.status === 409) return { conflict: await res.json() };
    if (!res.ok) throw new Error("server said " + res.status);
    return res.json();
  }

  // Upload this device's progress. If another device saved meanwhile, merge with its copy and try again.
  async function pushLocal(baseRev, backup) {
    for (let attempt = 0; attempt < 4; attempt++) {
      const changes = sync.changes;
      const all = localAll();
      const r = await putState(all, baseRev, backup);
      if (r.conflict) {
        const srv = r.conflict;
        if (srv.data) adopt(mergeAll(srv.data, localAll()), srv.rev, true);
        baseRev = srv.rev;
        continue;
      }
      // Still dirty if something was saved while the upload was in flight.
      setSyncMeta({ rev: r.rev, dirty: sync.changes !== changes, at: Date.now() });
      return;
    }
    throw new Error("too many conflicts");
  }

  async function syncNow() {
    if (sync.busy) { sync.again = true; return; }
    sync.busy = true;
    clearTimeout(sync.timer);
    try {
      const res = await fetch(API_STATE, { cache: "no-store" });
      if (!res.ok || !/json/.test(res.headers.get("content-type") || "")) throw Object.assign(new Error("no sync service"), { missing: true });
      const srv = await res.json();
      sync.available = true;
      const meta = syncMeta();
      const local = localAll();
      if (!srv.data) {
        // Empty server (first time): upload what this device has. This is how existing progress moves over.
        if (hasProgress(local)) await pushLocal(srv.rev, true); else setSyncMeta({ rev: srv.rev, dirty: true, at: 0 });
      } else if (srv.rev === meta.rev) {
        if (meta.dirty) await pushLocal(srv.rev);
      } else if (!meta.dirty || !hasProgress(local)) {
        adopt(srv.data, srv.rev, false);
      } else {
        adopt(mergeAll(srv.data, local), srv.rev, true);
        await pushLocal(srv.rev);
      }
      sync.error = "";
    } catch (e) {
      if (e.missing && sync.available !== true) sync.available = false;
      sync.error = e.missing ? "" : String(e.message || e);
    } finally {
      sync.busy = false;
      updateSyncStatus();
      if (sync.again) { sync.again = false; syncNow(); }
    }
  }

  function syncStatusText() {
    const m = syncMeta();
    if (sync.available === false) return "Saved on this device only (no sync service on this server).";
    if (sync.available === null) return "Connecting to the server…";
    if (sync.error) return "Saved on this device. Couldn't reach the server, will retry. (" + sync.error + ")";
    if (m.dirty) return "Saved on this device, syncing…";
    return "Synced with the server" + (m.at ? " · " + new Date(m.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "") + ".";
  }
  function updateSyncStatus() {
    const el = document.getElementById("sync-status");
    if (el) el.textContent = syncStatusText();
  }

  // ---------- Backup file (download / restore) ----------
  function downloadBackup() {
    const blob = new Blob([JSON.stringify({ app: "study-app", version: 1, exportedAt: new Date().toISOString(), data: localAll() }, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "study-app-backup-" + dayKey() + ".json";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  async function restoreBackup(file) {
    let data;
    try {
      const parsed = JSON.parse(await file.text());
      data = parsed && parsed.app === "study-app" ? parsed.data : parsed;
      if (!data || typeof data !== "object" || !Object.values(data).some((x) => x && typeof x === "object" && "stats" in x)) throw new Error();
    } catch (e) {
      alert("That file isn't a Study App backup.");
      return;
    }
    const subj = data[subject.id] || {};
    if (!confirm(`Replace the progress on this device${sync.available ? " and the server" : ""} with this backup?\n\n${Object.keys(subj.stats || {}).length} questions answered · ${subj.xp || 0} XP${sync.available ? "\n\nThe server keeps a copy of the current progress first." : ""}`)) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
    while (sync.busy) await new Promise((r) => setTimeout(r, 100));
    sync.busy = true; // keep the background sync from merging the old progress back in
    store = load();
    store.session = null;
    save();
    clearTimeout(sync.timer);
    render();
    if (sync.available) {
      try {
        const res = await fetch(API_STATE, { cache: "no-store" });
        const srv = await res.json();
        await pushLocal(srv.rev, true); // replaces the server copy (after a backup) rather than merging with it
        sync.error = "";
      } catch (e) { sync.error = String(e.message || e); }
    }
    sync.busy = false;
    updateSyncStatus();
    alert("Backup restored.");
  }

  // ---------- Theme (dark by default) ----------
  function getTheme() {
    try { return localStorage.getItem(THEME_KEY) || "dark"; } catch (e) { return "dark"; }
  }
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === "light" ? "#f4f6fa" : "#0d1117";
  }
  applyTheme(getTheme());

  // ---------- Helpers ----------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function weightedPick(items, weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }
  function fmtTime(sec) {
    sec = Math.max(0, Math.round(sec));
    const m = Math.floor(sec / 60), s = sec % 60;
    return m + ":" + String(s).padStart(2, "0");
  }
  const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
  const plural = (n, word) => n + " " + word + (n === 1 ? "" : "s");
  const has = (v) => v !== undefined && v !== null; // saved answers come back from JSON as null

  // ---------- Progress ----------
  const inPool = (q) => store.settings.domains.includes(q.d) && !store.settings.offTopics.includes(q.tk);

  function progress(filter) {
    const qs = questions.filter(filter);
    let seen = 0, mastered = 0, correct = 0, attempts = 0;
    qs.forEach((q) => {
      const s = store.stats[q.id];
      if (!s) return;
      seen++;
      if (s.last === 1) mastered++;
      correct += s.c;
      attempts += s.c + s.w;
    });
    return { total: qs.length, seen, mastered, accuracy: pct(correct, attempts), attempts };
  }
  const domainProgress = (domainId) => progress((q) => domainId == null || q.d === domainId);
  const missedIds = () => questions.filter((q) => store.stats[q.id] && store.stats[q.id].last === 0).map((q) => q.id);
  const flaggedIds = () => questions.filter((q) => store.flagged[q.id]).map((q) => q.id);

  // How well you know an objective, from your most recent answers on it.
  // `est` is smoothed toward 50% so a couple of lucky or unlucky answers don't swing it too far.
  const topicAccuracy = (tk) => recentAccuracy(store.topics[tk]);
  function weakSpots(limit) {
    return allTopics
      .map((x) => ({ ...x, a: topicAccuracy(x.tk) }))
      .filter((x) => x.a && x.a.n >= 3 && x.a.est < 0.85)
      .sort((a, b) => a.a.est - b.a.est)
      .slice(0, limit);
  }

  // ---------- Daily goal & streak ----------
  const today = () => store.daily[dayKey()] || { n: 0, c: 0, xp: 0, met: false };
  function streak() {
    const t = dayKey();
    // Today's streak is still alive until midnight even if you haven't practiced yet.
    let k = store.daily[t] && store.daily[t].met ? t : addDays(t, -1);
    let n = 0;
    while (store.daily[k] && store.daily[k].met) { n++; k = addDays(k, -1); }
    return n;
  }

  function recordAnswer(qid, choice, xp) {
    const q = byId[qid];
    const ok = choice === q.a;
    const s = store.stats[qid] || { c: 0, w: 0, last: 0 };
    if (ok) s.c++; else s.w++;
    s.last = ok ? 1 : 0;
    store.stats[qid] = s;

    store.topics[q.tk] = pushResult(store.topics[q.tk], ok);
    srsUpdate(qid, ok);

    return { ok, justMet: recordDay(ok, xp) };
  }

  // Count an answer toward today's goal and XP. Returns true when this answer completes the daily goal.
  function recordDay(ok, xp) {
    const key = dayKey();
    const day = store.daily[key] || (store.daily[key] = { n: 0, c: 0, xp: 0, met: false });
    day.n++;
    if (ok) day.c++;
    day.xp += xp;
    store.xp += xp;
    if (day.met || day.n < store.settings.goal) return false;
    day.met = true;
    store.bestStreak = Math.max(store.bestStreak, streak());
    return true;
  }

  // Spaced repetition: each correct answer pushes the next review further out (1, 3, 7, 16, 35, 90 days);
  // a miss makes it due again (it still won't repeat within the same session).
  function srsUpdate(key, ok) {
    const r = store.srs[key] || { box: 0, due: dayKey() };
    if (ok) {
      r.box = Math.min(r.box + 1, INTERVALS.length);
      r.due = addDays(dayKey(), INTERVALS[r.box - 1]);
    } else {
      r.box = 0;
      r.due = dayKey();
    }
    store.srs[key] = r;
  }
  // A question you've seen is due if you missed it last time or its review date has arrived.
  function isDue(q) {
    const st = store.stats[q.id];
    if (!st) return false;
    if (st.last === 0) return true;
    const r = store.srs[q.id];
    return !!r && r.due <= dayKey();
  }
  // Unseen or due: the only questions practice shows while any are left.
  const isFresh = (q) => !store.stats[q.id] || isDue(q);

  // Append a result to a { c, w, r } record (r = recent results, newest last).
  function pushResult(rec, ok) {
    rec = rec || { c: 0, w: 0, r: "" };
    if (ok) rec.c++; else rec.w++;
    rec.r = (rec.r + (ok ? "1" : "0")).slice(-RECENT);
    return rec;
  }
  function recentAccuracy(rec) {
    if (!rec || !rec.r.length) return null;
    let c = 0;
    for (const ch of rec.r) if (ch === "1") c++;
    return { acc: c / rec.r.length, n: rec.r.length, est: (c + 1) / (rec.r.length + 2) };
  }

  // ---------- Question selection ----------
  function practiceTopics(s) {
    if (s && s.focus) return [s.focus];
    return allTopics
      .filter((x) => store.settings.domains.includes(x.d) && !store.settings.offTopics.includes(x.tk) && questionsByTopic[x.tk])
      .map((x) => x.tk);
  }

  // Struggling objectives get picked far more often; objectives you haven't tried much get a boost
  // so they get explored; objectives you've mastered still show up now and then for review.
  function topicWeight(tk, lastTopics) {
    const a = topicAccuracy(tk);
    const est = a ? a.est : 0.5;
    let w = 0.15 + 4 * Math.pow(1 - est, 2);
    if (!a || a.n < 3) w += 0.6;
    if (lastTopics[0] === tk && lastTopics[1] === tk) w *= 0.3; // avoid long runs of one objective
    return w;
  }

  // Within an objective: earlier misses first, then reviews that are due, then unseen questions, and
  // last, ones you know that aren't due yet (longer intervals sort later). Nothing repeats within a session.
  function questionRank(q) {
    const s = store.stats[q.id];
    if (!s) return 1;
    if (s.last === 0) return 0;
    const r = store.srs[q.id];
    if (!r || r.due <= dayKey()) return 0.5;
    return 3 + r.box;
  }

  function nextPracticeId(s) {
    const prev = s.ids[s.ids.length - 1];
    const topics = practiceTopics(s);
    const lastTopics = s.ids.slice(-2).reverse().map((id) => byId[id].tk);
    const asked = new Set(s.ids);

    // About half the time, take a review that's due: earlier misses count double, weaker objectives come first.
    if (Math.random() < REVIEW_SHARE) {
      const inScope = new Set(topics);
      const due = questions.filter((q) => inScope.has(q.tk) && !asked.has(q.id) && isDue(q));
      if (due.length) return weightedPick(due, due.map((q) => topicWeight(q.tk, lastTopics) * (store.stats[q.id].last === 0 ? 2 : 1))).id;
    }

    // Only objectives that still have something unseen or due. A question you got right isn't shown again
    // before its review date unless everything in scope has been covered.
    const freshTopics = topics.filter((t) => questionsByTopic[t].some((q) => !asked.has(q.id) && isFresh(q)));
    if (freshTopics.length) {
      const tk = weightedPick(freshTopics, freshTopics.map((t) => topicWeight(t, lastTopics)));
      return questionsByTopic[tk]
        .filter((q) => !asked.has(q.id) && isFresh(q))
        .map((q) => ({ id: q.id, r: questionRank(q) + Math.random() * 0.9 }))
        .sort((a, b) => a.r - b.r)[0].id;
    }
    // Everything in scope is covered: review ahead, soonest review date first.
    const inScope = new Set(topics);
    let ahead = questions.filter((q) => inScope.has(q.tk) && !asked.has(q.id));
    if (!ahead.length) ahead = questions.filter((q) => inScope.has(q.tk) && q.id !== prev);
    const dueOf = (q) => (store.srs[q.id] || {}).due || "";
    return ahead.map((q) => ({ id: q.id, d: dueOf(q) + Math.random() })).sort((a, b) => (a.d < b.d ? -1 : 1))[0].id;
  }

  // Exam: random questions, split across the selected domains by their official exam weights.
  function pickExam(count) {
    const pools = subject.domains
      // Unseen or due questions first, so exams don't keep showing ones you already know.
      .map((d) => {
        const qs = questions.filter((q) => q.d === d.id && inPool(q));
        return { d, qs: shuffle(qs.filter(isFresh)).concat(shuffle(qs.filter((q) => !isFresh(q)))).map((q) => q.id) };
      })
      .filter((p) => p.qs.length);
    const totalWeight = pools.reduce((n, p) => n + p.d.weight, 0);
    // Largest-remainder allocation so the counts add up exactly.
    pools.forEach((p) => { p.exact = (count * p.d.weight) / totalWeight; p.n = Math.floor(p.exact); });
    let left = count - pools.reduce((n, p) => n + p.n, 0);
    [...pools].sort((a, b) => (b.exact - b.n) - (a.exact - a.n)).forEach((p) => { if (left > 0) { p.n++; left--; } });
    const picked = pools.flatMap((p) => p.qs.slice(0, p.n));
    // Top up from whatever is left if a domain ran short.
    const spare = shuffle(pools.flatMap((p) => p.qs.slice(p.n)));
    return shuffle(picked.concat(spare.slice(0, Math.max(0, count - picked.length))));
  }

  function selectionLabel() {
    const set = store.settings;
    const doms = subject.domains.filter((d) => set.domains.includes(d.id));
    const partial = doms.some((d) => d.topics.some((t) => set.offTopics.includes(topicKey(d.id, t))));
    if (doms.length === subject.domains.length && !partial) return "All domains";
    if (doms.length === 1) {
      const on = doms[0].topics.filter((t) => !set.offTopics.includes(topicKey(doms[0].id, t)));
      return on.length === 1 ? on[0] : doms[0].name + (partial ? " (some objectives)" : "");
    }
    return doms.length + " domains" + (partial ? " (some objectives)" : "");
  }

  // ---------- Sessions ----------
  // mode: "practice" = endless and adaptive; "review" = a fixed list with feedback; "exam" = timed, scored at end.
  function pushQuestion(s, id) {
    s.ids.push(id);
    s.order.push(shuffle(byId[id].c.map((_, i) => i)));
  }
  function startSession(mode, ids, label, extra) {
    const s = Object.assign({
      v: 2, mode, label, ids: [], order: [], answers: [], index: 0,
      startedAt: Date.now(), timeLimit: 0, finished: false,
      combo: 0, bestCombo: 0, xp: 0, celebrate: false, celebrating: false, showWhy: false
    }, extra || {});
    ids.forEach((id) => pushQuestion(s, id));
    if (mode === "exam") s.timeLimit = ids.length * 60;
    if (mode === "practice") pushQuestion(s, nextPracticeId(s));
    if (!s.ids.length) return;
    store.session = s;
    save();
    go("session");
  }

  function finishSession() {
    const s = store.session;
    if (!s || s.finished) return;
    if (s.mode === "exam") {
      s.ids.forEach((id, i) => {
        const ok = s.answers[i] === byId[id].a;
        const xp = ok ? XP_CORRECT : 0;
        s.xp += xp;
        recordAnswer(id, s.answers[i], xp);
      });
    }
    if (s.mode === "test") recordTest(s);
    s.finished = true;
    s.celebrating = false;
    const total = s.mode === "exam" ? s.ids.length : s.answers.filter(has).length;
    const score = isDrill(s.mode)
      ? s.results.filter((r) => r === true).length
      : s.ids.filter((id, i) => s.answers[i] === byId[id].a).length;
    store.history.push({ at: Date.now(), mode: s.mode, score, total });
    store.history = store.history.slice(-50);
    save();
    go("session");
  }

  // Leaving endless practice: drop the unanswered current question and show the summary.
  function endPractice() {
    const s = store.session;
    if (isDrill(s.mode)) {
      if (!has(s.answers[s.index])) { s.items.pop(); s.order.pop(); }
      if (!s.items.length) {
        currentDrill = s.mode;
        store.session = null;
        save();
        return go("drill");
      }
      s.index = s.items.length - 1;
      return finishSession();
    }
    if (!has(s.answers[s.index])) {
      s.ids.pop();
      s.order.pop();
      s.index = Math.max(0, s.ids.length - 1);
    }
    if (!s.ids.length) {
      store.session = null;
      save();
      return go("home");
    }
    finishSession();
  }

  function choose(orig) {
    const s = store.session;
    const i = s.index;
    if (s.mode === "exam") {
      s.answers[i] = orig;
      save();
      return render();
    }
    if (has(s.answers[i])) return;
    s.answers[i] = orig;
    const q = byId[s.ids[i]];
    const ok = orig === q.a;
    s.combo = ok ? s.combo + 1 : 0;
    s.bestCombo = Math.max(s.bestCombo, s.combo);
    const xp = ok ? XP_CORRECT + (s.combo >= COMBO_BONUS_AT ? COMBO_BONUS : 0) : XP_WRONG;
    s.xp += xp;
    s.lastXp = xp;
    s.showWhy = false;
    if (recordAnswer(q.id, orig, xp).justMet) s.celebrate = true;
    if (!ok && navigator.vibrate) navigator.vibrate(120);
    save();
    render();
    const fb = document.getElementById("feedback");
    if (fb) fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function advance() {
    const s = store.session;
    if (isDrill(s.mode)) {
      nextDrillItem(s);
      s.index++;
      save();
      return go("session");
    }
    if (s.mode === "practice") {
      pushQuestion(s, nextPracticeId(s));
      s.index++;
      save();
      return go("session");
    }
    if (s.index < s.ids.length - 1) {
      s.index++;
      save();
      return go("session");
    }
    finishSession();
  }

  function next() {
    const s = store.session;
    if (s.celebrate) {
      s.celebrate = false;
      s.celebrating = true;
      save();
      return go("session");
    }
    advance();
  }


  // ---------- Drills: subnetting (generated, see subnet.js), ports & IP classes (decks, see drills.js) ----------
  const SN = window.Subnet;
  const DRILLS = {
    subnet: {
      id: "subnet", title: "Subnetting", icon: "🧮", TYPES: SN.TYPES, topic: "1|IPv4 addressing",
      objective: "Networking Concepts > IPv4 addressing (subnetting)",
      blurb: "Endless questions, generated fresh every time, so you can't memorize them. Answers are calculated, and every explanation walks through the method."
    },
    ports: window.Drills.ports,
    classes: window.Drills.classes
  };
  const DRILL_IDS = ["subnet", "ports", "classes"];
  const isDrill = (mode) => DRILL_IDS.includes(mode);
  const drillType = (drill, id) => DRILLS[drill].TYPES.find((t) => t.id === id);
  const canType = (t) => (t.typedOk !== undefined ? t.typedOk : t.typed);
  const drillKey = (drill, cardId, typeId) => drill + ":" + cardId + ":" + typeId;

  // Subnetting: question types you miss come up more often.
  function nextSubnetItem(s) {
    const last2 = s.items.slice(-2).map((x) => x.type).reverse();
    // Fill-in-the-blank sessions leave out the yes/no type.
    const types = s.focusType ? [drillType("subnet", s.focusType)] : SN.TYPES.filter((t) => s.input === "choice" || t.typedOk);
    const weights = types.map((t) => {
      const a = recentAccuracy(store.subnet.types[t.id]);
      let w = 0.15 + 4 * Math.pow(1 - (a ? a.est : 0.5), 2);
      if (!a || a.n < 3) w += 0.6;
      if (types.length > 1 && last2[0] === t.id && last2[1] === t.id) w *= 0.2;
      return w;
    });
    const item = SN.generate(weightedPick(types, weights).id, s.level);
    s.items.push(item);
    s.order.push(shuffle(item.c.map((_, i) => i)));
  }

  // Every card+question-type pair in the current scope (what a deck session can ask).
  function deckPairs(drill, focusType) {
    const deck = DRILLS[drill];
    const cards = deck.cards(store[drill]);
    const pairs = [];
    cards.forEach((card) => deck.TYPES.forEach((t) => {
      if ((focusType && t.id !== focusType) || !t.applies(card)) return;
      pairs.push({ card, t, key: drillKey(drill, card.id, t.id) });
    }));
    return { pairs, cards };
  }
  function deckDueCounts(drill) {
    const today = dayKey();
    let due = 0, fresh = 0;
    deckPairs(drill).pairs.forEach((p) => {
      const r = store.srs[p.key];
      if (!r) fresh++;
      else if (r.due <= today) due++;
    });
    return { due, fresh };
  }

  // Ports & classes: spaced repetition per card+question type. Due reviews (earlier misses first) beat new
  // material, which beats reviewing ahead; weaker question types come up more; nothing repeats in a session.
  function nextDeckItem(s) {
    const st = store[s.mode];
    const { pairs, cards } = deckPairs(s.mode, s.focusType);
    const today = dayKey();
    const asked = new Set(s.items.map((x) => x.key));
    const last = s.items[s.items.length - 1];
    let pool = pairs.filter((p) => !asked.has(p.key));
    if (!pool.length) pool = pairs.filter((p) => !last || p.key !== last.key);
    if (!pool.length) pool = pairs;
    // Facts you got right stay away until their review date, unless nothing new or due is left.
    const freshPairs = pool.filter((p) => { const r = store.srs[p.key]; return !r || r.due <= today; });
    if (freshPairs.length) pool = freshPairs;
    const weights = pool.map((p) => {
      const r = store.srs[p.key];
      const a = recentAccuracy(st.types[p.t.id]);
      let w = !r ? 2 : r.due <= today ? (r.box === 0 ? 6 : 4) : 0.25;
      w *= 0.6 + 2 * (1 - (a ? a.est : 0.5));
      if (s.input === "type" && !p.t.typed) w *= 0.35; // fill-in sessions lean on typed questions
      if (last && last.card === p.card.id) w *= 0.2;
      return w;
    });
    const p = weightedPick(pool, weights);
    const item = Object.assign({ type: p.t.id, name: p.t.name, card: p.card.id, key: p.key, a: 0, parts: null }, p.t.gen(p.card, cards));
    item.typed = p.t.typed && (item.accept || item.acceptNums) ? true : null;
    s.items.push(item);
    s.order.push(shuffle(item.c.map((_, i) => i)));
  }

  function nextDrillItem(s) {
    if (s.mode === "subnet") nextSubnetItem(s);
    else nextDeckItem(s);
  }

  function startDrill(drill, focusType) {
    const st = store[drill];
    const s = {
      v: 2, mode: drill, label: focusType ? drillType(drill, focusType).name : DRILLS[drill].title,
      ids: [], items: [], order: [], answers: [], results: [], index: 0,
      startedAt: Date.now(), finished: false, combo: 0, bestCombo: 0, xp: 0,
      celebrate: false, celebrating: false, showWhy: false,
      focusType: focusType || null, level: st.level, input: st.input
    };
    nextDrillItem(s);
    store.session = s;
    save();
    go("session");
  }

  // Typed answers: number answers (ports, ranges) compare the set of numbers typed, in any separator style;
  // text answers compare after normalizing spaces, commas and similar.
  function typedCorrect(item, answer, drill) {
    if (item.acceptNums) {
      const got = (String(answer).match(/\d+/g) || []).map(Number).sort((a, b) => a - b);
      return item.acceptNums.some((set) => {
        const want = [...set].sort((a, b) => a - b);
        return want.length === got.length && want.every((v, i) => v === got[i]);
      });
    }
    const norm = drill === "subnet" ? SN.normalize : window.Drills.normalize;
    return (item.accept || item.typed).some((t) => norm(t) === norm(answer));
  }

  // `answer` is a choice index (multiple choice) or the typed text.
  function answerDrill(answer) {
    const s = store.session;
    const i = s.index;
    if (has(s.answers[i])) return;
    const item = s.items[i];
    const ok = typeof answer === "number" ? answer === item.a : typedCorrect(item, answer, s.mode);
    s.answers[i] = answer;
    s.results[i] = ok;
    s.combo = ok ? s.combo + 1 : 0;
    s.bestCombo = Math.max(s.bestCombo, s.combo);
    const xp = ok ? XP_CORRECT + (s.combo >= COMBO_BONUS_AT ? COMBO_BONUS : 0) : XP_WRONG;
    s.xp += xp;
    s.lastXp = xp;
    s.showWhy = false;
    const st = store[s.mode];
    st.types[item.type] = pushResult(st.types[item.type], ok);
    if (item.card) {
      st.cards[item.card] = pushResult(st.cards[item.card], ok);
      srsUpdate(item.key, ok);
    }
    // Drill results also feed the matching exam objective's weak-spot score.
    const tk = DRILLS[s.mode].topic;
    store.topics[tk] = pushResult(store.topics[tk], ok);
    if (recordDay(ok, xp)) s.celebrate = true;
    if (!ok && navigator.vibrate) navigator.vibrate(120);
    save();
    render();
    const fb = document.getElementById("feedback");
    if (fb) fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function drillAnswerText(s, i) {
    const a = s.answers[i];
    if (!has(a)) return null;
    return typeof a === "number" ? s.items[i].c[a] : a;
  }

  function askClaudeDrill(i) {
    const s = store.session;
    const item = s.items[i];
    const typed = typeof s.answers[i] === "string";
    openClaude({
      objective: DRILLS[s.mode].objective + " – " + item.name,
      question: item.q,
      choices: typed ? null : s.order[i].map((orig) => item.c[orig]),
      correct: item.c[item.a],
      chosen: drillAnswerText(s, i),
      explanation: item.e
    });
  }

  // ---------- Ask Claude ----------
  // Opens a new claude.ai chat with the question prefilled, so it runs on the user's own Claude plan
  // (no API key or API billing). The prompt is also copied to the clipboard in case the prefill is lost.
  function askClaude(qid, chosen, order) {
    const q = byId[qid];
    const idx = order || q.c.map((_, i) => i);
    openClaude({
      objective: domainName(q.d) + " > " + q.t,
      question: q.q,
      choices: idx.map((orig) => q.c[orig]),
      correct: q.c[q.a],
      chosen: has(chosen) ? q.c[chosen] : null,
      explanation: q.e
    });
  }
  // `chosen` is the text of the user's answer (null if unanswered); `choices` is null for typed answers.
  function openClaude(x) {
    const wrong = x.chosen != null && x.chosen !== x.correct;
    const prompt = [
      "I'm studying for the CompTIA Network+ (N10-009) exam. Help me understand this practice question more deeply.",
      "",
      "Objective: " + x.objective,
      "Question: " + x.question,
      ...(x.choices ? ["Choices:", ...x.choices.map((c, i) => LETTERS[i] + ") " + c)] : []),
      "",
      "Correct answer: " + x.correct,
      x.chosen == null ? "I didn't answer this one." : wrong ? "I answered: " + x.chosen : "I got it right, but I want to understand it better.",
      "My study app's explanation: " + x.explanation,
      "",
      "Please explain why the correct answer is right" + (wrong ? ", where my answer went wrong" : "") +
        (x.choices ? ", briefly why each other choice is wrong," : ", walk through the method step by step,") +
        " and give me a tip to remember this for the exam."
    ].join("\n");
    try { if (navigator.clipboard) navigator.clipboard.writeText(prompt).catch(() => {}); } catch (e) { /* ignore */ }
    window.open("https://claude.ai/new?q=" + encodeURIComponent(prompt), "_blank", "noopener");
  }

  // ---------- Views ----------
  function goalRing(n, goal, size) {
    const r = 15.5, c = 2 * Math.PI * r;
    const p = Math.min(1, n / goal);
    return `
      <svg class="ring" viewBox="0 0 36 36" width="${size}" height="${size}" aria-hidden="true">
        <circle cx="18" cy="18" r="${r}" class="ring-bg"/>
        <circle cx="18" cy="18" r="${r}" class="ring-fg ${p >= 1 ? "done" : ""}" stroke-dasharray="${(p * c).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 18 18)"/>
      </svg>`;
  }

  function weekStrip() {
    const t = dayKey();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const k = addDays(t, -i);
      const [y, m, d] = k.split("-").map(Number);
      const label = new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "narrow" });
      const rec = store.daily[k];
      days.push(`<div class="day ${rec && rec.met ? "met" : ""} ${k === t ? "today" : ""}"><span>${rec && rec.met ? "🔥" : ""}</span><small>${esc(label)}</small></div>`);
    }
    return `<div class="week">${days.join("")}</div>`;
  }

  function viewHome() {
    const set = store.settings;
    const s = store.session;
    const resumable = s && !s.finished;
    const t = today();
    const st = streak();
    const overall = domainProgress(null);
    const missed = missedIds().length;
    const flagged = flaggedIds().length;
    const canPractice = practiceTopics(null).length > 0;
    const poolSize = questions.filter(inPool).length;
    const weak = weakSpots(3);
    const dueReviews = questions.filter((q) => inPool(q) && isDue(q)).length;

    const goalText = t.met
      ? `Done for today. Come back tomorrow to make it ${plural(st + 1, "day")}.`
      : `${plural(set.goal - t.n, "more question")} to ${st ? `keep your ${st}-day streak` : "start a streak"}.`;

    const weakHtml = weak.length
      ? weak.map((x) => `
          <button class="weak" data-focus="${esc(x.tk)}">
            <div class="info">
              <div class="row"><span class="name">${esc(x.t)}</span><span class="spacer"></span><span class="small ${x.a.acc < 0.6 ? "bad-text" : "warn-text"}">${Math.round(x.a.acc * 100)}%</span></div>
              <div class="small muted">${esc(domainName(x.d))} · last ${x.a.n} answers</div>
              <div class="bar thin"><span style="width:${Math.round(x.a.acc * 100)}%;background:${x.a.acc < 0.6 ? "var(--bad)" : "var(--warn)"}"></span></div>
            </div>
            <span class="go">›</span>
          </button>`).join("")
      : `<p class="small muted">Answer a few questions and your weakest objectives will show up here. Practice automatically focuses on them.</p>`;

    const domainRows = subject.domains.map((d) => {
      const p = domainProgress(d.id);
      const on = set.domains.includes(d.id);
      const offCount = d.topics.filter((tp) => set.offTopics.includes(topicKey(d.id, tp))).length;
      const open = expanded.has(d.id);
      const topicRows = open ? d.topics.map((tp) => {
        const tk = topicKey(d.id, tp);
        const pr = progress((q) => q.tk === tk);
        const a = topicAccuracy(tk);
        const checked = on && !set.offTopics.includes(tk);
        return `
          <label class="topic">
            <input type="checkbox" data-topic="${esc(tk)}" ${checked ? "checked" : ""}>
            <div class="info">
              <div class="row"><span>${esc(tp)}</span><span class="spacer"></span><span class="small muted">${pr.mastered}/${pr.total}${a ? " · " + Math.round(a.acc * 100) + "%" : ""}</span></div>
              <div class="bar thin"><span style="width:${pct(pr.mastered, pr.total)}%"></span></div>
            </div>
          </label>`;
      }).join("") : "";
      return `
        <div class="domain-block">
          <div class="domain">
            <label class="domain-main">
              <input type="checkbox" data-domain="${d.id}" ${on ? "checked" : ""}>
              <div class="info">
                <div class="row"><span class="name">${d.id}.0 ${esc(d.name)}</span><span class="spacer"></span><span class="small muted">${d.weight}%</span></div>
                <div class="small muted">${p.mastered}/${p.total} mastered${p.attempts ? " · " + p.accuracy + "% accuracy" : ""}${on && offCount ? ` · ${d.topics.length - offCount}/${d.topics.length} objectives` : ""}</div>
                <div class="bar"><span style="width:${pct(p.mastered, p.total)}%"></span></div>
              </div>
            </label>
            <button class="icon-btn chevron ${open ? "open" : ""}" data-expand="${d.id}" aria-label="${open ? "Hide" : "Show"} objectives" aria-expanded="${open}">›</button>
          </div>
          ${open ? `<div class="topics">${topicRows}</div>` : ""}
        </div>`;
    }).join("");

    return `
      <div class="topbar">
        <div class="title">
          <div class="code">${esc(subject.code)}</div>
          <h1>${esc(subject.name)}</h1>
        </div>
        <div class="pill ${t.met ? "lit" : ""}" title="Day streak">🔥 ${st}</div>
        <div class="pill" title="Total XP">⚡ ${store.xp}</div>
      </div>

      ${resumable ? `
      <div class="card stack resume">
        <div><h2>Resume ${{ exam: "exam", review: "review", practice: "practice", test: "mini test", subnet: "subnetting", ports: "ports", classes: "IP classes" }[s.mode]}</h2>
        <div class="small muted">${esc(s.label)} · ${s.mode === "practice" || isDrill(s.mode) ? plural(s.answers.filter(has).length, "question") + " answered" : `question ${s.index + 1} of ${s.ids.length}`}</div></div>
        <div class="btn-row">
          <button class="btn" data-action="resume">Resume</button>
          <button class="btn secondary" data-action="discard">Discard</button>
        </div>
      </div>` : ""}

      <div class="card goal-card">
        <div class="ring-wrap">${goalRing(t.n, set.goal, 84)}<div class="ring-label"><strong>${Math.min(t.n, set.goal)}</strong><small>/${set.goal}</small></div></div>
        <div class="goal-info">
          <h2>${t.met ? "Daily goal complete! 🎉" : "Daily goal"}</h2>
          <div class="small muted">${goalText}</div>
          ${dueReviews ? `<div class="small due-line">📚 ${plural(dueReviews, "review")} due in practice</div>` : ""}
          ${weekStrip()}
        </div>
      </div>

      <button class="btn big" data-action="practice" ${canPractice ? "" : "disabled"}>${t.n ? "Keep practicing" : "Start practicing"}</button>
      <p class="small muted center hint">Endless practice. Keeps going until you stop, and focuses on what you get wrong.</p>

      <button class="card feature" data-action="learn-open">
        <span class="feature-icon">📖</span>
        <span class="info">
          <strong>Learn by topic</strong>
          <span class="small muted">Read each objective, then pass its mini test · ${passedCount()} of ${allTopics.length} passed</span>
        </span>
        <span class="go">›</span>
      </button>

      <div class="section-title">Memorization drills</div>
      ${DRILL_IDS.map((id) => `
        <button class="card feature" data-drill-open="${id}">
          <span class="feature-icon">${DRILLS[id].icon}</span>
          <span class="info">
            <strong>${esc(DRILLS[id].title)}</strong>
            <span class="small muted">${{ subnet: "Unlimited generated questions with step-by-step answers", ports: "Port numbers, TCP/UDP, what each protocol does", classes: "Classes A–E, private ranges, special addresses" }[id]}${drillSummary(id)}</span>
          </span>
          <span class="go">›</span>
        </button>`).join("")}

      <div class="section-title">Weak spots</div>
      <div class="card">${weakHtml}</div>

      <div class="card summary" style="margin-top:12px">
        <div><div class="num">${overall.seen}<span class="muted small">/${overall.total}</span></div><div class="lbl">Seen</div></div>
        <div><div class="num">${pct(overall.mastered, overall.total)}%</div><div class="lbl">Mastered</div></div>
        <div><div class="num">${overall.attempts ? overall.accuracy + "%" : "–"}</div><div class="lbl">Accuracy</div></div>
      </div>

      <div class="section-title">Domains <span class="normal">· tap › to pick objectives</span></div>
      <div class="card">${domainRows}</div>

      <div class="section-title">Practice exam</div>
      <div class="card stack">
        <div class="segmented">
          ${EXAM_COUNTS.map((n) => `<button data-count="${n}" class="${set.examCount === n ? "on" : ""}">${n} questions</button>`).join("")}
        </div>
        <button class="btn secondary" data-action="exam" ${poolSize ? "" : "disabled"}>Start exam <span class="muted normal">· ${set.examCount} min, weighted like the real exam</span></button>
      </div>

      <div class="section-title">Review</div>
      <div class="btn-row">
        <button class="btn secondary" data-action="missed" ${missed ? "" : "disabled"}>Missed (${missed})</button>
        <button class="btn secondary" data-action="flagged" ${flagged ? "" : "disabled"}>Flagged (${flagged})</button>
      </div>

      ${viewHistory()}

      <div class="section-title">Settings</div>
      <div class="card stack">
        <div>
          <div class="small muted" style="margin-bottom:6px">Daily goal (questions)</div>
          <div class="segmented">
            ${GOALS.map((n) => `<button data-goal="${n}" class="${set.goal === n ? "on" : ""}">${n}</button>`).join("")}
          </div>
        </div>
        <div class="row">
          <span>Dark mode</span><span class="spacer"></span>
          <button class="switch ${getTheme() === "dark" ? "on" : ""}" data-action="theme" role="switch" aria-checked="${getTheme() === "dark"}" aria-label="Dark mode"><span></span></button>
        </div>
        <div class="row small muted"><span>Best streak: ${plural(Math.max(store.bestStreak, st), "day")}</span><span class="spacer"></span><button class="link-btn small" data-action="reset">Reset progress</button></div>
      </div>

      <div class="section-title">Your data</div>
      <div class="card stack">
        <div class="row"><span class="small" id="sync-status">${esc(syncStatusText())}</span><span class="spacer"></span>${sync.available !== false ? `<button class="link-btn small" data-action="sync-now">Sync now</button>` : ""}</div>
        <div class="btn-row">
          <button class="btn secondary" data-action="backup-download">Download backup</button>
          <button class="btn secondary" data-action="backup-restore">Restore backup</button>
        </div>
        <input type="file" id="restore-file" accept="application/json,.json" hidden>
        <p class="small muted">A backup file holds all your progress, streaks and lesson badges. Keep one before big changes, or use it to move to another device.</p>
      </div>`;
  }

  function viewHistory() {
    const h = store.history.slice(-5).reverse();
    if (!h.length) return "";
    return `
      <div class="section-title">Recent sessions</div>
      <div class="card">
        ${h.map((x) => `
          <div class="row small" style="padding:4px 0">
            <span>${new Date(x.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
            <span class="muted">${{ exam: "Exam", review: "Review", test: "Mini test", subnet: "Subnetting", ports: "Ports", classes: "IP classes" }[x.mode] || "Practice"}</span>
            <span class="spacer"></span>
            <strong style="color:${pct(x.score, x.total) >= PASS_PCT ? "var(--good)" : "var(--bad)"}">${pct(x.score, x.total)}%</strong>
            <span class="muted">${x.score}/${x.total}</span>
          </div>`).join("")}
      </div>`;
  }

  function viewQuiz() {
    const s = store.session;
    const i = s.index;
    const qid = s.ids[i];
    const q = byId[qid];
    const chosen = s.answers[i];
    const answered = has(chosen);
    const reveal = s.mode !== "exam" && answered;
    const isLast = i === s.ids.length - 1;

    const choices = s.order[i].map((orig, k) => {
      let cls = "choice";
      if (reveal) {
        if (orig === q.a) cls += " correct";
        else if (orig === chosen) cls += " wrong";
      } else if (orig === chosen) cls += " selected";
      return `<button class="${cls}" data-choice="${orig}" ${reveal ? "disabled" : ""}>
        <span class="letter">${LETTERS[k]}</span><span>${esc(q.c[orig])}</span></button>`;
    }).join("");

    let feedback = "";
    if (reveal) {
      const ok = chosen === q.a;
      const praise = ["Correct!", "Nice!", "Great job!", "You got it!", "Exactly!"];
      feedback = `
        <div class="feedback ${ok ? "good" : "bad"}" id="feedback">
          <div class="row">
            <div class="verdict">${ok ? praise[s.ids.length % praise.length] : "Not quite."}</div>
            <span class="spacer"></span>
            <span class="xp-gain">+${s.lastXp || 0} XP</span>
          </div>
          ${ok
            ? (s.combo >= 3 ? `<p class="small combo-text">🔥 ${s.combo} in a row${s.combo >= COMBO_BONUS_AT ? ` · +${COMBO_BONUS} bonus XP` : ""}</p>` : "")
            : `<p class="small"><strong>Answer:</strong> ${esc(q.c[q.a])}</p>`}
          ${ok && !s.showWhy ? "" : `<p class="small why">${esc(q.e)}</p>`}
          <div class="feedback-actions">
            ${ok && !s.showWhy ? `<button class="link-btn small" data-action="why">Why?</button>` : ""}
            <button class="link-btn small" data-action="ask">Ask Claude ↗</button>
          </div>
          <button class="btn ${ok ? "good-btn" : "bad-btn"}" data-action="next">${(s.mode === "review" || s.mode === "test") && isLast ? "See results" : "Continue"}</button>
        </div>`;
    }

    let top, actions = "";
    if (s.mode === "practice") {
      const t = today();
      const goal = store.settings.goal;
      top = `
        <div class="quiz-top">
          <button class="icon-btn" data-action="quit" aria-label="End practice">✕</button>
          <div class="progress daily ${t.met ? "met" : ""}" title="Today's goal"><span style="width:${Math.min(100, pct(t.n, goal))}%"></span></div>
          <span class="count small">${t.met ? "🔥" : `${t.n}/${goal}`}</span>
          ${s.combo >= 2 ? `<span class="combo">⚡${s.combo}</span>` : ""}
          <button class="icon-btn ${store.flagged[qid] ? "active" : ""}" data-action="flag" aria-label="Flag question">${store.flagged[qid] ? "★" : "☆"}</button>
        </div>`;
    } else {
      top = `
        <div class="quiz-top">
          <button class="icon-btn" data-action="quit" aria-label="Back to home">✕</button>
          <span class="count">${i + 1} / ${s.ids.length}</span>
          <span class="spacer"></span>
          ${s.mode === "exam" ? `<span class="timer" id="timer">${fmtTime(timeLeft())}</span>` : ""}
          <button class="icon-btn ${store.flagged[qid] ? "active" : ""}" data-action="flag" aria-label="Flag question">${store.flagged[qid] ? "★" : "☆"}</button>
        </div>
        <div class="progress"><span style="width:${pct(i + (reveal ? 1 : 0), s.ids.length)}%"></span></div>`;
    }

    if (s.mode === "exam") {
      const answeredCount = s.answers.filter(has).length;
      actions = `
        <div class="footer-actions">
          <div class="btn-row">
            <button class="btn secondary" data-action="prev" ${i === 0 ? "disabled" : ""}>Back</button>
            ${isLast
              ? `<button class="btn" data-action="submit">Submit (${answeredCount}/${s.ids.length})</button>`
              : `<button class="btn" data-action="next">Next</button>`}
          </div>
          ${isLast ? "" : `<div class="center" style="margin-top:12px"><button class="link-btn small" data-action="submit">Submit exam early</button></div>`}
        </div>`;
    }

    return `
      ${top}
      <span class="chip">${esc(domainName(q.d))} · ${esc(q.t)}</span>
      <div class="question">${esc(q.q)}</div>
      <div class="choices">${choices}</div>
      ${feedback}
      ${actions}`;
  }

  function viewCelebrate() {
    const st = streak();
    return `
      <div class="celebrate">
        <div class="flame">🔥</div>
        <h1>${st}-day streak!</h1>
        <p class="muted">You hit today's goal of ${store.settings.goal} questions.${st > 1 && st >= store.bestStreak ? " That's your best streak yet!" : ""}</p>
        <div class="card" style="margin:20px 0">${weekStrip()}</div>
        <div class="stack">
          <button class="btn big" data-action="keep-going">Keep practicing</button>
          <button class="btn secondary" data-action="end">Finish for today</button>
        </div>
      </div>`;
  }

  function viewResults() {
    const s = store.session;
    const answeredIdx = s.ids.map((_, i) => i).filter((i) => s.mode === "exam" || has(s.answers[i]));
    const isRight = (i) => s.answers[i] === byId[s.ids[i]].a;
    const correct = answeredIdx.filter(isRight).length;
    const total = answeredIdx.length;
    const score = pct(correct, total);
    // Questions whose most recent attempt in this session was wrong.
    const lastAttempt = {};
    answeredIdx.forEach((i) => { lastAttempt[s.ids[i]] = i; });
    const wrongIdx = Object.values(lastAttempt).filter((i) => !isRight(i)).sort((a, b) => a - b);

    const perDomain = subject.domains.map((d) => {
      const idx = answeredIdx.filter((i) => byId[s.ids[i]].d === d.id);
      if (!idx.length) return "";
      const c = idx.filter(isRight).length;
      return `
        <div style="padding:6px 0">
          <div class="row small"><span>${esc(d.name)}</span><span class="spacer"></span><strong>${c}/${idx.length}</strong></div>
          <div class="bar"><span style="width:${pct(c, idx.length)}%;background:${pct(c, idx.length) >= PASS_PCT ? "var(--good)" : "var(--bad)"}"></span></div>
        </div>`;
    }).join("");

    const review = wrongIdx.map((i) => {
      const q = byId[s.ids[i]];
      const a = s.answers[i];
      return `
        <div class="review-item">
          <div style="font-weight:600">${esc(q.q)}</div>
          <div class="ans bad">Your answer: ${has(a) ? esc(q.c[a]) : "<em>no answer</em>"}</div>
          <div class="ans good">Correct: ${esc(q.c[q.a])}</div>
          <p class="small muted" style="margin-top:4px">${esc(q.e)}</p>
          <button class="link-btn small" data-ask="${i}">Ask Claude ↗</button>
        </div>`;
    }).join("");

    const test = s.mode === "test" ? testHeader(s) : null;
    const header = test ? test.header : s.mode === "exam"
      ? `
      <div class="card score-ring">
        <div class="pct ${score >= PASS_PCT ? "pass" : "fail"}">${score}%</div>
        <div style="margin-top:8px;font-weight:600">${correct} of ${total} correct</div>
        <div class="small muted">${score >= PASS_PCT ? "At or above the ~80% target. Nice work!" : "Aim for ~80% to be exam-ready."} · Time used ${fmtTime((Math.min(Date.now(), s.startedAt + s.timeLimit * 1000) - s.startedAt) / 1000)} · +${s.xp} XP</div>
      </div>`
      : `
      <div class="card score-ring">
        <h2>${s.mode === "practice" ? "Session complete" : "Review complete"}</h2>
        <div class="stats-grid">
          <div><div class="num">${total}</div><div class="lbl">Questions</div></div>
          <div><div class="num ${score >= PASS_PCT ? "good-text" : ""}">${score}%</div><div class="lbl">Accuracy</div></div>
          <div><div class="num">+${s.xp}</div><div class="lbl">XP</div></div>
          <div><div class="num">${s.bestCombo}</div><div class="lbl">Best combo</div></div>
        </div>
        <div class="small muted">${today().met ? `🔥 Daily goal complete · ${streak()}-day streak` : `${store.settings.goal - today().n} more today to hit your goal`}</div>
      </div>`;

    return `
      ${header}
      ${test ? "" : `<div class="section-title">By domain</div>
      <div class="card">${perDomain}</div>`}

      <div class="stack" style="margin-top:20px">
        ${test ? test.buttons : `
        ${wrongIdx.length ? `<button class="btn" data-action="retry-wrong">Review the ${plural(wrongIdx.length, "question")} I missed</button>` : ""}
        <button class="btn secondary" data-action="home">Back to home</button>`}
      </div>

      ${wrongIdx.length ? `<div class="section-title">Missed</div><div class="card">${review}</div>` : ""}`;
  }


  // ---------- Drill views ----------
  const accColor = (p) => (p == null ? "var(--border)" : p >= 80 ? "var(--good)" : p >= 60 ? "var(--warn)" : "var(--bad)");
  function cardLabel(drill, c) {
    if (drill === "ports") return `${c.name} · ${c.ports.join("/")}`;
    return c.kind === "class" ? `Class ${c.id}` : c.name;
  }

  function drillSummary(drill) {
    let c = 0, n = 0;
    Object.values(store[drill].types).forEach((r) => { for (const ch of r.r) { n++; if (ch === "1") c++; } });
    const parts = [];
    if (drill !== "subnet") {
      const { due } = deckDueCounts(drill);
      if (due) parts.push(`${due} due for review`);
    }
    if (n) parts.push(`recent accuracy ${pct(c, n)}%`);
    return parts.length ? " · " + parts.join(" · ") : "";
  }

  function drillReference(drill) {
    if (drill === "subnet") {
      const sheet = SN.cheatSheet().map((r) => `<tr><td>/${r.p}</td><td>${r.mask}</td><td>${r.block}</td><td>${r.hosts}</td></tr>`).join("");
      return `
        <details class="sheet">
          <summary>Show the subnetting cheat sheet</summary>
          <ul class="small tips">
            <li><strong>Block size</strong> = 256 − the mask value in the interesting octet (the last octet with network bits).</li>
            <li><strong>Usable hosts</strong> = 2<sup>host bits</sup> − 2.</li>
            <li><strong>Subnets</strong> created by borrowing <em>b</em> bits = 2<sup>b</sup>.</li>
            <li><strong>Wildcard mask</strong> = 255 − each mask octet.</li>
            <li>Mask octet values: 128, 192, 224, 240, 248, 252, 254, 255 (1–8 bits).</li>
            <li>Interesting octet: /9–/16 → 2nd, /17–/24 → 3rd, /25–/30 → 4th. On an exact octet boundary (/8, /16, /24) just keep those octets and zero the rest.</li>
          </ul>
          <div class="table-wrap">
            <table class="small">
              <thead><tr><th>CIDR</th><th>Mask</th><th>Block</th><th>Hosts</th></tr></thead>
              <tbody>${sheet}</tbody>
            </table>
          </div>
        </details>`;
    }
    if (drill === "ports") {
      const deck = DRILLS.ports;
      const rows = deck.rows(deck.cards(store.ports)).map((r) => `<tr><td class="mono">${r.port}</td><td><strong>${esc(r.name)}</strong></td><td>${r.tx}</td><td class="wrap">${esc(r.use)}</td></tr>`).join("");
      return `
        <details class="sheet">
          <summary>Show the ports table</summary>
          <div class="table-wrap">
            <table class="small ref">
              <thead><tr><th>Port</th><th>Protocol</th><th>Transport</th><th>What it does</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </details>`;
    }
    const deck = DRILLS.classes;
    const cls = deck.classRows().map((c) => `<tr><td><strong>${c.id}</strong></td><td>${c.range[0]}–${c.range[1]}</td><td class="mono">${c.bits}</td><td>${c.mask ? "/" + c.prefix : "–"}</td><td class="wrap">${esc(c.use)}</td></tr>`).join("");
    const priv = deck.classRows().filter((c) => c.priv).map((c) => `<li>Class ${c.id}: <span class="mono">${c.privCidr}</span> (${c.priv})</li>`).join("");
    const special = deck.specialRows().map((c) => `<li><span class="mono">${c.block}</span>: ${esc(c.use)}</li>`).join("");
    return `
      <details class="sheet">
        <summary>Show the address class table</summary>
        <div class="table-wrap">
          <table class="small ref">
            <thead><tr><th>Class</th><th>1st octet</th><th>Bits</th><th>Mask</th><th>Used for</th></tr></thead>
            <tbody>${cls}</tbody>
          </table>
        </div>
        <p class="small" style="margin-top:12px"><strong>Private (RFC 1918) ranges</strong></p>
        <ul class="small tips">${priv}</ul>
        <p class="small"><strong>Special addresses</strong></p>
        <ul class="small tips">${special}</ul>
      </details>`;
  }

  function viewDrillHub(drill) {
    const d = DRILLS[drill];
    const st = store[drill];
    const t = today();
    const typeRows = d.TYPES.map((tp) => {
      const a = recentAccuracy(st.types[tp.id]);
      const accPct = a ? Math.round(a.acc * 100) : null;
      return `
        <button class="weak" data-drill-focus="${tp.id}">
          <div class="info">
            <div class="row"><span class="name">${esc(tp.name)}</span>${canType(tp) ? "" : `<span class="tag">choice</span>`}<span class="spacer"></span><span class="small muted">${accPct == null ? "not tried" : accPct + "%"}</span></div>
            <div class="bar thin"><span style="width:${accPct || 0}%;background:${accColor(accPct)}"></span></div>
          </div>
          <span class="go">›</span>
        </button>`;
    }).join("");

    let settings = "";
    if (drill === "subnet") {
      settings = `
        <div>
          <div class="small muted" style="margin-bottom:6px">Difficulty</div>
          <div class="segmented">
            ${Object.entries(SN.LEVELS).map(([k, lv]) => `<button data-level="${k}" class="${st.level === k ? "on" : ""}">${lv.label}<br><small class="muted">${lv.note}</small></button>`).join("")}
          </div>
        </div>`;
    } else if (drill === "ports") {
      const core = d.CARDS.filter((p) => p.core).length;
      settings = `
        <div>
          <div class="small muted" style="margin-bottom:6px">Which ports</div>
          <div class="segmented">
            <button data-scope="core" class="${st.scope === "core" ? "on" : ""}">Exam objectives<br><small class="muted">${core} protocols</small></button>
            <button data-scope="all" class="${st.scope === "all" ? "on" : ""}">+ Other common<br><small class="muted">${d.CARDS.length} protocols</small></button>
          </div>
        </div>`;
    }

    let progressCard = "";
    if (drill !== "subnet") {
      const { due, fresh } = deckDueCounts(drill);
      const weak = d.cards(st)
        .map((c) => ({ c, a: recentAccuracy(st.cards[c.id]) }))
        .filter((x) => x.a && x.a.acc < 0.8)
        .sort((a, b) => a.a.est - b.a.est)
        .slice(0, 5);
      progressCard = `
        <div class="card stack" style="margin-top:12px">
          <div class="row"><span>📚 <strong>${due}</strong> due for review</span><span class="spacer"></span><span class="small muted">${fresh} not started yet</span></div>
          ${weak.length ? `<div class="small muted">Needs work: ${weak.map((x) => `<span class="pill-sm">${esc(cardLabel(drill, x.c))} · ${Math.round(x.a.acc * 100)}%</span>`).join(" ")}</div>` : ""}
        </div>`;
    }

    return `
      <div class="topbar">
        <button class="icon-btn back" data-action="home-screen" aria-label="Back to home">‹</button>
        <div class="title"><h1>${esc(d.title)}</h1></div>
        <div class="pill ${t.met ? "lit" : ""}" title="Day streak">🔥 ${streak()}</div>
        <div class="pill" title="Total XP">⚡ ${store.xp}</div>
      </div>

      <div class="card stack">
        <p class="small muted">${esc(d.blurb)} Counts toward your daily goal.</p>
        ${settings}
        <div>
          <div class="small muted" style="margin-bottom:6px">Answer style</div>
          <div class="segmented">
            <button data-input="type" class="${st.input === "type" ? "on" : ""}">Fill in the blank</button>
            <button data-input="choice" class="${st.input === "choice" ? "on" : ""}">Multiple choice</button>
          </div>
        </div>
      </div>
      ${progressCard}

      <button class="btn big" data-action="drill-start">Start</button>
      <p class="small muted center hint">${drill === "subnet" ? "Mixes all question types and focuses on the ones you miss." : "Spaced repetition: reviews come back after 1, 3, 7, 16, 35, then 90 days. Misses come back next session."}</p>

      <div class="section-title">Question types <span class="normal">· tap one to drill it</span></div>
      <div class="card">${typeRows}</div>

      <div class="section-title">Reference</div>
      <div class="card">${drillReference(drill)}</div>`;
  }

  function viewDrillQuiz() {
    const s = store.session;
    const d = DRILLS[s.mode];
    const i = s.index;
    const item = s.items[i];
    const answer = s.answers[i];
    const answered = has(answer);
    const ok = s.results[i];
    const typedMode = s.input === "type" && item.typed;
    const t = today();
    const goal = store.settings.goal;
    const numeric = !!item.acceptNums || /^[\d./ –-]+$/.test(item.c[0]);
    const kb = numeric ? `inputmode="decimal"` : `inputmode="text"`;

    let body;
    if (typedMode) {
      const kind = item.c[0].includes(".") ? "e.g. 192.168.1.64" : numeric ? "e.g. 26" : "Type your answer";
      const inputs = item.parts
        ? item.parts.map((label, k) => `<label class="small muted">${esc(label)}<input id="${k ? "typed-2" : "typed"}" class="typed-input mono" ${kb} autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="${s.mode === "subnet" ? (k ? "e.g. 192.168.1.94" : "e.g. 192.168.1.65") : ""}"></label>`).join("")
        : `<input id="typed" class="typed-input mono" ${kb} autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="${kind}" aria-label="Your answer">`;
      body = answered
        ? `<div class="typed-result ${ok ? "good" : "bad"}"><span class="small muted">You answered</span><div class="mono">${esc(answer) || "<em>blank</em>"}</div></div>`
        : `<form class="typed-form" id="typed-form" autocomplete="off">
             ${inputs}
             <button class="btn" type="submit">Check</button>
           </form>`;
    } else {
      body = `<div class="choices">${s.order[i].map((orig, k) => {
        let cls = "choice";
        if (answered) {
          if (orig === item.a) cls += " correct";
          else if (orig === answer) cls += " wrong";
        }
        return `<button class="${cls}" data-drill-choice="${orig}" ${answered ? "disabled" : ""}>
          <span class="letter">${LETTERS[k]}</span><span${s.mode === "subnet" ? ` class="mono"` : ""}>${esc(item.c[orig])}</span></button>`;
      }).join("")}</div>`;
    }

    let feedback = "";
    if (answered) {
      const praise = ["Correct!", "Nice!", "Great job!", "You got it!", "Exactly!"];
      feedback = `
        <div class="feedback ${ok ? "good" : "bad"}" id="feedback">
          <div class="row">
            <div class="verdict">${ok ? praise[s.items.length % praise.length] : "Not quite."}</div>
            <span class="spacer"></span>
            <span class="xp-gain">+${s.lastXp || 0} XP</span>
          </div>
          ${ok
            ? (s.combo >= 3 ? `<p class="small combo-text">🔥 ${s.combo} in a row${s.combo >= COMBO_BONUS_AT ? ` · +${COMBO_BONUS} bonus XP` : ""}</p>` : "")
            : `<p class="small"><strong>Answer:</strong> <span class="mono">${esc(item.c[item.a])}</span></p>`}
          ${ok && !s.showWhy ? "" : `<p class="small why">${esc(item.e)}</p>`}
          <div class="feedback-actions">
            ${ok && !s.showWhy ? `<button class="link-btn small" data-action="why">${s.mode === "subnet" ? "Show the steps" : "Why?"}</button>` : ""}
            <button class="link-btn small" data-action="ask">Ask Claude ↗</button>
          </div>
          <button class="btn ${ok ? "good-btn" : "bad-btn"}" data-action="next">Continue</button>
        </div>`;
    }

    return `
      <div class="quiz-top">
        <button class="icon-btn" data-action="quit" aria-label="End ${esc(d.title)} practice">✕</button>
        <div class="progress daily ${t.met ? "met" : ""}" title="Today's goal"><span style="width:${Math.min(100, pct(t.n, goal))}%"></span></div>
        <span class="count small">${t.met ? "🔥" : `${t.n}/${goal}`}</span>
        ${s.combo >= 2 ? `<span class="combo">⚡${s.combo}</span>` : ""}
      </div>
      <span class="chip">${esc(d.title)} · ${esc(item.name)}</span>
      <div class="question">${esc(item.q)}</div>
      ${body}
      ${feedback}`;
  }

  function viewDrillResults() {
    const s = store.session;
    const d = DRILLS[s.mode];
    const done = s.results.map((r, i) => i).filter((i) => has(s.results[i]));
    const correct = done.filter((i) => s.results[i]).length;
    const score = pct(correct, done.length);
    const byType = d.TYPES.map((tp) => {
      const idx = done.filter((i) => s.items[i].type === tp.id);
      if (!idx.length) return "";
      const c = idx.filter((i) => s.results[i]).length;
      return `
        <div style="padding:6px 0">
          <div class="row small"><span>${esc(tp.name)}</span><span class="spacer"></span><strong>${c}/${idx.length}</strong></div>
          <div class="bar"><span style="width:${pct(c, idx.length)}%;background:${pct(c, idx.length) >= PASS_PCT ? "var(--good)" : "var(--bad)"}"></span></div>
        </div>`;
    }).join("");
    const missed = done.filter((i) => !s.results[i]).map((i) => {
      const item = s.items[i];
      return `
        <div class="review-item">
          <div style="font-weight:600">${esc(item.q)}</div>
          <div class="ans bad">Your answer: <span class="mono">${esc(drillAnswerText(s, i) || "")}</span></div>
          <div class="ans good">Correct: <span class="mono">${esc(item.c[item.a])}</span></div>
          <p class="small muted" style="margin-top:4px">${esc(item.e)}</p>
          <button class="link-btn small" data-ask-drill="${i}">Ask Claude ↗</button>
        </div>`;
    }).join("");
    return `
      <div class="card score-ring">
        <h2>${esc(d.title)} session complete</h2>
        <div class="stats-grid">
          <div><div class="num">${done.length}</div><div class="lbl">Questions</div></div>
          <div><div class="num ${score >= PASS_PCT ? "good-text" : ""}">${score}%</div><div class="lbl">Accuracy</div></div>
          <div><div class="num">+${s.xp}</div><div class="lbl">XP</div></div>
          <div><div class="num">${s.bestCombo}</div><div class="lbl">Best combo</div></div>
        </div>
        <div class="small muted">${today().met ? `🔥 Daily goal complete · ${streak()}-day streak` : `${store.settings.goal - today().n} more today to hit your goal`}</div>
      </div>
      <div class="section-title">By question type</div>
      <div class="card">${byType}</div>
      <div class="stack" style="margin-top:20px">
        <button class="btn" data-action="drill-again">Practice again</button>
        <button class="btn secondary" data-action="drill-home">Back to ${esc(d.title.toLowerCase())}</button>
      </div>
      ${missed ? `<div class="section-title">Missed</div><div class="card">${missed}</div>` : ""}`;
  }

  // ---------- Learn: lessons per objective + section-by-section mini tests ----------
  const LESSONS = (window.LESSONS || {})[subject.id] || {};
  const LESSON_VIDEOS = (window.LESSON_VIDEOS || {})[subject.id] || {};
  const PER_SECTION = 2; // mini test questions drawn from each lesson section
  const FALLBACK_SIZE = 10; // for a lesson without section quizzes
  const passMark = (n) => Math.ceil(n * 0.8); // 80% to pass
  const PASS_BONUS_XP = 50;
  const learnRec = (tk) => store.learn[tk] || { read: false, best: 0, passed: false, attempts: 0 };
  const bestText = (r) => `${r.best}/${r.of || 10}`; // records from before section tests were out of 10
  const lessonSections = (tk) => [...(LESSONS[tk] || "").matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
  const sectionQs = (tk, sec) => (questionsByTopic[tk] || []).filter((q) => q.s === sec);
  function testSize(tk) {
    const n = lessonSections(tk).reduce((sum, sec) => sum + Math.min(PER_SECTION, sectionQs(tk, sec).length), 0);
    return n || Math.min(FALLBACK_SIZE, (questionsByTopic[tk] || []).length);
  }
  const passedCount = () => allTopics.filter((x) => learnRec(x.tk).passed).length;

  // Minimal Markdown for lessons: ## and ### headings, paragraphs, - / 1. lists (one level of nesting),
  // | tables |, > callouts, **bold**, *italic*, `code`. Text is escaped before formatting.
  function inlineMd(text) {
    // Code spans become placeholders first, so **bold `code` text** works and * inside code stays literal.
    const codes = [];
    return esc(text).replace(/`([^`]*)`/g, (m, c) => `\u0000${codes.push(c) - 1}\u0000`)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, "$1<em>$2</em>")
      .replace(/\u0000(\d+)\u0000/g, (m, n) => `<code>${codes[n]}</code>`);
  }
  function renderMd(src) {
    const lines = src.split("\n");
    const out = [];
    let para = [];
    const flush = () => { if (para.length) { out.push(`<p>${inlineMd(para.join(" "))}</p>`); para = []; } };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^# /.test(line)) continue; // the title is shown separately
      if (!line.trim()) { flush(); continue; }
      if (/^## /.test(line)) { flush(); out.push(`<h3>${inlineMd(line.slice(3))}</h3>`); continue; }
      if (/^### /.test(line)) { flush(); out.push(`<h4>${inlineMd(line.slice(4))}</h4>`); continue; }
      if (/^> /.test(line)) { flush(); out.push(`<div class="callout">${inlineMd(line.slice(2))}</div>`); continue; }
      if (/^\|/.test(line)) {
        flush();
        const rows = [];
        while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
        i--;
        const cells = (r) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
        const body = rows.filter((r, k) => k !== 1 || !/^\|[\s:|-]+\|$/.test(r));
        out.push(`<div class="table-wrap"><table class="lesson-table"><thead><tr>${cells(body[0]).map((c) => `<th>${inlineMd(c)}</th>`).join("")}</tr></thead><tbody>${
          body.slice(1).map((r) => `<tr>${cells(r).map((c) => `<td>${inlineMd(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
        continue;
      }
      const li = line.match(/^(\s*)(- |\d+\. )(.*)$/);
      if (li) {
        flush();
        const ordered = /\d/.test(li[2]);
        const items = [];
        while (i < lines.length) {
          const m = lines[i].match(/^(\s*)(- |\d+\. )(.*)$/);
          if (!m) break;
          if (m[1].length >= 2 && items.length) items[items.length - 1].sub.push(m[3]);
          else items.push({ text: m[3], sub: [] });
          i++;
        }
        i--;
        const tag = ordered ? "ol" : "ul";
        out.push(`<${tag}>${items.map((it) => `<li>${inlineMd(it.text)}${it.sub.length ? `<ul>${it.sub.map((x) => `<li>${inlineMd(x)}</li>`).join("")}</ul>` : ""}</li>`).join("")}</${tag}>`);
        continue;
      }
      para.push(line.trim());
    }
    flush();
    return out.join("");
  }

  // Mini test: PER_SECTION questions from every lesson section, in lesson order, so passing means you
  // understood the whole topic. Within a section, questions you haven't seen (or that are due) come first,
  // so retakes get new questions.
  const freshFirst = (qs) => shuffle(qs.filter(isFresh)).concat(shuffle(qs.filter((q) => !isFresh(q))));
  function startTest(tk) {
    let ids = lessonSections(tk).flatMap((sec) => freshFirst(sectionQs(tk, sec)).slice(0, PER_SECTION).map((q) => q.id));
    if (!ids.length) ids = freshFirst(questionsByTopic[tk] || []).slice(0, FALLBACK_SIZE).map((q) => q.id);
    startSession("test", ids, tk.split("|")[1] + " test", { topic: tk });
  }

  // Called when a test session finishes.
  function recordTest(s) {
    const score = s.ids.filter((id, i) => s.answers[i] === byId[id].a).length;
    const of = s.ids.length;
    const rec = learnRec(s.topic);
    rec.attempts++;
    if (score / of >= rec.best / (rec.of || 10)) { rec.best = score; rec.of = of; }
    rec.last = score;
    s.score = score;
    s.of = of;
    s.passed = score >= passMark(of);
    s.firstPass = s.passed && !rec.passed;
    if (s.firstPass) {
      rec.passed = true;
      rec.passedAt = dayKey();
      store.xp += PASS_BONUS_XP;
      s.xp += PASS_BONUS_XP;
    }
    store.learn[s.topic] = rec;
  }

  function topicStatus(tk) {
    const r = learnRec(tk);
    if (r.passed) return { icon: "✓", cls: "passed", text: `Passed · best ${bestText(r)}` };
    if (r.attempts) return { icon: "↻", cls: "tried", text: `Best ${bestText(r)} · need 80%` };
    if (r.read) return { icon: "📖", cls: "read", text: "Read · test not taken" };
    return { icon: "○", cls: "", text: "Not started" };
  }

  function viewLearnHub() {
    const total = allTopics.length;
    const passed = passedCount();
    const domains = subject.domains.map((d) => {
      const done = d.topics.filter((t) => learnRec(topicKey(d.id, t)).passed).length;
      const rows = d.topics.map((t) => {
        const tk = topicKey(d.id, t);
        const st = topicStatus(tk);
        return `
          <button class="weak lesson-row" data-lesson="${esc(tk)}">
            <span class="status ${st.cls}">${st.icon}</span>
            <div class="info">
              <div class="name">${esc(t)}</div>
              <div class="small muted">${st.text}</div>
            </div>
            <span class="go">›</span>
          </button>`;
      }).join("");
      return `
        <div class="section-title">${d.id}.0 ${esc(d.name)} <span class="normal">· ${done}/${d.topics.length} passed${done === d.topics.length ? " 🏅" : ""}</span></div>
        <div class="card">${rows}</div>`;
    }).join("");
    return `
      <div class="topbar">
        <button class="icon-btn back" data-action="home-screen" aria-label="Back to home">‹</button>
        <div class="title"><h1>Learn</h1></div>
        <div class="pill ${today().met ? "lit" : ""}" title="Day streak">🔥 ${streak()}</div>
        <div class="pill" title="Total XP">⚡ ${store.xp}</div>
      </div>
      <div class="card stack">
        <div class="row"><strong>${passed} of ${total} topics passed</strong><span class="spacer"></span><span class="small muted">${pct(passed, total)}%</span></div>
        <div class="bar"><span style="width:${pct(passed, total)}%;background:var(--flame)"></span></div>
        <p class="small muted">Read a topic, then take its mini test: ${PER_SECTION} questions from every section of the lesson, so it checks the whole topic. Score 80% or better to pass and earn the badge (+${PASS_BONUS_XP} XP the first time). Pass every topic in a domain to earn the domain's 🏅.</p>
      </div>
      ${domains}`;
  }

  function viewLesson(tk) {
    const [d, t] = [Number(tk.split("|")[0]), tk.split("|").slice(1).join("|")];
    const st = topicStatus(tk);
    const r = learnRec(tk);
    const idx = allTopics.findIndex((x) => x.tk === tk);
    const prev = allTopics[idx - 1], nextT = allTopics[idx + 1];
    const n = testSize(tk);
    const sections = lessonSections(tk).filter((sec) => sectionQs(tk, sec).length);
    return `
      <div class="topbar">
        <button class="icon-btn back" data-action="learn-open" aria-label="Back to Learn">‹</button>
        <div class="title"><div class="code">${d}.0 ${esc(domainName(d))}</div><h1>${esc(t)}</h1></div>
      </div>
      ${r.passed ? `<div class="card pass-banner">✓ <strong>Passed</strong> · best ${bestText(r)}${r.passedAt ? ` · ${new Date(r.passedAt + "T12:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}</div>` : ""}
      ${(LESSON_VIDEOS[tk] || []).length ? `<div class="card stack videos">
        <div class="row"><strong>🎬 Watch: Professor Messer</strong><span class="spacer"></span><span class="small muted">free videos</span></div>
        ${LESSON_VIDEOS[tk].map((v) => `<a class="video-link" href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">▶ ${esc(v.title)} <span class="muted">↗</span></a>`).join("")}
      </div>` : ""}
      <article class="card lesson">${renderMd(LESSONS[tk] || "*No lesson yet.*")}</article>
      <div class="card stack test-cta">
        <div>
          <h2>${r.passed ? "Retake the mini test" : "Ready? Take the mini test"}</h2>
          <p class="small muted">${n} questions, ${sections.length ? `${PER_SECTION} from each of the ${sections.length} sections above` : `on ${esc(t)}`}. Score ${passMark(n)}/${n} to pass.${r.attempts && !r.passed ? ` Your best so far: ${bestText(r)}.` : ""}</p>
        </div>
        <button class="btn big" data-test="${esc(tk)}">Start mini test</button>
        <button class="btn secondary" data-focus="${esc(tk)}">Practice this topic (endless)</button>
      </div>
      <div class="row lesson-nav">
        ${prev ? `<button class="link-btn small" data-lesson="${esc(prev.tk)}">‹ ${esc(prev.t)}</button>` : ""}
        <span class="spacer"></span>
        ${nextT ? `<button class="link-btn small" data-lesson="${esc(nextT.tk)}">${esc(nextT.t)} ›</button>` : ""}
      </div>`;
  }

  function testHeader(s) {
    const idx = allTopics.findIndex((x) => x.tk === s.topic);
    const nextT = allTopics.slice(idx + 1).find((x) => !learnRec(x.tk).passed) || allTopics.find((x) => !learnRec(x.tk).passed);
    // Sections with a missed question, in lesson order, so you know exactly what to re-read.
    const weakSecs = [];
    s.ids.forEach((id, i) => { const q = byId[id]; if (q.s && s.answers[i] !== q.a && !weakSecs.includes(q.s)) weakSecs.push(q.s); });
    return {
      header: `
        <div class="card score-ring test-result ${s.passed ? "passed" : ""}">
          <div class="badge-icon">${s.passed ? "🏅" : "📖"}</div>
          <h2>${s.passed ? (s.firstPass ? "Topic passed!" : "Passed again!") : "Not yet"}</h2>
          <div class="pct ${s.passed ? "pass" : "fail"}">${s.score}/${s.of || s.ids.length}</div>
          <div class="small muted">${esc(s.topic.split("|")[1])} · ${s.passed
            ? (s.firstPass ? `Badge earned · +${PASS_BONUS_XP} XP bonus · ${passedCount()} of ${allTopics.length} topics passed` : `Best score ${bestText(learnRec(s.topic))}`)
            : `You need ${passMark(s.of || s.ids.length)}/${s.of || s.ids.length}. Review the lesson and the missed questions below, then try again.`}</div>
        </div>
        ${weakSecs.length ? `<div class="card stack">
          <strong>${s.passed ? "Worth a second look" : "Review these sections"}</strong>
          <ul class="weak-secs">${weakSecs.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        </div>` : ""}`,
      buttons: `
        ${s.passed && nextT ? `<button class="btn" data-lesson="${esc(nextT.tk)}">Next topic: ${esc(nextT.t)}</button>` : ""}
        <button class="btn ${s.passed ? "secondary" : ""}" data-test="${esc(s.topic)}">${s.passed ? "Retake test" : "Try again"}</button>
        <button class="btn secondary" data-lesson="${esc(s.topic)}">Back to the lesson</button>`
    };
  }

  // ---------- Timer ----------
  let timerHandle = null;
  function timeLeft() {
    const s = store.session;
    return s.timeLimit - (Date.now() - s.startedAt) / 1000;
  }
  function syncTimer() {
    const s = store.session;
    const running = screen === "session" && s && !s.finished && s.mode === "exam";
    if (running && !timerHandle) {
      timerHandle = setInterval(() => {
        const left = timeLeft();
        const el = document.getElementById("timer");
        if (el) el.textContent = fmtTime(left);
        if (left <= 0) finishSession();
      }, 1000);
    } else if (!running && timerHandle) {
      clearInterval(timerHandle);
      timerHandle = null;
    }
  }

  // ---------- Render ----------
  let screen = "home"; // "home" | "drill" | "session"
  let currentDrill = "subnet"; // which drill hub is open
  let currentLesson = null;    // topicKey of the open lesson
  const expanded = new Set(); // domain ids whose objective list is open
  function render() {
    const s = store.session;
    if (screen === "session" && s) {
      if (s.mode === "exam" && !s.finished && timeLeft() <= 0) return finishSession();
      if (isDrill(s.mode)) app.innerHTML = s.finished ? viewDrillResults() : s.celebrating ? viewCelebrate() : viewDrillQuiz();
      else app.innerHTML = s.finished ? viewResults() : s.celebrating ? viewCelebrate() : viewQuiz();
      const input = document.getElementById("typed");
      if (input) input.focus();
    } else if (screen === "learn") {
      app.innerHTML = viewLearnHub();
    } else if (screen === "lesson") {
      app.innerHTML = viewLesson(currentLesson);
    } else if (screen === "drill") {
      app.innerHTML = viewDrillHub(currentDrill);
    } else {
      screen = "home";
      app.innerHTML = viewHome();
    }
    syncTimer();
  }
  function go(to) {
    screen = to;
    render();
    window.scrollTo(0, 0);
  }

  // ---------- Events ----------
  app.addEventListener("click", (e) => {
    const el = e.target.closest("button");
    if (!el) return;
    const set = store.settings;
    const s = store.session;

    if (el.dataset.count) { set.examCount = Number(el.dataset.count); save(); return render(); }
    if (el.dataset.level) { store.subnet.level = el.dataset.level; save(); return render(); }
    if (el.dataset.scope) { store.ports.scope = el.dataset.scope; save(); return render(); }
    if (el.dataset.input) { store[currentDrill].input = el.dataset.input; store[currentDrill].picked = true; save(); return render(); }
    if (el.dataset.lesson) {
      currentLesson = el.dataset.lesson;
      if (store.session && store.session.finished) store.session = null;
      store.learn[currentLesson] = Object.assign(learnRec(currentLesson), { read: true });
      save();
      return go("lesson");
    }
    if (el.dataset.test) return startTest(el.dataset.test);
    if (el.dataset.drillOpen) { currentDrill = el.dataset.drillOpen; return go("drill"); }
    if (el.dataset.drillFocus) return startDrill(currentDrill, el.dataset.drillFocus);
    if (el.dataset.drillChoice !== undefined) return answerDrill(Number(el.dataset.drillChoice));
    if (el.dataset.askDrill) return askClaudeDrill(Number(el.dataset.askDrill));
    if (el.dataset.goal) { set.goal = Number(el.dataset.goal); save(); return render(); }
    if (el.dataset.choice !== undefined) return choose(Number(el.dataset.choice));
    if (el.dataset.expand) {
      const id = Number(el.dataset.expand);
      if (expanded.has(id)) expanded.delete(id); else expanded.add(id);
      return render();
    }
    if (el.dataset.focus) {
      const tk = el.dataset.focus;
      return startSession("practice", [], tk.split("|")[1], { focus: tk });
    }
    if (el.dataset.ask) {
      const i = Number(el.dataset.ask);
      return askClaude(s.ids[i], s.answers[i], s.order[i]);
    }

    switch (el.dataset.action) {
      case "home-screen":
        return go("home");
      case "learn-open":
        if (store.session && store.session.finished) store.session = null;
        return go("learn");
      case "drill-start":
        return startDrill(currentDrill, null);
      case "drill-again":
        return startDrill(s.mode, s.focusType);
      case "drill-home":
        currentDrill = s.mode;
        store.session = null;
        save();
        return go("drill");
      case "practice":
        return startSession("practice", [], selectionLabel());
      case "exam":
        return startSession("exam", pickExam(set.examCount), selectionLabel());
      case "missed":
        return startSession("review", shuffle(missedIds()), "Missed questions");
      case "flagged":
        return startSession("review", shuffle(flaggedIds()), "Flagged questions");
      case "retry-wrong": {
        const last = {};
        s.ids.forEach((id, i) => { if (s.mode === "exam" || has(s.answers[i])) last[id] = i; });
        const wrong = Object.keys(last).filter((id) => s.answers[last[id]] !== byId[id].a);
        return startSession("review", shuffle(wrong), "Retry missed");
      }
      case "resume":
        return go("session");
      case "discard":
        store.session = null;
        save();
        return render();
      case "quit":
        if (s.mode === "test") {
          // Leaving a mini test abandons it (nothing is recorded as an attempt) and returns to the lesson.
          currentLesson = s.topic;
          store.session = null;
          save();
          return go("lesson");
        }
        return s.mode === "practice" || isDrill(s.mode) ? endPractice() : go("home");
      case "home":
        store.session = null;
        save();
        return go("home");
      case "next":
        return next();
      case "prev":
        s.index = Math.max(0, s.index - 1);
        save();
        return go("session");
      case "submit": {
        const unanswered = s.ids.length - s.answers.filter(has).length;
        if (unanswered && !confirm(plural(unanswered, "question") + " unanswered. Submit anyway?")) return;
        return finishSession();
      }
      case "flag": {
        const qid = s.ids[s.index];
        if (store.flagged[qid]) delete store.flagged[qid];
        else store.flagged[qid] = true;
        save();
        return render();
      }
      case "why":
        s.showWhy = true;
        save();
        return render();
      case "ask":
        if (isDrill(s.mode)) return askClaudeDrill(s.index);
        return askClaude(s.ids[s.index], s.answers[s.index], s.order[s.index]);
      case "keep-going":
        s.celebrating = false;
        return advance();
      case "end":
        s.celebrating = false;
        return s.mode === "practice" || isDrill(s.mode) ? endPractice() : finishSession();
      case "theme": {
        const theme = getTheme() === "dark" ? "light" : "dark";
        try { localStorage.setItem(THEME_KEY, theme); } catch (err) { /* ignore */ }
        applyTheme(theme);
        return render();
      }
      case "sync-now":
        syncNow();
        return;
      case "backup-download":
        return downloadBackup();
      case "backup-restore":
        return document.getElementById("restore-file").click();
      case "reset":
        if (confirm("Reset all progress, streaks, XP, flags, and history for " + subject.name + "?")) {
          store = defaults();
          save();
          render();
        }
        return;
    }
  });

  app.addEventListener("submit", (e) => {
    if (e.target.id !== "typed-form") return;
    e.preventDefault();
    const first = document.getElementById("typed").value.trim();
    const second = document.getElementById("typed-2");
    // Two-part answers (host range) are compared in the same "first – last" form the generator uses.
    answerDrill(second ? first + " – " + second.value.trim() : first);
  });

  app.addEventListener("change", (e) => {
    if (e.target.id === "restore-file") {
      const file = e.target.files && e.target.files[0];
      e.target.value = "";
      if (file) restoreBackup(file);
      return;
    }
    const set = store.settings;
    const { domain, topic } = e.target.dataset;
    if (domain) {
      const id = Number(domain);
      if (e.target.checked) {
        set.domains = [...new Set([...set.domains, id])].sort((a, b) => a - b);
        // Re-checking a domain turns all of its objectives back on.
        set.offTopics = set.offTopics.filter((k) => !k.startsWith(id + "|"));
      } else {
        set.domains = set.domains.filter((x) => x !== id);
      }
    } else if (topic) {
      const id = Number(topic.split("|")[0]);
      const d = subject.domains.find((x) => x.id === id);
      if (e.target.checked) {
        if (!set.domains.includes(id)) {
          // Domain was off: turn it on with only this objective selected.
          set.domains = [...set.domains, id].sort((a, b) => a - b);
          set.offTopics = set.offTopics.filter((k) => !k.startsWith(id + "|")).concat(d.topics.map((t) => topicKey(id, t)));
        }
        set.offTopics = set.offTopics.filter((k) => k !== topic);
      } else {
        set.offTopics = [...new Set([...set.offTopics, topic])];
        // Unchecking the last objective turns the whole domain off.
        if (d.topics.every((t) => set.offTopics.includes(topicKey(id, t)))) {
          set.domains = set.domains.filter((x) => x !== id);
          set.offTopics = set.offTopics.filter((k) => !k.startsWith(id + "|"));
        }
      }
    } else return;
    save();
    render();
  });

  // Keyboard shortcuts: 1-4 / A-D to answer, Enter / → to continue.
  document.addEventListener("keydown", (e) => {
    const s = store.session;
    if (screen !== "session" || !s || s.finished || s.celebrating || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.tagName === "INPUT") return; // typing an answer
    const key = e.key.toUpperCase();
    if (isDrill(s.mode)) {
      const answered = has(s.answers[s.index]);
      let k = "1234".indexOf(key);
      if (k < 0) k = "ABCD".indexOf(key);
      if (!answered && !(s.input === "type" && s.items[s.index].typed) && k >= 0 && k < s.order[s.index].length) return answerDrill(s.order[s.index][k]);
      if (answered && (key === "ENTER" || key === "ARROWRIGHT")) next();
      return;
    }
    const order = s.order[s.index];
    let i = "1234".indexOf(key);
    if (i < 0) i = "ABCD".indexOf(key);
    if (i >= 0 && i < order.length) return choose(order[i]);
    if (key === "ENTER" || key === "ARROWRIGHT") {
      if (s.mode === "exam" ? s.index < s.ids.length - 1 : has(s.answers[s.index])) next();
    }
  });

  // Refresh the home screen when the app comes back to the foreground (e.g. the next day).
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      if (screen === "home") render();
      syncNow(); // pick up progress made on another device
    }
  });
  window.addEventListener("online", () => syncNow());

  render();
  if (location.protocol !== "file:") syncNow();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    // When an updated service worker takes over, reload once so the new version shows right away.
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (hadController && !reloaded) { reloaded = true; location.reload(); }
    });
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).catch(() => {});
  }
})();
