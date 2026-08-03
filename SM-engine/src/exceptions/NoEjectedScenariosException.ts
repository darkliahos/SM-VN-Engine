export class NoEjectedScenariosException extends Error {
  constructor() {
    super('No Ejected Scenario were found in the game state');
    this.name = 'NoEjectedScenariosException';
  }
}
