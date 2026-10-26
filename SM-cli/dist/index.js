#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * SM-cli — Single CLI entry point.
 *
 * Commands:
 *   sm-cli pack [--dir=<path>] [--out=<path>] [--password=<pwd>] [--iterations=<n>]
 *   sm-cli metadata [--dir=<path>] [--password=<pwd>] [--iterations=<n>]
 *   sm-cli validate [--dir=<path>]
 *   sm-cli                     ← interactive menu
 */
const readline = __importStar(require("readline"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const validator_1 = require("./validator");
const packer_1 = require("./packer");
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
var ImageFormatType;
(function (ImageFormatType) {
    ImageFormatType[ImageFormatType["Bitmap"] = 0] = "Bitmap";
    ImageFormatType[ImageFormatType["JPEG"] = 1] = "JPEG";
    ImageFormatType[ImageFormatType["PNG"] = 2] = "PNG";
})(ImageFormatType || (ImageFormatType = {}));
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CLI_VERSION = 'ALPHA';
const PACK_FORMAT_VERSION = 1;
const DEFAULT_KDF_ITERATIONS = 100_000;
const VERIFIER_BYTES = 32;
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function hashVersion() {
    return crypto.createHash('md5').update(CLI_VERSION, 'ascii').digest('hex').toUpperCase();
}
function createEncryptionMetadata(password, iterations) {
    const salt = crypto.randomBytes(16);
    const verifier = crypto.pbkdf2Sync(password, salt, iterations, VERIFIER_BYTES, 'sha256');
    return {
        Algorithm: 'ZipCrypto',
        Kdf: 'pbkdf2-sha256',
        Iterations: iterations,
        Salt: salt.toString('base64'),
        Verifier: verifier.toString('base64'),
    };
}
/**
 * Reads a flag value from process.argv.
 * Supports both `--name value` and `--name=value` forms.
 */
function readFlag(name, argv = process.argv.slice(2)) {
    const prefix = `--${name}=`;
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === `--${name}` && argv[i + 1] !== undefined) {
            return argv[i + 1];
        }
        if (argv[i].startsWith(prefix)) {
            return argv[i].slice(prefix.length);
        }
    }
    return undefined;
}
function readIterations(argv = process.argv.slice(2)) {
    const raw = readFlag('iterations', argv);
    if (!raw)
        return DEFAULT_KDF_ITERATIONS;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) {
        throw new Error(`Invalid --iterations value: ${raw}`);
    }
    return n;
}
function makeRl() {
    return readline.createInterface({ input: process.stdin, output: process.stdout });
}
function question(rl, query) {
    return new Promise((resolve) => rl.question(query, resolve));
}
// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------
/**
 * `sm-cli pack`
 */
async function cmdPack(argv) {
    const projectDir = path.resolve(readFlag('dir', argv) ?? process.cwd());
    const outArg = readFlag('out', argv);
    const outPath = outArg ? path.resolve(outArg) : path.join(projectDir, 'game.fap');
    const password = readFlag('password', argv);
    const iterations = readIterations(argv);
    // 1. Pre-flight validation
    console.log(`\n📂 Project directory: ${projectDir}`);
    console.log('🔍 Validating project layout…');
    const validation = (0, validator_1.validateProjectLayout)(projectDir);
    if (validation.warnings.length > 0) {
        for (const w of validation.warnings) {
            console.warn(`  ⚠  ${w}`);
        }
    }
    if (!validation.valid) {
        for (const e of validation.errors) {
            console.error(`  ✖  ${e}`);
        }
        console.error('\n❌ Validation failed. Pack aborted.');
        process.exit(1);
    }
    console.log('  ✔ Layout valid');
    // 2. Build pack
    console.log('\n📦 Building pack…');
    if (password) {
        console.log('  🔐 Encryption enabled (AES-256-GCM key file + PBKDF2 verifier)');
    }
    const result = await (0, packer_1.buildPack)({ projectDir, outPath, password, iterations });
    console.log(`\n✅ Pack written: ${result.packPath}`);
    console.log(`   Entries : ${result.entryCount}`);
    console.log(`   Size    : ${result.bytes.toLocaleString()} bytes`);
    console.log(`   Digest  : ${result.contentDigest}`);
    if (result.keyPath) {
        console.log(`\n🔑 Key file written: ${result.keyPath}`);
        console.log('   Keep this file alongside the pack. The engine reads it to unlock the game.');
    }
    if (result.warnings.length > 0) {
        console.log('\nWarnings:');
        for (const w of result.warnings) {
            console.warn(`  ⚠  ${w}`);
        }
    }
}
/**
 * `sm-cli metadata`  (formerly the sole purpose of this tool)
 */
