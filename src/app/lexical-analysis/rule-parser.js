import NFA from '../../automata/nfa';
import DFA from '../../automata/dfa';
import Regex2NFA from '../../automata/regex-to-nfa';
import ParseError from '../../automata/parse-error';

export default function parse(text, options) {
  const lines = text.split('\n');
  const result = [];

  let type = null;
  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i].trim();

    if (!line) {
      type = null;
      continue;
    }

    if (line.slice(0, 2) == '//') {
      const content = line.slice(2).trim();
      if (content.slice(0, 5) === 'type:') {
        type = content.slice(5).trim();
      }

    } else {
      if (!type) {
        throw new ParseError(`Please specify the type of token matching this regular expression: ${line}`, i, 0);
      }

      if (/keyword($|\.)/.test(type)) {
        result.push({
          type,
          line: i,
          keyword: line,
        });

      } else {
        result.push({
          type,
          line: i,
          regex: line,
        });
      }
    }
  }

  return result;
}


parse.transform = (tokens, options) => {
  if (typeof tokens == 'string') {
    tokens = parse(tokens, options);
  }

  if (tokens.length == 0) {
    return {
      nfa: null,
      dfa: null,
      keywords: [],
    };
  }

  const nfa = new NFA();
  const entry = nfa.addState();
  const epsilon = nfa.get('epsilon');
  const keywords = [];
  nfa.set('entries', [entry]);

  for (let token of tokens) {
    if (token.keyword) {
      keywords.push(token.keyword);
      continue;
    }

    try {
      const regex_nfa = Regex2NFA.transform(token.regex, {
        final_state_type: token.type,
        max_repeat_count: 32,
        max_repeat_group: 32,
        epsilon_symbol: epsilon,
      });
      const states = regex_nfa.getVertices();
      for (let state of states) {
        state.unset('label');
      }
      nfa.mount(regex_nfa, epsilon, entry);

    } catch (e) {
      e.line = token.line;
      throw e;
    }
  }

  const dfa = DFA.from(nfa);
  for (let state of dfa.terminals) {
    state.set('tooltip', state.get('type'));
  }

  return {
    keywords,
    nfa,
    dfa,
  };
};
