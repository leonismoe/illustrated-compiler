declare class EventEmitter {

  constructor();

  getListeners(evt: string | RegExp): Function[] | object;

  flattenListeners(listeners: object[]): Function[];

  getListenersAsObject(evt: string | RegExp): object;

  on(evt: string | RegExp, listener: Function): EventEmitter;
  addListener(evt: string | RegExp, listener: Function): EventEmitter;

  once(evt: string | RegExp, listener: Function): EventEmitter;
  addOnceListener(evt: string | RegExp, listener: Function): EventEmitter;

  defineEvent(evt: string): EventEmitter;
  defineEvents(evts: string[]): EventEmitter;

  off(evt: string | RegExp, listener: Function): EventEmitter;
  removeListener(evt: string | RegExp, listener: Function): EventEmitter;

  addListeners(evt: string | RegExp, listeners: Function[]): EventEmitter;
  addListeners(evts: object): EventEmitter;

  removeListeners(evt: string | RegExp, listeners: Function[]): EventEmitter;
  removeListeners(evts: object): EventEmitter;

  manipulateListeners(remove: boolean, evt: string | RegExp, listeners: Function[]): EventEmitter;
  manipulateListeners(remove: boolean, evts: object): EventEmitter;

  removeEvent(evt?: string | RegExp): EventEmitter;
  removeAllListeners(): EventEmitter;

  trigger(evt: string | RegExp, args?: any[]): EventEmitter;
  emitEvent(evt: string | RegExp, args?: any[]): EventEmitter;

  emit(evt: string | RegExp, ...args: any[]): EventEmitter;

  setOnceReturnValue(value: any): EventEmitter;

}


export declare class Base extends EventEmitter {

  constructor(props?: object);

  id: string | number;

  get(name: string, defaultValue?: any): any;
  set(name: string, value: any): any;
  getProps(): object;

  isset(name: string): boolean;
  unset(name: string): boolean;

  setDefault(name: string, value: any): void;

  bind(property: string): object;
  bind(object: object, property: string): object;

  bind2way(property: string): object;
  bind2way(object: object, property: string): object;

  unbind(property: string): boolean;
  unbind(object: object, property: string): boolean;

}


export declare class Graph extends Base {

  constructor(props?: object);

  getVertex(id: string | number): Vertex | null;
  getVertex(fn: (vertex: Vertex) => boolean): Vertex | null;
  getVertexById(id: string | number): Vertex | null;
  getVertices(fn?: (vertex: Vertex, index?: number, array?: Vertex[]) => boolean): Vertex[];

  getEdge(id: string | number): Edge | null;
  getEdge(fn: (edge: Edge) => boolean): Edge | null;
  getEdgeById(id: string | number): Edge | null;
  getEdges(fn?: (edge: Edge, index?: number, array?: Edge[]) => boolean): Edge[];

  generateVertexId(): number;
  generateEdgeId(): number;

  addVertex(): Vertex;
  addVertex(vertex: Vertex): Vertex;
  addVertex(props: object): Vertex;
  addVertex(id: string | number, props?: object): Vertex;

  hasVertex(vertex: Vertex): boolean;
  hasVertex(id: string | number): boolean;

  removeVertex(vertex: Vertex): boolean;
  removeVertexById(id: string | number): boolean;

  addEdge(edge: Edge): Edge;
  addEdge(from: Vertex | null, to: Vertex | null, props?: object): Edge;
  addEdge(id: string | number, from: Vertex | null, to: Vertex | null, props?: object): Edge;

  hasEdge(edge: Edge): boolean;
  hasEdge(id: string | number): boolean;

  removeEdge(edge: Edge): boolean;
  removeEdgeById(id: string | number): boolean;

  bfs(vertex: Vertex, callback: (currentValue: Vertex, previous: any) => any, initialValue?: any): any;
  dfs(vertex: Vertex, callback: (currentValue: Vertex, previous: any) => any, initialValue?: any): any;

  toDOT(graph_name?: string): string;

}


export declare class Vertex extends Base {

  constructor(id: string | number, props?: object);

  graph: Graph | null;
  label: string;
  labelOrId: string | number;

  edges: Edge[];
  out: Edge[];
  in: Edge[];

  addEdge(edge: Edge): void;
  removeEdge(edge: Edge): void;
  removeEdgeById(id: string | number): void;

  remove(): void;
  destroy(): void;

  bfs(callback: (currentValue: Vertex, previous: any) => any, initialValue?: any, condition?: (current: Vertex, index?: number, array?: Vertex[]) => boolean): any;
  bfsEdge(callback: (currentValue: Edge, previous: any) => any, initialValue?: any, condition?: (current: Edge) => boolean): any;
  dfs(callback: (currentValue: Vertex, previous: any) => any, initialValue?: any, condition?: (current: Vertex, index?: number, array?: Vertex[]) => boolean): any;
  dfsEdge(callback: (currentValue: Edge, previous: any) => any, initialValue?: any, condition?: (current: Edge) => boolean): any;

}


export declare class Edge extends Base {

  constructor(id: string | number, from: Vertex | null, to: Vertex | null, props?: object);

  from: Vertex | null;
  to: Vertex | null;
  graph: Graph | null;

  label: string;
  labelOrId: string | number;

  remove: void;
  destroy: void;

}