async function cmdMetadata(argv) {
    const projectDir = path.resolve(readFlag('dir', argv) ?? process.cwd());
    const passwordFlag = readFlag('password', argv);
    const iterations = readIterations(argv);
    const rl = makeRl();
    try {
        process.stdout.write('\x1b[44m\x1b[33m');
        console.log('===== Metadata Generator =====');
        const title = await question(rl, 'What is the title of your game?\n');
        const author = await question(rl, 'Who is the creator of this game?\n');
        const titleScreenName = await question(rl, 'Title screen image name (no extension, place PNG in Assets/):\n');
        const gameVersion = await question(rl, 'Version number:\n');
        const startFile = await question(rl, 'Start file name (without extension):\n');
        const metadata = {
            Title: title,
            TitleScreenImageName: titleScreenName,
            Author: author,
            Version: gameVersion,
            DateGenerated: new Date().toISOString(),
            VersionHash: hashVersion(),
            PictureFormatType: ImageFormatType.PNG,
            ScenarioExtension: 'txt',
            StartFile: startFile,
            PackFormatVersion: PACK_FORMAT_VERSION,
        };
        if (passwordFlag !== undefined) {
            if (!passwordFlag) {
                throw new Error('--password was supplied with an empty value');
            }
            // Only store the PBKDF2 verifier — NEVER the plaintext password
            metadata.Encryption = createEncryptionMetadata(passwordFlag, iterations);
            console.log('\n📝 Encryption block (PBKDF2 verifier) added to Metadata.json.', '\n   Run `sm-cli pack --password=<same>` to generate the matching game.key.');
        }
        const outputPath = path.join(projectDir, 'Metadata.json');
        fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2), 'utf8');
        process.stdout.write('\x1b[0m');
        console.log(`\n✅ Metadata.json written to ${outputPath}`);
        await question(rl, 'Press Enter to exit…\n');
    }
    finally {
        process.stdout.write('\x1b[0m');
        rl.close();
    }
}
/**
 * `sm-cli validate`
 */
function cmdValidate(argv) {
    const projectDir = path.resolve(readFlag('dir', argv) ?? process.cwd());
    console.log(`Validating: ${projectDir}`);
    const result = (0, validator_1.validateProjectLayout)(projectDir);
    for (const w of result.warnings)
        console.warn(`  ⚠  ${w}`);
    for (const e of result.errors)
        console.error(`  ✖  ${e}`);
    if (result.valid) {
        console.log('✔ Project layout is valid.');
    }
    else {
        console.error('✖ Validation failed.');
        process.exit(1);
    }
}
/**
 * Interactive main menu (no sub-command provided).
 */
async function cmdInteractive() {
    const rl = makeRl();
    try {
        process.stdout.write('\x1b[44m\x1b[33m');
        console.log('===== SM-cli =====');
        console.log('[1] Build .fap pack (Standard or Encrypted)');
        console.log('[2] Generate or update Metadata.json');
        console.log('[3] Validate project layout');
        console.log('[Q] Quit');
        process.stdout.write('\x1b[0m');
        const choice = (await question(rl, '\nChoose an option: ')).trim().toLowerCase();
        rl.close();
        switch (choice) {
            case '1':
                await cmdPack([]);
                break;
            case '2':
                await cmdMetadata([]);
                break;
            case '3':
                cmdValidate([]);
                break;
            case 'q':
                break;
            default:
                console.error(`Unknown option: ${choice}`);
                process.exit(1);
        }
    }
    catch (err) {
        process.stdout.write('\x1b[0m');
        rl.close();
        throw err;
    }
}
// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
async function main() {
    const args = process.argv.slice(2);
    const subcommand = args[0];
    const rest = args.slice(1);
    try {
        switch (subcommand) {
            case 'pack':
                await cmdPack(rest);
                break;
            case 'metadata':
                await cmdMetadata(rest);
                break;
            case 'validate':
                cmdValidate(rest);
                break;
            case '--help':
            case '-h':
            case 'help':
                printHelp();
                break;
            case undefined:
                await cmdInteractive();
                break;
            default:
                console.error(`Unknown sub-command: ${subcommand}`);
                printHelp();
                process.exit(1);
        }
    }
    catch (err) {
        console.error('Error:', err instanceof Error ? err.message : String(err));
        process.exit(1);
    }
}
function printHelp() {
    console.log(`
SM-cli — Visual Novel Engine pack builder & metadata generator

Usage:
  sm-cli pack     [--dir=<path>] [--out=<path>] [--password=<pwd>] [--iterations=<n>]
  sm-cli metadata [--dir=<path>] [--password=<pwd>] [--iterations=<n>]
  sm-cli validate [--dir=<path>]
  sm-cli                      (interactive menu)

Options:
  --dir=<path>        Project directory containing Metadata.json, Assets/, Scripts/
                      (default: current working directory)
  --out=<path>        Output path for the .fap file (default: <dir>/game.fap)
  --password=<pwd>    Encrypt the pack; generates a matching game.key file.
                      The password is NEVER stored in Metadata.json.
  --iterations=<n>    PBKDF2 iteration count (default: 100000)
  -h, --help          Show this help

Examples:
  sm-cli pack
  sm-cli pack --password=secret123
  sm-cli pack --dir=./my-game --out=./release/Story.fap --password=secret
  sm-cli validate --dir=./my-game
  sm-cli metadata
`);
}
if (require.main === module) {
    main();
}
