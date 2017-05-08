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

  next(ostep) {
    this.goto(ostep + 1, true);
    this._vdfa.next(ostep);
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

}
