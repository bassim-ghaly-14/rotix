## Rotix

Rotix is a browser-based pipeline puzzle game with no build step or external dependencies.

### Run locally

Serve this folder with any static web server, then open the displayed local URL in a modern browser. For example:

```sh
python3 -m http.server 4173
```

Open `http://localhost:4173/`.

The game uses browser `localStorage` only to remember the current level and whether diagnostic mode is enabled.
