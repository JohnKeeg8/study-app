# Study App

A phone-friendly practice-question app. It currently covers **CompTIA Network+ (N10-009)** with about 1,560 questions mapped to every exam objective. Every question has an explanation.

It's a Progressive Web App (plain HTML/CSS/JS; nothing to install to run it). Once it's hosted you can add it to your home screen, and it works offline.

## Features

- **Practice mode**: tap an answer and see right/wrong plus an explanation right away.
- **Exam mode**: timed (1 min per question, like the real exam), with questions split across domains by the official exam weights (23/20/19/14/24%). You can go back and change answers, and the exam is scored at the end.
- **Smart selection**: questions you missed come first, then ones you haven't seen, then ones you know least well.
- **Domain and objective filters**: study any mix of domains, or tap › on a domain to drill specific objectives (for example only *Tools & protocols*).
- **Missed / Flagged**: drill only the questions you got wrong last time, or ones you starred.
- **Progress tracking**: per-domain mastery bars, accuracy, and recent scores. Saved on your device.
- **Resume**: leave mid-quiz and pick up where you left off.
- Dark mode, offline support, answer choices shuffled on every attempt.

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
