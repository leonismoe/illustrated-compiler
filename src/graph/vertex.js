import Base from './base';
import Graph from './graph';
import Edge from './edge';

export default class Vertex extends Base {

  constructor(id, props) {
    super(props);

    if (typeof id != 'number' && typeof id != 'string') {
      throw new TypeError('Vertex ID can only be a number or string');
    }

    this._id = id;
    this._graph = null;

    this._edges = [];
    this._edges_map = Object.create(null);
  }

  get graph() {
    return this._graph;
  }

  set graph(value) {
    if (value !== null && !(value instanceof Graph)) {
      throw new TypeError('Hosted graph must be a Graph instance');
    }
    return this._graph = value;
  }

  get label() {
    return this._props.label || '';
  }

  get labelOrId() {
    return this._props.label || this._id;
  }

  get edges() {
    return this._edges;
  }

  get out() {
    return this._edges.filter(v => v.from == this);
  }

  get in() {
    return this._edges.filter(v => v.to == this);
  }

  addEdge(edge) {
    if (!(edge instanceof Edge)) {
      throw new TypeError('Related edge must be a Edge instance');
    }
    if (!edge.issetId) {
      throw new Error('Edge\'s id is required');
    }
    if (this._edges_map[edge.id]) {
      return;
    }
    if (edge.from == this || edge.to == this) {
      this._edges.push(edge);
      this._edges_map[edge.id] = edge;
      if (this._graph) {
        this._graph.addEdge(edge);
      }
    }
  }

  removeEdge(edge) {
    if (!(edge instanceof Edge)) {
      throw new TypeError('Related edge must be a Edge instance');
    }
    if (!this._edges_map[edge.id]) {
      return;
    }
    const position = this._edges.indexOf(edge);
    if (position > -1) this._edges.splice(position, 1);
    delete this._edges_map[edge.id];
  }

  removeEdgeById(id) {
    if (!this._edges_map[id]) {
      return;
    }
    return this.removeEdge(this._edges_map[id]);
  }

  remove() {
    if (this._graph) {
      this.set('self-remove', true);
      for (let edge of this._edges_map) {
        this._graph.removeEdge(edge);
      }
      this._graph.removeVertex(this);
    }
    this.destroy();
  }

  destroy() {
    this._props     = null;
    this._out_edges = null;
    this._in_edges  = null;
    this._edges_map = null;
  }

  bfs(callback, initialValue, condition) {
    const visited = Object.create(null);
    let stack = [this];
    let vertex;
    let result = initialValue;
    while (vertex = stack.shift()) { // eslint-disable-line no-cond-assign
      if (!vertex || visited[vertex.id]) continue;
      if (condition) {
        stack = stack.concat(vertex.out.filter(condition).map(v => v.to));
      } else {
        stack = stack.concat(vertex.out.map(v => v.to));
      }
      result = callback(vertex, result);
      visited[vertex.id] = true;
    }
    return result;
  }

  bfsEdge(callback, initialValue, condition) {
    const visited = Object.create(null);
    let stack = [...this.out];
    let edge;
    let result = initialValue;
    while (edge = stack.shift()) { // eslint-disable-line no-cond-assign
      if (visited[edge.id]) continue;
      if (condition && condition(edge) || !condition) {
        if (edge.to) stack = stack.concat(edge.to.out);
      }
      result = callback(edge, result);
      visited[edge.id] = true;
    }
    return result;
  }

  dfs(callback, initialValue, condition) {
    const visited = Object.create(null);
    let stack = [this];
    let vertex;
    let result = initialValue;
    while (vertex = stack.pop()) { // eslint-disable-line no-cond-assign
      if (!vertex || visited[vertex.id]) continue;
      if (condition) {
        stack = stack.concat(vertex.out.filter(condition).map(v => v.to));
      } else {
        stack = stack.concat(vertex.out.map(v => v.to));
      }
      result = callback(vertex, result);
      visited[vertex.id] = true;
    }
    return result;
  }

  dfsEdge(callback, initialValue, condition) {
    const visited = Object.create(null);
    let stack = [...this.out];
    let edge;
    let result = initialValue;
    while (edge = stack.pop()) { // eslint-disable-line no-cond-assign
      if (visited[edge.id]) continue;
      if (condition && condition(edge) || !condition) {
        if (edge.to) stack = stack.concat(edge.to.out);
      }
      result = callback(edge, result);
      visited[edge.id] = true;
    }
    return result;
  }

}
