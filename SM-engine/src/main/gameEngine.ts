import * as fs from 'fs/promises';
import * as path from 'path';
import { BrowserWindow } from 'electron';
import { Metadata, GameWindowInstruction } from '../models';
import { GameState, DirtyParser, StateManager, ConsoleAlertHandler } from '../services';
import { generateGuid } from '../services/StringUtils';
import log from 'electron-log';
import { getResourcePath } from './pathUtils';

interface ScenarioStackFrame {
  fileName: string;
  scenarioName: string;
  lines: string[];
  returnLine: number;
}

export class GameEngine {
  private parser: DirtyParser;
  private alertHandler: ConsoleAlertHandler;
  private stateManager: StateManager;
  private scenarioLines: string[] = [];
  private currentFileName: string = 'Start.txt';
  private scenarioStack: ScenarioStackFrame[] = [];
  private metadata: Metadata | null = null;

  constructor(private mainWindow: BrowserWindow | null) {
    this.alertHandler = new ConsoleAlertHandler();
    this.stateManager = new StateManager(this.alertHandler);
    this.parser = new DirtyParser(this.stateManager);
  }

  public async initialize(): Promise<void> {
    try {
      await this.loadMetadata();
      if (!this.metadata) {
        throw new Error('Failed to load metadata');
      }
      GameState.getInstance().setupGameState(this.metadata, false);
      await this.loadScenario();
      log.info('Game engine initialized successfully');
    } catch (error) {
      log.error('Failed to initialize game engine:', error);
      this.alertHandler.showError(error as Error);
    }
  }

  private async loadMetadata(): Promise<void> {
    const metadataPath = getResourcePath('Metadata.json');
    const content = await fs.readFile(metadataPath, 'utf-8');
    this.metadata = JSON.parse(content);
  }

  private async loadScenario(): Promise<void> {
    const scenarioPath = getResourcePath('Scenarios');
    const startFile = GameState.getInstance().getStartFile();
    const scenarioFile = path.join(scenarioPath, startFile);

    const content = await fs.readFile(scenarioFile, 'utf-8');
    this.scenarioLines = content.split('\n');
    this.currentFileName = startFile;
    this.scenarioStack = [];
  }

