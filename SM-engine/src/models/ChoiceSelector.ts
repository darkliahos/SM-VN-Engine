export interface ChoiceSelector {
  Id: string;
  Question: string;
  Choices: { [key: string]: number };
  SelectedChoice?: string;
  EndLine?: number;
}
