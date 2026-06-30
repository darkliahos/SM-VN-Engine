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
function hashVersion() {
    return crypto.createHash('md5').update(version, 'ascii').digest('hex').toUpperCase();
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
        console.log('=====Metadata Generator===== ');
        const title = await question('What is the title of your game?\n');
        const author = await question('Who is the creator of this game?\n');
        const gameVersion = await question('Please type in the version number for this game\n');
        const startFile = await question('Please enter the name of the start file (without the extension)\n');
        const metadata = {
            Title: title,
            Author: author,
            Version: gameVersion,
            DateGenerated: new Date().toISOString(),
            VersionHash: hashVersion(),
            PictureFormatType: ImageFormatType.PNG, // Hardcoded to PNG per C# version
            ScenarioExtension: 'txt',
            StartFile: startFile
        };
        const outputFilePath = path.join(process.cwd(), 'Metadata.json');
        fs.writeFileSync(outputFilePath, JSON.stringify(metadata, null, 2), 'utf8');
        console.log('\nCongratulations, your new metadata file has been generated');
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
