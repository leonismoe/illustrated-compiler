export default class ParseError extends Error {

  constructor(message, line, column) {
    super(message);
    this.message = message;
    this.line = line;
    this.column = column;
  }

}
