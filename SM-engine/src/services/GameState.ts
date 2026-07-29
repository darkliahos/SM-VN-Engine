import { ScenarioStatus, ImageFormatType } from '../enums';
import {
  Game,
  Metadata,
  RunningScenario,
  Character,
  RanScenario,
} from '../models';
import { NoEjectedScenariosException, ScenarioNotRunningException } from '../exceptions';
import { generateGuid } from './StringUtils';

export class GameState {
  private static instance: GameState;
  private state: Game = new Game();

  private constructor() {}

  public static getInstance(): GameState {
    if (!GameState.instance) {
      console.log("Created new instance of game state")
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  public setupGameState(metaData: Metadata, debug: boolean): void {
    this.state = new Game();
    this.state.Title = metaData.Title;
    this.state.TitleScreenImageName = metaData.TitleScreenImageName || '';
    this.state.ImageFormatType = metaData.PictureFormatType;
    this.state.DebugMode = debug;
    this.state.StartFile = metaData.StartFile;
    this.state.ScenarioExtension = metaData.ScenarioExtension;
    this.state.CurrentScenario = this.setupScenario(metaData.StartFile, metaData.StartFile);
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

  public jumpScenarios(name: string, fileName: string): void {
    this.teardownCurrentScenario(ScenarioStatus.Ejected);
    this.setupScenario(name, fileName);
  }

  public getLastEjectedScenario(): RanScenario {
    const ejected = this.state.PreviousScenarios
      .filter(s => s.Status === ScenarioStatus.Ejected)
      .sort((a, b) => b.EjectionPrecidence - a.EjectionPrecidence);

    if (ejected.length === 0) {
      throw new NoEjectedScenariosException();
    }

    return ejected[0];
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
      LastBackground: scenario.Background,
      LastSound: "", //TODO We do not have this in state 
      EjectionPrecidence: this.state.EjectionCounter + 1
    });
    this.state.CurrentScenario = null;
    this.state.EjectionCounter = this.state.EjectionCounter + 1
  }

  public setupScenario(name: string, file: string): RunningScenario {
    const newScenario = new RunningScenario();
    newScenario.Id = generateGuid();
    newScenario.fileName = file;
    newScenario.Name = name;
    newScenario.Line = 0;
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
      TitleScreenImageName: this.state.TitleScreenImageName,
      Author: '',
      Version: '1.0.0',
      DateGenerated: new Date(),
      VersionHash: '',
      StartFile: this.state.StartFile,
      ScenarioExtension: this.state.ScenarioExtension,
      PictureFormatType: this.state.ImageFormatType,
    };
  }

  public dumpState(): void {
    console.group('GameState Dump');
    console.log('Title:', this.state.Title);
    console.log('TitleScreenImageName:', this.state.TitleScreenImageName);
    console.log('ImageFormatType:', ImageFormatType[this.state.ImageFormatType]);
    console.log('DebugMode:', this.state.DebugMode);
    console.log('StartFile:', this.state.StartFile);
    console.log('ScenarioExtension:', this.state.ScenarioExtension);

    if (this.state.CurrentScenario) {
      console.group('CurrentScenario');
      console.log('Id:', this.state.CurrentScenario.Id);
      console.log('Name:', this.state.CurrentScenario.Name);
      console.log('Line:', this.state.CurrentScenario.Line);
      console.log('Background:', this.state.CurrentScenario.Background);
      console.log('Redraw:', this.state.CurrentScenario.Redraw);

      console.group('CurrentChoiceSelector');
      console.log('Id:', this.state.CurrentScenario.CurrentChoiceSelector.Id);
      console.log('Question:', this.state.CurrentScenario.CurrentChoiceSelector.Question);
      console.log('Choices:', this.state.CurrentScenario.CurrentChoiceSelector.Choices);
      console.log('SelectedChoice:', this.state.CurrentScenario.CurrentChoiceSelector.SelectedChoice);
      console.log('EndLine:', this.state.CurrentScenario.CurrentChoiceSelector.EndLine);
      console.groupEnd();

      console.log('ChoiceSelectors:', JSON.stringify(this.state.CurrentScenario.ChoiceSelectors));

      console.group('Characters');
      for (const [id, character] of this.state.CurrentScenario.Characters) {
        console.group(`Character: ${character.FriendlyName} (${id})`);
        console.log('Identifier:', character.Identifier);
        console.log('FriendlyName:', character.FriendlyName);
        console.log('DisplayName:', character.DisplayName);
        console.log('Position:', { XAxis: character.Position.XAxis, YAxis: character.Position.YAxis });
        console.log('SpriteHeight:', character.SpriteHeight);
        console.log('SpriteWidth:', character.SpriteWidth);
        console.log('CurrentSprite:', character.CurrentSprite);
        console.log('InScene:', character.InScene);
        console.log('ScreenPosition:', character.ScreenPosition);
        console.groupEnd();
      }
      console.groupEnd();
      console.groupEnd();
    } else {
      console.log('CurrentScenario: null');
    }

    console.group('PreviousScenarios');
    for (let i = 0; i < this.state.PreviousScenarios.length; i++) {
      const prev = this.state.PreviousScenarios[i];
      console.group(`Scenario ${i}`);
      console.log('Id:', prev.Id);
      console.log('Name:', prev.Name);
      console.log('Status:', ScenarioStatus[prev.Status]);
      console.log('LastRunNumber:', prev.LastRunNumber);
      console.groupEnd();
    }
    console.groupEnd();
    console.groupEnd();
  }
}
