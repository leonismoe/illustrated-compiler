import Scrollbar from 'smooth-scrollbar';
import anime from 'animejs';
// import throttle from 'lodash/throttle';

import DFA from './dfa';
import injectDragScroll from '../components/smooth-drag-scroll';

const markerSVG = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <marker id="arrow-tail" viewBox="0 -3 6 6" refX="6" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,-3L6,0L0,3" class="arrow-tail"></path>
    </marker>
  </defs>
</svg>`;

(function (cb) {
  const $svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  $svg.setAttribute('style', 'position:absolute; top:-300px; width:100px; height:2px; visibility:hidden; opacity:0; pointer-events:none');
  document.body.appendChild($svg);

  try {
    const $path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    $path.setAttribute('d', 'M0,0L0,100');
    $svg.appendChild($path);

    const length = $path.getTotalLength();
    $path.setAttribute('stroke-dasharray', length);

    const animation = $path.animate({ strokeDashoffset: [0, length] }, { duration: 100 });

    let timer = setTimeout(() => {
      timer = null;
      document.body.removeChild($svg);
      cb(true);
    }, 1000);

    animation.onfinish = () => {
      if (timer) clearTimeout(timer);
      document.body.removeChild($svg);
      cb(false);
    };

    animation.play();

  } catch (e) {
    document.body.removeChild($svg);
    cb(false);
  }

})((support_svg_animation) => {
  if (support_svg_animation) return;

  (typeof SVGElement != 'undefined' ? SVGElement : Element).prototype.animate = function (properties, options) {
    const anim_options = Object.assign({}, properties, options, {
      targets: this,
      autoplay: false,
    });
    if (typeof options.easing == 'string' && options.easing.indexOf('cubic-bezier') > -1) {
      anim_options.easing = options.easing.split(/\(|\)|,/).slice(1, 5).map(v => parseFloat(v));
    }

    const anim = anime(anim_options);
    anim.complete = () => {
      if (anim.onfinish) anim.onfinish();
    };

    return anim;
  };
});

export default class VisualDFA {

  constructor(object, container, options) {
    if (!object || !(object instanceof DFA)) {
      throw new Error('Object must be a DFA instance');
    }

    this.$container = typeof container == 'string' ? document.querySelector(container) : container;
    this.$svg = this.$container.querySelector('svg');
    this.$graph = this.$svg.querySelector('.graph');

    this._dfa = object;
    this._state = null;
    this._last_anim = null;
    this._last_timer = null;

    this._options = Object.assign({
      duration: 800,
    }, options);

    this._history = [];

    this._scroll = Scrollbar.init(this.$container, { damping: 0.2 });
    injectDragScroll(this._scroll);

    this._node_dom_map = {};
    this._node_position_map = {};
    const container_bounding = this.$container.getBoundingClientRect();
    for (let node of this._dfa.getVertices()) {
      const id = node.id;
      const $node = this.$container.querySelector(`[id=s${id}]`);
      const bounding = $node.getBoundingClientRect();
      const x = bounding.left - container_bounding.left;
      const y = bounding.top - container_bounding.top;
      this._node_dom_map[id] = $node;
      this._node_position_map[id] = {
        x: Math.trunc(x),
        y: Math.trunc(y),
        centerX: Math.trunc(x + bounding.width / 2),
        centerY: Math.trunc(y + bounding.height / 2),
        width: Math.round(bounding.width),
        height: Math.round(bounding.height),
      };
    }

    this.resize();
    this.updateSVGdefs();

    // this.scrollTo = throttle(this.scrollTo, this._options.duration, { leading: true, trailing: false });

    window.addEventListener('resize', () => this.resize(), false);
  }

  get dfa() {
    return this._dfa;
  }

  prepare(str, fullmatch) {
    if (this._state) {
      const $node = this._node_dom_map[this._state.id];
      $node.setAttribute('class', 'node');
    }

    this._history = [{ state: this._dfa.entry, edge: null, done: false, error: '', description: 'initial' }];
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
    return this._history.length;
  }

  goto(step) {
    if (!Number.isInteger(step) || step < 0 || step >= this._history.length) {
      throw new RangeError('Invalid step');
    }

    const history = this._history[step];
    const state = history.state;
    if (this._state && state != this._state) {
      this._node_dom_map[this._state.id].setAttribute('class', 'node');
    }
    if (state) {
      let classes = 'node highlight';
      if (history && history.done) {
        classes += history.error ? ' rejected' : ' resolved';
      }
      const $node = this._node_dom_map[state.id];
      $node.setAttribute('class', classes);
      this.scrollTo(state);
    }
    this._state = state;
  }

  prev(step) {
    const item = this._history[step + 1];
    this.move(item, true, true);
  }

  next(step) {
    const item = this._history[step];
    this.move(item, true);
  }

  move(item, animate, reverse) {
    const edge = item.edge;

    if (this._last_anim) {
      this._last_anim();
      clearTimeout(this._last_timer);
    }

    if (!edge) {
      if (this._state && this._state != item.state) {
        const $node = this._node_dom_map[this._state.id];
        $node.setAttribute('class', 'node' + (animate ? ' animate' : ''));
      }
      if (item.done && !reverse) {
        const $node = this._node_dom_map[item.state.id];
        $node.setAttribute('class', 'node highlight ' + (animate ? 'animate ' : '') + (item.error ? 'rejected' : 'resolved'));
      } else {
        const $node = this._node_dom_map[item.state.id];
        $node.setAttribute('class', 'node highlight ' + (animate ? 'animate' : ''));
        if (this._state != item.state) {
          this.scrollTo(item.state, animate);
        }
      }
      this._state = item.state;
      return;
    }

    const $from = reverse ? this._node_dom_map[edge.to.id] : this._node_dom_map[edge.from.id];
    const $to   = reverse ? this._node_dom_map[edge.from.id] : this._node_dom_map[edge.to.id];

    if (!animate) {
      $from.setAttribute('class', 'node');
      $to.setAttribute('class', 'node highlight');
      this.scrollTo(edge.to);
      return;
    }

    const $$edge = this.$container.querySelector(`[id=e${edge.id}] path`);
    const length = $$edge.getTotalLength();
    const $edge = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    $edge.setAttribute('fill', 'none');
    $edge.setAttribute('d', $$edge.getAttribute('d'));
    $edge.setAttribute('class', 'edge animate');
    $edge.setAttribute('stroke-dasharray', length);
    this.$graph.appendChild($edge);

    const duration = this._options.duration;
    const animation = $edge.animate(
      { strokeDashoffset: reverse ? [-length, length] : [length, -length] },
      { duration, easing: 'cubic-bezier(0.5, 1, 0.5, 0)' }
    );
    animation.onfinish = () => {
      $edge.parentNode.removeChild($edge);
    };

    $from.setAttribute('class', 'node animate');
    animation.play();

    this._state = edge.to;
    this.scrollTo(edge.to, true);

    this._last_anim = () => {
      let classes = 'node animate highlight';
      if (item.done) {
        classes += item.error ? ' rejected' : ' resolved';
      }
      $to.setAttribute('class', classes);
      this._last_anim = null;
    };
    this._last_timer = setTimeout(this._last_anim, duration / 2);
  }

  updateSVGdefs() {
    if (this.$svg.querySelector('defs')) return;
    this.$svg.appendChild(new DOMParser().parseFromString(markerSVG, 'application/xml').querySelector('defs'));
  }

  resize() {
    this._container_width = this.$container.clientWidth;
    this._container_height = this.$container.clientHeight;
    this._container_half_width = Math.trunc(this._container_width / 2);
    this._container_half_height = Math.trunc(this._container_height / 2);
  }

  scrollTo(state, animate, callback = null) {
    if (!state) return;

    const bounding = this._node_position_map[state.id];
    if (bounding) {
      const scrollOffset = this._scroll.offset;
      if (bounding.x <= scrollOffset.x + 50 || bounding.y <= scrollOffset.y + 50
          || bounding.x + bounding.width >= scrollOffset.x + this._container_width
          || bounding.y + bounding.height >= scrollOffset.y + this._container_height) {
        const x = Math.max(0, bounding.centerX - this._container_half_width);
        const y = Math.max(0, bounding.centerY - this._container_half_height);
        this._scroll.scrollTo(x, y, animate ? this._options.duration / 2 : 0, callback);
      }
    }
  }

}
