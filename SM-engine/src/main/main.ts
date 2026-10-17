import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';
import log from 'electron-log';
import { GameEngine } from './gameEngine';
import { GameSource } from './content/GameSource';
import { openGameSource } from './content/locateGameSource';
import { registerAssetProtocol, registerAssetScheme } from './content/protocol';

let mainWindow: BrowserWindow | null = null;
let gameEngine: GameEngine | null = null;
let gameSource: GameSource | null = null;

log.transports.file.level = 'info';
log.transports.console.level = 'debug';

// Must run before the app ready event, and only once.
registerAssetScheme();

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

  gameEngine = new GameEngine(mainWindow, gameSource ?? undefined);
  await gameEngine.initialize();
}

async function bootstrap(): Promise<void> {
  // Registered before the source exists; the handler reads it at request time,
  // and the renderer cannot request anything until createWindow loads the page.
  registerAssetProtocol(() => gameSource);

  gameSource = await openGameSource();
  const meta = (gameSource as unknown as { buildMeta?: Record<string, unknown> }).buildMeta;
  if (meta) {
    log.info(`Loading game content from pack: ${gameSource.description} (entries=${gameSource.entryCount}, reused=${meta.reused}, warnings=${(meta.warnings as unknown[] | undefined)?.length ?? 0})`);
    log.info(`Source root: ${meta.sourceRoot}, cache: ${meta.cachePack}`);
  } else {
    log.info(`Loading game content from pack: ${gameSource.description} (entries=${gameSource.entryCount})`);
  }

  if (gameSource.requiresPassword && !gameSource.isUnlocked) {
    await dialog.showMessageBox({
      type: 'error',
      title: 'Password Required',
      message: 'A password is required in Metadata.json to open this game.',
      detail: 'The game could not be started because no valid password was found in Metadata.json.',
      buttons: ['Quit'],
    });
    app.quit();
    return;
  }

  await createWindow();
}

app.whenReady().then(async () => {
  try {
    await bootstrap();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error('Failed to start game:', error);
    await dialog.showMessageBox({
      type: 'error',
      title: 'Could Not Load Game',
      message: 'The game content could not be loaded.',
      detail: message,
      buttons: ['Quit'],
    });
    app.quit();
    return;
  }

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
