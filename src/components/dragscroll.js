export default class DragScroll {

  constructor(container) {
    this.$container = typeof container == 'string' ? document.querySelector(container) : container;
    this._dragging = false;
    this.init();
  }

  init() {
    this.$container.addEventListener('mousedown', (e) => this.onmousedown(e), true);
    this.$container.addEventListener('mouseup',   (e) => this.onmouseup(e),   true);
    this.$container.addEventListener('mousemove', (e) => this.onmousemove(e), true);
  }

  onmousedown(e) {
    if (this._dragging || e.button != 0) {
      return;
    }
    e.preventDefault(); // disable selection
    e.stopImmediatePropagation();
    this._dragging = true;
    this._lastX = e.clientX;
    this._lastY = e.clientY;
    this.$container.classList.add('js-dragging');
  }

  onmouseup(e) {
    if (!this._dragging) {
      return;
    }
    e.stopImmediatePropagation();
    this._dragging = false;
    this.$container.classList.remove('js-dragging');
  }

  onmousemove(e) {
    if (this._dragging) {
      return;
    }
    e.preventDefault(); // disable selection
    e.stopImmediatePropagation();

    const newScrollX = (- this._lastX + (this._lastX = e.clientX));
    const newScrollY = (- this._lastY + (this._lastY = e.clientY));
    this.$container.scrollLeft -= newScrollX;
    this.$container.scrollTop  -= newScrollY;
    if (this.$container == document.body) {
      document.documentElement.scrollLeft -= newScrollX;
      document.documentElement.scrollTop  -= newScrollY;
    }
  }

}
