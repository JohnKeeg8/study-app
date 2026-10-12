#!/usr/bin/env node
// Validates the question sources and lessons, and bundles them into data/<subject>.js and
// data/<subject>-lessons.js.
// Usage: node tools/build.js
//
// Question files (questions/<subject>/*.js) export either
//   { domain, topic, questions: [[question, [correct, wrong, wrong, wrong], explanation], ...] }
// (the correct choice is always written first; the app shuffles choices), or
//   { items: [{ d, t, q, c, a, e }, ...] }.
//
// Lessons (lessons/<subject>/<name>.md) start with "# <objective name>" and split into "## Section" headings.
// Each lesson has a quiz file <name>.quiz.js exporting { "<Section heading>": [[question, choices, explanation], ...] }
// with at least MIN_PER_SECTION questions for every section. Mini tests draw from these, so everything a
// test asks is taught in the lesson. Lesson questions also join the practice bank.
"use strict";
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const srcRoot = path.join(root, "questions");
const MIN_PER_SECTION = 3;
let failed = false;
const fail = (msg) => { failed = true; console.error("ERROR: " + msg); };

for (const subjectId of fs.readdirSync(srcRoot)) {
  const dir = path.join(srcRoot, subjectId);
  const meta = require(path.join(dir, "_meta.js"));
  const topicsByDomain = Object.fromEntries(meta.domains.map((d) => [d.id, d.topics]));
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".js") && f !== "_meta.js").sort();

  const questions = [];
  for (const file of files) {
    const mod = require(path.join(dir, file));
    if (mod.items) {
      mod.items.forEach((x) => questions.push({ ...x, file }));
    } else {
      mod.questions.forEach((x, i) => {
        if (!Array.isArray(x) || x.length !== 3) return fail(`${file} #${i + 1}: expected [question, choices, explanation]`);
        questions.push({ d: mod.domain, t: mod.topic, q: x[0], c: x[1], a: 0, e: x[2], file });
      });
    }
  }

  // ---- lessons and their section quizzes
  const lessonDir = path.join(root, "lessons", subjectId);
  const lessons = {};
  const lessonQs = [];
  const videos = {};
  if (fs.existsSync(lessonDir)) {
    for (const file of fs.readdirSync(lessonDir).filter((f) => f.endsWith(".md")).sort()) {
      const where = `lessons/${subjectId}/${file}`;
      const text = fs.readFileSync(path.join(lessonDir, file), "utf8").replace(/\r\n/g, "\n").trim();
      const title = (text.match(/^# (.+)$/m) || [])[1];
      const domain = meta.domains.find((d) => d.topics.includes(title));
      if (!domain) { fail(`${where}: title "${title}" doesn't match any topic in _meta.js`); continue; }
      const key = domain.id + "|" + title;
      if (lessons[key]) fail(`${where}: second lesson for "${title}"`);
      lessons[key] = text;

      const sections = [...text.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
      if (new Set(sections).size !== sections.length) fail(`${where}: duplicate section headings`);
      const quizFile = path.join(lessonDir, file.replace(/\.md$/, ".quiz.js"));
      if (!fs.existsSync(quizFile)) { fail(`${where}: missing quiz file ${path.basename(quizFile)}`); continue; }
      const quiz = require(quizFile);
      for (const s of Object.keys(quiz)) if (!sections.includes(s)) fail(`${path.basename(quizFile)}: section "${s}" isn't a "## " heading in the lesson`);
      for (const s of sections) {
        const qs = quiz[s] || [];
        if (qs.length < MIN_PER_SECTION) fail(`${path.basename(quizFile)}: section "${s}" has ${qs.length} questions (needs ${MIN_PER_SECTION}+)`);
        qs.forEach((x, i) => {
          if (!Array.isArray(x) || x.length !== 3) return fail(`${path.basename(quizFile)} "${s}" #${i + 1}: expected [question, choices, explanation]`);
          lessonQs.push({ d: domain.id, t: title, s, q: x[0], c: x[1], a: 0, e: x[2], file: path.basename(quizFile) });
        });
      }
    }
    // Optional companion videos: lessons/<subject>/_videos.js exports { "<topic>": [{ title, url }, ...] }.
    const videosFile = path.join(lessonDir, "_videos.js");
    if (fs.existsSync(videosFile)) {
      for (const [t, list] of Object.entries(require(videosFile))) {
        const d = meta.domains.find((x) => x.topics.includes(t));
        if (!d) { fail(`_videos.js: "${t}" isn't a topic in _meta.js`); continue; }
        list.forEach((v, i) => {
          if (!v || typeof v.title !== "string" || !/^https:\/\/\S+$/.test(String(v.url))) fail(`_videos.js: "${t}" #${i + 1} needs a title and an https url`);
        });
        videos[d.id + "|" + t] = list;
      }
    }
    for (const d of meta.domains) for (const t of d.topics) {
      if (!lessons[d.id + "|" + t]) fail(`no lesson for ${d.id} "${t}" (add lessons/${subjectId}/<file>.md starting with "# ${t}")`);
    }
  }

  // ---- merge lesson questions into the bank. A lesson question identical to one already in the bank for the
  // same objective tags that bank question with the section instead of adding a second copy.
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const bankByText = new Map(questions.map((q) => [norm(String(q.q)), q]));
  for (const lq of lessonQs) {
    const twin = bankByText.get(norm(String(lq.q)));
    if (twin && !twin.s && twin.d === lq.d && twin.t === lq.t) { twin.s = lq.s; continue; }
    questions.push(lq);
  }

  // ---- validation
  const seen = new Map();
  for (const q of questions) {
    const where = `${q.file}: "${String(q.q).slice(0, 70)}"`;
    if (!topicsByDomain[q.d]) fail(`${where} unknown domain ${q.d}`);
    else if (!topicsByDomain[q.d].includes(q.t)) fail(`${where} topic "${q.t}" is not listed for domain ${q.d} in _meta.js`);
    if (typeof q.q !== "string" || q.q.length < 10) fail(`${where} question text missing`);
    if (typeof q.e !== "string" || q.e.length < 10) fail(`${where} explanation missing`);
    if (!Array.isArray(q.c) || q.c.length < 3 || q.c.length > 5) fail(`${where} needs 3–5 choices`);
    else {
      if (q.c.some((c) => typeof c !== "string" || !c.trim())) fail(`${where} has an empty choice`);
      if (new Set(q.c.map((c) => c.toLowerCase().replace(/\s+/g, " ").trim())).size !== q.c.length) fail(`${where} has duplicate choices`);
      if (q.c.some((c) => /\b(all|none) of the above\b/i.test(c))) fail(`${where} uses "all/none of the above" (choices are shuffled)`);
    }
    if (!(q.a >= 0 && q.a < q.c.length)) fail(`${where} answer index out of range`);
    const key = norm(q.q);
    if (seen.has(key)) fail(`${where} duplicates a question in ${seen.get(key)}`);
    seen.set(key, q.file);
  }

  // ---- report
  const total = questions.length;
  const fromLessons = questions.filter((q) => q.s).length;
  console.log(`${meta.name} (${meta.code}): ${total} questions (${fromLessons} from lesson quizzes)`);
  for (const d of meta.domains) {
    const inD = questions.filter((q) => q.d === d.id);
    console.log(`  ${d.id}. ${d.name}: ${inD.length} (${Math.round((inD.length / total) * 100)}% of bank, exam weight ${d.weight}%)`);
    for (const t of d.topics) {
      const lessonQs = inD.filter((q) => q.t === t && q.s);
      const secs = new Set(lessonQs.map((q) => q.s)).size;
      console.log(`       ${String(inD.filter((q) => q.t === t).length).padStart(4)}  ${t}  (lesson: ${secs} sections, ${lessonQs.length} questions, test ${secs * 2})`);
    }
  }
  console.log(`Lessons: ${Object.keys(lessons).length} of ${meta.domains.reduce((n, d) => n + d.topics.length, 0)} objectives`);

  if (failed) { console.error("\nBuild failed; data files not written."); process.exit(1); }

  const out = {
    id: meta.id, name: meta.name, code: meta.code, domains: meta.domains,
    questions: questions.map(({ d, t, s, q, c, a, e }) => (s ? { d, t, s, q, c, a, e } : { d, t, q, c, a, e }))
  };
  const js = "// GENERATED by tools/build.js from questions/" + subjectId + "/ and lessons/" + subjectId + "/. Do not edit by hand.\n" +
    "window.SUBJECTS = window.SUBJECTS || [];\nwindow.SUBJECTS.push(" + JSON.stringify(out) + ");\n";
  fs.writeFileSync(path.join(root, "data", subjectId + ".js"), js);
  console.log(`Wrote data/${subjectId}.js (${Math.round(js.length / 1024)} KB)`);
  if (Object.keys(lessons).length) {
    fs.writeFileSync(path.join(root, "data", subjectId + "-lessons.js"),
      "// GENERATED by tools/build.js from lessons/" + subjectId + "/. Do not edit by hand.\n" +
      "window.LESSONS = window.LESSONS || {};\nwindow.LESSONS[" + JSON.stringify(subjectId) + "] = " + JSON.stringify(lessons) + ";\n" +
      "window.LESSON_VIDEOS = window.LESSON_VIDEOS || {};\nwindow.LESSON_VIDEOS[" + JSON.stringify(subjectId) + "] = " + JSON.stringify(videos) + ";\n");
    console.log(`Wrote data/${subjectId}-lessons.js`);
  }
}

// Stamp index.html's script and stylesheet links with a hash of each file (app.js?v=1a2b3c), so a phone that
// cached an old copy has to download the new one after an update.
if (!failed) {
  const crypto = require("crypto");
  const indexPath = path.join(root, "index.html");
  const html = fs.readFileSync(indexPath, "utf8");
  const stamped = html.replace(/(<(?:script|link)\b[^>]*?\b(?:src|href)=")([^"?:]+\.(?:js|css))(?:\?v=[^"]*)?"/g, (m, pre, file) => {
    const p = path.join(root, file);
    if (!fs.existsSync(p)) return m;
    return `${pre}${file}?v=${crypto.createHash("sha1").update(fs.readFileSync(p)).digest("hex").slice(0, 8)}"`;
  });
  if (stamped !== html) { fs.writeFileSync(indexPath, stamped); console.log("Updated version stamps in index.html"); }
}
