import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import log from 'electron-log';
import { GameEngine } from './gameEngine';

const ALLOWED_SCENE_EXTENSIONS = ['.png', '.jpg', '.jpeg'];
const ALLOWED_CHARACTER_EXTENSIONS = ['.png'];

function isPathSafe(basePath: string, requestedPath: string): boolean {
  const resolved = path.resolve(basePath, requestedPath);
  const baseResolved = path.resolve(basePath);
  return resolved.startsWith(baseResolved) && !resolved.includes('..');
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9_\-.]/g, '');
}

let mainWindow: BrowserWindow | null = null;
let gameEngine: GameEngine | null = null;

log.transports.file.level = 'info';
log.transports.console.level = 'debug';

async function createWindow(): Promise<void> {
  log.info('Creating main window');

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'SM Visual Novel Engine',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  gameEngine = new GameEngine(mainWindow);
  await gameEngine.initialize();
}

app.whenReady().then(async () => {
  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('get-metadata', async () => {
  return gameEngine?.getMetadata();
});

ipcMain.handle('parse-command', async (_event, command: string) => {
  return gameEngine?.parseCommand(command);
});

ipcMain.handle('run-scenario', async () => {
  return gameEngine?.runScenario();
});

ipcMain.handle('reset-game', async () => {
  return gameEngine?.resetGame();
});

ipcMain.handle('set-current-background', async (_event, background: string) => {
  gameEngine?.setCurrentBackground(background);
});

ipcMain.handle('draw-background', async (_event, background: string) => {
  mainWindow?.webContents.send('draw-background', background);
});

ipcMain.handle('draw-character', async (_event, characterName: string, sprite: string) => {
  mainWindow?.webContents.send('draw-character', characterName, sprite);
});

ipcMain.handle('show-error', async (_event, error: string) => {
  log.error(error);
  mainWindow?.webContents.send('show-error', error);
});

ipcMain.handle('show-character', async (_event, characterName: string, animation: number) => {
  mainWindow?.webContents.send('show-character', characterName, animation);
});

ipcMain.handle('hide-character', async (_event, characterName: string, animation: number) => {
  mainWindow?.webContents.send('hide-character', characterName, animation);
});

ipcMain.handle('remove-character', async (_event, characterName: string, animation: number) => {
  mainWindow?.webContents.send('remove-character', characterName, animation);
});

ipcMain.handle('show-choices', async (_event, question: string, choices: { text: string; line: number }[]) => {
  mainWindow?.webContents.send('show-choices', question, choices);
});

ipcMain.handle('select-choice', async (_event, choiceText: string, line: number) => {
  await gameEngine?.selectChoice(choiceText, line);
});

ipcMain.handle('load-scene-image', async (_event, name: string) => {
  const safeName = sanitizeFileName(name);
  const baseDir = path.join(process.cwd(), 'Scenes');
  
  if (!isPathSafe(baseDir, safeName)) {
    log.warn(`Path traversal attempt detected: ${name}`);
    return null;
  }
  
  for (const ext of ALLOWED_SCENE_EXTENSIONS) {
    const imagePath = path.join(baseDir, `${safeName}${ext}`);
    try {
      const stat = await fs.stat(imagePath);
      if (stat.isFile()) {
        return await fs.readFile(imagePath);
      }
    } catch {
      continue;
    }
  }
  return null;
});

ipcMain.handle('load-character-image', async (_event, characterName: string, sprite: string) => {
  const safeCharName = sanitizeFileName(characterName);
  const safeSprite = sanitizeFileName(sprite);
  const baseDir = path.join(process.cwd(), 'Characters', safeCharName);
  
  if (!isPathSafe(baseDir, safeSprite)) {
    log.warn(`Path traversal attempt detected: ${characterName}/${sprite}`);
    return null;
  }
  
  for (const ext of ALLOWED_CHARACTER_EXTENSIONS) {
    const imagePath = path.join(baseDir, `${safeSprite}${ext}`);
    try {
      const stat = await fs.stat(imagePath);
      if (stat.isFile()) {
        return await fs.readFile(imagePath);
      }
    } catch {
      continue;
    }
  }
  return null;
});
