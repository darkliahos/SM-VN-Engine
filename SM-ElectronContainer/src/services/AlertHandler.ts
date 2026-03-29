import { GameState } from './GameState';

export interface IAlertHandler {
  showUserError(message: string): void;
  showError(error: Error): void;
  showWarning(message: string): void;
  showInfo(message: string): void;
}

export class ConsoleAlertHandler implements IAlertHandler {
  showUserError(message: string): void {
    console.error(`[User Error] ${message}`);
  }

  showError(error: Error): void {
    console.error(`[Error] ${error.message}`);
    if (this.isDebug()) {
      console.error(error.stack);
    }
  }

  showWarning(message: string): void {
    console.warn(`[Warning] ${message}`);
  }

  showInfo(message: string): void {
    console.log(`[Info] ${message}`);
  }

  private isDebug(): boolean {
    try {
      return GameState.getInstance().isDebug();
    } catch {
      return false;
    }
  }
}
