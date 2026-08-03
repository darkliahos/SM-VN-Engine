import { ScenarioStatus } from '../enums';
import { Character } from './Character';

export class RanScenario {
  public Id: string = '';
  public Name: string = '';
  public Status: ScenarioStatus = ScenarioStatus.Ended;
  public LastRunNumber: number = 0;
  public LastBackground: string = '';
  public LastSound: string= '';
  public EjectionPrecidence: number = -1; // The bigger the number the more recent it has been ejected - this allows for scenarios of scenarios 
  public Characters: Map<string, Character> = new Map();
}
