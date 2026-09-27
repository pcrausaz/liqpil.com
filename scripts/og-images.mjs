#!/usr/bin/env node
// Renders the 1200x630 link-preview cards (og:image) with headless Chrome.
// No dependencies (Node 18+). Re-run after adding an app or changing an icon:
//   node scripts/og-images.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const chrome = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const template = pathToFileURL(join(root, 'scripts/og-card.html')).href;

// out name -> card params (null = home card)
const cards = {
    home: null,
    petcheckai: { icon: '/assets/PetCheckAI.svg', name: 'Pet Check AI' },
    garageopener: { icon: '/assets/GarageOpener.svg', name: 'Protect Garage Opener' },
    ariade: { icon: '/assets/Ariade.svg', name: 'Ariade' },
    tapmapapp: { icon: '/assets/TapMapApp.png', name: 'Tap Map App' },
    inkedmark: { icon: '/assets/InkedMark.svg', name: 'InkedMark' },
    pagoda: { icon: '/assets/pagoda-icon-black.svg', name: 'Pagoda' },
    kaclink: { icon: '/assets/Kaclink.svg', name: 'Kaclink' },
    termwidget: { icon: '/assets/TermWidget.svg', name: 'TermWidget' },
};

mkdirSync(join(root, 'assets/og'), { recursive: true });
for (const [out, params] of Object.entries(cards)) {
    const url = params ? `${template}?${new URLSearchParams(params)}` : template;
    const file = join(root, 'assets/og', `${out}.png`);
    execFileSync(chrome, [
        '--headless', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
        '--force-device-scale-factor=1', '--window-size=1200,630', `--screenshot=${file}`, url,
    ], { stdio: 'ignore' });
    console.log(`assets/og/${out}.png`);
}
