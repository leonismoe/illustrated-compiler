import NFA from './nfa';
import ParseError from './parse-error';

const defaultOptions = {
  comment: '#',
  epsilon: 'ε',
  epsilon_label: 'ε',
  final_state_name: 'END',
  only_one_terminal: true,
  initial_nonterminal: null,
};

export default class RLG2NFA {

  constructor(options) {
    this.options = Object.assign({}, defaultOptions, options);
  }

  static transform(text, options) {
    return (new RLG2NFA(options)).transform(text);
  }

  transform(text) {
    const prods = this.parse(text);
    return this.convert(prods);
  }

  parse(text) {
    const regex_produce = /=>|->|::=/;
    const regex_comment = this.options.comment ? new RegExp(this.options.comment.replace(/(\^|\$|\.|\/|\{|\}|\(|\)|\[|\]|\+|\*|\?)/g, '\\$1') + '.*$', 'gm') : null;
    const lines = (regex_comment ? text.replace(regex_comment, '') : text).split('\n');

    // merge lines
    let i = 1;
    while (i < lines.length) {
      if (!regex_produce.test(lines[i])) {
        lines[i - 1] += lines[i];
        lines.splice(i, 1);
      } else {
        ++i;
      }
    }

    const nonterminals = [];
    const rules = [];
    for (let i = 0, len = lines.length; i < len; ++i) {
      if (!lines[i]) continue; // empty line
      const parts = lines[i].split(regex_produce);
      if (parts.length > 2) {
        throw new ParseError('Unexpected "define as" / "consist of" symbol', i, parts[0].length + parts[1].length + lines[i].match(regex_produce)[0].length);
      }
      if (parts.length < 2) {
        throw new ParseError('Unexpected EOL, expecting "define as" / "consist of" symbol', i, lines[i].length);
      }

      const nonterminal = parts[0].trim();
      const expressions = parts[1].split('|');
      if (/\s/.test(nonterminal)) {
        throw new ParseError('Unexpected whitespace in nonterminal', i, parts[0].ltrim().indexOf(' '));
      }

      nonterminals.push(nonterminal);
      rules.push(expressions);
    }

    const prods = [];
    for (let i = 0, len = rules.length; i < len; ++i) {
      const nonterminal = nonterminals[i];
      const expressions = rules[i];

      for (let j = 0; j < expressions.length; ++j) {
        const expr = expressions[j].trim();
        if (!expr) {
          throw new ParseError('The expression cannot be empty', i);
        }
        let nt_offset;
        for (let nt of nonterminals) {
          if ((nt_offset = expr.lastIndexOf(nt)) > -1) {
            break;
          }
        }
        if (nt_offset == 0) {
          throw new ParseError('The expression should contain at least one terminal', i);
        }
        const prefix = nt_offset < 0 ? expr : expr.slice(0, nt_offset).trim();
        const prod = [];
        for (let ch of prefix) {
          prod.push({ type: 'terminal', value: ch });
        }
        if (nt_offset > -1) {
          prod.push({ type: 'nonterminal', value: expr.slice(nt_offset) });
        }
        prods.push({ name: nonterminal, rule: prod });
      }
    }

    return prods;
  }

  convert(prods) {
    let producers = Object.create(null);
    let prod_names = [];
    if (Array.isArray(prods)) {
      for (let prod of prods) {
        if (!producers[prod.name]) {
          producers[prod.name] = [];
          prod_names.push(prod.name);
        }
        producers[prod.name].push(prod.rule);
      }
    } else {
      producers = prods;
      prod_names = Object.keys(producers);
    }

    if (!this.options.initial_nonterminal) {
      this.options.initial_nonterminal = prod_names[0];
    }

    const nfa = new NFA({ epsilon: this.options.epsilon });
    const final_terminal_name = this.options.final_state_name || this.options.epsilon;
    let nodes_added = [];

    // add final terminal state
    if (this.options.only_one_terminal) {
      nfa.addState(final_terminal_name, { label: final_terminal_name, terminal: true });
      nodes_added.push(final_terminal_name);
    }

    for (let nonterminal in producers) {
      nfa.addState(nonterminal, { label: nonterminal });
      nodes_added.push(nonterminal);

      for (let rule of producers[nonterminal]) {
        const last = rule[rule.length - 1];
        const contains_nonterminal = last.type == 'nonterminal';
        if (contains_nonterminal) {
          if (!producers[last.value]) {
            throw new Error(`Nonterminal "${last.value}" is not defined`);
          }
        } else {
          if (!this.options.only_one_terminal && nodes_added.indexOf(last.value) < 0) {
            nfa.addState(last.value, { label: last.value, terminal: true });
            nodes_added.push(last.value);
          }
        }

        const treat_last_as_nonterminal = (contains_nonterminal || this.options.only_one_terminal) ? 1 : 0;
        for (let i = treat_last_as_nonterminal, size = rule.length + 1 - treat_last_as_nonterminal; i < size; ++i) {
          const id = rule.slice(i).reduce((prev, curr) => prev + curr.value, '');
          if (nodes_added.indexOf(id) < 0) {
            nfa.addState(id, { label: id });
            nodes_added.push(id);
          }
        }

        for (let i = 0, size = rule.length - 1 - (contains_nonterminal ? 1 : 0), current = nonterminal; i <= size; ++i) {
          const ch = rule[i];
          const label = ch.value == this.options.epsilon ? this.options.epsilon_label : ch.value;
          let next = rule.slice(i + treat_last_as_nonterminal).reduce((prev, curr) => prev + curr.value, '');
          if (!next && this.options.only_one_terminal || next == this.options.epsilon) {
            next = final_terminal_name;
          }
          const trans_id = `${current}-${ch.value}-${next}`;
          nfa.addEdge(trans_id, nfa.getState(current), nfa.getState(next), { accept: ch.value, label });
          current = next;
        }
      }
    }

    nfa.set('entries', [nfa.getState(this.options.initial_nonterminal)]);
    return nfa;
  }

}
