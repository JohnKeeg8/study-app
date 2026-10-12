# Study App

A phone-friendly practice-question app. It currently covers **CompTIA Network+ (N10-009)** with about 1,560 questions mapped to every exam objective. Every question has an explanation.

It's a Progressive Web App (plain HTML/CSS/JS; nothing to install to run it). Once it's hosted you can add it to your home screen, and it works offline.

## Features

- **Learn by topic**: an in-depth study lesson for each of the 35 exam objectives (explanations, comparison tables, common mix-ups, key terms, exam tips), followed by a mini test with 2 questions from every section of the lesson, so passing means you understood the whole topic. Score 80% to pass and earn the topic's badge (+50 XP the first time); pass every topic in a domain for the domain 🏅. Retakes pull questions you haven't seen first, and results list the sections to re-read.
- **Daily goal and streak**: answer 20 questions a day (adjustable: 10/20/30/50) to keep your 🔥 streak going. A ring and a 7-day strip show progress, with a celebration when you hit the goal.
- **XP and combos**: +10 XP per correct answer, +5 bonus per answer once you're 5 in a row.
- **Endless adaptive practice**: keeps going until you tap ✕. Each objective gets a weakness score from your last 20 answers on it, and objectives you struggle with come up far more often. New objectives get explored, and mastered ones still return occasionally for review. Questions are never repeated within a session, and a question you got right isn't shown again until its spaced-repetition review date (unless you've covered everything in your selected scope). Questions you missed come back in your next session.
- **Instant feedback**: wrong answers show the correct answer and why. Correct answers have a "Why?" link.
- **Ask Claude ↗**: opens a new chat on claude.ai with the question, your answer, and the explanation already filled in, for a deeper explanation. It uses your own Claude account, so there are no API keys or extra charges. The prompt is also copied to your clipboard in case the prefill doesn't come through.
- **Subnetting practice**: a dedicated section with unlimited, freshly generated questions in 17 types: CIDR ↔ mask, wildcard masks, usable hosts, block size, network ID, broadcast, first/last host, host range, next subnet, same-subnet checks, right-sizing a subnet (as a prefix or a dotted mask), counting subnets, subnets-needed → prefix, and the Nth subnet. It has three difficulty levels (/24–/30, /16–/30, /8–/30). Fill in the blank is the default (16 of 17 types; host range uses two boxes), and multiple choice is available too. It includes a worked step-by-step explanation for every answer, a built-in cheat sheet, and per-type accuracy so you can drill your weakest type. It also focuses automatically on the types you miss. Answers count toward your daily goal and your IPv4 addressing weak-spot score. All answers are computed in `subnet.js` and were cross-checked against Python's `ipaddress` module on 15,300 generated questions.
- **Spaced repetition**: every question you answer is scheduled for review. Each correct answer pushes the next review further out (1, 3, 7, 16, 35, then 90 days); a miss makes it due again. About half of each practice session is due reviews (earlier misses first), and the home screen shows how many are due. Nothing repeats within a session.
- **Ports & protocols drill**: memorize every port in the N10-009 objectives (27 protocols, including IP protocol numbers for ICMP, TCP, UDP, GRE, ESP, and AH), optionally plus 11 other commonly tested ones. Question types: protocol → port, port → protocol, what it does, TCP or UDP, secure replacement, and acronym → name. Fill in the blank by default (multi-port answers like "20, 21" work in any order), with spaced repetition per fact and a reference table.
- **IP address classes drill**: Classes A–E (first-octet ranges, leading bits, default masks, private ranges, hosts per network, what each class is used for) plus special addresses (loopback, APIPA, limited broadcast, 0.0.0.0) and private/public/special identification. Fill in the blank by default, with spaced repetition and a reference table.
- **Weak spots**: the home screen lists your weakest objectives. Tap one to drill only that objective.
- **Practice exam**: timed (1 min per question) and weighted like the real exam (23/20/19/14/24%), scored at the end.
- **Domain and objective filters**, **Missed / Flagged review**, resumable sessions.
- Dark mode by default (switch to light in Settings), works offline, answer choices shuffled on every attempt.

All progress is stored on the device in your browser and isn't synced between devices.

## Put it on your phone

1. Host it with **GitHub Pages**: in the repo on GitHub go to **Settings → Pages**, set *Source* to "Deploy from a branch", and pick your branch and `/ (root)`. After a minute it will be live at `https://<your-username>.github.io/study-app/`.
2. Open that URL on your phone:
   - **iPhone (Safari):** Share button → **Add to Home Screen**.
   - **Android (Chrome):** ⋮ menu → **Add to Home screen** / **Install app**.
3. Launch it from the home-screen icon. It opens full-screen like a normal app.

Progress is stored in the browser on that device (localStorage). It is not synced between devices.

## Run locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Question bank

| Domain | Weight | Questions |
|---|---|---|
| 1.0 Networking Concepts | 23% | 446 |
| 2.0 Network Implementation | 20% | 290 |
| 3.0 Network Operations | 19% | 280 |
| 4.0 Network Security | 14% | 234 |
| 5.0 Network Troubleshooting | 24% | 313 |

Domain 1 includes about 140 calculated drills (subnet masks, host counts, network/broadcast addresses, address classes, port numbers). Their answers are computed in code, not typed by hand.

## Lessons

Lessons live in `lessons/netplus/`, one Markdown file per objective, starting with `# <objective name>` (it must match a topic in `questions/netplus/_meta.js`). Supported formatting: `##` headings, paragraphs, `-` and `1.` lists (one nested level), tables, `>` callouts, **bold**, *italic*, and `code`. Each lesson has a matching quiz file `<name>.quiz.js` that exports `{ "<## section heading>": [[question, [correct, wrong...], explanation], ...] }` with at least 3 questions per section, all answerable from that section's text. Mini tests draw 2 per section; the questions also join the practice bank. `node tools/build.js` checks that every objective has a lesson, that every section has its questions, and that no question is duplicated, then writes `data/netplus-lessons.js`.

## Adding or editing questions

Question sources live in `questions/netplus/`, one file per exam objective:

```js
module.exports = {
  domain: 2,
  topic: "Routing technologies",   // must match a topic in _meta.js
  questions: [
    ["Which routing protocol exchanges routes between autonomous systems?",
      ["BGP", "OSPF", "RIP", "EIGRP"],          // correct answer FIRST; the app shuffles
      "BGP is the path-vector exterior gateway protocol used between autonomous systems."],
  ]
};
```

After editing, rebuild the bundle the app loads:

```sh
node tools/build.js
```

The build validates every question (topic exists, 3–5 unique choices, explanation present, no duplicate questions, no "all of the above"). It prints counts per objective and writes `data/netplus.js`. Don't edit `data/netplus.js` by hand.

Then bump `CACHE` in `sw.js` (e.g. `study-app-v3`) so installed phones pick up the update.

Notes:
- Saved progress is keyed by question text, so rewording a question resets its progress (only for that question).
- To add another subject, create `questions/<subject>/_meta.js` plus question files, add its `data/<subject>.js` script tag to `index.html`, and add it to `sw.js`.
