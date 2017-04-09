/// <reference path="./nfa.d.ts" />

import { Graph } from '../graph';

export default class NFA extends Graph {

  constructor(props) {
    super(props);
    this.setDefault('epsilon', 'ε');
    this.setDefault('entries', []);

    this._move_map = Object.create(null);
    this._terminals = [];

    this.on('vertex.add', (vertex) => {
      this._move_map[vertex.id] = [];
      if (vertex.get('terminal')) {
        this._terminals.push(vertex);
      }
    });

    this.on('vertex.remove', (vertex) => {
      delete this._move_map[vertex.id];
      if (vertex.get('terminal')) {
        const position = this._terminals.indexOf(vertex);
        if (position > -1) {
          this._terminals.splice(position, 1);
        }
      }
    });

    this.on('edge.add', (edge) => {
      this._move_map[edge.from.id].push(edge);
    });

    this.on('edge.remove', (edge) => {
      const list = this._move_map[edge.from.id];
      const position = list.indexOf(edge);
      if (position > -1) {
        list.splice(position, 1);
      }
    });

    this.on('edge.update', (edge, property, oldValue) => {
      if (property == 'from') {
        const oldFromMove = this._move_map[oldValue.id];
        const position = oldFromMove.indexOf(edge);
        if (position > -1) {
          oldFromMove.splice(position, 1);
        }
        if (!this._vertex_map[edge.from.id]) {
          this.addVertex(edge.from);
        }
        this._move_map[edge.from.id].push(edge);

      } else if (property == 'to') {
        if (!this._vertex_map[edge.to.id]) {
          this.addVertex(edge.to);
        }
      }
    });
  }

  get entries() {
    return this.get('entries').slice();
  }

  get terminals() {
    return this._terminals.slice();
  }

  isTerminal(vertex) {
    return this._terminals.indexOf(vertex) > -1;
  }

  minimize() {
    const visited = Object.create(null);
    let stack = [...this._props.entries];
    let vertex;
    while (vertex = stack.shift()) { // eslint-disable-line no-cond-assign
      if (visited[vertex.id]) continue;
      stack = stack.concat(vertex.outs.map(v => v.to));
      visited[vertex.id] = true;
    }
    for (let vertex of this._vertices) {
      if (vertex.id in visited) continue;
      this.removeVertex(vertex);
    }
  }

  toDOT(graph_name = 'nfa') {
    const terminals = this.terminals;
    const instructions = [];
    instructions.push(`digraph ${graph_name} {`);
    if (terminals.length) {
      instructions.push('  node [shape = doublecircle]; ' + terminals.map(v => v.labelOrId).join(' ') + ';');
    }
    instructions.push('  node [shape = circle];');
    instructions.push('  rankdir=LR;');
    this._edges.forEach(v => {
      const label = v.label || (v.get('match') == this._props.epsilon ? 'ε' : v.id);
      instructions.push(`  ${v.from && v.from.labelOrId} -> ${v.to && v.to.labelOrId} [ label = "${label}" ];`);
    });
    instructions.push('}');
    return instructions.join('\n');
  }


  // ==========================================================================
  // Alias
  // ==========================================================================

  // addState(vertex : Vertex)
  // addState(id)
  // addState(props)
  // addState(id, props)
  // addState()
  addState() {
    return this.addVertex.apply(this, arguments);
  }

  getState(id) {
    return this.getVertexById(id);
  }

  removeState(state) {
    return this.removeVertex(state);
  }

  removeStateById(id) {
    return this.removeVertexById(id);
  }

  // addTransition(edge : Edge)
  // addTransition(from, to)
  // addTransition(id, from, to)
  // addTransition(from, to, props)
  // addTransition(id, from, to, props)
  addTransition() {
    return this.addEdge.apply(this, arguments);
  }

  getTransition(id) {
    return this.getEdgeById(id);
  }

  removeTransition(trans) {
    return this.removeEdge(trans);
  }

  removeTransitionById(id) {
    return this.removeEdgeById(id);
  }

}
