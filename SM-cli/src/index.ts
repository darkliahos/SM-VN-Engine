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
}

const version = "ALPHA";

function hashVersion(): string {
  return crypto.createHash('md5').update(version, 'ascii').digest('hex').toUpperCase();
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
      StartFile: startFile
    };

    const outputFilePath = path.join(process.cwd(), 'Metadata.json');
    fs.writeFileSync(outputFilePath, JSON.stringify(metadata, null, 2), 'utf8');

    console.log('\nCongratulations, your new metadata file has been generated');
    
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
