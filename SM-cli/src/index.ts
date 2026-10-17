#!/usr/bin/env node
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

enum ImageFormatType {
  Bitmap = 0,
  JPEG = 1,
  PNG = 2
}

interface EncryptionMetadata {
  Algorithm: string;
  Kdf: string;
  Iterations: number;
  Salt: string;
  Verifier: string;
}

interface Metadata {
  Title: string;
  TitleScreenImageName:string;
  Author: string;
  Version: string;
  DateGenerated: string;
  VersionHash: string;
  StartFile: string;
  ScenarioExtension: string;
  PictureFormatType: ImageFormatType;
  PackFormatVersion: number;
  Password?: string;
  Encryption?: EncryptionMetadata;
}

const version = "ALPHA";

const PACK_FORMAT_VERSION = 1;
const DEFAULT_KDF_ITERATIONS = 100000;
const VERIFIER_BYTES = 32;

function hashVersion(): string {
  return crypto.createHash('md5').update(version, 'ascii').digest('hex').toUpperCase();
}

/**
 * Builds the Encryption block for a pack. Only a PBKDF2 verifier is stored, never
 * the password itself: a key kept inside the container it protects is recoverable
 * by anyone who unzips it.
 */
function createEncryptionMetadata(password: string, iterations: number): EncryptionMetadata {
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

function readFlag(name: string): string | undefined {
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

  const question = (query: string): Promise<string> => {
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
    const titleScreenName = await question("Do you have a title screen image \n Type the name of the file excluding the extension and place the png image in the assets folder \n")
    const gameVersion = await question('Please type in the version number for this game\n');
    const startFile = await question('Please enter the name of the start file (without the extension)\n');

    const metadata: Metadata = {
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
  } catch (error) {
    // Reset terminal colors in case of error
    process.stdout.write('\x1b[0m');
    console.error('An error occurred:', error);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}
