# House ads - server side (liqpil.com)

First-party cross-promo banners for the liqpil apps (Tap Map first; PetCheckAI /
Pagoda can join later). Replaces AdMob after the publisher account was disabled
on 2026-08-30. This site only serves **static files**: a JSON manifest plus PNG
creatives. The apps do selection, rendering, capping and stats client-side; the
ops/stats side lives in `liqpil-services-infra/utils/house-ads-stats.md`.

## Directory layout

```
ads/v1/manifest.json                          the manifest (schemaVersion 1)
ads/v1/creatives/<id>/banner-{1x,2x,3x}.png   320x50 at 1x/2x/3x
ads/v1/creatives/<id>/wide-{1x,2x,3x}.png     728x90 at 1x/2x/3x (tablet)
go/<app>/index.html                           JS user-agent redirect (App Store / Play / web)
scripts/validate-ads.mjs                      run before publishing
```

## Manifest schema (v1)

Top level: `{ "schemaVersion": 1, "placements": { "<placement>": [creative...] } }`.
Placements are per app slot: `tapmap.banner` today; use `petcheck.banner`,
`pagoda.banner` when those apps adopt house ads. Clients ignore unknown fields,
skip malformed creatives, and reject any other `schemaVersion` (they then keep
their last good cached copy, else the bundled liqpil fallback).

Creative fields:

| field | meaning |
|---|---|
| `id` | stable id; also the stats key. New campaign => new id. |
| `assets` | `png1x/2x/3x` (320x50) and `wide1x/2x/3x` (728x90). Clients pick by density and width, falling through whatever exists. A creative with no PNGs is never shown. |
| `url` | string, or `{ "ios": ..., "android": ..., "web": ... }`. GitHub Pages cannot redirect per platform server-side, so per-platform store links live **here**. `app://premium` opens the app's own paywall. |
| `weight` | integer >= 1; weighted-random selection. **Editable without an app release.** |
| `locales` | e.g. `["en","fr"]`; omit = all. Matched against the device language code. |
| `platforms` | `["ios","android"]`; omit = all. |
| `start` / `end` | inclusive `yyyy-MM-dd` (UTC). Omit for open-ended. |
| `capPerDay` | max impressions per creative per device per day (default 6). |
| `bg` | `["#hex"]` (both themes) or `["#light","#dark"]`. Should match the colour baked into the PNG so the banner blends edge-to-edge. |
| `promotes` | `tapmap` / `petcheckai` / `pagoda` / `liqpil` / `premium`. Clients exclude their own app; never list a creative that promotes the app in that app's own placement anyway. |

## Adding a campaign

1. Render creatives (Chrome headless was used for the current set - any tool is
   fine) at exactly 320x50 / 728x90 in 1x/2x/3x, background colour baked in.
2. Drop them under `ads/v1/creatives/<new-id>/`.
3. Add the creative object to each placement it should run in.
4. `node scripts/validate-ads.mjs --local` (in this repo) - must pass.
5. Commit + push. GitHub Pages publishes in about a minute; apps pick it up on
   their next manifest refresh (6 h default, or next cold start after expiry).

## Retiring a campaign

Set `end` to yesterday (history-friendly) or remove the creative object.
Leave the PNGs in place until every client cache is surely past them (a week is
plenty), then delete the directory.

## Headers / caching

GitHub Pages controls the headers - they cannot be customised:
`ETag` is served automatically (clients revalidate with `If-None-Match`),
`Cache-Control: max-age=600`, and `Access-Control-Allow-Origin: *` on GET.
That is exactly what the clients are built for; nothing to configure.

## /go/<app> redirects

`go/{pagoda,petcheckai,tapmap}/index.html` do a client-side UA redirect
(iOS -> App Store, Android -> Play, else web page) with a meta-refresh fallback.
The apps do NOT use them (they get per-platform URLs from the manifest); they
exist for web use - link them as `https://liqpil.com/go/pagoda` etc.

## Validation

`node scripts/validate-ads.mjs --local` checks the manifest structurally and
verifies every referenced asset exists in the repo. After publishing, run it
without `--local` to HEAD-check the live URLs (store links included).

## Remote switches (not in this repo)

Firestore `system_config/ads` in the Tap Map project selects the provider
(`house` | `admob` | `none`), the manifest URL, refresh minutes and the stats
endpoint. Default (doc missing/unreachable) is house ads with this site's
manifest and **stats off**.
