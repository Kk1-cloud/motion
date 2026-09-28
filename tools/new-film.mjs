// npm run new -- <name> : copy the starter film to films/<name>/
import { cpSync, existsSync } from 'node:fs';
const name = process.argv[2];
if (!name || !/^[a-z0-9-]+$/.test(name)) { console.error('usage: npm run new -- <kebab-name>'); process.exit(1); }
const dest = `films/${name}`;
if (existsSync(dest)) { console.error(`${dest} already exists`); process.exit(1); }
cpSync('films/_starter', dest, { recursive: true, filter: (p) => !p.includes('/out') });
console.log(`created ${dest}/index.html\nnext: write ${dest}/brief.md and ${dest}/shotlist.md before any code`);