  private async loadTargetScenario(targetScenario: string): Promise<void> {
    const normalizedTarget = targetScenario.trim().toLowerCase();
    for (let i = 0; i < this.scenarioLines.length; i++) {
      const line = this.scenarioLines[i].trim();
      if (line.toLowerCase().startsWith('begin scenario')) {
        const markerName = line.substring(14).replace(/"/g, '').trim().toLowerCase();
        if (markerName === normalizedTarget) {
          GameState.getInstance().setCurrentLine(i);
          return;
        }
      }
    }

    const scenarioPath = getResourcePath('Scenarios');
    const ext = GameState.getInstance().getScenarioFileExtension() || 'txt';
    const candidateFiles = [
      targetScenario,
      `${targetScenario}.${ext}`,
      `${targetScenario.replace(/\s+/g, '')}.${ext}`,
      `${targetScenario.toLowerCase()}.${ext}`
    ];

    for (const file of candidateFiles) {
      const scenarioFile = path.join(scenarioPath, file);
      try {
        const content = await fs.readFile(scenarioFile, 'utf-8');
        const currentLine = GameState.getInstance().getCurrentLine();
        const currentScenarioName = GameState.getInstance().getRunningScenario()?.Name || 'Start';

        this.scenarioStack.push({
          fileName: this.currentFileName,
          scenarioName: currentScenarioName,
          lines: this.scenarioLines,
          returnLine: currentLine + 1,
        });

        this.scenarioLines = content.split('\n');
        this.currentFileName = file;
        GameState.getInstance().jumpScenarios(targetScenario);
        GameState.getInstance().setCurrentLine(0);
        log.info(`Jumped to scenario file: ${file} (pushed ${this.scenarioStack[this.scenarioStack.length - 1].fileName} to stack)`);
        return;
      } catch {
        continue;
      }
    }

    log.warn(`Scenario target not found: ${targetScenario}`);
  }

  private popScenarioStack(): boolean {
    if (this.scenarioStack.length > 0) {
      const parentFrame = this.scenarioStack.pop()!;
      this.scenarioLines = parentFrame.lines;
      this.currentFileName = parentFrame.fileName;
      GameState.getInstance().jumpScenarios(parentFrame.scenarioName);
      GameState.getInstance().setCurrentLine(parentFrame.returnLine);
      log.info(`Returned to parent scenario: ${parentFrame.fileName} at line ${parentFrame.returnLine}`);
      return true;
    }
    return false;
  }

  public getMetadata(): Metadata | null {
    return this.metadata;
  }

  public parseCommand(command: string): GameWindowInstruction | null {
    return this.parser.parse(command);
  }

  public async selectChoice(choiceText: string, line: number): Promise<void> {
    const activeScenario = GameState.getInstance().getRunningScenario();
    if (activeScenario && activeScenario.CurrentChoiceSelector) {
      activeScenario.CurrentChoiceSelector.SelectedChoice = choiceText;
    }
    GameState.getInstance().setCurrentLine(line);
    await this.runScenario();
  }

  public async runScenario(): Promise<void> {
    while (true) {
      const currentLineIndex = GameState.getInstance().getCurrentLine();
      if (currentLineIndex < 0 || currentLineIndex >= this.scenarioLines.length) {
        if (this.popScenarioStack()) {
          continue;
        }
        break;
      }

      const command = this.scenarioLines[currentLineIndex].trim();
      
      if (!command) {
        GameState.getInstance().setCurrentLine(currentLineIndex + 1);
        continue;
      }

      // Check if we are executing a choice branch and have encountered another FORK or END CHOICES.
      const currentChoiceSelector = GameState.getInstance().getRunningScenario().CurrentChoiceSelector;
      if (currentChoiceSelector && currentChoiceSelector.EndLine !== undefined) {
        if (command.startsWith('FORK') || command.startsWith('END CHOICES')) {
          const nextLine = currentChoiceSelector.EndLine + 1;
          GameState.getInstance().setCurrentLine(nextLine);
          currentChoiceSelector.EndLine = undefined;
          
          const activeScenario = GameState.getInstance().getRunningScenario();
          activeScenario.ChoiceSelectors.push({
            Id: currentChoiceSelector.Id,
            Question: currentChoiceSelector.Question,
            Choices: { ...currentChoiceSelector.Choices },
            SelectedChoice: currentChoiceSelector.SelectedChoice
          });
          
          continue;
        }
      }

      // Scan ahead for choice block
      if (command.startsWith('BEGIN CHOICES')) {
        let endIndex = -1;
        for (let i = currentLineIndex + 1; i < this.scenarioLines.length; i++) {
          if (this.scenarioLines[i].trim().startsWith('END CHOICES')) {
            endIndex = i;
            break;
          }
        }

        if (endIndex === -1) {
          log.error(`Missing END CHOICES for BEGIN CHOICES at line ${currentLineIndex}`);
          this.alertHandler.showUserError(`Syntax Error: BEGIN CHOICES at line ${currentLineIndex + 1} has no matching END CHOICES`);
          break;
        }

        const choiceId = generateGuid();
        GameState.getInstance().createChoice(choiceId);
        const selector = GameState.getInstance().getRunningScenario().CurrentChoiceSelector;
        selector.EndLine = endIndex;

        for (let i = currentLineIndex + 1; i < endIndex; i++) {
          const innerCommand = this.scenarioLines[i].trim();
          if (innerCommand.startsWith('QUESTION')) {
            const questionText = innerCommand.substring(9).replace(/"/g, '');
            GameState.getInstance().setChoiceQuestion(questionText);
          } else if (innerCommand.startsWith('FORK')) {
            const forkText = innerCommand.substring(5).replace(/"/g, '');
            selector.Choices[forkText] = i + 1;
          }
        }

        GameState.getInstance().setCurrentLine(endIndex);
      }

      try {
        const lineBeforeExecute = GameState.getInstance().getCurrentLine();
        const scenarioBeforeExecute = GameState.getInstance().getRunningScenario().Name;

        const instruction = this.parser.parse(this.scenarioLines[lineBeforeExecute].trim());

        if (instruction) {
          await this.executeInstruction(instruction);
        }

        if (GameState.getInstance().getRedraw()) {
          await this.redrawScene();
        }

        const lineAfterExecute = GameState.getInstance().getCurrentLine();
        const scenarioAfterExecute = GameState.getInstance().getRunningScenario()?.Name;

        const jumpOccurred = lineAfterExecute !== lineBeforeExecute || scenarioAfterExecute !== scenarioBeforeExecute;

        if (this.shouldForceInput(instruction)) {
          GameState.getInstance().setRedraw(true);
          if (!jumpOccurred) {
            GameState.getInstance().setCurrentLine(lineAfterExecute + 1);
          }
          break;
        }

        if (!jumpOccurred) {
          GameState.getInstance().setCurrentLine(lineAfterExecute + 1);
        }
      } catch (error) {
        log.error(`Error parsing command at line ${currentLineIndex}: ${this.scenarioLines[currentLineIndex]}`, error);
        this.alertHandler.showError(error as Error);
        break;
      }
    }
  }

  private async executeInstruction(instruction: GameWindowInstruction | null): Promise<void> {
    if (!instruction) return;
    
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
          await this.loadTargetScenario(instruction.Parameters[0]);
        }
        break;
      case 'EndGame':
        if (this.popScenarioStack()) {
          break;
        }
        this.mainWindow?.webContents.send('end-game');
        this.mainWindow?.webContents.send('stop-all-sounds');
        break;
      case 'WipeImage':
        this.mainWindow?.webContents.send('hide-character', instruction.Parameters[0], instruction.Parameters[1]);
        break;
      case 'DrawImage':
        this.mainWindow?.webContents.send('change-sprite', instruction.Parameters[0], instruction.Parameters[1]);
        break;
      case 'PLAY SOUND':
        this.mainWindow?.webContents.send('play-sound', instruction.Parameters[0], instruction.Parameters[1], instruction.Parameters[2]);
        break;
      case 'STOP SOUND':
        this.mainWindow?.webContents.send('stop-sound', instruction.Parameters[0]);
        break;
      case 'PAUSE SOUND':
        this.mainWindow?.webContents.send('pause-sound', instruction.Parameters[0]);
        break;
      case 'RESUME SOUND':
        this.mainWindow?.webContents.send('resume-sound', instruction.Parameters[0]);
        break;
      case 'DISPLAY CHOICE':
        const selector = GameState.getInstance().getRunningScenario().CurrentChoiceSelector;
        const choicesArray = Object.keys(selector.Choices).map(text => ({
          text,
          line: selector.Choices[text]
        }));
        this.mainWindow?.webContents.send('show-choices', selector.Question, choicesArray);
        break;
      case 'NEW CHOICE':
      case 'CHOICE SET QUESTION':
      case 'ADD CHOICE':
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

  private shouldForceInput(instruction: GameWindowInstruction | null): boolean {
    return instruction?.MethodName === 'WriteText' || instruction?.MethodName === 'DISPLAY CHOICE';
  }

  public setCurrentBackground(background: string): void {
    GameState.getInstance().setCurrentBackground(background);
  }

  public async resetGame(): Promise<void> {
    try {
      if (this.metadata) {
        this.scenarioStack = [];
        GameState.getInstance().setupGameState(this.metadata, false);
        await this.loadScenario();
        log.info('Game state reset successfully');
      }
    } catch (error) {
      log.error('Failed to reset game state:', error);
      this.alertHandler.showError(error as Error);
    }
  }
}
