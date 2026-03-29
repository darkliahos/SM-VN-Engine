import { Animation, Direction, Position } from '../enums';
import { GameWindowInstruction } from '../models';
import { RegexConstants } from './RegexConstants';
import { containsInsensitive, generateGuid } from './StringUtils';
import { ParserException } from '../exceptions';
import { IStateManager } from './StateManager';
import { GameState } from './GameState';

export interface IParser {
  parse(command: string): GameWindowInstruction | null;
  getScenarioMarkers(lines: string[]): Map<string, number>;
  seekIndex(command: string): number;
}

export class DirtyParser implements IParser {
  private static readonly DEFAULT_SOUND_VOLUME = 0.5;

  constructor(private instructor: IStateManager) {}

  public getScenarioMarkers(lines: string[]): Map<string, number> {
    const markers = new Map<string, number>();
    lines.forEach((line, index) => {
      if (line.includes('BEGIN SCENARIO')) {
        markers.set(line, index);
      }
    });
    return markers;
  }

  public parse(command: string): GameWindowInstruction | null {
    if (containsInsensitive(command, 'says')) {
      return this.parseSays(command);
    }

    if (containsInsensitive(command, 'add')) {
      return this.parseAdd(command);
    }

    if (containsInsensitive(command, 'remove')) {
      return this.parseRemove(command);
    }

    if (containsInsensitive(command, 'show')) {
      return this.parseShow(command);
    }

    if (containsInsensitive(command, 'hide')) {
      return this.parseHide(command);
    }

    if (command.startsWith('MOVE')) {
      return this.parseMove(command);
    }

    if (command.startsWith('PLACE')) {
      return this.parsePlace(command);
    }

    if (command.startsWith('CHANGE SPRITE')) {
      return this.parseChangeSprite(command);
    }

    if (command.startsWith('CHANGE BACKGROUND')) {
      return this.parseChangeBackground(command);
    }

    if (command.startsWith('PLAY SOUND')) {
      return this.parsePlaySound(command);
    }

    if (command.startsWith('STOP SOUND')) {
      return this.parseStopSound(command);
    }

    if (command.startsWith('PAUSE SOUND')) {
      return this.parsePauseSound(command);
    }

    if (command.startsWith('RESUME SOUND')) {
      return this.parseResumeSound(command);
    }

    if (command.startsWith('BEGIN CHOICES')) {
      return this.parseBeginChoices(command);
    }

    if (command.startsWith('QUESTION')) {
      return this.parseQuestion(command);
    }

    if (command.startsWith('JUMP')) {
      return this.parseJump(command);
    }

    if (command.startsWith('FORK')) {
      return this.parseFork(command);
    }

    if (command.startsWith('END CHOICES')) {
      return this.parseEndChoices(command);
    }

    if (command === 'END STORY') {
      return this.parseEndStory(command);
    }

    return null;
  }

  private parseSays(command: string): GameWindowInstruction {
    const characterName = this.getPrimaryCharacterName(command);
    const match = command.match(RegexConstants.GetStuffInQuotes);
    
    if (match) {
      if (characterName) {
        this.instructor.checkCharacterExists(characterName);
      }
      const says = match[1];
      return new GameWindowInstruction('WriteText', [characterName, says]);
    }
    
    throw new ParserException('The character must say something', command);
  }

  private parseAdd(command: string): GameWindowInstruction {
    const characterName = this.getPrimaryCharacterName(command);
    const spriteMatch = command.match(RegexConstants.GetSprite);
    
    if (!spriteMatch) {
      throw new ParserException('Sprite was invalid', command);
    }
    
    let sprite = spriteMatch[1].trim();
    if (!sprite || sprite.length < 4) {
      throw new ParserException('Sprite was invalid', command);
    }
    
    const animationMatch = command.match(RegexConstants.GetStuffInAstrix);
    if (!animationMatch) {
      throw new ParserException('Animation was invalid', command);
    }
    
    const animationStr = animationMatch[1];
    const animation = Animation[animationStr as keyof typeof Animation];

    const positionMatch = command.match(RegexConstants.GetPosition);
    let position = Position.Centre;
    if (positionMatch) {
      const posStr = positionMatch[1].toLowerCase();
      if (posStr === 'left') position = Position.Left;
      else if (posStr === 'right') position = Position.Right;
      else if (posStr === 'centre' || posStr === 'center') position = Position.Centre;
    }
    
    this.instructor.addCharacter(characterName.trim(), sprite, animation, position);
    return new GameWindowInstruction('DrawCharacter', [characterName, sprite, animation, position]);
  }

