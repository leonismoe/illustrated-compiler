export default class TextMarker {

  constructor(marker, font, text) {
    this.$marker = typeof marker == 'string' ? document.querySelector(marker) : marker;
    this._font = font;
    this._canvas = document.createElement('canvas');
    this._context = this._canvas.getContext('2d');
    this._context.font = this._font;
    this.setText(text);
  }

  setText(text) {
    this._text   = text;
    this._offset = [0];
    this._width  = [];

    if (!text) return;
    const repeat = 10;
    for (let ch of text) {
      // FIXME: known issue: width is not correct under IE and Firebox
      const width = this._context.measureText(ch.repeat(repeat)).width / repeat;
      this._width.push(width);
      this._offset.push(this._offset[this._offset.length - 1] + width);
    }
  }

  show() {
    this.$marker.classList.add('show');
  }

  hide() {
    this.$marker.classList.remove('show');
  }

  mark(offset, length = 1) {
    if (offset >= this._offset.length) {
      offset = this._offset.length - 1;
    }
    if (offset + length >= this._offset.length) {
      length = this._offset.length - offset - 1;
    }
    this.$marker.style.width = (this._offset[offset + length] - this._offset[offset]) + 'px';
    this.$marker.style.left  = this._offset[offset] + 'px';
  }

}
