#!/usr/bin/env node
const path = require('path');
const { ensurePack } = require('./dist/main/content/packBuilder');

const argv = process.argv.slice(2);
let force = false;
let out = null;
let root = null;

for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === '-f' || arg === '--force') {
    force = true;
    continue;
  }
  if (arg === '-h' || arg === '--help') {
    printHelp();
    process.exit(0);
  }
  if (arg.startsWith('-o=') || arg.startsWith('--out=')) {
    out = arg.slice(arg.indexOf('=') + 1);
    continue;
  }
  if (arg === '-o' || arg === '--out') {
    out = argv[i + 1];
    i++;
    continue;
  }
  if (arg.startsWith('-r=') || arg.startsWith('--root=')) {
    root = arg.slice(arg.indexOf('=') + 1);
    continue;
  }
  if (arg === '-r' || arg === '--root') {
    root = argv[i + 1];
    i++;
    continue;
  }
}

function printHelp() {
  console.log('Usage: node tools/pack.js [options]');
  console.log('Build the engine content pack (game.fap) from the canonical source layout.');
  console.log('');
  console.log('Options:');
  console.log('  -o, --out <path>   Write pack to this path (default: <root>/game.fap)');
  console.log('  -r, --root <path>  Source root containing Metadata.json, Assets, Scripts (default: cwd)');
  console.log('  -f, --force        Always rebuild, even if the cache is fresh');
  console.log('  -h, --help         Show this help');
  console.log('');
  console.log('Encrypted packs: ZipCrypto must be authored by an external tool (unzipper only reads).');
  console.log('Example:');
  console.log('  7z a -tzip -mem=ZipCrypto game.fap Metadata.json Assets Scripts');
}

async function main() {
  try {
    const sourceRoot = path.resolve(root || process.cwd());
    const packPath = out ? path.resolve(out) : path.join(sourceRoot, 'game.fap');
    const result = await ensurePack(sourceRoot, packPath, { force });
    const status = result.reused ? 'reused (fresh)' : 'rebuilt';
    console.log(`Packed ${packPath} (${status})`);
    console.log(`- entries: ${result.entryCount}`);
    console.log(`- bytes: ${result.bytes}`);
    console.log(`- digest: ${result.contentDigest}`);
    if (result.warnings.length > 0) {
      console.log('Warnings:');
      for (const w of result.warnings) {
        console.log(`  - ${w}`);
      }
    }
  } catch (err) {
    console.error('Failed to build pack:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