  private parseRemove(command: string): GameWindowInstruction {
    const characterName = this.getPrimaryCharacterName(command);
    const animationMatch = command.match(RegexConstants.GetStuffInAstrix);
    const animation = animationMatch 
      ? Animation[animationMatch[1].trim() as keyof typeof Animation]
      : Animation.FadeOut;
    
    this.instructor.removeCharacter(characterName, animation);
    return new GameWindowInstruction('WipeImage', [characterName, animation]);
  }

  private parseShow(command: string): GameWindowInstruction {
    const characterName = this.getPrimaryCharacterName(command);
    const animationMatch = command.match(RegexConstants.GetStuffInAstrix);
    const animation = animationMatch 
      ? Animation[animationMatch[1].trim() as keyof typeof Animation]
      : Animation.None;
    
    this.instructor.showCharacter(characterName, animation);
    return new GameWindowInstruction('DrawImage', [characterName, animation]);
  }

  private parseHide(command: string): GameWindowInstruction {
    const characterName = this.getPrimaryCharacterName(command);
    const animationMatch = command.match(RegexConstants.GetStuffInAstrix);
    const animation = animationMatch 
      ? Animation[animationMatch[1].trim() as keyof typeof Animation]
      : Animation.FadeOut;
    
    this.instructor.hideCharacter(characterName, animation);
    return new GameWindowInstruction('WipeImage', [characterName, animation]);
  }

  private parseMove(command: string): GameWindowInstruction {
    const characterName = this.getPrimaryCharacterName(command);
    const directionValues = Object.keys(Direction).filter(k => !isNaN(Number(k)));
    
    const pixelMatch = command.match(RegexConstants.GetPixelValue);
    if (!pixelMatch) {
      throw new ParserException('Specify how much to move the character', command);
    }
    
    const moveBy = parseInt(pixelMatch[0].replace('px', ''), 10);
    const directionStr = this.findKeywords(command, directionValues);
    const direction = Direction[directionStr as keyof typeof Direction];
    
    this.instructor.moveCharacter(characterName, direction, moveBy);
    return new GameWindowInstruction('DrawImage', [characterName, direction, moveBy]);
  }

  private parsePlace(command: string): GameWindowInstruction {
    const characterName = this.getPrimaryCharacterName(command);
    const numericMatches = command.match(RegexConstants.GetRoundBracketNumbers);
    
    if (!numericMatches) {
      throw new ParserException('Invalid placement parameters', command);
    }
    
    const nums = numericMatches.map(n => parseInt(n, 10));
    
    if (nums.length === 2) {
      this.instructor.placeCharacter(characterName, nums[0], nums[1]);
      return new GameWindowInstruction('DrawImage', [characterName, nums[0], nums[1]]);
    }
    
    if (nums.length === 4) {
      this.instructor.placeCharacter(characterName, nums[0], nums[1], nums[2], nums[3]);
      return new GameWindowInstruction('DrawImage', [characterName, nums[0], nums[1], nums[2], nums[3]]);
    }
    
    throw new ParserException('The number of values in the parameters is invalid', command);
  }

  private parseChangeSprite(command: string): GameWindowInstruction {
    const spriteMatch = command.match(/\]\s*(\w+)\s*\*/);
    
    if (!spriteMatch) {
      throw new ParserException('Unable to process command, check syntax', command);
    }

    const sprite = spriteMatch[1].trim();
    if (!sprite) {
      throw new ParserException('Unable to parse sprite name', command);
    }
    
    const animationMatch = command.match(RegexConstants.GetStuffInAstrix);
    const animationStr = animationMatch ? animationMatch[1] : 'None';
    const characterName = this.getPrimaryCharacterName(command);
    const animation = Animation[animationStr.trim() as keyof typeof Animation];
    
