# AGENTS.md

Guidance for AI coding agents (and humans) working in the Origo repository.
Read this together with `README.md`, `CONTRIBUTING.md`, `DEVELOPING.md` and `PLUGINS.md`.
If anything here conflicts with those files, the maintainers' docs win.

## Project overview

Origo is a configurable framework for building web map applications on top of
[OpenLayers](https://openlayers.org/) (`ol`, see `package.json` for the supported version).
It is maintained by a group of Swedish municipalities. A map is defined by a JSON
configuration (see `index.json`) and rendered in the browser by `origo.js`.

- Plain JavaScript (modern ECMAScript, ES modules), SCSS, HTML. No TypeScript, no UI framework.
- Bundled with webpack (configs in `tasks/`), styles compiled with `sass`.
- Server-side components live in a separate repo (`origo-map/origo-server`) and are out of scope here.
- User-facing API documentation lives in a separate repo (`origo-map/origo-documentation` / `api-documentation`).

## Setup and commands

Requires Node.js (current LTS; CI uses Node 20) and npm.

```bash
npm install          # install dependencies
npm start            # compile SCSS + webpack-dev-server with live reload at http://localhost:9966/
npm run lint         # ESLint on origo.js and src/ — must pass, CI runs this on every push/PR
npm run lint-fix     # auto-fix lint errors where possible
npm run build        # production bundle into build/ (origo.min.js, style.css, assets)
```

There is no automated test suite. Verification means: lint passes, `npm run build`
succeeds, and the change is checked manually in the dev server with `index.json`
(or an example config in `examples/`).

## Repository layout

| Path | Contents |
| --- | --- |
| `origo.js` | Entry point. Exposes the public `Origo` API (`Origo.ui`, `Origo.ol`, controls, utils, etc.) |
| `src/viewer.js` | Core viewer: map, layers, groups, controls, state |
| `src/controls/` | Built-in controls (zoom, legend, search, print, editor, measure, ...). Registered in `src/controls.js` |
| `src/layer/` | Layer type factories (wms, wmts, wfs, agsmap, vectortile, geojson, cog, ...). Mapped in `src/layer/layertype.js` |
| `src/ui/` | Small in-house component library (`Component`, `Button`, `Element`, `Modal`, `dom`, ...) |
| `src/style/` | Feature styling and style functions |
| `src/loc/` | Localization strings: `sv_SE.json`, `en_US.json` |
| `src/permalink/` | Map state sharing / permalinks |
| `src/utils/` | Generic helpers |
| `scss/` | All styles. `scss/origo.scss` is the root, variables in `_variables.scss` |
| `css/`, `img/`, `data/` | Static assets, sample data, SVG icon sprites |
| `index.html`, `index.json` | Demo map used by the dev server |
| `examples/` | Example configurations |
| `tasks/` | webpack configs |
| `build/`, `dist/` | Build output — **do not edit by hand** |

## Code conventions

- **Style:** Airbnb JavaScript style guide via `eslint-config-airbnb-base`, with the
  overrides in `.eslintrc.json` (notably `comma-dangle: never`, `max-len` off).
  Never commit lint errors. If a rule truly can't be satisfied, use
  `// eslint-disable-next-line <rule>` with a comment explaining why.
- **Components:** follow the existing factory pattern, not classes:

  ```js
  import { Component, Button, dom } from '../ui';

  const MyControl = function MyControl(options = {}) {
    let viewer;
    return Component({
      name: 'mycontrol',
      onAdd(evt) { viewer = evt.target; /* add sub-components, render */ },
      onInit() { /* create sub-components */ },
      render() { /* build DOM with dom.html / createElement, then dispatch 'render' */ }
    });
  };
  export default MyControl;
  ```

  Look at a similar existing control (e.g. `src/controls/zoom.js`) before writing a new one.
- **New control:** add the file under `src/controls/`, export it from `src/controls.js`
  using the same naming style, and make it configurable from the JSON config via `options`.
- **New layer type:** add a factory under `src/layer/` and register it in `src/layer/layertype.js`.
- **Imports from OpenLayers:** import specific modules (`import VectorSource from 'ol/source/Vector'`)
  rather than the whole package, to keep the bundle small.
- **Dependencies:** avoid adding new ones. Prefer what is already in `package.json`
  (OpenLayers, proj4, etc.). If a new library is unavoidable it must be small and have a
  BSD-2-Clause-compatible license. Features that need heavy or niche dependencies
  belong in a plugin, not in core (see `PLUGINS.md`).
- **Browser support:** current Edge, Firefox, Chrome and Safari. Progressive enhancement
  is fine for non-critical features.
- **Backwards compatibility:** many municipalities run Origo in production with their own
  JSON configs. Do not rename or remove config options, public API members on `Origo`/`viewer`,
  or CSS classes without a clear deprecation path, and call it out in the PR.

## Styling

- Only edit `.scss` files under `scss/`; never edit generated CSS (`css/style.css`, `build/`, `dist/`).
- All CSS classes and IDs are prefixed with `o-` (e.g. `o-zoom-in`).
- Follow Airbnb's CSS/Sass guidelines. Check that changes don't break existing styles.
- Responsive behaviour is based on the **map size**, not the browser window: use the
  breakpoints defined in the Origo configuration rather than adding new `@media` queries.
- Icons are SVG from the existing sprites (Material Icons first, then Font Awesome),
  referenced like `icon: '#ic_add_24px'`.

## Localization

- Never hard-code user-facing strings. Add keys to **both** `src/loc/sv_SE.json` and
  `src/loc/en_US.json`, nested under the control's name, and read them via
  `localization.getStringByKeys({ targetParentKey: '<control>', targetKey: '<key>' })`.
- Swedish is the primary language of most deployments, so write natural Swedish, not a literal translation.

## Security

- Content from WMS/WFS responses, feature attributes and config can be untrusted.
  Avoid injecting it as raw HTML; escape or use DOM APIs. Be careful when touching
  `featureinfo`, `infowindow` and popup code.
- Never commit API keys, internal service URLs or credentials in configs or examples.
- Report vulnerabilities as described in `SECURITY.md`, not in public issues.

## Pull requests and commits

- One PR = one issue or one piece of functionality. Larger changes should be discussed
  in an issue first, as described in `CONTRIBUTING.md`.
- PR title must start with one of: `dep:`, `docs:`, `feature:`, `fix:`.
- Commit messages follow the OpenLayers convention: header line ≤ 50 characters,
  blank line, then a wrapped body (~72–74 columns) explaining what and why.
- Keep the history clean and rebase-friendly; the PR must merge without conflicts.
- New or changed config options/API need a matching PR in the documentation repository;
  link it from the Origo PR.
- Do not bump `version` in `package.json` or commit build output unless the maintainers ask for it.

## Checklist before finishing a task

1. `npm run lint` passes with no errors.
2. `npm run build` succeeds.
3. The change works in the dev server (`npm start`) on a desktop and a narrow/mobile map size.
4. New strings exist in both `sv_SE.json` and `en_US.json`.
5. No unrelated reformatting, no edits in `build/`/`dist/`, no new dependencies without justification.
6. Existing JSON configs still work (no breaking config/API changes without a note).
