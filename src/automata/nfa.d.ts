import { Graph, Vertex, Edge } from '../graph/typings';

declare class NFA extends Graph {

  constructor(props?: object);

  entries: Vertex[];
  terminals: Vertex[];

  isTerminal(vertex: Vertex): boolean;
  minimize(): void;
  toDOT(name?: string, noarrow?: boolean): string;

  addState(): Vertex;
  addState(state: Vertex): Vertex;
  addState(props: object): Vertex;
  addState(id: string | number, props?: object): Vertex;

  hasState(state: Vertex): boolean;
  hasState(id: string | number): boolean;

  removeState(state: Vertex): boolean;
  removeStateById(id: string | number): boolean;

  addTransition(trans: Edge): Edge;
  addTransition(from: Vertex | null, to: Vertex | null, props?: object): Edge;
  addTransition(id: string | number, from: Vertex | null, to: Vertex | null, props?: object): Edge;

  hasTransition(trans: Edge): boolean;
  hasTransition(id: string | number): boolean;

  removeTransition(trans: Edge): boolean;
  removeTransitionById(id: string | number): boolean;

}

export = NFA;
