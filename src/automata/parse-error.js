export default class ParseError extends Error {

  constructor(message, offset, line, column, length) {
    super(message);
    this.message = message;
    this.offset = offset;
    this.line = line || 0;
    this.column = column || 0;
    this.length = length || 0;
  }

}
