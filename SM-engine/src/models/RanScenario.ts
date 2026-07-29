import { ScenarioStatus } from '../enums';

export class RanScenario {
  public Id: string = '';
  public Name: string = '';
  public Status: ScenarioStatus = ScenarioStatus.Ended;
  public LastRunNumber: number = 0;
  public LastBackground: string = '';
  public LastSound: string= '';
  public EjectionPrecidence: number = -1; // The bigger the number the more recent it has been ejected - this allows for scenarios of scenarios 
}
