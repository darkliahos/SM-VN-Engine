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
const readline = __importStar(require("readline"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
var ImageFormatType;
(function (ImageFormatType) {
    ImageFormatType[ImageFormatType["Bitmap"] = 0] = "Bitmap";
    ImageFormatType[ImageFormatType["JPEG"] = 1] = "JPEG";
    ImageFormatType[ImageFormatType["PNG"] = 2] = "PNG";
})(ImageFormatType || (ImageFormatType = {}));
const version = "ALPHA";
const PACK_FORMAT_VERSION = 1;
const DEFAULT_KDF_ITERATIONS = 100000;
const VERIFIER_BYTES = 32;
function hashVersion() {
    return crypto.createHash('md5').update(version, 'ascii').digest('hex').toUpperCase();
}
/**
 * Builds the Encryption block for a pack. Only a PBKDF2 verifier is stored, never
 * the password itself: a key kept inside the container it protects is recoverable
 * by anyone who unzips it.
 */
function createEncryptionMetadata(password, iterations) {
    const salt = crypto.randomBytes(16);
    const verifier = crypto.pbkdf2Sync(password, salt, iterations, VERIFIER_BYTES, 'sha256');
    return {
        Algorithm: 'ZipCrypto',
        Kdf: 'pbkdf2-sha256',
        Iterations: iterations,
        Salt: salt.toString('base64'),
        Verifier: verifier.toString('base64')
    };
}
function readFlag(name) {
    const prefix = `--${name}=`;
    const argv = process.argv.slice(2);
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
async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    const question = (query) => {
        return new Promise((resolve) => rl.question(query, resolve));
    };
    try {
        // Set terminal colors: Blue background (\x1b[44m), Yellow foreground (\x1b[33m)
        process.stdout.write('\x1b[44m\x1b[33m');
        // --password / --iterations let a pack be built for an encrypted FAP without
        // editing the generated file by hand.
        const passwordFlag = readFlag('password');
        const iterationsFlag = readFlag('iterations');
        const iterations = iterationsFlag ? Number(iterationsFlag) : DEFAULT_KDF_ITERATIONS;
        if (!Number.isFinite(iterations) || iterations <= 0) {
            throw new Error(`Invalid --iterations value: ${iterationsFlag}`);
        }
        console.log('=====Metadata Generator===== ');
        const title = await question('What is the title of your game?\n');
        const author = await question('Who is the creator of this game?\n');
        const titleScreenName = await question("Do you have a title screen image \n Type the name of the file excluding the extension and place the png image in the assets folder \n");
        const gameVersion = await question('Please type in the version number for this game\n');
        const startFile = await question('Please enter the name of the start file (without the extension)\n');
        const metadata = {
            Title: title,
            TitleScreenImageName: titleScreenName,
            Author: author,
            Version: gameVersion,
            DateGenerated: new Date().toISOString(),
            VersionHash: hashVersion(),
            PictureFormatType: ImageFormatType.PNG, // Hardcoded to PNG per C# version
            ScenarioExtension: 'txt',
            StartFile: startFile,
            PackFormatVersion: PACK_FORMAT_VERSION
        };
        if (passwordFlag !== undefined) {
            if (passwordFlag === '') {
                throw new Error('--password was supplied with an empty value');
            }
            metadata.Password = passwordFlag;
            metadata.Encryption = createEncryptionMetadata(passwordFlag, iterations);
        }
        const outputFilePath = path.join(process.cwd(), 'Metadata.json');
        fs.writeFileSync(outputFilePath, JSON.stringify(metadata, null, 2), 'utf8');
        console.log('\nCongratulations, your new metadata file has been generated');
        if (metadata.Password) {
            console.log('Password has been set in Metadata.json.');
        }
        // Reset terminal colors before blocking on keypress/exit
        process.stdout.write('\x1b[0m');
        await question('Press Enter to exit...\n');
    }
    catch (error) {
        // Reset terminal colors in case of error
        process.stdout.write('\x1b[0m');
        console.error('An error occurred:', error);
    }
    finally {
        rl.close();
    }
}
if (require.main === module) {
    main();
}
