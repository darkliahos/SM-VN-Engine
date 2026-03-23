import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import log from 'electron-log';
import { GameEngine } from './gameEngine';

let mainWindow: BrowserWindow | null = null;
let gameEngine: GameEngine | null = null;

log.transports.file.level = 'info';
log.transports.console.level = 'debug';

function createWindow(): void {
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
  gameEngine.initialize();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
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

ipcMain.handle('show-choices', async (_event, choices: { text: string; line: number }[]) => {
  mainWindow?.webContents.send('show-choices', choices);
});

ipcMain.handle('load-scene-image', async (_event, name: string) => {
  const { app: electronApp } = await import('electron');
  const imagePath = path.join(process.cwd(), 'Scenes', `${name}.png`);
  return fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null;
});

ipcMain.handle('load-character-image', async (_event, characterName: string, sprite: string) => {
  const imagePath = path.join(process.cwd(), 'Characters', characterName, `${sprite}.png`);
  return fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null;
});
