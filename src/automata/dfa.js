/// <reference path="./dfa.d.ts" />

import NFA from './nfa';
import NFA2DFA from './nfa-to-dfa';

export default class DFA extends NFA {

  constructor(props) {
    super(props);
    // Note: inherited property "epsilon" from NFA is unused
    this.setDefault('entry', null);
    this.setDefault('greedy', true);

    this._done = false;
    this._matches = [];
    this._state = this.get('entry');

    // redefine property "entries" to reuse method "NFA#minimize"
    Object.defineProperty(this._props, 'entries', { get: () => [this.get('entry')] });
  }

  get greedy() {
    return this._props.greedy;
  }

  get done() {
    return this._done;
  }

  get state() {
    return this._state;
  }

  get matches() {
    return this._matches.slice();
  }

  get entry() {
    return this.get('entry');
  }

  static from(object) {
    return NFA2DFA(object);
  }

  reset() {
    this._done = false;
    this._matches = [];
    this._state = this.get('entry');
  }

  next(val) {
    if (!this._state) {
      this._done = true;
      return { state: null, edge: null, done: true, error: 'Unknown state' };
    }
    if (this._done) {
      return { state: this._state, edge: null, done: true, error: 'This state machine has finished matching' };
    }
    const moves = this._state.out;
    let transition = null;
    if (val !== null && val !== undefined) {
      for (let edge of moves) {
        const accept = edge.get('accept');
        if (typeof accept == 'function') {
          if (accept(val)) {
            transition = edge;
            break;
          }
        } else if (accept instanceof RegExp) {
          if (accept.test(val)) {
            transition = edge;
            break;
          }
        } else if (accept === val || accept === '') {
          transition = edge;
          break;
        }
      }
    }
    if (!transition) {
      this._done = true;
      if (this._state.get('terminal')) {
        return { state: this._state, edge: null, done: true, error: '' };
      }
      return { state: this._state, edge: null, done: true, error: 'No available transitions' };
    }
    this._matches.push(val);
    this._state  = transition.to;
    const greedy = this._state.get('greedy', this._props.greedy);
    this._done   = greedy ? false : !!this._state.get('terminal');
    return { state: this._state, edge: transition, done: this._done, error: '' };
  }

  match(str, fullmatch) {
    // TODO:
  }

  test(str, fullmatch) {
    if (typeof str != 'string') {
      if (str === null || str === undefined) return false;
      str += '';
    }
    let last_test = null;
    if (fullmatch) {
      this.reset();
      for (let i = 0, size = str.length; i <= size; ++i) {
        last_test = this.next(str[i]);
        if (last_test.done) break;
      }
    } else {
      outer:
      for (let i = 0, size = str.length; i < size; ++i) {
        this.reset();
        for (let j = i; j <= size; ++j) {
          last_test = this.next(str[j]);
          if (last_test.error) break;
          if (last_test.done)  break outer;
        }
      }
    }
    return last_test.done && !last_test.error;
  }

  toDOT(name, noarrow) {
    const nfa = this.get('nfa');
    const instructions = [];
    instructions.push(`digraph ${name ? JSON.stringify(name) : ''} {`);
    if (this._terminals.length) {
      instructions.push('  node [shape=doublecircle]; ' + this._terminals.map(v => v.id).join(' ') + ';');
    }
    instructions.push('  node [shape=circle];');
    instructions.push('  rankdir=LR;');
    for (let vertex of this._vertices) {
      const attrs = {
        id: 's' + vertex.id,
        label: vertex.labelOrId,
      };
      if (vertex.isset('tooltip')) {
        attrs.tooltip = vertex.get('tooltip');
      } else if (nfa && vertex.isset('nfa-mapping')) {
        attrs.tooltip = vertex.get('nfa-mapping').map(v => nfa.getVertexById(v).labelOrId).join(', ');
      }
      instructions.push(`  ${vertex.id} [${this.genDotAttrs(attrs)}];`);
    }
    for (let edge of this._edges) {
      const attrs = {
        id: 'e' + edge.id,
        label: edge.labelOrId,
      };
      if (edge.isset('tooltip')) {
        attrs.tooltip = edge.get('tooltip');
      }
      if (noarrow) {
        attrs.dir = 'none';
      }
      instructions.push(`  ${edge.from && edge.from.id} -> ${edge.to && edge.to.id} [${this.genDotAttrs(attrs)}];`);
    }
    if (this.entry) {
      instructions.push('  _invis [shape=none label="" fixedsize=true width=0 height=0];');
      instructions.push(`  _invis -> ${this.entry.id}${noarrow ? '[dir="none"]' : ''};`);
    }
    instructions.push('}');
    return instructions.join('\n');
  }

}
