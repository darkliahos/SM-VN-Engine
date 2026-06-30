export class ParserException extends Error {
  constructor(message: string, public command?: string) {
    super(message);
    this.name = 'ParserException';
  }
}
