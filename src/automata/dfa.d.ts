import { Graph, Vertex, Edge } from '../graph/typings';
import NFA from './nfa';

declare class DFA extends NFA {

  constructor(props?: object);

  greedy: boolean;
  done: boolean;
  state: Vertex;
  matches: string[];
  entry: Vertex;

  reset(): void;
  next(val: string): any;
  toDOT(name?: string, noarrow?: boolean): string;

  static from(object: NFA): DFA;

}

export = DFA;
