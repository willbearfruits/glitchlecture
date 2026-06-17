#!/usr/bin/env python3
"""
Creative Destruction — local dev server.

    python serve.py            # serve on http://127.0.0.1:8042 and open a browser
    python serve.py 9000       # pick a port
    python serve.py --no-open  # don't auto-open the browser

Static files only. No-cache headers so edits show up on refresh. Some demos
(databending, pixel sort) decode images on a canvas, and webcam demos need a
secure context — 127.0.0.1 counts as secure, so localhost is all you need.
"""
import http.server
import socketserver
import sys
import os
import webbrowser
from functools import partial

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 8042
OPEN = True

for a in sys.argv[1:]:
    if a == "--no-open":
        OPEN = False
    elif a.isdigit():
        PORT = int(a)


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".ogg": "audio/ogg",
        ".wasm": "application/wasm",
        ".webp": "image/webp",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stdout.write("  · " + (fmt % args) + "\n")


def run():
    global PORT
    socketserver.TCPServer.allow_reuse_address = True
    handler = partial(Handler, directory=ROOT)
    for attempt in range(20):
        try:
            httpd = socketserver.TCPServer(("127.0.0.1", PORT), handler)
            break
        except OSError:
            PORT += 1
    else:
        print("could not bind a port"); return

    url = f"http://127.0.0.1:{PORT}/index.html"
    print("\n  CREATIVE DESTRUCTION — a history of glitch art")
    print("  " + "-" * 46)
    print(f"  serving:  {ROOT}")
    print(f"  open:     {url}")
    print("  stop:     Ctrl+C\n")
    if OPEN:
        try:
            webbrowser.open(url)
        except Exception:
            pass
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  corrupted gracefully. bye.\n")
        httpd.shutdown()


if __name__ == "__main__":
    run()
