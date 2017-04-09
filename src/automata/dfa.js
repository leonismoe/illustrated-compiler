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

  next(ch) {
    ;
  }

  toDOT(graph_name = 'dfa') {
    const instructions = [];
    instructions.push(`digraph ${graph_name} {`);
    if (this._terminals.length) {
      instructions.push('  node [shape = doublecircle]; ' + this._terminals.map(v => v.labelOrId).join(' ') + ';');
    }
    instructions.push('  node [shape = circle];');
    instructions.push('  rankdir=LR;');
    this._edges.forEach(v => {
      instructions.push(`  ${v.from && v.from.labelOrId} -> ${v.to && v.to.labelOrId} [ label = "${v.labelOrId}" ];`);
    });
    instructions.push('}');
    return instructions.join('\n');
  }

}
