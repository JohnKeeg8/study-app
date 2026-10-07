# Study App

A phone-friendly practice-question app. It currently covers **CompTIA Network+ (N10-009)** with 165 questions across all five exam domains. Every question has an explanation.

It's a Progressive Web App (plain HTML/CSS/JS, no build step). Once it's hosted you can add it to your home screen, and it works offline.

## Features

- **Practice mode**: tap an answer and see right/wrong plus an explanation right away.
- **Exam mode**: timed (1 min per question, like the real exam). You can go back and change answers, and the exam is scored at the end.
- **Smart selection**: questions you missed come first, then ones you haven't seen, then ones you know least well.
- **Domain filter**: study one domain or any mix of domains.
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

## Adding or editing questions

Questions live in `data/netplus.js`:

```js
{ d: 1, t: "Ports & protocols", q: "Which port does SSH use by default?",
  c: ["22", "23", "21", "443"], a: 0,
  e: "SSH uses TCP 22..." }
```

- `d` – domain number, `t` – topic label, `q` – question
- `c` – choices (shuffled when shown), `a` – index of the correct choice, `e` – explanation

After changing files, bump `CACHE` in `sw.js` (e.g. `study-app-v2`) so installed phones pick up the update.

To add another subject later, create a new file in `data/` that pushes onto `window.SUBJECTS` in the same format.
