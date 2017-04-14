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

  toDOT(name, noarrow) {
    const terminals = this.terminals;
    const instructions = [];
    instructions.push(`digraph ${name ? JSON.stringify(name) : ''} {`);
    if (terminals.length) {
      instructions.push('  node [shape=doublecircle]; ' + terminals.map(v => v.id).join(' ') + ';');
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
      }
      instructions.push(`  ${JSON.stringify(vertex.id)} [${this.genDotAttrs(attrs)}];`);
    }
    for (let edge of this._edges) {
      const attrs = {
        id: 'e' + edge.id,
        label: edge.label || (edge.get('match') == this._props.epsilon ? 'ε' : edge.id),
      };
      if (attrs.label == ' ') {
        attrs.label = '" "';
      }
      if (edge.isset('tooltip')) {
        attrs.tooltip = edge.get('tooltip');
      }
      if (noarrow) {
        attrs.dir = 'none';
      }
      instructions.push(`  ${edge.from && JSON.stringify(edge.from.id)} -> ${edge.to && JSON.stringify(edge.to.id)} [${this.genDotAttrs(attrs)}];`);
    }
    instructions.push('  node [shape=none label="" fixedsize=true width=0 height=0];');
    const entries = this._props.entries;
    for (let i = 0, size = entries.length; i < size; ++i) {
      instructions.push(`  _invis${i} -> ${JSON.stringify(entries[i].id)}${noarrow ? '[dir="none"]' : ''};`);
    }
    instructions.push('}');
    return instructions.join('\n');
  }

}

const GraphProto = Graph.prototype;
Object.assign(NFA.prototype, {
  addState:             GraphProto.addVertex,
  getState:             GraphProto.getVertexById,
  removeState:          GraphProto.removeVertex,
  removeStateById:      GraphProto.removeVertexById,

  addTransition:        GraphProto.addVertex,
  getTransition:        GraphProto.getEdgeById,
  removeTransition:     GraphProto.removeEdge,
  removeTransitionById: GraphProto.removeEdgeById,
});
