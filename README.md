# charge_ring_viz — Splunk Dashboard Studio custom visualization

A **battery / charge-status ring** for Splunk Dashboard Studio: battery % as a
colored ring fill with a high-contrast value, an animated dock + cable while
charging, and an optional last-sync readout. Built for the companion
**oura_health** Ring dashboard, but generic for any device's battery/charge state.

**Viz type string:** `charge_ring_viz.chargestatus`

## Data contract
| column | notes |
|--------|-------|
| `level` | battery % 0–100 — ring fill + center number |
| `charging` | bool → glow / ⚡ / animated cable energy |
| `in_charger` | bool → dock shown. Rule: `on_dock = charging OR in_charger` (the ring only charges on its dock, so this absorbs API lag) |
| `ring_color` | optional — tints the ring body (e.g. `stealth_black`) |
| `sync_label`, `sync_color` | optional — lower-left "🕐 as of X ago" readout, tinted by staleness |

See `visualizations/chargestatus/SPL.md`.

## Build & package
```bash
npm install
npm run build:prod
npm run package        # -> dist/charge_ring_viz-<version>-<hash>.spl
```
Install the `.spl` via Splunk Web. After a viz-code update, bump Splunk's static-asset
cache (`/en-US/_bump`) or restart, then hard-refresh.

Framework: `@splunk/dashboard-studio-extension`. Passes Splunk Cloud AppInspect (cloud tags).

## Related repositories

- **[oura-health-splunk](https://github.com/narwhaldc/oura-health-splunk)** — the Splunk app + ingest pipeline this viz was built for
- **[hypnogram_viz](https://github.com/narwhaldc/hypnogram_viz)** — companion stepped lane-timeline (hypnogram) viz
