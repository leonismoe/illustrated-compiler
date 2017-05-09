/// <reference path="./nfa.d.ts" />

import isPlainObject from 'lodash/isPlainObject';
import { Graph, Edge } from '../graph';

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

  // mount(nfa, edge)
  // mount(nfa, props, state?)
  // mount(nfa, accept?, state?)
  mount(nfa, edge, state) {
    if (!(nfa instanceof NFA)) {
      throw new TypeError('The object to be mounted is not a NFA instance');
    }

    if (!(edge instanceof Edge)) {
      if (!state) {
        if (nfa.entries.length != 1) {
          throw new Error('The mount point is not specified');
        }
        state = nfa.entries[0];
      }

      // mount(nfa, props, state)
      if (edge && isPlainObject(edge)) {
        edge = new Edge(null, state, null, edge);

      // mount(nfa, accept, state)
      } else {
        const accept = arguments.length > 1 ? edge : this._props.epsilon;
        const label = accept == this._props.epsilon ? 'ε' : '' + accept;
        edge = new Edge(null, state, null, { accept, label });
      }
    }

    if (!edge.isset('accept') || edge.get('accept') == '') {
      throw new Error('The edge is invalid: property accept is empty');
    }

    if (!edge.from) {
      edge.from = this.entries[0];
    } else if (edge.from != this.getVertexById(edge.from.id)) {
      throw new Error('The source state does not exist in the source NFA');
    }

    if (!edge.to) {
      const target_entries = nfa.entries;
      if (target_entries.length == 0) {
        throw new Error('The target NFA has no entries');
      }
      if (target_entries.length > 1) {
        throw new Error('Don\'t know the target state to mount: more than 1 entries');
      }
      edge.to = target_entries[0];
    } else if (edge.to != nfa.getVertexById(edge.to.id)) {
      throw new Error('The target state does not exist in the target NFA');
    }

    // const mount_accept = edge.get('accept');
    // for (let temp of edge.from.out) {
    //   if (temp.get('accept') == mount_accept) {
    //     throw new Error(`The transition of "${mount_accept}" exists in the source NFA`);
    //   }
    // }

    const state_mapping = Object.create(null);
    if (edge.to) {
      state_mapping[edge.to.id] = this.addState(edge.to.getProps());
    }
    this.addEdge(edge.from, edge.to && state_mapping[edge.to.id], edge.getProps());
    edge.bfs(trans => {
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

    const entries = this._props.entries;
    const terminals = this.terminals;
    const instructions = [];
    instructions.push(`digraph ${name ? JSON.stringify(name) : ''} {`);
    for (let i = 0, size = entries.length; i < size; ++i) {
      instructions.push(`  _invis${i} [shape=none label="" fixedsize=true width=0 height=0];`);
    }
    if (terminals.length) {
      instructions.push('  node [shape=doublecircle]; ' + terminals.map(v => JSON.stringify(v.id)).join(' ') + ';');
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
    for (let i = 0, size = entries.length; i < size; ++i) {
      instructions.push(`  _invis${i} -> ${JSON.stringify(entries[i].id)}${options.noarrow ? '[dir="none"]' : ''};`);
    }
    for (let edge of this._edges) {
      const attrs = {
        id: 'e' + edge.id,
        label: edge.label || (edge.get('accept') == this._props.epsilon ? 'ε' : edge.id),
      };
      if (edge.isset('tooltip')) {
        attrs.tooltip = edge.get('tooltip');
      }
      if (options.noarrow) {
        attrs.dir = 'none';
      }
      instructions.push(`  ${edge.from && JSON.stringify(edge.from.id)} -> ${edge.to && JSON.stringify(edge.to.id)} [${this.genDotAttrs(attrs)}];`);
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
