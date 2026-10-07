(function () {
  "use strict";

  const STORAGE_KEY = "studyapp.v1";
  const PASS_PCT = 80; // Network+ passes at 720/900; ~80% is a good practice target.
  const COUNTS = [10, 25, 50, 90];
  const LETTERS = "ABCDEFGH";

  const subject = window.SUBJECTS[0];
  const app = document.getElementById("app");

  // ---------- Question ids ----------
  function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }
  const questions = subject.questions.map((q) => ({ ...q, id: q.d + "-" + hash(q.q) }));
  const byId = Object.fromEntries(questions.map((q) => [q.id, q]));
  const domainName = (id) => (subject.domains.find((d) => d.id === id) || {}).name || "";

  // ---------- Storage ----------
  function defaults() {
    return {
      stats: {},   // qid -> { c: correct count, w: wrong count, last: 1|0 }
      flagged: {}, // qid -> true
      settings: { domains: subject.domains.map((d) => d.id), offTopics: [], count: 10 },
      session: null,
      history: []  // { at, mode, score, total }
    };
  }
  function load() {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return Object.assign(defaults(), all[subject.id] || {});
    } catch (e) {
      return defaults();
    }
  }
  function save() {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      all[subject.id] = store;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) { /* storage unavailable (private mode); progress just won't persist */ }
  }
  let store = load();
  store.settings.offTopics = store.settings.offTopics || []; // added after v1 settings were saved
  // Discard a saved session if the question bank changed underneath it.
  if (store.session && store.session.ids.some((id) => !byId[id])) store.session = null;

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
  function fmtTime(sec) {
    sec = Math.max(0, Math.round(sec));
    const m = Math.floor(sec / 60), s = sec % 60;
    return m + ":" + String(s).padStart(2, "0");
  }
  function pct(n, d) { return d ? Math.round((n / d) * 100) : 0; }

  const topicKey = (d, t) => d + "|" + t;
  const inPool = (q) => store.settings.domains.includes(q.d) && !store.settings.offTopics.includes(topicKey(q.d, q.t));

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

  // Practice: weakest first — missed, then unseen, then least-mastered; random within each group.
  function pickPractice(count) {
    const pool = questions.filter(inPool);
    const rank = (q) => {
      const s = store.stats[q.id];
      if (!s) return 1;
      if (s.last === 0) return 0;
      return 2 + s.c / (s.c + s.w + 1);
    };
    return pool
      .map((q) => ({ id: q.id, r: rank(q) + Math.random() * 0.9 }))
      .sort((a, b) => a.r - b.r)
      .slice(0, count)
      .map((x) => x.id);
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
    return picked.concat(spare.slice(0, Math.max(0, count - picked.length)));
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
  function startSession(mode, ids, label) {
    if (!ids.length) return;
    ids = shuffle(ids);
    store.session = {
      mode,                // "practice" | "exam"
      label,
      ids,
      order: Object.fromEntries(ids.map((id) => [id, shuffle(byId[id].c.map((_, i) => i))])),
      answers: {},         // qid -> original choice index
      index: 0,
      startedAt: Date.now(),
      timeLimit: mode === "exam" ? ids.length * 60 : 0,
      finished: false
    };
    save();
    render();
  }

  function recordAnswer(qid, choice) {
    const q = byId[qid];
    const ok = choice === q.a;
    const s = store.stats[qid] || { c: 0, w: 0, last: 0 };
    if (ok) s.c++; else s.w++;
    s.last = ok ? 1 : 0;
    store.stats[qid] = s;
  }

  function finishSession() {
    const s = store.session;
    if (!s || s.finished) return;
    if (s.mode === "exam") s.ids.forEach((id) => recordAnswer(id, s.answers[id]));
    s.finished = true;
    const score = s.ids.filter((id) => s.answers[id] === byId[id].a).length;
    store.history.push({ at: Date.now(), mode: s.mode, score, total: s.ids.length });
    store.history = store.history.slice(-50);
    save();
    render();
  }

  // ---------- Views ----------
  function viewHome() {
    const overall = domainProgress(null);
    const set = store.settings;
    const missed = missedIds().length;
    const flagged = flaggedIds().length;
    const s = store.session;
    const resumable = s && !s.finished;

    const domainRows = subject.domains.map((d) => {
      const p = domainProgress(d.id);
      const on = set.domains.includes(d.id);
      const offCount = d.topics.filter((t) => set.offTopics.includes(topicKey(d.id, t))).length;
      const open = expanded.has(d.id);
      const topicRows = open ? d.topics.map((t) => {
        const tp = progress((q) => q.d === d.id && q.t === t);
        const checked = on && !set.offTopics.includes(topicKey(d.id, t));
        return `
          <label class="topic">
            <input type="checkbox" data-topic="${esc(topicKey(d.id, t))}" ${checked ? "checked" : ""}>
            <div class="info">
              <div class="row"><span>${esc(t)}</span><span class="spacer"></span><span class="small muted">${tp.mastered}/${tp.total}</span></div>
              <div class="bar thin"><span style="width:${pct(tp.mastered, tp.total)}%"></span></div>
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

    const poolSize = questions.filter(inPool).length;

    return `
      <div class="header">
        <div>
          <div class="code">${esc(subject.code)}</div>
          <h1>${esc(subject.name)}</h1>
        </div>
      </div>

      ${resumable ? `
      <div class="card stack" style="border-color:var(--accent)">
        <div class="row">
          <div><h2>Resume ${s.mode === "exam" ? "exam" : "quiz"}</h2>
          <div class="small muted">${esc(s.label)} · question ${s.index + 1} of ${s.ids.length}</div></div>
        </div>
        <div class="btn-row">
          <button class="btn" data-action="resume">Resume</button>
          <button class="btn secondary" data-action="discard">Discard</button>
        </div>
      </div>` : ""}

      <div class="card summary" style="margin-top:${resumable ? 12 : 0}px">
        <div><div class="num">${overall.seen}<span class="muted small">/${overall.total}</span></div><div class="lbl">Seen</div></div>
        <div><div class="num">${pct(overall.mastered, overall.total)}%</div><div class="lbl">Mastered</div></div>
        <div><div class="num">${overall.attempts ? overall.accuracy + "%" : "–"}</div><div class="lbl">Accuracy</div></div>
      </div>

      <div class="section-title">Domains <span style="text-transform:none;font-weight:400">· tap › to pick objectives</span></div>
      <div class="card">${domainRows}</div>

      <div class="section-title">Questions per session</div>
      <div class="segmented">
        ${COUNTS.map((n) => `<button data-count="${n}" class="${set.count === n ? "on" : ""}">${n}</button>`).join("")}
      </div>

      <div class="stack" style="margin-top:20px">
        <button class="btn" data-action="practice" ${poolSize ? "" : "disabled"}>Practice <span style="opacity:.75;font-weight:400">· instant feedback</span></button>
        <button class="btn secondary" data-action="exam" ${poolSize ? "" : "disabled"}>Exam mode <span class="muted" style="font-weight:400">· timed, scored at end</span></button>
        <div class="btn-row">
          <button class="btn secondary" data-action="missed" ${missed ? "" : "disabled"}>Missed (${missed})</button>
          <button class="btn secondary" data-action="flagged" ${flagged ? "" : "disabled"}>Flagged (${flagged})</button>
        </div>
      </div>

      ${viewHistory()}

      <div style="text-align:center;margin-top:24px">
        <button class="link-btn small" data-action="reset">Reset progress</button>
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
            <span class="muted">${x.mode === "exam" ? "Exam" : "Practice"}</span>
            <span class="spacer"></span>
            <strong style="color:${pct(x.score, x.total) >= PASS_PCT ? "var(--good)" : "var(--bad)"}">${pct(x.score, x.total)}%</strong>
            <span class="muted">${x.score}/${x.total}</span>
          </div>`).join("")}
      </div>`;
  }

  function viewQuiz() {
    const s = store.session;
    const qid = s.ids[s.index];
    const q = byId[qid];
    const chosen = s.answers[qid];
    const answered = chosen !== undefined;
    const reveal = s.mode === "practice" && answered;
    const isLast = s.index === s.ids.length - 1;

    const choices = s.order[qid].map((orig, i) => {
      let cls = "choice";
      if (reveal) {
        if (orig === q.a) cls += " correct";
        else if (orig === chosen) cls += " wrong";
      } else if (orig === chosen) cls += " selected";
      return `<button class="${cls}" data-choice="${orig}" ${reveal ? "disabled" : ""}>
        <span class="letter">${LETTERS[i]}</span><span>${esc(q.c[orig])}</span></button>`;
    }).join("");

    let explain = "";
    if (reveal) {
      const ok = chosen === q.a;
      explain = `
        <div class="card explain ${ok ? "good" : "bad"}">
          <div class="verdict">${ok ? "Correct!" : "Not quite."}</div>
          ${ok ? "" : `<p class="small" style="margin-bottom:6px">Answer: <strong>${esc(q.c[q.a])}</strong></p>`}
          <p class="small">${esc(q.e)}</p>
        </div>`;
    }

    let actions;
    if (s.mode === "practice") {
      actions = reveal
        ? `<button class="btn" data-action="next">${isLast ? "See results" : "Next question"}</button>`
        : "";
    } else {
      const answeredCount = Object.keys(s.answers).length;
      actions = `
        <div class="btn-row">
          <button class="btn secondary" data-action="prev" ${s.index === 0 ? "disabled" : ""}>Back</button>
          ${isLast
            ? `<button class="btn" data-action="submit">Submit (${answeredCount}/${s.ids.length})</button>`
            : `<button class="btn" data-action="next">Next</button>`}
        </div>
        ${isLast ? "" : `<div style="text-align:center;margin-top:12px"><button class="link-btn small" data-action="submit">Submit exam early</button></div>`}`;
    }

    return `
      <div class="quiz-top">
        <button class="icon-btn" data-action="quit" aria-label="Quit to home">✕</button>
        <span class="count">${s.index + 1} / ${s.ids.length}</span>
        <span class="spacer"></span>
        ${s.mode === "exam" ? `<span class="timer" id="timer">${fmtTime(timeLeft())}</span>` : ""}
        <button class="icon-btn ${store.flagged[qid] ? "active" : ""}" data-action="flag" aria-label="Flag question">${store.flagged[qid] ? "★" : "☆"}</button>
      </div>
      <div class="progress"><span style="width:${pct(s.index + (reveal ? 1 : 0), s.ids.length)}%"></span></div>
      <span class="chip">${esc(domainName(q.d))} · ${esc(q.t)}</span>
      <div class="question">${esc(q.q)}</div>
      <div class="choices">${choices}</div>
      ${explain}
      <div class="footer-actions">${actions}</div>`;
  }

  function viewResults() {
    const s = store.session;
    const correct = s.ids.filter((id) => s.answers[id] === byId[id].a);
    const score = pct(correct.length, s.ids.length);
    const wrong = s.ids.filter((id) => s.answers[id] !== byId[id].a);

    const perDomain = subject.domains.map((d) => {
      const ids = s.ids.filter((id) => byId[id].d === d.id);
      if (!ids.length) return "";
      const c = ids.filter((id) => s.answers[id] === byId[id].a).length;
      return `
        <div style="padding:6px 0">
          <div class="row small"><span>${esc(d.name)}</span><span class="spacer"></span><strong>${c}/${ids.length}</strong></div>
          <div class="bar"><span style="width:${pct(c, ids.length)}%;background:${pct(c, ids.length) >= PASS_PCT ? "var(--good)" : "var(--bad)"}"></span></div>
        </div>`;
    }).join("");

    const review = wrong.map((id) => {
      const q = byId[id];
      const a = s.answers[id];
      return `
        <div class="review-item">
          <div style="font-weight:600">${esc(q.q)}</div>
          <div class="ans bad">Your answer: ${a === undefined ? "<em>no answer</em>" : esc(q.c[a])}</div>
          <div class="ans good">Correct: ${esc(q.c[q.a])}</div>
          <p class="small muted" style="margin-top:4px">${esc(q.e)}</p>
        </div>`;
    }).join("");

    return `
      <div class="card score-ring">
        <div class="pct ${score >= PASS_PCT ? "pass" : "fail"}">${score}%</div>
        <div style="margin-top:8px;font-weight:600">${correct.length} of ${s.ids.length} correct</div>
        <div class="small muted">${score >= PASS_PCT ? "At or above the ~80% target. Nice work!" : "Aim for ~80% to be exam-ready."}${s.mode === "exam" ? " · Time used " + fmtTime((Math.min(Date.now(), s.startedAt + s.timeLimit * 1000) - s.startedAt) / 1000) : ""}</div>
      </div>

      <div class="section-title">By domain</div>
      <div class="card">${perDomain}</div>

      <div class="stack" style="margin-top:20px">
        ${wrong.length ? `<button class="btn" data-action="retry-wrong">Practice the ${wrong.length} I missed</button>` : ""}
        <button class="btn secondary" data-action="home">Back to home</button>
      </div>

      ${wrong.length ? `<div class="section-title">Review</div><div class="card">${review}</div>` : ""}`;
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
      app.innerHTML = s.finished ? viewResults() : viewQuiz();
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
  function choose(orig) {
    const s = store.session;
    const qid = s.ids[s.index];
    if (s.mode === "practice") {
      if (s.answers[qid] !== undefined) return;
      s.answers[qid] = orig;
      recordAnswer(qid, orig);
    } else {
      s.answers[qid] = orig;
    }
    save();
    render();
  }

  function next() {
    const s = store.session;
    if (s.index < s.ids.length - 1) {
      s.index++;
      save();
      go("session");
    } else {
      finishSession();
      window.scrollTo(0, 0);
    }
  }

  app.addEventListener("click", (e) => {
    const el = e.target.closest("button");
    if (!el) return;
    const set = store.settings;

    if (el.dataset.count) {
      set.count = Number(el.dataset.count);
      save();
      return render();
    }
    if (el.dataset.choice !== undefined) return choose(Number(el.dataset.choice));
    if (el.dataset.expand) {
      const id = Number(el.dataset.expand);
      if (expanded.has(id)) expanded.delete(id); else expanded.add(id);
      return render();
    }

    const s = store.session;
    switch (el.dataset.action) {
      case "practice":
      case "exam": {
        const ids = el.dataset.action === "exam" ? pickExam(set.count) : pickPractice(set.count);
        startSession(el.dataset.action, ids, selectionLabel());
        return go("session");
      }
      case "missed":
        startSession("practice", missedIds(), "Missed questions");
        return go("session");
      case "flagged":
        startSession("practice", flaggedIds(), "Flagged questions");
        return go("session");
      case "retry-wrong": {
        const wrong = s.ids.filter((id) => s.answers[id] !== byId[id].a);
        startSession("practice", wrong, "Retry missed");
        return go("session");
      }
      case "resume":
        return go("session");
      case "discard":
        store.session = null;
        save();
        return render();
      case "quit":
        return go("home");
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
        const unanswered = s.ids.length - Object.keys(s.answers).length;
        if (unanswered && !confirm(unanswered + " question(s) unanswered. Submit anyway?")) return;
        finishSession();
        return window.scrollTo(0, 0);
      }
      case "flag": {
        const qid = s.ids[s.index];
        if (store.flagged[qid]) delete store.flagged[qid];
        else store.flagged[qid] = true;
        save();
        return render();
      }
      case "reset":
        if (confirm("Reset all progress, flags, and history for " + subject.name + "?")) {
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

  // Keyboard shortcuts: 1-4 / A-D to answer, Enter / → for next.
  document.addEventListener("keydown", (e) => {
    const s = store.session;
    if (screen !== "session" || !s || s.finished || e.metaKey || e.ctrlKey || e.altKey) return;
    const key = e.key.toUpperCase();
    const order = s.order[s.ids[s.index]];
    let i = "1234".indexOf(key);
    if (i < 0) i = "ABCD".indexOf(key);
    if (i >= 0 && i < order.length) return choose(order[i]);
    if (key === "ENTER" || key === "ARROWRIGHT") {
      if (s.mode === "exam" ? s.index < s.ids.length - 1 : s.answers[s.ids[s.index]] !== undefined) next();
    }
  });

  render();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
