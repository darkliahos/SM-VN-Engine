import * as fs from 'fs';
import * as path from 'path';
import { BrowserWindow } from 'electron';
import { Metadata } from '../models';
import { GameState, DirtyParser, StateManager, ConsoleAlertHandler } from '../services';
import log from 'electron-log';

export class GameEngine {
  private parser: DirtyParser;
  private alertHandler: ConsoleAlertHandler;
  private stateManager: StateManager;
  private scenarioLines: string[] = [];
  private metadata: Metadata | null = null;

  constructor(private mainWindow: BrowserWindow | null) {
    this.alertHandler = new ConsoleAlertHandler();
    this.stateManager = new StateManager(this.alertHandler);
    this.parser = new DirtyParser(this.stateManager);
  }

  public initialize(): void {
    try {
      this.loadMetadata();
      GameState.getInstance().setupGameState(this.metadata!, false);
      this.loadScenario();
      log.info('Game engine initialized successfully');
    } catch (error) {
      log.error('Failed to initialize game engine:', error);
      this.alertHandler.showError(error as Error);
    }
  }

  private loadMetadata(): void {
    const metadataPath = path.join(process.cwd(), 'Metadata.json');
    console.log(metadataPath);
    if (!fs.existsSync(metadataPath)) {
      throw new Error('Metadata.json not found');
    }

    const content = fs.readFileSync(metadataPath, 'utf-8');
    this.metadata = JSON.parse(content);
  }

  private loadScenario(): void {
    const scenarioPath = path.join(process.cwd(), 'Scenarios');
    const startFile = GameState.getInstance().getStartFile();
    const scenarioFile = path.join(scenarioPath, startFile);

    if (!fs.existsSync(scenarioFile)) {
      throw new Error(`Start file not found: ${scenarioFile}`);
    }

    this.scenarioLines = fs.readFileSync(scenarioFile, 'utf-8').split('\n');
  }

  public getMetadata(): Metadata | null {
    return this.metadata;
  }

  public parseCommand(command: string): any {
    return this.parser.parse(command);
  }

  public async runScenario(): Promise<void> {
    const lines = this.scenarioLines;
    
    for (let lineIndex = GameState.getInstance().getCurrentLine(); lineIndex < lines.length; lineIndex++) {
      const command = lines[lineIndex].trim();
      
      if (!command) {
        continue;
      }

      try {
        const instruction = this.parser.parse(command);

        if (instruction) {
          await this.executeInstruction(instruction);
        }

        if (GameState.getInstance().getRedraw()) {
          await this.redrawScene();
        }

        if (this.shouldForceInput(instruction)) {
          GameState.getInstance().setRedraw(true);
          GameState.getInstance().setCurrentLine(lineIndex + 1);
          break;
        }
      } catch (error) {
        log.error(`Error parsing command at line ${lineIndex}: ${command}`, error);
        this.alertHandler.showError(error as Error);
      }

      if (lineIndex >= lines.length - 1) {
        break;
      }
    }
  }

  private async executeInstruction(instruction: any): Promise<void> {
    switch (instruction.MethodName) {
      case 'DrawCharacter':
        this.mainWindow?.webContents.send('draw-character', instruction.Parameters[0], instruction.Parameters[1], instruction.Parameters[3] ?? 1);
        break;
      case 'DrawScene':
        GameState.getInstance().setCurrentBackground(instruction.Parameters[0]);
        this.mainWindow?.webContents.send('draw-background', instruction.Parameters[0]);
        break;
      case 'WriteText':
        this.mainWindow?.webContents.send('write-text', instruction.Parameters[0], instruction.Parameters[1]);
        break;
      case 'Jump':
        if (instruction.Parameters.length > 0) {
          // Scenario jump
        }
        break;
      case 'EndGame':
        this.mainWindow?.webContents.send('end-game');
        break;
      case 'WipeImage':
        this.mainWindow?.webContents.send('hide-character', instruction.Parameters[0], instruction.Parameters[1]);
        break;
      case 'DrawImage':
        this.mainWindow?.webContents.send('show-character', instruction.Parameters[0], instruction.Parameters[1]);
        break;
      case 'NEW CHOICE':
      case 'CHOICE SET QUESTION':
      case 'ADD CHOICE':
      case 'DISPLAY CHOICE':
        // TODO: Implement choices
        break;
    }
  }

  private async redrawScene(): Promise<void> {
    const background = GameState.getInstance().getCurrentBackground();
    if (background) {
      this.mainWindow?.webContents.send('draw-background', background);
    }

    const characters = GameState.getInstance().getCharactersInScene();
    for (const character of characters) {
      this.mainWindow?.webContents.send('draw-character', character.FriendlyName, character.CurrentSprite, character.ScreenPosition);
    }
  }

  private shouldForceInput(instruction: any): boolean {
    return instruction?.MethodName === 'WriteText';
  }

  public setCurrentBackground(background: string): void {
    GameState.getInstance().setCurrentBackground(background);
  }
}
