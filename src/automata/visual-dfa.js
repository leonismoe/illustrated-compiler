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

    this.dfa = object;
    this.container = typeof container == 'string' ? document.querySelector(container) : container;
    this.state = null;
    this.$svg = this.container.querySelector('svg');
    this.$graph = this.$svg.querySelector('.graph');

    this.defineMarker();
  }

  next(val) {
    const result = this.dfa.next(val);
    if (result.edge) {
      this.move(result.edge, true);
    }
    return result;
  }

  move(edge, animate) {
    const $from = this.container.querySelector(`[id=s${edge.from.id}]`);
    const $to   = this.container.querySelector(`[id=s${edge.to.id}]`);

    if (!animate) {
      $from.setAttribute('class', 'node');
      $to.setAttribute('class', 'node highlight');
      return;
    }

    const $edge = this.container.querySelector(`[id=e${edge.id}] path`).cloneNode();
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

    this.state = edge.to;
    setTimeout(() => {
      $to.setAttribute('class', 'node animate highlight');
    }, 416);
  }

  highlightState(state) {
    if (this.state) {
      this.container.querySelector(`[id=s${this.state.id}]`).setAttribute('class', 'node');
    }
    if (state) {
      this.container.querySelector(`[id=s${state.id}]`).setAttribute('class', 'node highlight');
    }
    this.state = state;
  }

  reset() {
    this.dfa.reset();
    if (this.state) {
      this.container.querySelector(`[id=s${this.state.id}]`).setAttribute('class', 'node');
    }
    this.highlightState(this.dfa.entry);
  }

  defineMarker() {
    if (this.$svg.querySelector('defs')) return;
    this.$svg.appendChild(new DOMParser().parseFromString(markerSVG, 'application/xml').querySelector('defs'));
  }

}
