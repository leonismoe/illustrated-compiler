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
  toDOT(name?: string, options?: object): string;

  mount(dfa: DFA, edge: Edge): void;
  mount(dfa: DFA, props: object, state?: Vertex): void;
  mount(dfa: DFA, accept: string | number | ((val: string) => boolean) | RegExp | null, state?: Vertex): void;

  static from(object: NFA, options?: object): DFA;

}

export = DFA;
