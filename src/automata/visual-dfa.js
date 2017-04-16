import DFA from './dfa';

const markerSVG = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <marker id="arrow-tail" viewBox="0 -3 6 6" refX="6" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,-3L6,0L0,3" class="arrow-tail"></path>
    </marker>
  </defs>
</svg>`;

export default class VisualDFA {

  constructor(object, container) {
    if (!object || !(object instanceof DFA)) {
      throw new Error('Object must be a DFA instance');
    }

    this.$container = typeof container == 'string' ? document.querySelector(container) : container;
    this.$svg = this.$container.querySelector('svg');
    this.$graph = this.$svg.querySelector('.graph');

    this._dfa = object;
    window.dfa = object;
    this._state = null;

    this._history = [];

    this.updateSVGdefs();
  }

  get dfa() {
    return this._dfa;
  }

  prepare(str, fullmatch) {
    if (this._state) {
      const $node = this.$container.querySelector(`[id=s${this._state.id}]`);
      $node.classList.remove('rejected', 'resolved', 'highlight');
    }

    this._history = [];
    this._dfa.reset();
    this._state = this._dfa.entry;

    if (!str) {
      return;
    }

    let last_step = null;
    for (let i = 0, len = str.length; i <= len; ++i) {
      last_step = this._dfa.next(str[i]);
      this._history.push(last_step);
      if (last_step.done) {
        if (fullmatch && !last_step.error && i < len) {
          last_step.error = 'State machine finished matching before reaching EOF.';
        }
        break;
      }
    }
  }

  getTotalSteps() {
    return this._history.length + 1;
  }

  goto(step) {
    if (!Number.isInteger(step) || step < 0 || step > this._history.length) {
      throw new RangeError('Invalid step');
    }

    if (step == 0) {
      this.highlightState(this._dfa.entry);
      return;
    }

    const item = this._history[step - 1];
    this.highlightState(item.state);
    if (step == this._history.length) {
      const $node = this.$container.querySelector(`[id=s${item.state.id}]`);
      $node.classList.add(item.error ? 'rejected' : 'resolved');
    }
  }

  highlightState(state) {
    if (this._state && state != this._state) {
      this.$container.querySelector(`[id=s${this._state.id}]`).setAttribute('class', 'node');
    }
    if (state) {
      this.$container.querySelector(`[id=s${state.id}]`).setAttribute('class', 'node highlight');
    }
    this._state = state;
  }

  next(ostep) {
    const item = this._history[ostep];
    this.move(item, true);
  }

  move(item, animate) {
    const edge = item.edge;
    if (!edge) {
      if (item.done) {
        const $node = this.$container.querySelector(`[id=s${this._state.id}]`);
        $node.classList.add('animate');
        $node.classList.add(item.error ? 'rejected' : 'resolved');
      }
      return;
    }

    const $from = this.$container.querySelector(`[id=s${edge.from.id}]`);
    const $to   = this.$container.querySelector(`[id=s${edge.to.id}]`);

    if (!animate) {
      $from.setAttribute('class', 'node');
      $to.setAttribute('class', 'node highlight');
      return;
    }

    const $edge = this.$container.querySelector(`[id=e${edge.id}] path`).cloneNode();
    const length = $edge.getTotalLength();
    $edge.setAttribute('class', 'edge animate');
    $edge.setAttribute('stroke-dasharray', length);
    $edge.setAttribute('stroke-dashoffset', length);
    $edge.addEventListener('transitionend', () => {
      // $to.setAttribute('class', 'node animate highlight');
      $edge.parentNode.removeChild($edge);
    }, false);
    this.$graph.appendChild($edge);

    setTimeout(() => {
      $from.setAttribute('class', 'node animate');
      $edge.setAttribute('stroke-dashoffset', -length);
    }, 16);

    this._state = edge.to;
    setTimeout(() => {
      let classes = 'node animate highlight';
      if (item.done) {
        classes += item.error ? ' rejected' : ' resolved';
      }
      $to.setAttribute('class', classes);
    }, 416);
  }

  updateSVGdefs() {
    if (this.$svg.querySelector('defs')) return;
    this.$svg.appendChild(new DOMParser().parseFromString(markerSVG, 'application/xml').querySelector('defs'));
  }

}
