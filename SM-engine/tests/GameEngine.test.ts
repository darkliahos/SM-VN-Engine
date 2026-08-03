import { describe, it, expect } from 'vitest';
import { GameEngine } from '../src/main/gameEngine';
import { GameState } from '../src/services/GameState';
import { Character } from '../src/models';
import { ScenarioStatus } from '../src/enums';

describe('GameEngine - Choices / Forking', () => {
  it('should initialize and process choices correctly', async () => {
    const engine = new GameEngine(null);
    await engine.initialize();
    
    // Reset state to start
    GameState.getInstance().setCurrentLine(0);
    
    // Advance first dialogue line
    await engine.runScenario();
    
    // Advance second dialogue line
    await engine.runScenario();
    
    // Run to reach choices block (which pauses at DISPLAY CHOICE)
    await engine.runScenario();
    
    // The engine should have scanned ahead, created the ChoiceSelector and paused at DISPLAY CHOICE
    const activeScenario = GameState.getInstance().getRunningScenario();
    const selector = activeScenario.CurrentChoiceSelector;
    expect(selector).toBeDefined();
    expect(selector.Question).toBe('What should Kenji do next?');
    expect(Object.keys(selector.Choices)).toEqual(["Hold Yuki's hand", "Offer Yuki some hot tea", "Go inside the tower with Yuki"]);
    
    const holdHandLine = selector.Choices["Hold Yuki's hand"];
    expect(holdHandLine).toBeGreaterThan(0);
    
    // Select the first choice
    const choiceText = "Hold Yuki's hand";
    await engine.selectChoice(choiceText, holdHandLine);
    
    // Advance the second dialogue line inside the fork
    await engine.runScenario();
    
    // Run again to hit the next FORK (which triggers choice completion)
    await engine.runScenario();
    
    // After selection and resuming, the choice selector history should contain the choice
    const history = activeScenario.ChoiceSelectors;
    expect(history.length).toBe(1);
    expect(history[0].SelectedChoice).toBe(choiceText);
  });

  it('should jump to insidethetower scenario correctly when selected', async () => {
    const engine = new GameEngine(null);
    await engine.initialize();
    
    GameState.getInstance().setCurrentLine(0);
    await engine.runScenario();
    await engine.runScenario();
    await engine.runScenario();
    
    const selector = GameState.getInstance().getRunningScenario().CurrentChoiceSelector;
    const towerChoiceLine = selector.Choices["Go inside the tower with Yuki"];
    expect(towerChoiceLine).toBeGreaterThan(0);
    
    await engine.selectChoice("Go inside the tower with Yuki", towerChoiceLine);
    // Advance to execute JUMP SCENARIO insidethetower
    await engine.runScenario();
    
    const currentScenarioName = GameState.getInstance().getRunningScenario().Name;
    expect(currentScenarioName).toBe('insidethetower');
  });

  it('should return to parent scenario after completing inner scenario', async () => {
    const engine = new GameEngine(null);
    await engine.initialize();
    
    GameState.getInstance().setCurrentLine(0);
    await engine.runScenario();
    await engine.runScenario();
    await engine.runScenario();
    
    const selector = GameState.getInstance().getRunningScenario().CurrentChoiceSelector;
    const towerChoiceLine = selector.Choices["Go inside the tower with Yuki"];
    await engine.selectChoice("Go inside the tower with Yuki", towerChoiceLine);
    await engine.runScenario(); // Jump to insidethetower
    
    expect(GameState.getInstance().getRunningScenario().Name).toBe('insidethetower');
    
    // Advance insidethetower dialogue lines until BEGIN CHOICES in insidethetower
    for (let i = 0; i < 15; i++) {
      await engine.runScenario();
      const current = GameState.getInstance().getRunningScenario();
      if (current.CurrentChoiceSelector && Object.keys(current.CurrentChoiceSelector.Choices).length > 0) {
        break;
      }
    }

    const innerSelector = GameState.getInstance().getRunningScenario().CurrentChoiceSelector;
    expect(innerSelector).toBeDefined();
    const innerForkLine = innerSelector.Choices["Pull the lever and forge our own path"];
    expect(innerForkLine).toBeGreaterThan(0);
    
    await engine.selectChoice("Pull the lever and forge our own path", innerForkLine);

    // Advance remaining dialogue in insidethetower until it completes and pops back to Start
    for (let i = 0; i < 10; i++) {
      await engine.runScenario();
      if (GameState.getInstance().getRunningScenario().Name === 'Start') {
        break;
      }
    }
    
    expect(GameState.getInstance().getRunningScenario().Name).toBe('Start');
  });

  it('should restore characters in scope when returning to parent scenario', async () => {
    const engine = new GameEngine(null);
    await engine.initialize();
    
    GameState.getInstance().setCurrentLine(0);
    await engine.runScenario();
    await engine.runScenario();
    await engine.runScenario();
    
    // Yuki and Kenji should be on stage in Start
    expect(GameState.getInstance().getCharactersInScene().map(c => c.FriendlyName).sort()).toEqual(['Kenji', 'Yuki']);

    const selector = GameState.getInstance().getRunningScenario().CurrentChoiceSelector;
    const towerChoiceLine = selector.Choices["Go inside the tower with Yuki"];
    await engine.selectChoice("Go inside the tower with Yuki", towerChoiceLine);
    await engine.runScenario(); // Jump to insidethetower
    
    expect(GameState.getInstance().getRunningScenario().Name).toBe('insidethetower');
    expect(GameState.getInstance().getCharactersInScene().map(c => c.FriendlyName).sort()).toEqual(['Kenji', 'Yuki']);

    // Advance insidethetower dialogue lines until BEGIN CHOICES in insidethetower
    for (let i = 0; i < 15; i++) {
      await engine.runScenario();
      const current = GameState.getInstance().getRunningScenario();
      if (current.CurrentChoiceSelector && Object.keys(current.CurrentChoiceSelector.Choices).length > 0) {
        break;
      }
    }

    const innerSelector = GameState.getInstance().getRunningScenario().CurrentChoiceSelector;
    const innerForkLine = innerSelector.Choices["Pull the lever and forge our own path"];
    await engine.selectChoice("Pull the lever and forge our own path", innerForkLine);

    // Advance remaining dialogue in insidethetower until it completes and pops back to Start
    for (let i = 0; i < 10; i++) {
      await engine.runScenario();
      if (GameState.getInstance().getRunningScenario().Name === 'Start') {
        break;
      }
    }

    expect(GameState.getInstance().getRunningScenario().Name).toBe('Start');

    // Characters in scope from Start should be restored
    expect(GameState.getInstance().getCharactersInScene().map(c => c.FriendlyName).sort()).toEqual(['Kenji', 'Yuki']);
  });

  it('should preserve character sprites across scenario teardown and setup', () => {
    const state = GameState.getInstance();
    const scenario = state.getRunningScenario();
    state.removeAllCharacters();

    const character = new Character();
    character.FriendlyName = 'Yuki';
    character.DisplayName = 'Yuki';
    character.CurrentSprite = 'Thoughtful';
    character.InScene = true;
    character.ScreenPosition = 2;
    state.addCharacter(character);

    state.teardownCurrentScenario(ScenarioStatus.Ejected);
    state.setupScenario(scenario.Name, scenario.Name);

    const restored = Array.from(state.getRunningScenario().Characters.values());
    expect(restored).toHaveLength(1);
    expect(restored[0].FriendlyName).toBe('Yuki');
    expect(restored[0].CurrentSprite).toBe('Thoughtful');
    expect(restored[0].InScene).toBe(true);
  });

  it('should end the game after parent completes, not pop to the GameOver placeholder', async () => {
    const sent: string[] = [];
    const mockWindow = {
      webContents: { send: (channel: string) => { sent.push(channel); } },
    } as unknown as never;
    const engine = new GameEngine(mockWindow);
    await engine.initialize();

    GameState.getInstance().setCurrentLine(0);
    await engine.runScenario();
    await engine.runScenario();
    await engine.runScenario();

    const selector = GameState.getInstance().getRunningScenario().CurrentChoiceSelector;
    await engine.selectChoice("Go inside the tower with Yuki", selector.Choices["Go inside the tower with Yuki"]);
    await engine.runScenario(); // Jump to insidethetower

    // Advance insidethetower dialogue lines until BEGIN CHOICES in insidethetower
    for (let i = 0; i < 15; i++) {
      await engine.runScenario();
      const current = GameState.getInstance().getRunningScenario();
      if (current.CurrentChoiceSelector && Object.keys(current.CurrentChoiceSelector.Choices).length > 0) {
        break;
      }
    }

    const innerSelector = GameState.getInstance().getRunningScenario().CurrentChoiceSelector;
    await engine.selectChoice("Pull the lever and forge our own path", innerSelector.Choices["Pull the lever and forge our own path"]);

    // Return to the parent scenario
    for (let i = 0; i < 12; i++) {
      await engine.runScenario();
      if (GameState.getInstance().getRunningScenario().Name === 'Start') {
        break;
      }
    }
    expect(GameState.getInstance().getRunningScenario().Name).toBe('Start');

    // Play Start to completion. It should end the game rather than popping to the
    // GameOver placeholder at line 1 (the previous bug).
    for (let i = 0; i < 40; i++) {
      await engine.runScenario();
      if (GameState.getInstance().getRunningScenario().Name === 'GameOver') {
        break;
      }
    }

    expect(GameState.getInstance().getRunningScenario().Name).toBe('GameOver');
    expect(sent).toContain('end-game');
  });
});
