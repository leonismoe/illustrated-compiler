import NFA from './nfa';
import ParseError from './parse-error';

const defaultOptions = {
  epsilon_symbol: 'ε',
  epsilon_label: 'ε',
  initial_state_symbol: 'X',
  final_state_symbol: 'Y',
  max_repeat_count: 8,
  max_repeat_group: 2,
  minimize_circle: false,
};

const hexdigit = /[0-9a-fA-F]/;
const octdigit = /[0-7]/;

export default class Regex2NFA {

  constructor(options) {
    this.options = Object.assign({}, defaultOptions, options);
  }

  static transform(regex) {
    return (new Regex2NFA()).transform(regex);
  }

  transform(regex) {
    const tokens = this.lexicalAnalyse(regex);
    const rpn = this.tokens2rpn(tokens);
    return this.rpn2nfa(rpn);
  }

  lexicalAnalyse(regex) {
    if (regex instanceof RegExp) {
      regex = regex.source;
    }

    const search_until = (search, begin, end, open = false) => {
      let result = -1;
      let escaped = false;
      for (let i = begin; i < end; ++i) {
        const ch = regex[i];
        if (ch == '\\') {
          escaped = !escaped;
        } else if (ch == search && !escaped) {
          result = i;
          break;
        } else if (open && ch == open && !escaped) {
          throw new ParseError(`Character "${open}" is not allowed between "${open}" and "${search}"`, 0, i);
        } else {
          escaped = false;
        }
      }
      return result;
    };

    const tokens = [];
    const octs = [];

    let escaped = false;
    let paren_count = 0;
    for (let i = 0, len = regex.length; i < len; ++i) {
      let ch = regex[i];
      let token = null;
      if (ch == '\\' && !escaped) {
        escaped = true;
        continue;
      }
      if (escaped) {
        escaped = false;
        ch = '\\' + ch;
      }

      // handle escape
      if (ch.length > 1) {
        if (ch[1] == 'x') {
          const temp = regex.substr(i + 1, 2);
          if (hexdigit.test(temp[0])) {
            if (!hexdigit.test(temp[1])) {
              throw new ParseError('Invalid hexadecimal escape sequence', 0, i + 2);
            }
            ch += temp;
            i += 2;
          } else {
            ch = 'x';
          }

        } else if (ch[1] == 'u') {
          const temp = regex.substr(i + 1, 4);
          if (hexdigit.test(temp[0])) {
            for (let j = 1; j < 4; ++j) {
              if (!hexdigit.test(temp[j])) {
                throw new ParseError('Invalid Unicode escape sequence', 0, i + 1 + j);
              }
            }
            ch += temp;
            i += 4;
          } else {
            ch = 'u';
          }

        } else if (/\d/.test(ch[1])) {
          if ((ch[1] | 0) >= 8) {
            throw new ParseError('Back reference is not supported', 0, i + 1);
          }

          let temp = '';
          for (let j = 1; j < 3 && octdigit.test(regex[i + j]); ++j) {
            temp += regex[i + j];
          }
          octs.push(parseInt(ch[1] + temp, 8));
          ch += temp;
          i += temp.length;

        } else if (ch[1] == 'c') {
          const temp = regex[i + 1];
          if (/[a-z]/i.test(temp)) {
            ch += temp;
            i += 1;
          } else {
            ch = 'c';
          }

        } else if (ch[1] == 'b' || ch[1] == 'B') {
          throw new ParseError('Boundary character "\\b" and "\\B" are not supported', 0, i + 1);

        } else if ('tnvfrdDsSwW'.indexOf(ch[1]) < 0) {
          ch = ch[1];
        }
      }

      if (ch == '(') {
        let capture = true;
        const lookahead2 = regex.substr(i + 1, 2);
        if (lookahead2 == '?:') {
          capture = false;
          ch = '(?:';
          i += 2;
        } else {
          ++paren_count;
        }
        if (lookahead2 == '?=' || lookahead2 == '?!') {
          throw new ParseError(`Quantifier "${lookahead2}" is not supported`, 0, i + 1);
        }

        const lookahead3 = regex.substr(i + 1, 3);
        if (lookahead3 == '?<=' || lookahead3 == '?<!') {
          throw new ParseError('Lookbehind is not supported', 0, i + 1);
        }

        token = { type: 'group', value: '(', capture, offset: i };

      } else if (ch == ')') {
        token = { type: 'group', value: ')', offset: i };

      } else if (ch == '[') {
        const offset = search_until(']', i + 1, len);
        if (offset < 0) {
          throw new ParseError('Expecting "]", but reached EOF', 0, len);
        }
        if (offset == i + 1) {
          throw new ParseError('Expecting character list between "[" and "]", but nothing found', 0, i + 1);
        }
        const range = regex.slice(i + 1, offset);
        ch = '[' + range + ']';
        token = { type: 'range', value: range, offset: i };
        try {
          new RegExp(ch); // throws
        } catch (e) {
          throw new ParseError('Range out of order in character class', 0, i + 1);
        }
        i = offset;

      } else if (ch == '{') {
        let range = [];
        let temp = '';
        for (let j = i + 1; j < len; ++j) {
          const ch = regex[j];
          if (/\d/.test(ch)) {
            if (range.length == 0) {
              temp += ch;
            }
          } else if (ch == ',' && temp && range.length == 0) {
            range.push(temp | 0);
            temp = '';
          } else if (ch == '}' && range.length <= 1) {
            if (temp) {
              range.push(temp | 0);
            } else if (range.length == 1) {
              range.push(Infinity);
            }
            break;
          } else {
            break;
          }
        }

        if (range.length == 2) {
          if (range[0] > range[1]) {
            throw new ParseError('Numbers out of order in {} quantifier', 0, i + 2 + ('' + range[0]).length);
          }
        } else if (range.length != 1) {
          range = null;
        }

        if (range) {
          if (range[0] == 0 && range[1] == 0) {
            throw new ParseError('It\'s meaningless to repeat 0 times', 0, i + 1);
          }
          i += range[0].toString().length + 1;
          if (range[1] && range[1] != Infinity) {
            i += range[1].toString().length + 1;
          } else if (range[1]) {
            i += 1;
          }
          token = { type: 'repeat', value: range, greedy: true, offset: i };
        } else {
          ch = '{';
        }

      } else if (ch == '^' || ch == '$' || ch == '\\b' || ch == '\\B') {
        throw new ParseError('Boundary character "^", "$", "\\b" and "\\B" are not supported', 0, i);

      } else if (ch == '*' || ch == '+' || ch == '?') {
        if (ch == '?' && tokens.length && tokens[tokens.length - 1].type == 'repeat') {
          tokens[tokens.length - 1].greedy = false;
          continue;
        }

        let range;
        if (ch == '*') {
          range = [0, Infinity];
        } else if (ch == '+') {
          range = [1, Infinity];
        } else if (ch == '?') {
          range = [0, 1];
        }

        token = { type: 'repeat', value: range, greedy: true, offset: i };

      } else if (ch == '|') {
        token = { type: 'union', value: '|', offset: i };
      }

      if (!token) {
        token = { type: 'char', value: ch, offset: i };
      }

      token.text = ch;
      tokens.push(token);
    }

    for (let i = 0, size = octs.length; i < size; ++i) {
      const oct = octs[i];
      if (oct && oct <= paren_count) {
        throw new ParseError('Back reference is not supported');
      }
    }

    return tokens;

  }

