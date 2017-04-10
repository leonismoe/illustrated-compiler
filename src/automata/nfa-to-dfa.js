import NFA from './nfa';
import DFA from './dfa';

export default function NFA2DFA(object) {
  if (!(object instanceof NFA)) {
    throw new TypeError('Source object is not a NFA');
  }

  const entries = object.entries;
  if (entries.length == 0) {
    throw new RangeError('Could not construct DFA: no initial states found');
  }

  const epsilon_symbol = object.get('epsilon');
  const terminals = object.terminals;
  const accepts = get_accepts(object);
  const nfa_states = [ epsilon_closure(object.entries, epsilon_symbol) ];

  const dfa = new DFA();
  const entry = dfa.addVertex({ 'nfa-mapping': map_to_id(nfa_states[0]), terminal: contain_terminal(terminals, nfa_states[0]) });
  dfa.set('entry', entry);
  dfa.set('nfa', object);
  const states = [entry];

  for (let i = 0; i < nfa_states.length; ++i) {
    const state_set = nfa_states[i];
    for (let accept of accepts) {
      const new_state = epsilon_closure(move_closure(state_set, accept), epsilon_symbol);
      if (new_state.length == 0) continue;
      let index = state_index(nfa_states, new_state);
      if (index < 0) {
        index = nfa_states.length;
        nfa_states.push(new_state);
        states.push(dfa.addVertex({ 'nfa-mapping': map_to_id(new_state), terminal: contain_terminal(terminals, new_state) }));
      }
      dfa.addEdge(states[i], states[index], { accept, label: accept.source || accept });
    }
  }
  return dfa;
}

function append_if_not_exist(array, value) {
  if (array.indexOf(value) < 0) {
    array.push(value);
  }
  return array;
}

function epsilon_closure(states, epsilon) {
  const result = states.slice();
  for (let vertex of result) {
    for (let edge of vertex.out) {
      if (edge.get('accept') == epsilon) {
        append_if_not_exist(result, edge.to);
      }
    }
  }
  return result;
}

function move_closure(states, move) {
  const result = [];
  for (let vertex of states) {
    for (let edge of vertex.out) {
      if (edge.get('accept') == move) {
        append_if_not_exist(result, edge.to);
      }
    }
  }
  return result;
}

function get_terminals(nfa) {
  const terminals = [];
  const visited = Object.create(null);
  const epsilon = nfa.get('epsilon');
  let stack = nfa.terminals;
  let vertex;
  while (vertex = stack.shift()) { // eslint-disable-line no-cond-assign
    if (visited[vertex.id]) continue;
    stack = stack.concat(vertex.outs.filter(v => v.get('match') == epsilon).map(v => v.to));
    terminals.push(vertex);
    visited[vertex.id] = true;
  }
  return terminals;
}

function get_accepts(nfa) {
  const accepts = [];
  const epsilon = nfa.get('epsilon');
  for (let edge of nfa.getEdges()) {
    const accept = edge.get('accept');
    if (accept !== undefined && accept != epsilon) {
      if (accepts.indexOf(accept) < 0) {
        accepts.push(accept);
      }
    }
  }
  return accepts;
}

function state_index(states, check) {
  outer:
  for (let i = 0, size = states.length; i < size; ++i) {
    const state = states[i];
    if (state.length != check.length) continue;
    for (let j = 0, len = state.length; j < len; ++j) {
      if (state.indexOf(check[j]) < 0) continue outer;
    }
    return i;
  }
  return -1;
}

function contain_terminal(terminals, states) {
  for (let i = 0, size = terminals.length; i < size; ++i) {
    if (states.indexOf(terminals[i]) > -1) return true;
  }
  return false;
}

function map_to_id(array) {
  return array.map(v => v.id);
}
