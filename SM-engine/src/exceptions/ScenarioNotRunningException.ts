export class ScenarioNotRunningException extends Error {
  constructor() {
    super('No scenario is currently running');
    this.name = 'ScenarioNotRunningException';
  }
}
