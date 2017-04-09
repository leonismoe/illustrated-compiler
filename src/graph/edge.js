import Base from './base';
import Graph from './graph';
import Vertex from './vertex';

export default class Edge extends Base {

  constructor(id, from, to, props) {
    super(props);

    if (typeof id != 'number' && typeof id != 'string') {
      throw new TypeError('Edge ID can only be a number or string');
    }

    if (from != null && !(from instanceof Vertex) || to != null && !(to instanceof Vertex)) {
      throw new TypeError('Related vertices must be Vertex instance or null');
    }

    this._id = id;
    this._from = from;
    this._to = to;
    this._graph = null;

    if (from) from.addEdge(this);
    if (to)   to.addEdge(this);
  }

  set(name, value) {
    const oldValue = this.get(name);
    const result = Base.prototype.set.call(this, name, value);
    if (this._graph) {
      this._graph.emit('edge.update', this, name);
    }
    return result;
  }

  get from() {
    return this._from;
  }

  set from(value) {
    if (value != null && !(value instanceof Vertex)) {
      throw new TypeError('Related vertex must be a Vertex instance');
    }

    const oldValue = this._from;
    if (this._from) {
      this._from.removeEdge(this);
    }
    this._from = value;
    if (value) {
      value.addEdge(this);
    }

    if (this._graph) {
      this._graph.emit('edge.update', this, 'from', oldValue);
    }

    return value;
  }

  get to() {
    return this._to;
  }

  set to(value) {
    if (value != null && !(value instanceof Vertex)) {
      throw new TypeError('Related vertex must be a Vertex instance');
    }

    const oldValue = this._to;
    if (this._to) {
      this._to.removeEdge(this);
    }
    this._to = value;
    if (value) {
      value.addEdge(this);
    }

    if (this._graph) {
      this._graph.emit('edge.update', this, 'to', oldValue);
    }

    return value;
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

  remove() {
    if (this._from) {
      this._from.removeEdge(this);
    }
    if (this._to) {
      this._to.removeEdge(this);
    }
    this.set('self-remove', true);
    if (this._graph) {
      this._graph.removeEdge(this);
    }
    this.destroy();
  }

  destroy() {
    this._from  = null;
    this._to    = null;
    this._props = null;
  }

}
