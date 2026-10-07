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
  const RECENT = 20;         // how many recent answers per objective decide how well you know it
  const RETRY_GAP = [3, 6];  // a missed question comes back 3–6 questions later
  const AVOID_REPEAT = 40;   // otherwise, don't repeat a question within this many in one session

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
    if (!saved.topics) backfillTopics(s);
    // Discard a saved session from an older app version or a changed question bank.
    if (s.session && (s.session.v !== 2 || s.session.ids.some((id) => !byId[id]))) s.session = null;
    return s;
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
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      all[subject.id] = store;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) { /* storage unavailable (private mode); progress just won't persist */ }
  }
  let store = load();

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
  function topicAccuracy(tk) {
    const ts = store.topics[tk];
    if (!ts || !ts.r.length) return null;
    let c = 0;
    for (const ch of ts.r) if (ch === "1") c++;
    return { acc: c / ts.r.length, n: ts.r.length, est: (c + 1) / (ts.r.length + 2) };
  }
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

    const ts = store.topics[q.tk] || { c: 0, w: 0, r: "" };
    if (ok) ts.c++; else ts.w++;
    ts.r = (ts.r + (ok ? "1" : "0")).slice(-RECENT);
    store.topics[q.tk] = ts;

    const key = dayKey();
    const day = store.daily[key] || (store.daily[key] = { n: 0, c: 0, xp: 0, met: false });
    day.n++;
    if (ok) day.c++;
    day.xp += xp;
    store.xp += xp;
    let justMet = false;
    if (!day.met && day.n >= store.settings.goal) {
      day.met = true;
      justMet = true;
      store.bestStreak = Math.max(store.bestStreak, streak());
    }
    return { ok, justMet };
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

  // Within an objective: missed questions first, then unseen, then the least mastered.
  function questionRank(q) {
    const s = store.stats[q.id];
    if (!s) return 1;
    if (s.last === 0) return 0;
    return 2 + s.c / (s.c + s.w + 1);
  }

  function nextPracticeId(s) {
    const pos = s.ids.length;
    const prev = s.ids[pos - 1];
    const due = s.retry.findIndex((r) => r.due <= pos && r.id !== prev);
    if (due >= 0) return s.retry.splice(due, 1)[0].id;

    const topics = practiceTopics(s);
    const lastTopics = s.ids.slice(-2).reverse().map((id) => byId[id].tk);
    const tk = weightedPick(topics, topics.map((t) => topicWeight(t, lastTopics)));
    const recent = new Set(s.ids.slice(-AVOID_REPEAT));
    let pool = questionsByTopic[tk].filter((q) => !recent.has(q.id));
    if (!pool.length) pool = questionsByTopic[tk].filter((q) => q.id !== prev);
    if (!pool.length) pool = questionsByTopic[tk];
    return pool
      .map((q) => ({ id: q.id, r: questionRank(q) + Math.random() * 0.9 }))
      .sort((a, b) => a.r - b.r)[0].id;
  }

  // Exam: random questions, split across the selected domains by their official exam weights.
  function pickExam(count) {
    const pools = subject.domains
      .map((d) => ({ d, qs: shuffle(questions.filter((q) => q.d === d.id && inPool(q)).map((q) => q.id)) }))
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
      combo: 0, bestCombo: 0, xp: 0, retry: [], celebrate: false, celebrating: false, showWhy: false
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
    s.finished = true;
    s.celebrating = false;
    const total = s.mode === "exam" ? s.ids.length : s.answers.filter(has).length;
    const score = s.ids.filter((id, i) => s.answers[i] === byId[id].a).length;
    store.history.push({ at: Date.now(), mode: s.mode, score, total });
    store.history = store.history.slice(-50);
    save();
    go("session");
  }

  // Leaving endless practice: drop the unanswered current question and show the summary.
  function endPractice() {
    const s = store.session;
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
    // Bring a missed question back a few questions later (at most twice per session).
    if (!ok && s.mode === "practice" && s.ids.filter((id) => id === q.id).length < 3) {
      const gap = RETRY_GAP[0] + Math.floor(Math.random() * (RETRY_GAP[1] - RETRY_GAP[0] + 1));
      s.retry.push({ id: q.id, due: s.ids.length + gap });
    }
    if (!ok && navigator.vibrate) navigator.vibrate(120);
    save();
    render();
    const fb = document.getElementById("feedback");
    if (fb) fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function advance() {
    const s = store.session;
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

  // ---------- Ask Claude ----------
  // Opens a new claude.ai chat with the question prefilled, so it runs on the user's own Claude plan
  // (no API key or API billing). The prompt is also copied to the clipboard in case the prefill is lost.
  function askClaude(qid, chosen, order) {
    const q = byId[qid];
    const idx = order || q.c.map((_, i) => i);
    const wrong = has(chosen) && chosen !== q.a;
    const prompt = [
      "I'm studying for the CompTIA Network+ (N10-009) exam. Help me understand this practice question more deeply.",
      "",
      "Objective: " + domainName(q.d) + " > " + q.t,
      "Question: " + q.q,
      "Choices:",
      ...idx.map((orig, i) => LETTERS[i] + ") " + q.c[orig]),
      "",
      "Correct answer: " + q.c[q.a],
      has(chosen) ? (wrong ? "I chose: " + q.c[chosen] : "I got it right, but I want to understand it better.") : "I didn't answer this one.",
      "My study app's explanation: " + q.e,
      "",
      "Please explain why the correct answer is right" + (wrong ? ", why my choice is wrong" : "") +
        ", briefly why each other choice is wrong, and give me a tip to remember this for the exam."
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
        <div><h2>Resume ${s.mode === "exam" ? "exam" : "review"}</h2>
        <div class="small muted">${esc(s.label)} · question ${s.index + 1} of ${s.ids.length}</div></div>
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
          ${weekStrip()}
        </div>
      </div>

      <button class="btn big" data-action="practice" ${canPractice ? "" : "disabled"}>${t.n ? "Keep practicing" : "Start practicing"}</button>
      <p class="small muted center hint">Endless practice. Keeps going until you stop, and focuses on what you get wrong.</p>

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
            <span class="muted">${x.mode === "exam" ? "Exam" : x.mode === "review" ? "Review" : "Practice"}</span>
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
          <button class="btn ${ok ? "good-btn" : "bad-btn"}" data-action="next">${s.mode === "review" && isLast ? "See results" : "Continue"}</button>
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

    const header = s.mode === "exam"
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
      <div class="section-title">By domain</div>
      <div class="card">${perDomain}</div>

      <div class="stack" style="margin-top:20px">
        ${wrongIdx.length ? `<button class="btn" data-action="retry-wrong">Review the ${plural(wrongIdx.length, "question")} I missed</button>` : ""}
        <button class="btn secondary" data-action="home">Back to home</button>
      </div>

      ${wrongIdx.length ? `<div class="section-title">Missed</div><div class="card">${review}</div>` : ""}`;
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
  let screen = "home"; // "home" | "session"
  const expanded = new Set(); // domain ids whose objective list is open
  function render() {
    const s = store.session;
    if (screen === "session" && s) {
      if (s.mode === "exam" && !s.finished && timeLeft() <= 0) return finishSession();
      app.innerHTML = s.finished ? viewResults() : s.celebrating ? viewCelebrate() : viewQuiz();
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
        return s.mode === "practice" ? endPractice() : go("home");
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
        return askClaude(s.ids[s.index], s.answers[s.index], s.order[s.index]);
      case "keep-going":
        s.celebrating = false;
        return advance();
      case "end":
        s.celebrating = false;
        return s.mode === "practice" ? endPractice() : finishSession();
      case "theme": {
        const theme = getTheme() === "dark" ? "light" : "dark";
        try { localStorage.setItem(THEME_KEY, theme); } catch (err) { /* ignore */ }
        applyTheme(theme);
        return render();
      }
      case "reset":
        if (confirm("Reset all progress, streaks, XP, flags, and history for " + subject.name + "?")) {
          store = defaults();
          save();
          render();
        }
        return;
    }
  });

  app.addEventListener("change", (e) => {
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
    const key = e.key.toUpperCase();
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
    if (document.visibilityState === "visible" && screen === "home") render();
  });

  render();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
