import { ImageFormatType } from '../enums';

export interface Metadata {
  Title: string;
  TitleScreenImageName: string;
  Author: string;
  Version: string;
  DateGenerated: Date;
  VersionHash: string;
  StartFile: string;
  ScenarioExtension: string;
  PictureFormatType: ImageFormatType;
}
