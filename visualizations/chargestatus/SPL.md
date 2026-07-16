# Charge Status Ring — SPL Reference

Draws the ring's battery level as a circular fill, with a dock + cable that
appears when seated and animates while charging.

## Expected Columns

| Column        | Type    | Required? | Description |
|---------------|---------|-----------|-------------|
| `level`       | number  | Yes       | Battery percent 0–100 (drives the ring fill + center number). |
| `charging`    | bool    | Yes       | Actively charging. Drives the glow/⚡/flowing-cable animation. |
| `in_charger`  | bool    | Yes       | Seated on the dock. |
| `ring_color`  | string  | Optional  | Oura finish (e.g. `stealth_black`) — tints the ring body. |
| `ring_design` | string  | Optional  | Oura design (reserved for future shape variants). |

Booleans arrive from Splunk as the strings `"true"` / `"false"`.

## Domain rule

`on_dock = charging OR in_charger`. An Oura ring only charges on its dock, so
`charging=true` implies it is seated — this absorbs the API's `in_charger`
lag at charge onset (no separate "connecting" state).

## Full SPL

```spl
index=oura (oura_data_type=battery OR oura_data_type=ring_config)
| eval rc=if(oura_data_type="ring_config",color,null()), rd=if(oura_data_type="ring_config",design,null())
| eventstats latest(rc) as ring_color, latest(rd) as ring_design
| where oura_data_type="battery"
| sort -_time | head 1
| table level, charging, in_charger, ring_color, ring_design
```

## Time range

`-2d` to `now` (query pins to the latest battery reading via `sort -_time | head 1`).
```
