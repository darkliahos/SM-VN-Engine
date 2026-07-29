import { Character } from './Character';
import { ChoiceSelector } from './ChoiceSelector';

export class RunningScenario {
  public Id: string = '';
  public Name: string = '';
  public fileName: string = ""; // Allows for multiple scenarios in one file
  public Line: number = 0;
  public Background: string = '';
  public Characters: Map<string, Character> = new Map();
  public Redraw: boolean = false;
  public CurrentChoiceSelector: ChoiceSelector = {
    Id: '',
    Question: '',
    Choices: {},
  };
  public ChoiceSelectors: ChoiceSelector[] = [];
}
