import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DirtyParser } from '../src/services/Parser';
import { IStateManager } from '../src/services/StateManager';
import { GameState } from '../src/services/GameState';
import { Animation as AnimationEnum, Direction } from '../src/enums';

describe('DirtyParser', () => {
  let parser: DirtyParser;
  let mockInstructor: Partial<IStateManager>;

  beforeEach(() => {
    mockInstructor = {
      checkCharacterExists: vi.fn(),
      addCharacter: vi.fn(),
      removeCharacter: vi.fn(),
      showCharacter: vi.fn(),
      hideCharacter: vi.fn(),
      moveCharacter: vi.fn(),
      placeCharacter: vi.fn(),
      changeCharacterSprite: vi.fn(),
      playSound: vi.fn(),
      createFork: vi.fn(),
      setForkQuestion: vi.fn(),
      addChoice: vi.fn(),
      jumpScenario: vi.fn(),
      jumpLine: vi.fn(),
      gameOver: vi.fn(),
      changeBackground: vi.fn(),
    };
    parser = new DirtyParser(mockInstructor as IStateManager);
  });

  describe('parse - says commands', () => {
    it('should parse a says command with character name', () => {
      const result = parser.parse('[Sam] says "Hello, world!"');
      
      expect(result).not.toBeNull();
      expect(result!.MethodName).toBe('WriteText');
      expect(result!.Parameters).toEqual(['Sam', 'Hello, world!']);
    });

    it('should parse a says command without character name', () => {
      const result = parser.parse('says "Hello, world!"');
      
      expect(result).not.toBeNull();
      expect(result!.MethodName).toBe('WriteText');
      expect(result!.Parameters).toEqual(['', 'Hello, world!']);
    });

    it('should throw ParserException when says has no quoted text', () => {
      expect(() => parser.parse('[Sam] says')).toThrow();
    });

    it('should be case insensitive for says', () => {
      const result = parser.parse('[Sam] SAYS "Hello!"');
      
      expect(result).not.toBeNull();
      expect(result!.MethodName).toBe('WriteText');
    });
  });

  describe('parse - add commands', () => {
    it('should parse an add command with sprite', () => {
      const result = parser.parse('[Sam] add ]Happy.png* *FadeIn*');
      
      expect(result).not.toBeNull();
      expect(result!.MethodName).toBe('DrawCharacter');
      expect(result!.Parameters[0]).toBe('Sam');
    });

    it('should throw ParserException when sprite is missing', () => {
      expect(() => parser.parse('[Sam] add')).toThrow();
    });
  });

  describe('parse - remove commands', () => {
    it('should parse a remove command', () => {
      const result = parser.parse('[Sam] remove *FadeOut*');
      
      expect(result).not.toBeNull();
      expect(result!.MethodName).toBe('WipeImage');
      expect(mockInstructor.removeCharacter).toHaveBeenCalledWith('Sam', AnimationEnum.FadeOut);
    });

    it('should use FadeOut as default animation for remove', () => {
      const result = parser.parse('[Sam] remove');
      
      expect(result).not.toBeNull();
      expect(mockInstructor.removeCharacter).toHaveBeenCalledWith('Sam', AnimationEnum.FadeOut);
    });
  });

  describe('parse - show commands', () => {
    it('should parse a show command', () => {
      const result = parser.parse('[Sam] show *FadeIn*');
      
      expect(result).not.toBeNull();
      expect(result!.MethodName).toBe('DrawImage');
      expect(mockInstructor.showCharacter).toHaveBeenCalledWith('Sam', AnimationEnum.FadeIn);
    });

    it('should use None as default animation for show', () => {
      const result = parser.parse('[Sam] show');
      
      expect(result).not.toBeNull();
      expect(mockInstructor.showCharacter).toHaveBeenCalledWith('Sam', AnimationEnum.None);
    });
  });

  describe('parse - hide commands', () => {
    it('should parse a hide command', () => {
      const result = parser.parse('[Sam] hide *SlideLeft*');
      
      expect(result).not.toBeNull();
      expect(result!.MethodName).toBe('WipeImage');
      expect(mockInstructor.hideCharacter).toHaveBeenCalledWith('Sam', AnimationEnum.SlideLeft);
    });
  });

  describe('parse - MOVE commands', () => {
    it('should parse a MOVE command with direction and pixels', () => {
      const result = parser.parse('MOVE [Sam] Left 50px');
      
      expect(result).not.toBeNull();
      expect(result!.MethodName).toBe('DrawImage');
    });

    it('should throw ParserException when MOVE has no pixel value', () => {
      expect(() => parser.parse('MOVE [Sam] Left')).toThrow();
    });
  });

  describe('parse - PLACE commands', () => {
    it('should parse a PLACE command with x, y coordinates', () => {
      const result = parser.parse('PLACE [Sam] (100, 200)');
      
      expect(result).not.toBeNull();
      expect(result!.MethodName).toBe('DrawImage');
      expect(mockInstructor.placeCharacter).toHaveBeenCalledWith('Sam', 100, 200);
    });

    it('should parse a PLACE command with x, y, height, width', () => {
      const result = parser.parse('PLACE [Sam] (100, 200, 300, 400)');
      
      expect(result).not.toBeNull();
      expect(mockInstructor.placeCharacter).toHaveBeenCalledWith('Sam', 100, 200, 300, 400);
    });

    it('should throw ParserException for invalid PLACE parameters', () => {
      expect(() => parser.parse('PLACE [Sam] (100)')).toThrow();
    });
  });

  describe('parse - CHANGE SPRITE commands', () => {
    it('should parse a CHANGE SPRITE command', () => {
      const result = parser.parse('CHANGE SPRITE [Fred] Happy *FadeIn*');
      
      expect(result).not.toBeNull();
      expect(result!.MethodName).toBe('DrawImage');
    });
  });

  describe('parse - CHANGE BACKGROUND commands', () => {
    it('should parse a CHANGE BACKGROUND command', () => {
      GameState.getInstance().setupGameState({
        Title: 'Test',
        Author: 'Test',
        Version: '1.0',
        DateGenerated: new Date(),
        VersionHash: '',
        StartFile: 'start',
        ScenarioExtension: 'txt',
        PictureFormatType: 2,
      }, false);
      
      const result = parser.parse('CHANGE BACKGROUND beach');
      
      expect(result).not.toBeNull();
      expect(result!.MethodName).toBe('DrawScene');
      expect(result!.Parameters).toEqual(['beach']);
    });
  });

  describe('parse - PLAY SOUND commands', () => {
    it('should parse a PLAY SOUND command', () => {
      const result = parser.parse('PLAY SOUND "music.mp3"');
      
      expect(result).not.toBeNull();
      expect(result!.MethodName).toBe('PLAY SOUND');
      expect(result!.Parameters).toEqual(['music.mp3', false, 0.5]);
    });

    it('should parse PLAY SOUND with loop flag', () => {
      const result = parser.parse('PLAY SOUND loop "music.mp3"');
      
      expect(result).not.toBeNull();
      expect(result!.Parameters).toEqual(['music.mp3', true, 0.5]);
    });

    it('should parse PLAY SOUND with volume', () => {
      const result = parser.parse('PLAY SOUND "music.mp3" VOL:50');
      
      expect(result).not.toBeNull();
      expect(result!.Parameters).toEqual(['music.mp3', false, 0.5]);
    });

    it('should parse PLAY SOUND with loop and volume', () => {
      const result = parser.parse('PLAY SOUND loop "music.mp3" VOL:75');
      
      expect(result).not.toBeNull();
      expect(result!.Parameters).toEqual(['music.mp3', true, 0.75]);
    });

    it('should throw ParserException when sound file is not quoted', () => {
      expect(() => parser.parse('PLAY SOUND music.mp3')).toThrow();
    });
  });

  describe('parse - STOP SOUND commands', () => {
    it('should parse a STOP SOUND command', () => {
      const result = parser.parse('STOP SOUND "music.mp3"');
      
      expect(result).not.toBeNull();
      expect(result!.MethodName).toBe('STOP SOUND');
      expect(result!.Parameters).toEqual(['music.mp3']);
    });
  });

  describe('parse - PAUSE SOUND commands', () => {
    it('should parse a PAUSE SOUND command', () => {
      const result = parser.parse('PAUSE SOUND "music.mp3"');
      
      expect(result).not.toBeNull();
      expect(result!.MethodName).toBe('PAUSE SOUND');
      expect(result!.Parameters).toEqual(['music.mp3']);
    });
  });

  describe('parse - RESUME SOUND commands', () => {
    it('should parse a RESUME SOUND command', () => {
      const result = parser.parse('RESUME SOUND "music.mp3"');
      
      expect(result).not.toBeNull();
      expect(result!.MethodName).toBe('RESUME SOUND');
      expect(result!.Parameters).toEqual(['music.mp3']);
    });
  });

  describe('parse - choice commands', () => {
    it('should parse BEGIN CHOICES', () => {
      const result = parser.parse('BEGIN CHOICES');
      
      expect(result).not.toBeNull();
      expect(result!.MethodName).toBe('NEW CHOICE');
      expect(mockInstructor.createFork).toHaveBeenCalled();
    });

    it('should parse QUESTION', () => {
      const result = parser.parse('QUESTION "What do you want?"');
      
      expect(result).not.toBeNull();
      expect(result!.MethodName).toBe('CHOICE SET QUESTION');
      expect(result!.Parameters).toEqual(['What do you want?']);
    });

    it('should parse FORK', () => {
      const result = parser.parse('FORK "Go left"');
      
      expect(result).not.toBeNull();
      expect(result!.MethodName).toBe('ADD CHOICE');
      expect(mockInstructor.addChoice).toHaveBeenCalledWith('Go left');
    });

    it('should parse END CHOICES', () => {
      const result = parser.parse('END CHOICES');
      
      expect(result).not.toBeNull();
      expect(result!.MethodName).toBe('DISPLAY CHOICE');
    });
  });

  describe('parse - JUMP commands', () => {
    it('should parse JUMP to line number', () => {
      const result = parser.parse('JUMP 10');
      
      expect(result).not.toBeNull();
      expect(result!.MethodName).toBe('Jump');
      expect(mockInstructor.jumpLine).toHaveBeenCalledWith(10);
    });

    it('should parse JUMP to scenario', () => {
      const result = parser.parse('JUMP SCENARIO "chapter2"');
      
      expect(result).not.toBeNull();
      expect(result!.MethodName).toBe('Jump');
      expect(result!.Parameters).toEqual(['chapter2']);
      expect(mockInstructor.jumpScenario).toHaveBeenCalledWith('chapter2');
    });
  });

  describe('parse - END STORY', () => {
    it('should parse END STORY', () => {
      const result = parser.parse('END STORY');
      
      expect(result).not.toBeNull();
      expect(result!.MethodName).toBe('EndGame');
      expect(mockInstructor.gameOver).toHaveBeenCalled();
    });
  });

  describe('parse - unknown commands', () => {
    it('should return null for unrecognized commands', () => {
      const result = parser.parse('UNKNOWN COMMAND');
      
      expect(result).toBeNull();
    });
  });

  describe('getScenarioMarkers', () => {
    it('should find all BEGIN SCENARIO markers', () => {
      const lines = [
        'Some text',
        'BEGIN SCENARIO intro',
        'More text',
        'BEGIN SCENARIO chapter1',
      ];
      
      const markers = parser.getScenarioMarkers(lines);
      
      expect(markers.size).toBe(2);
      expect(markers.get('BEGIN SCENARIO intro')).toBe(1);
      expect(markers.get('BEGIN SCENARIO chapter1')).toBe(3);
    });

    it('should return empty map when no markers found', () => {
      const lines = ['Line 1', 'Line 2'];
      
      const markers = parser.getScenarioMarkers(lines);
      
      expect(markers.size).toBe(0);
    });
  });
});
