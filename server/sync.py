#!/usr/bin/env python3
"""Study App sync server: keeps your progress on the server so every device shares it.

Standard library only (no pip installs). It listens on 127.0.0.1 and the web server (Caddy) forwards
/api/* to it, so it's only reachable through the app's own address.

  GET  /api/state  -> {"rev": n, "updatedAt": ms, "data": {...} | null}
  PUT  /api/state  <- {"baseRev": n, "data": {...}, "backup": true?}  (backup: always keep a copy first)
                   -> 200 {"rev": n+1, "updatedAt": ms}
                   -> 409 {"rev", "updatedAt", "data"} when another device saved since baseRev; the app merges
                      and sends again.
  GET  /api/health -> {"ok": true}

Progress is stored in <data dir>/state.json (atomic writes). Before it's overwritten, a copy goes to
<data dir>/backups/ at most once an hour, keeping the newest 72, so a bad sync or a reset can be undone.

Usage: sync.py [--port 8787] [--data /var/lib/study-app] [--static DIR]
--static also serves the app's files (for testing without Caddy).
"""
import argparse
import json
import os
import shutil
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

MAX_BODY = 20 * 1024 * 1024  # 20 MB; a heavily used save is well under 1 MB
BACKUP_EVERY = 3600          # seconds between automatic backups
BACKUPS_KEPT = 72

lock = threading.Lock()


def now_ms():
    return int(time.time() * 1000)


class Store:
    def __init__(self, data_dir):
        self.dir = data_dir
        self.path = os.path.join(data_dir, "state.json")
        self.backups = os.path.join(data_dir, "backups")
        os.makedirs(self.backups, exist_ok=True)

    def read(self):
        try:
            with open(self.path, encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            return {"rev": 0, "updatedAt": 0, "data": None}

    def write(self, state, force_backup=False):
        self.backup(force_backup)
        tmp = self.path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(state, f, separators=(",", ":"))
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, self.path)

    def backup(self, force=False):
        if not os.path.exists(self.path):
            return
        names = sorted(n for n in os.listdir(self.backups) if n.startswith("state-") and n.endswith(".json"))
        if not force and names and time.time() - os.path.getmtime(os.path.join(self.backups, names[-1])) < BACKUP_EVERY:
            return
        shutil.copy2(self.path, os.path.join(self.backups, time.strftime("state-%Y%m%d-%H%M%S.json")))
        names = sorted(n for n in os.listdir(self.backups) if n.startswith("state-") and n.endswith(".json"))
        for old in names[:-BACKUPS_KEPT]:
            os.remove(os.path.join(self.backups, old))


def make_handler(store, static_dir):
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=static_dir or os.getcwd(), **kwargs)

        def log_message(self, fmt, *args):  # quieter logs: only API errors are interesting
            pass

        def send_json(self, code, obj):
            body = json.dumps(obj, separators=(",", ":")).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def api_path(self):
            path = self.path.split("?", 1)[0]
            i = path.find("/api/")
            return path[i:] if i >= 0 else None

        def do_GET(self):
            p = self.api_path()
            if p == "/api/state":
                with lock:
                    return self.send_json(200, store.read())
            if p == "/api/health":
                return self.send_json(200, {"ok": True})
            if p is not None:
                return self.send_json(404, {"error": "not found"})
            if not static_dir:
                return self.send_json(404, {"error": "not found"})
            return super().do_GET()

        def do_HEAD(self):
            if self.api_path() is not None or not static_dir:
                self.send_response(404)
                return self.end_headers()
            return super().do_HEAD()

        def do_PUT(self):
            if self.api_path() != "/api/state":
                return self.send_json(404, {"error": "not found"})
            try:
                length = int(self.headers.get("Content-Length") or 0)
            except ValueError:
                length = -1
            if length <= 0 or length > MAX_BODY:
                return self.send_json(413 if length > MAX_BODY else 400, {"error": "bad length"})
            try:
                body = json.loads(self.rfile.read(length).decode("utf-8"))
                base = int(body.get("baseRev", -1))
                data = body["data"]
                if not isinstance(data, dict):
                    raise ValueError("data must be an object")
            except (ValueError, KeyError, TypeError, AttributeError):
                return self.send_json(400, {"error": "bad request"})
            with lock:
                cur = store.read()
                if base != cur["rev"]:
                    return self.send_json(409, cur)
                state = {"rev": cur["rev"] + 1, "updatedAt": now_ms(), "data": data}
                store.write(state, force_backup=bool(body.get("backup")))
            return self.send_json(200, {"rev": state["rev"], "updatedAt": state["updatedAt"]})

    return Handler


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--port", type=int, default=int(os.environ.get("STUDYAPP_PORT", 8787)))
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--data", default=os.environ.get("STATE_DIRECTORY") or os.environ.get("STUDYAPP_DATA") or "/var/lib/study-app")
    ap.add_argument("--static", default=None, help="also serve the app's files from this folder (testing)")
    args = ap.parse_args()
    store = Store(args.data)
    server = ThreadingHTTPServer((args.host, args.port), make_handler(store, args.static))
    print(f"Study App sync listening on {args.host}:{args.port}, data in {args.data}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
