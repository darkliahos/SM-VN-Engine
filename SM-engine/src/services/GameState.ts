import { ScenarioStatus } from '../enums';
import {
  Game,
  Metadata,
  RunningScenario,
  Character,
  RanScenario,
} from '../models';
import { ScenarioNotRunningException } from '../exceptions';
import { generateGuid } from './StringUtils';

export class GameState {
  private static instance: GameState;
  private state: Game = new Game();

  private constructor() {}

  public static getInstance(): GameState {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  public setupGameState(metaData: Metadata, debug: boolean): void {
    this.state.Title = metaData.Title;
    this.state.ImageFormatType = metaData.PictureFormatType;
    this.state.DebugMode = debug;
    this.state.StartFile = metaData.StartFile;
    this.state.ScenarioExtension = metaData.ScenarioExtension;
    this.state.CurrentScenario = new RunningScenario();
    this.state.CurrentScenario.Name = 'Start';
    this.state.CurrentScenario.Line = 0;
  }

  public getTitle(): string {
    return this.state.Title;
  }

  public isDebug(): boolean {
    return this.state.DebugMode;
  }

  public getImageFormat() {
    return this.state.ImageFormatType;
  }

  public getStartFile(): string {
    return `${this.state.StartFile}.${this.state.ScenarioExtension}`;
  }

  public getScenarioFileExtension(): string {
    return this.state.ScenarioExtension;
  }

  public getCurrentBackground(): string {
    return this.getRunningScenario().Background;
  }

  public setCurrentBackground(background: string): void {
    this.getRunningScenario().Background = background;
  }

  public setCurrentLine(line: number): void {
    this.getRunningScenario().Line = line;
  }

  public getCurrentLine(): number {
    return this.getRunningScenario().Line;
  }

  public getRedraw(): boolean {
    return this.getRunningScenario().Redraw;
  }

  public setRedraw(redraw: boolean): void {
    this.getRunningScenario().Redraw = redraw;
  }

  public jumpScenarios(name: string): void {
    this.teardownCurrentScenario(ScenarioStatus.Ejected);
    this.setupScenario(name);
  }

  public getRunningScenario(): RunningScenario {
    if (!this.state.CurrentScenario) {
      throw new ScenarioNotRunningException();
    }
    return this.state.CurrentScenario;
  }

  public teardownCurrentScenario(status: ScenarioStatus): void {
    const scenario = this.getRunningScenario();
    this.state.PreviousScenarios.push({
      Id: scenario.Id,
      Name: scenario.Name,
      Status: status,
      LastRunNumber: scenario.Line,
    });
    this.state.CurrentScenario = null;
  }

  public setupScenario(name: string): RunningScenario {
    const newScenario = new RunningScenario();
    newScenario.Id = generateGuid();
    newScenario.Name = name;
    this.state.CurrentScenario = newScenario;
    return newScenario;
  }

  public getCharactersInScene(): Character[] {
    const scenario = this.getRunningScenario();
    return Array.from(scenario.Characters.values()).filter(c => c.InScene);
  }

  public characterExists(friendlyName: string): boolean {
    const scenario = this.getRunningScenario();
    return Array.from(scenario.Characters.values()).some(c => c.FriendlyName === friendlyName);
  }

  public addCharacter(character: Character): boolean {
    const id = generateGuid();
    character.Identifier = id;
    this.getRunningScenario().Characters.set(id, character);
    return true;
  }

  public removeCharacter(friendlyName: string): boolean {
    const scenario = this.getRunningScenario();
    for (const [id, char] of scenario.Characters) {
      if (char.FriendlyName === friendlyName) {
        return scenario.Characters.delete(id);
      }
    }
    return false;
  }

  public removeAllCharacters(): void {
    this.getRunningScenario().Characters = new Map();
  }

  public placeCharacter(friendlyName: string, x: number, y: number, height: number = 0, width: number = 0): boolean {
    const scenario = this.getRunningScenario();
    for (const char of scenario.Characters.values()) {
      if (char.FriendlyName === friendlyName) {
        char.Position.XAxis = x;
        char.Position.YAxis = y;
        if (height > 0) char.SpriteHeight = height;
        if (width > 0) char.SpriteWidth = width;
        return true;
      }
    }
    return false;
  }

  public showCharacter(friendlyName: string): boolean {
    const scenario = this.getRunningScenario();
    for (const char of scenario.Characters.values()) {
      if (char.FriendlyName === friendlyName) {
        char.InScene = true;
        return true;
      }
    }
    return false;
  }

  public hideCharacter(friendlyName: string): boolean {
    const scenario = this.getRunningScenario();
    for (const char of scenario.Characters.values()) {
      if (char.FriendlyName === friendlyName) {
        char.InScene = false;
        return true;
      }
    }
    return false;
  }

  public changeCharacterName(friendlyName: string, newDisplayName: string): void {
    const scenario = this.getRunningScenario();
    for (const char of scenario.Characters.values()) {
      if (char.FriendlyName === friendlyName) {
        char.DisplayName = newDisplayName;
        return;
      }
    }
  }

  public changeSprite(friendlyName: string, sprite: string): boolean {
    const scenario = this.getRunningScenario();
    for (const char of scenario.Characters.values()) {
      if (char.FriendlyName === friendlyName) {
        char.CurrentSprite = sprite;
        return true;
      }
    }
    return false;
  }

  public createChoice(id: string): void {
    const scenario = this.getRunningScenario();
    scenario.CurrentChoiceSelector = {
      Id: id,
      Question: '',
      Choices: {},
    };
  }

  public setChoiceQuestion(question: string): void {
    this.getRunningScenario().CurrentChoiceSelector.Question = question;
  }

  public addChoice(key: string): void {
    const scenario = this.getRunningScenario();
    scenario.CurrentChoiceSelector.Choices[key] = this.getCurrentLine() + 1;
  }

  public getMetadata(): Metadata {
    return {
      Title: this.state.Title,
      Author: '',
      Version: '1.0.0',
      DateGenerated: new Date(),
      VersionHash: '',
      StartFile: this.state.StartFile,
      ScenarioExtension: this.state.ScenarioExtension,
      PictureFormatType: this.state.ImageFormatType,
    };
  }
}
