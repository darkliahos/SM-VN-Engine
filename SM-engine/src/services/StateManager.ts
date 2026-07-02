import { Animation, Direction, ScenarioStatus } from '../enums';
import { Character, Coordinate } from '../models';
import { GameState } from './GameState';
import { IAlertHandler } from './AlertHandler';

export interface IStateManager {
  addCharacter(friendlyName: string, spriteName: string, animation: Animation, screenPosition?: number): void;
  addChoice(choice: string): void;
  changeCharacterDisplayName(friendlyName: string, displayName: string): void;
  changeCharacterSprite(friendlyName: string, spriteName: string, animation: Animation): void;
  checkCharacterExists(friendlyName: string): boolean;
  createFork(currentGuid: string): void;
  gameOver(): void;
  hideCharacter(friendlyName: string, animation: Animation): void;
  jumpLine(number: number): void;
  jumpScenario(scenario: string): void;
  moveCharacter(friendlyName: string, direction: Direction, pixels: number): void;
  placeCharacter(friendlyName: string, x: number, y: number, scaleHeight?: number, scaleWidth?: number): void;
  playSound(fileName: string, loop: boolean, volume?: number): void;
  removeCharacter(friendlyName: string, animation: Animation): void;
  setForkQuestion(question: string): void;
  showCharacter(friendlyName: string, animation: Animation): void;
  showChoices(): void;
  changeBackground(sprite: string):void
}

export class StateManager implements IStateManager {
  constructor(private alertHandler: IAlertHandler) { }

  public addCharacter(friendlyName: string, spriteName: string, _animation: Animation, screenPosition: number = 1): void {
    if (!GameState.getInstance().showCharacter(friendlyName)) {
      const character = new Character();
      character.CurrentSprite = spriteName;
      character.FriendlyName = friendlyName;
      character.DisplayName = friendlyName;
      character.Position = new Coordinate(300, 300);
      character.InScene = true;
      character.SpriteHeight = 50;
      character.SpriteWidth = 50;
      character.ScreenPosition = screenPosition;
      GameState.getInstance().addCharacter(character);
    }
  }

  public addChoice(choice: string): void {
    GameState.getInstance().addChoice(choice);
  }

  public changeCharacterDisplayName(friendlyName: string, displayName: string): void {
    GameState.getInstance().changeCharacterName(friendlyName, displayName);
  }

  public changeCharacterSprite(friendlyName: string, spriteName: string, _animation: Animation): void {
    if (GameState.getInstance().changeSprite(friendlyName, spriteName)) {
      GameState.getInstance().setRedraw(true);
    }
  }

  public checkCharacterExists(friendlyName: string): boolean {
    return GameState.getInstance().characterExists(friendlyName);
  }

  public createFork(currentGuid: string): void {
    GameState.getInstance().createChoice(currentGuid);
  }

  public gameOver(): void {
    GameState.getInstance().teardownCurrentScenario(ScenarioStatus.Ended);
    GameState.getInstance().setupScenario('GameOver');
    GameState.getInstance().setCurrentBackground('GameOver');
    GameState.getInstance().setRedraw(true);
  }

  public hideCharacter(friendlyName: string, _animation: Animation): void {
    if (!GameState.getInstance().hideCharacter(friendlyName)) {
      this.alertHandler.showUserError(`${friendlyName} may not exist, unable to hide character`);
    }
    GameState.getInstance().setRedraw(true);
  }

  public jumpLine(number: number): void {
    GameState.getInstance().setCurrentLine(number);
  }

  public jumpScenario(scenario: string): void {
    GameState.getInstance().jumpScenarios(scenario);
  }

  public moveCharacter(friendlyName: string, _direction: Direction, _pixels: number): void {
    this.alertHandler.showWarning(`Character movement not fully implemented: ${friendlyName}`);
  }

  public placeCharacter(friendlyName: string, x: number, y: number, scaleHeight: number = 0, scaleWidth: number = 0): void {
    if (GameState.getInstance().placeCharacter(friendlyName, x, y, scaleHeight, scaleWidth)) {
      GameState.getInstance().setRedraw(true);
    }
  }

  public playSound(fileName: string, loop: boolean, volume?: number): void {
    this.alertHandler.showInfo(`Sound play requested: ${fileName} (loop: ${loop}, vol: ${volume})`);
  }

  public removeCharacter(friendlyName: string, _animation: Animation): void {
    if (!GameState.getInstance().removeCharacter(friendlyName)) {
      throw new Error(`Failed to remove ${friendlyName}`);
    }
    GameState.getInstance().setRedraw(true);
  }

  public setForkQuestion(question: string): void {
    GameState.getInstance().setChoiceQuestion(question);
  }

  public showCharacter(friendlyName: string, _animation: Animation): void {
    if (!GameState.getInstance().showCharacter(friendlyName)) {
      this.alertHandler.showUserError(`Unable to show ${friendlyName}, character may not exist`);
    }
  }

  public showChoices(): void {
    this.alertHandler.showWarning('Choice display not fully implemented');
  }

  public changeBackground(sprite: string):void {
    GameState.getInstance().setCurrentBackground(sprite);
  }
}
