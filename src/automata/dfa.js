/// <reference path="./dfa.d.ts" />

import NFA from './nfa';
import NFA2DFA from './nfa-to-dfa';
import { Edge } from '../graph';

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

  static from(object, options) {
    return NFA2DFA(object, options);
  }

  reset() {
    this._done = false;
    this._matches = [];
    this._state = this.get('entry');
    this._match_path = [];
    this._wildcard = [];
    this._edge_met = {};
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
        } else if (accept === val || (accept === '' || accept === null) && (this._props.dotall || val != '\n')) {
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
      if (this._wildcard.length) {
        // TODO: backtrack
        const last_wildcard_edge = this._wildcard.pop();
        let steps = 0, edge;
        while ((edge = this._match_path.pop()) && edge != last_wildcard_edge) {
          ++steps;
        }
        if (edge) {
          this._state = this.last_wildcard_edge.from;
          const backtrack = [this._state];
            // let last_step = this._dfa.next(str[i]);
            // if (last_step.done) {
            //   //
            // }
        }
      }
      return { state: this._state, edge: null, done: true, error: 'No available transitions' };
    }
    this._match_path.push(transition);
    this._edge_met[transition.id] = true;
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
        if (last_test.error) break;
        if (last_test.done && i == size) break;
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

  // mount(dfa, edge)
  // mount(dfa, props, state?)
  // mount(dfa, accept, state?)
  mount(dfa, edge, state) {
    if (!(dfa instanceof DFA)) {
      throw new TypeError('The object to be mounted is not a DFA instance');
    }

    if (!(edge instanceof Edge)) {
      if (!state) {
        state = dfa.entry;
      }

      // mount(dfa, props, state)
      if (edge && Object.getPrototypeOf(edge) == Object) {
        edge = new Edge(null, null, state, edge);

      // mount(dfa, accept, state)
      } else {
        edge = new Edge(null, null, state, { accept: edge, label: '' + edge });
      }
    }

    if (!edge.isset('accept') || edge.get('accept') == '') {
      throw new Error('The edge is invalid: property accept is empty');
    }

    if (!edge.from) {
      edge.from = this.entry;
    } else if (edge.from != this.getVertexById(edge.from.id)) {
      throw new Error('The source state does not exist in the source DFA');
    }

    if (!edge.to) {
      if (!dfa.entry) {
        throw new Error('The target DFA has no entries');
      }
      edge.to = dfa.entry;
    } else if (edge.to && edge.to != dfa.getVertexById(edge.to.id)) {
      throw new Error('The target state does not exist in the target DFA');
    }

    const mount_accept = edge.get('accept');
    for (let temp of edge.from.out) {
      if (temp.get('accept') == mount_accept) {
        throw new Error(`The transition of "${mount_accept}" exists in the source DFA`);
      }
    }

    const state_mapping = Object.create(null);
    if (edge.to) {
      state_mapping[edge.to.id] = this.addState(edge.to.getProps());
    }
    this.addEdge(edge.from, edge.to && state_mapping[edge.to.id], edge.getProps());
    edge.bfs((trans) => {
      if (trans.to && !state_mapping[trans.to.id]) {
        state_mapping[trans.to.id] = this.addState(trans.to.getProps());
      }
      if (edge != trans) {
        this.addEdge(state_mapping[trans.from.id], trans.to && state_mapping[trans.to.id], trans.getProps());
      }
    });
  }

  toDOT(name, options) {
    options = Object.assign({
      noarrow: false,
      hide_duplicate_edges: false,
    }, options);

    const nfa = this.get('nfa');
    const instructions = [];
    instructions.push(`digraph ${name ? JSON.stringify(name) : ''} {`);
    if (this.entry) {
      instructions.push('  _invis [shape=none label="" fixedsize=true width=0 height=0];');
    }
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
    if (this.entry) {
      instructions.push(`  _invis -> ${this.entry.id}${options.noarrow ? '[dir="none"]' : ''};`);
    }
    const edge_map = Object.create(null);
    for (let edge of this._edges) {
      const attrs = {
        id: 'e' + edge.id,
        label: edge.labelOrId,
      };
      const _from = edge.from && edge.from.id;
      const _to   = edge.to && edge.to.id;
      if (options.hide_duplicate_edges) {
        const cache_key = `${_from}-${_to}-${attrs.label}`;
        if (edge_map[cache_key]) continue;
        edge_map[cache_key] = true;
      }
      if (edge.isset('tooltip')) {
        attrs.tooltip = edge.get('tooltip');
      }
      if (options.noarrow) {
        attrs.dir = 'none';
      }
      instructions.push(`  ${_from} -> ${_to} [${this.genDotAttrs(attrs)}];`);
    }
    instructions.push('}');
    return instructions.join('\n');
  }

}