  tokens2rpn(tokens) {
    const result = [];
    const stack = [];

    let interpret_stack_count = 0;
    const append = (object) => {
      switch (object.type) {
        case 'concat':
          if (interpret_stack_count < 2) {
            return result.length;
          }
          --interpret_stack_count;
          break;
        case 'union':
          if (interpret_stack_count < 2) {
            throw new Error('No expression to union');
          }
          --interpret_stack_count;
          break;
        case 'repeat':
          if (interpret_stack_count < 1) {
            throw new Error('Nothing to repeat');
          }
          break;
        case 'char':
        case 'range':
          ++interpret_stack_count;
          break;
      }
      return result.push(object);
    };

    let parsed_length = 0;
    let last_char = null;
    for (let token of tokens) {
      if (token.type == 'group') {
        if (token.value == '(') {
          stack.push(token);
          last_char = null;

        } else {
          let top;
          while (top = stack.pop()) { // eslint-disable-line no-cond-assign
            if (top.type == 'group' && top.value == '(') break;
            append(top);
          }
          if (!top) {
            throw new ParseError('Unmatched ")"', 0, parsed_length);
          }
          last_char = ')';
        }

      } else if (token.type == 'repeat') {
        if (!last_char) {
          throw new ParseError('Nothing to repeat', 0, parsed_length);
        }

        const range = token.value;
        const max_finite_repeat = range.length == 2 && range[1] != Infinity ? range[1] : range[0];
        if (max_finite_repeat > this.options.max_repeat_count || last_char == ')' && max_finite_repeat > this.options.max_repeat_group) {
          throw new ParseError('Repeat too more', 0, parsed_length);
        }

        last_char = null;
        stack.push(token);

      } else if (token.type == 'union') {
        last_char = null;
        stack.push(token);

      } else {
        let top;
        while (stack.length && (top = stack[stack.length - 1]) && top.type == 'repeat') {
          stack.pop();
          append(top);
        }
        last_char = token;
        stack.push({ type: 'concat', value: '', offset: parsed_length });
        append(token);
      }

      parsed_length += token.text.length;
    }

    let top;
    while (top = stack.pop()) { // eslint-disable-line no-cond-assign
      if (top.type == 'group' && top.value == '(') {
        throw new Error('Unterminated group');
      }
      append(top);
    }

    return result;
  }

