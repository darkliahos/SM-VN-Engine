export interface ChoiceSelector {
  Id: string;
  Question: string;
  Choices: { [key: string]: number };
}
