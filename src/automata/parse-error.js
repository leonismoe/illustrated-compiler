export default class ParseError extends Error {

  constructor(message, line, column, length) {
    super(message);
    this.message = message;
    this.line = line || 0;
    this.column = column || 0;
    this.length = length || 0;
  }

}