    this.instructor.changeCharacterSprite(characterName, sprite, animation);
    return new GameWindowInstruction('DrawImage', [characterName, sprite, animation]);
  }

  private parseChangeBackground(command: string): GameWindowInstruction {
    const sprite = command.replace('CHANGE BACKGROUND', '').trim();
    GameState.getInstance().setCurrentBackground(sprite);
    return new GameWindowInstruction('DrawScene', [sprite]);
  }

  private parsePlaySound(command: string): GameWindowInstruction {
    const match = command.match(RegexConstants.GetStuffInQuotes);
    if (!match) {
      throw new ParserException('Sound file must be quoted', command);
    }
    
    const file = match[1];
    const loop = containsInsensitive(command, 'loop');
    const volumeMatch = command.match(/VOL:(\d+)/i);
    const volume = volumeMatch ? parseInt(volumeMatch[1], 10) / 100 : DirtyParser.DEFAULT_SOUND_VOLUME;
    this.instructor.playSound(file, loop);
    return new GameWindowInstruction('PLAY SOUND', [file, loop, volume]);
  }

  private parseStopSound(command: string): GameWindowInstruction {
    const match = command.match(RegexConstants.GetStuffInQuotes);
    if (!match) {
      throw new ParserException('Sound file must be quoted', command);
    }
    
    const file = match[1];
    return new GameWindowInstruction('STOP SOUND', [file]);
  }

  private parsePauseSound(command: string): GameWindowInstruction {
    const match = command.match(RegexConstants.GetStuffInQuotes);
    if (!match) {
      throw new ParserException('Sound file must be quoted', command);
    }
    
    const file = match[1];
    return new GameWindowInstruction('PAUSE SOUND', [file]);
  }

  private parseResumeSound(command: string): GameWindowInstruction {
    const match = command.match(RegexConstants.GetStuffInQuotes);
    if (!match) {
      throw new ParserException('Sound file must be quoted', command);
    }
    
    const file = match[1];
    return new GameWindowInstruction('RESUME SOUND', [file]);
  }

  private parseBeginChoices(command: string): GameWindowInstruction {
    const choiceId = generateGuid();
    this.instructor.createFork(choiceId);
    return new GameWindowInstruction('NEW CHOICE', [choiceId]);
  }

  private parseQuestion(command: string): GameWindowInstruction {
    const questionText = command.substring(9).replace(/"/g, '');
    this.instructor.setForkQuestion(questionText);
    return new GameWindowInstruction('CHOICE SET QUESTION', [questionText]);
  }

  private parseJump(command: string): GameWindowInstruction {
    const jumpResult = command.replace('JUMP ', '').trim();
    
    if (jumpResult.startsWith('SCENARIO')) {
      const match = command.match(RegexConstants.GetStuffInQuotes);
      if (match) {
        const scenario = match[1];
        this.instructor.jumpScenario(scenario);
        return new GameWindowInstruction('Jump', [scenario]);
      }
    }
    
    const number = parseInt(jumpResult, 10);
    this.instructor.jumpLine(number);
    return new GameWindowInstruction('Jump', []);
  }

  private parseFork(command: string): GameWindowInstruction {
    const fork = command.substring(5).replace(/"/g, '');
    this.instructor.addChoice(fork);
    return new GameWindowInstruction('ADD CHOICE', [fork]);
  }

  private parseEndChoices(command: string): GameWindowInstruction {
    return new GameWindowInstruction('DISPLAY CHOICE', []);
  }

  private parseEndStory(command: string): GameWindowInstruction {
    this.instructor.gameOver();
    return new GameWindowInstruction('EndGame', []);
  }

  public seekIndex(command: string): number {
    // TODO: Implement
    return 0;
  }

  private getPrimaryCharacterName(command: string): string {
    const match = command.match(RegexConstants.CharacterNameRegex);
    return match ? match[1] : '';
  }

  private findKeywords(input: string, keywords: string[]): string {
    const pattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'i');
    const match = input.match(pattern);
    return match ? match[0] : '';
  }
}
