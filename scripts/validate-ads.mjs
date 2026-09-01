#!/usr/bin/env node
// Validates ads/v1/manifest.json and its assets. No dependencies (Node 18+).
//   node scripts/validate-ads.mjs --local   check files in this repo (pre-push)
//   node scripts/validate-ads.mjs           HEAD-check live URLs (post-publish)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const local = process.argv.includes('--local');
const errors = [];
const err = (m) => errors.push(m);

const HEX = /^#[0-9a-fA-F]{6}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const PROMOTES = ['tapmap', 'petcheckai', 'pagoda', 'liqpil', 'premium'];
const ASSET_KEYS = ['png1x', 'png2x', 'png3x', 'wide1x', 'wide2x', 'wide3x'];
const SELF = { 'tapmap.banner': 'tapmap', 'petcheck.banner': 'petcheckai', 'pagoda.banner': 'pagoda' };

let manifest;
try {
  manifest = JSON.parse(readFileSync(join(root, 'ads/v1/manifest.json'), 'utf8'));
} catch (e) {
  console.error('manifest.json unreadable:', e.message);
  process.exit(1);
}

if (manifest.schemaVersion !== 1) err(`schemaVersion must be 1, got ${manifest.schemaVersion}`);
if (!manifest.placements || typeof manifest.placements !== 'object') err('placements missing');

const urls = new Set();
for (const [placement, creatives] of Object.entries(manifest.placements ?? {})) {
  if (!Array.isArray(creatives)) { err(`${placement}: not an array`); continue; }
  const ids = new Set();
  for (const c of creatives) {
    const tag = `${placement}/${c?.id ?? '?'}`;
    if (!c?.id || typeof c.id !== 'string') { err(`${tag}: missing id`); continue; }
    if (ids.has(c.id)) err(`${tag}: duplicate id`);
    ids.add(c.id);
    if (c.weight !== undefined && (!Number.isInteger(c.weight) || c.weight < 0)) err(`${tag}: bad weight`);
    if (c.capPerDay !== undefined && (!Number.isInteger(c.capPerDay) || c.capPerDay < 1)) err(`${tag}: bad capPerDay`);
    if (c.promotes !== undefined && !PROMOTES.includes(c.promotes)) err(`${tag}: unknown promotes "${c.promotes}"`);
    if (c.promotes && SELF[placement] === c.promotes) err(`${tag}: promotes the app inside its own placement`);
    for (const k of ['start', 'end']) if (c[k] !== undefined && c[k] !== null && !DATE.test(c[k])) err(`${tag}: bad ${k}`);
    if (c.bg !== undefined && (!Array.isArray(c.bg) || c.bg.length < 1 || c.bg.length > 2 || !c.bg.every((h) => HEX.test(h)))) err(`${tag}: bad bg`);
    const assets = c.assets ?? {};
    if (!ASSET_KEYS.some((k) => typeof assets[k] === 'string')) err(`${tag}: no PNG assets - creative can never render`);
    for (const k of ASSET_KEYS) if (assets[k]) urls.add(assets[k]);
    if (c.url === undefined) err(`${tag}: missing url`);
    else if (typeof c.url === 'string') {
      if (!/^(https:|app:)/.test(c.url)) err(`${tag}: url must be https:// or app://`);
      if (c.url.startsWith('https:')) urls.add(c.url);
    } else {
      for (const [p, u] of Object.entries(c.url)) {
        if (!/^https:/.test(u)) err(`${tag}: url.${p} must be https://`);
        else urls.add(u);
      }
    }
  }
}

const checkLocal = (u) => {
  if (!u.startsWith('https://liqpil.com/')) return true; // external links only checked live
  return existsSync(join(root, u.replace('https://liqpil.com/', '')));
};

if (local) {
  for (const u of urls) if (!checkLocal(u)) err(`missing file for ${u}`);
  report();
} else {
  const results = await Promise.allSettled([...urls].map(async (u) => {
    const res = await fetch(u, { method: 'HEAD', redirect: 'follow' });
    if (!res.ok) throw new Error(`${res.status} ${u}`);
  }));
  for (const r of results) if (r.status === 'rejected') err(String(r.reason?.message ?? r.reason));
  report();
}

function report() {
  if (errors.length) {
    console.error(`FAIL - ${errors.length} problem(s):`);
    for (const e of errors) console.error('  -', e);
    process.exit(1);
  }
  console.log(`OK - manifest valid, ${urls.size} URLs checked (${local ? 'local' : 'live'})`);
}
