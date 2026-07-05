import { ImageFormatType } from '../enums';
import { RunningScenario } from './RunningScenario';
import { RanScenario } from './RanScenario';

export class Game {
  public ImageFormatType: ImageFormatType = ImageFormatType.PNG;
  public Title: string = '';
  public TitleScreenImageName: string = '';
  public DebugMode: boolean = false;
  public StartFile: string = '';
  public ScenarioExtension: string = '';
  public CurrentScenario: RunningScenario | null = null;
  public PreviousScenarios: RanScenario[] = [];
}