  rpn2nfa(tokens) {
    const nfa = new NFA({ epsilon: this.options.epsilon_symbol });
    const stack = [];
    const epsilon_edge_props = { accept: this.options.epsilon_symbol, label: this.options.epsilon_label };

    for (let token of tokens) {
      if (token.type == 'char' || token.type == 'range') {
        const begin = nfa.addState();
        const ch = token.value[0] == '\\' || token.type == 'range' ? new RegExp(`[${token.value}]`) : token.value;
        const edge = nfa.addEdge(begin, null, { accept: ch, label: token.value });
        stack.push({ entry: begin, edges: [edge], simple: true });

      } else if (token.type == 'concat') {
        const b = stack.pop();
        const a = stack.pop();
        for (let edge of a.edges) {
          edge.to = b.entry;
        }
        stack.push({ entry: a.entry, edges: b.edges, simple: false });

      } else if (token.type == 'union') {
        const begin = nfa.addState();
        const b = stack.pop();
        const a = stack.pop();

        nfa.addEdge(begin, a.entry, epsilon_edge_props);
        nfa.addEdge(begin, b.entry, epsilon_edge_props);

        stack.push({ entry: begin, edges: [...a.edges, ...b.edges], simple: false });

      } else if (token.type == 'repeat') {
        const range = token.value;
        if (range.length == 2 && range[0] == range[1]) {
          range.pop();
        }
        const [ a, b ] = range;
        const { entry: original_entry, edges: original_edges, simple } = stack.pop();
        let entry = original_entry;
        let edges = [...original_edges];
        let last_entry = original_entry;
        let last_edges = edges;

        if (a == 0) {
          entry = nfa.addState();
          nfa.addEdge(entry, original_entry, epsilon_edge_props);
          edges = [ nfa.addEdge(entry, null, epsilon_edge_props) ];
        }

        // a > 1
        for (let i = 1; i < a; ++i) {
          edges = [];
          const state_mapping = Object.create(null);
          const new_entry = nfa.addState();
          state_mapping[original_entry.id] = new_entry.id;
          for (let edge of last_edges) {
            edge.to = new_entry;
          }

          original_entry.bfsEdge((edge) => {
            const is_final_edge = original_edges.indexOf(edge) > -1;
            const id_to = is_final_edge ? null : edge.to.id;
            if (!is_final_edge && !state_mapping[id_to]) {
              const new_state = nfa.addState();
              state_mapping[id_to] = new_state.id;
            }
            const begin = state_mapping[edge.from.id];
            const end = is_final_edge ? null : state_mapping[id_to];
            const new_edge = nfa.addEdge(begin, end, edge.getProps());
            if (is_final_edge) {
              edges.push(new_edge);
            }
          }, null, (edge) => original_edges.indexOf(edge) < 0);

          last_edges = edges;
          last_entry = new_entry;
        }

        if (b == 1) {
          // a == 0 // ==> true
          edges = edges.concat(original_edges);

        } else if (b == Infinity) {
          if (a == 0) {
            for (let edge of original_edges) {
              edge.to = entry;
            }

          } else {
            const new_end_state = nfa.addState();
            for (let edge of edges) {
              edge.to = new_end_state;
            }
            nfa.addEdge(new_end_state, last_entry, epsilon_edge_props);
            edges = [ nfa.addEdge(new_end_state, null, epsilon_edge_props) ];
          }

        } else {
          let preserved_edges = [];
          if (a == 0) {
            preserved_edges = preserved_edges.concat(edges);
          }

          const minimize_circle = this.options.minimize_circle;
          const cmp = a == 0 ? b - 1 : b - a;
          for (let i = 0; i < cmp; ++i) {
            edges = [];
            const state_mapping = Object.create(null);
            const new_entry = nfa.addState();
            state_mapping[original_entry.id] = new_entry.id;
            for (let edge of last_edges) {
              edge.to = new_entry;
            }

            original_entry.bfsEdge((edge) => {
              const is_final_edge = original_edges.indexOf(edge) > -1;
              const id_to = is_final_edge ? null : edge.to.id;
              if (!is_final_edge && !state_mapping[id_to]) {
                const new_state = nfa.addState();
                state_mapping[id_to] = new_state.id;
              }
              const begin = state_mapping[edge.from.id];
              const end = is_final_edge ? null : state_mapping[id_to];
              const new_edge = nfa.addEdge(begin, end, edge.getProps());
              if (is_final_edge) {
                edges.push(new_edge);
              }
            }, null, (edge) => original_edges.indexOf(edge) < 0);

            if (minimize_circle) {
              nfa.addEdge(last_entry, new_entry, epsilon_edge_props);
            } else {
              preserved_edges.push(nfa.addEdge(new_entry, null, epsilon_edge_props));
            }

            last_edges = edges;
            last_entry = new_entry;
          }

          if (minimize_circle) {
            preserved_edges.push(nfa.addEdge(last_entry, null, epsilon_edge_props));
          }
          edges = edges.concat(preserved_edges);
        }

        stack.push({ entry, edges, simple: false });
      }
    }

    const final_state = nfa.addState({ label: this.options.final_state_symbol, terminal: true });
    const entry_state = nfa.getState(0);
    entry_state.set('label', this.options.initial_state_symbol);
    nfa.set('entries', [entry_state]);

    if (stack.length != 1) {
      throw new Error('Unknown Error');
    }
    for (let edge of stack[0].edges) {
      edge.to = final_state;
    }

    return nfa;
  }

