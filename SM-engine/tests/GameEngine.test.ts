import { describe, it, expect } from 'vitest';
import { GameEngine } from '../src/main/gameEngine';
import { GameState } from '../src/services/GameState';

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
    expect(Object.keys(selector.Choices)).toEqual(["Hold Yuki's hand", "Offer Yuki some hot tea"]);
    
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
});
