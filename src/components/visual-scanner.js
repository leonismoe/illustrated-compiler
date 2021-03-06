import VisualDFA from '../automata/visual-dfa';
import TextMarker from './text-marker';

export default class VisualScanner {

  constructor(vdfa, marker, font) {
    if (!vdfa || !(vdfa instanceof VisualDFA)) {
      throw new Error('Object must be a VisualDFA instance');
    }

    this._vdfa = vdfa;
    this._marker = new TextMarker(marker, font);
  }

  prepare(str, fullmatch) {
    this._marker.setText(str);
    this._marker.mark(0, 0);
    this._vdfa.prepare(str, fullmatch);
    this.show();
  }

  getTotalSteps() {
    return this._vdfa.getTotalSteps();
  }

  goto(step, justmarker) {
    if (step == 0) {
      this._marker.mark(0, 0);
    } else {
      this._marker.mark(step - 1);
    }
    if (!justmarker) {
      this._vdfa.goto(step);
    }
  }

  prev(step) {
    this.goto(step, true);
    this._vdfa.prev(step);
  }

  next(step) {
    this.goto(step, true);
    this._vdfa.next(step);
  }

  show() {
    this._marker.show();
  }

  hide() {
    this._marker.hide();
  }

  clear() {
    this.hide();
    this._marker.mark(0, 0);
    this._vdfa.prepare(null);
  }

  resize() {
    this._vdfa.resize();
  }

}
