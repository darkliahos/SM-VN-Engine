import { ScenarioStatus } from '../enums';

export class RanScenario {
  public Id: string = '';
  public Name: string = '';
  public Status: ScenarioStatus = ScenarioStatus.Ended;
  public LastRunNumber: number = 0;
}
