import Base from './base';
import Vertex from './vertex';
import Edge from './edge';

export default class Graph extends Base {

  constructor(props) {
    super(props);
    this.setDefault('next_vertex_id', 0);
    this.setDefault('next_edge_id', 0);

    this._vertices = [];
    this._edges = [];

    this._vertex_map = Object.create(null);
    this._edge_map = Object.create(null);
  }

  getVertex(fn) {
    if (typeof fn == 'string' || typeof fn == 'number') {
      return this.getVertexById(fn);
    }
    for (let vertex of this._vertices) {
      if (fn(vertex)) {
        return vertex;
      }
    }
    return null;
  }

  getVertexById(id) {
    return this._vertex_map[id] || null;
  }

  getVertices(fn) {
    if (!fn) {
      return this._vertices.slice();
    }
    return this._vertices.filter(fn);
  }

  getEdge(fn) {
    if (typeof fn == 'string' || typeof fn == 'number') {
      return this.getEdgeById(fn);
    }
    for (let edge of this._edges) {
      if (fn(edge)) {
        return edge;
      }
    }
    return null;
  }

  getEdgeById(id) {
    return this._edge_map[id] || null;
  }

  getEdges(fn) {
    if (!fn) {
      return this._edges.slice();
    }
    return this._edges.filter(fn);
  }

  generateVertexId() {
    return this._props.next_vertex_id++;
  }

  generateEdgeId() {
    return this._props.next_edge_id++;
  }

  // addVertex(vertex: Vertex)
  // addVertex(id)
  // addVertex(props)
  // addVertex(id, props)
  // addVertex()
  addVertex(vertex, props) {
    if (typeof vertex == 'string' || typeof vertex == 'number') {
      const id = vertex;
      if (props) {
        vertex = new Vertex(id, props);
      } else {
        vertex = new Vertex(id);
      }
    } else if (vertex && !(vertex instanceof Vertex)) {
      const id = this.generateVertexId();
      const props = vertex;
      vertex = new Vertex(id, props);
    } else if (!vertex) {
      const id = this.generateVertexId();
      vertex = new Vertex(id);
    }
    if (!this._vertex_map[vertex.id]) {
      vertex.graph = this;
      this._vertices.push(vertex);
      this._vertex_map[vertex.id] = vertex;
      this.emit('vertex.add', vertex);
    }
    return vertex;
  }

  hasVertex(vertex) {
    if (typeof vertex == 'undefined' || vertex === null) {
      return false;
    }
    const id = typeof vertex == 'string' || typeof vertex == 'number' ? vertex : vertex.id;
    return !!this._vertex_map[id];
  }

  removeVertex(vertex) {
    if (this._vertex_map[vertex.id]) {
      const position = this._vertices.indexOf(vertex);
      if (position > -1) this._vertices.splice(position, 1);
      delete this._vertex_map[vertex.id];
      if (!vertex.get('self-remove')) {
        for (let edge of vertex.edges) {
          this.removeEdge(edge);
        }
      }
      this.emit('vertex.remove', vertex);
      return true;
    }
    return false;
  }

  removeVertexById(id) {
    if (this._vertex_map[id]) {
      return this.removeVertex(this._vertex_map[id]);
    }
    return false;
  }


  // addEdge(edge: Edge)
  // addEdge(from, to)
  // addEdge(id, from, to)
  // addEdge(from, to, props)
  // addEdge(id, from, to, props)
  /// addEdge(edges: Edge): Edge;
  /// addEdge(from: Vertex | null, to: Vertex | null): Edge;
  /// addEdge(id: string | number, from: Vertex | null, to: Vertex | null): Edge;
  /// addEdge(from: Vertex | null, to: Vertex | null, props: Object): Edge;
  /// addEdge(id: string | number, from: Vertex | null, to: Vertex | null, props: Object): Edge;
  addEdge(edge, from, to, props) {
    if (!(edge instanceof Edge)) {
      if (!to) { // addEdge(from, to)
        const id = this.generateEdgeId();
        to = from;
        from = edge;
        edge = new Edge(id, from, to);
      } else if (!props) {
        if (typeof edge == 'number' || typeof edge == 'string') { // addEdge(id, from, to)
          const id = edge;
          edge = new Edge(id, from, to);
        } else { // addEdge(from, to, props)
          const id = this.generateEdgeId();
          props = to;
          to = from;
          from = edge;
          edge = new Edge(id, from, to, props);
        }
      } else { // addEdge(id, from, to, props)
        const id = edge;
        edge = new Edge(id, from, to, props);
      }
    }
    if (!this._edge_map[edge.id]) {
      if (edge.from && !this._vertex_map[edge.from.id]) {
        this.addVertex(edge.from);
      }
      if (edge.to && !this._vertex_map[edge.to.id]) {
        this.addVertex(edge.to);
      }
      edge.graph = this;
      this._edges.push(edge);
      this._edge_map[edge.id] = edge;
      this.emit('edge.add', edge);
    }
    return edge;
  }

  hasEdge(edge) {
    if (typeof edge == 'undefined' || edge === null) {
      return false;
    }
    const id = typeof edge == 'string' || typeof edge == 'number' ? edge : edge.id;
    return !!this._edge_map[id];
  }

  removeEdge(edge) {
    if (this._edge_map[edge.id]) {
      const position = this._edges.indexOf(edge);
      if (position > -1) this._edges.splice(position, 1);
      delete this._edge_map[edge.id];
      if (!edge.get('self-remove')) {
        if (edge.from) edge.from.removeEdge(edge);
        if (edge.to)   edge.to.removeEdge(edge);
      }
      this.emit('edge.remove', edge);
      return true;
    }
    return false;
  }

  removeEdgeById(id) {
    if (this._edge_map[id]) {
      return this.removeEdge(this._edge_map[id]);
    }
    return false;
  }

  bfs(vertex, callback, initialValue) {
    if (!(vertex instanceof Vertex)) {
      throw new TypeError('BFS needs a Vertex instance to start iteration');
    }
    return vertex.bfs(callback, initialValue);
  }

  dfs(vertex, callback, initialValue) {
    if (!(vertex instanceof Vertex)) {
      throw new TypeError('DFS needs a Vertex instance to start iteration');
    }
    return vertex.dfs(callback, initialValue);
  }

  toDOT(graph_name = 'directed_graph') {
    const instructions = [];
    instructions.push(`digraph ${graph_name} {`);
    instructions.push('  node [shape = circle];');
    instructions.push('  rankdir=LR;');
    this._edges.forEach(v => {
      instructions.push(`  ${v.from && v.from.labelOrId} -> ${v.to && v.to.labelOrId} [ label = "${v.labelOrId}" ];`);
    });
    instructions.push('}');
    return instructions.join('\n');
  }

}