  // http://stackoverflow.com/questions/10220401/c-string-literals-escape-character/10220539#10220539
  escape(str, allowRegexp) {
    if (str[0] != '\\') {
      return str[0];
    }

    let temp;
    switch (str[1]) {
      // case 'a': return '\x07'; // alert (bell)
      case 'b': return '\x08'; // backspace
      case 't': return '\x09'; // horizontal tab
      case 'n': return '\x0a'; // new line (line feed)
      case 'v': return '\x0b'; // vertical tab
      case 'f': return '\x0c'; // form feed
      case 'r': return '\x0d'; // carriage return
      // case 'e': return '\x1b'; // escape (non-standard GCC extension)

      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        temp = str[1];
        for (let i = 2; i <= 3 && i < str.length && /\d/.test(str[i]); ++i) {
          temp += str[i];
        }
        return String.fromCharCode(temp | 0);

      case 'x':
        temp = '';
        for (let i = 2; i <= 3 && i < str.length && /[0-9a-f]/i.test(str[i]); ++i) {
          temp += str[i];
        }
        if (temp.length != 2) {
          return 'x';
        }
        return String.fromCharCode(parseInt(temp, 16));

      case 'u':
        temp = '';
        for (let i = 2; i <= 5 && i < str.length && /[0-9a-f]/i.test(str[i]); ++i) {
          temp += str[i];
        }
        if (temp.length != 4) {
          return 'u';
        }
        return String.fromCharCode(parseInt(temp, 16));

      case 'd':
      case 'D':
      case 's':
      case 'S':
      case 'w':
      case 'W':
        if (allowRegexp) {
          return new RegExp(str.slice(0, 2));
        }

      default:
        return ch;
    }
  }

  inspect_tokens(tokens) {
    let temp = [];
    for (let unit of tokens) {
      switch (unit.type) {
        case 'char':   temp.push(`char: ${unit.value}`); break;
        case 'range':  temp.push(`char range: ${unit.value}`); break;
        case 'group':  temp.push(`group: ${unit.value}`); break;
        case 'repeat': temp.push(`repeat: ${unit.value.join(', ')}\tgreedy: ${unit.greedy}`); break;
        case 'concat': temp.push('concat'); break;
        case 'union':  temp.push('union'); break;
      }
    }
    return temp.join('\n');
  }

}
