import './styles/app.css';

import NFA from './automata/nfa';
import DFA from './automata/dfa';
import Regex2NFA from './automata/regex-to-nfa';
import RLG2NFA from './automata/rlg-to-nfa';
import VisualDFA from './automata/visual-dfa';

import debounce from 'lodash/debounce';
import CodeMirror from 'codemirror';
import Viz from 'viz.js';


const initial_text = `# a+b*
S -> aS | aC
C -> b | bC | ε

#S -> aA | bB
#B -> aA | b
#A -> bbB | ε`;

CodeMirror.defineMode('nearley', function(config) {
  return CodeMirror.multiplexingMode(
    CodeMirror.getMode(config, 'ebnf'),
    {
      open: /^\s*#/,
      close: /.*$/,
      mode: CodeMirror.getMode(config, 'text/plain'),
      delimStyle: 'comment-delimit'
    }
  );
});

const cm = CodeMirror(document.querySelector('.grammar-editor'), {
  mode: 'nearley',
  value: initial_text,
  lineNumbers: true,
  // lineWrapping: true,
  indentWithTabs: false,
  highlightSelectionMatches: true,
  styleSelectedText: true,
  styleActiveLine: true,
  indentUnit: 2,
});
cm.setSize(null, '100%');

let updating;
let errorMarker;
cm.on('changes', debounce(onchange, 200));
onchange(cm);

function onchange(instance, changes) {
  if (updating) return;
  updating = true;
  if (errorMarker) errorMarker.clear();
  const text = instance.getValue().trim();
  if (!text) {
    updating = false;
    return;
  }
  try {
    const nfa = Regex2NFA.transform(text);
    const nfa_dot = nfa.toDOT('nfa_graph');
    document.querySelector('.nfa-container').innerHTML = Viz(nfa_dot);

    const dfa = DFA.from(nfa);
    let dfa_dot = dfa.toDOT('dfa_graph', true);
    document.querySelector('.dfa-container').innerHTML = Viz(dfa_dot);
    // debug
    window.visualdfa = new VisualDFA(dfa, '.dfa-container');
  } catch (e) {
    throw e;
    // if (e.message.startsWith('nearley')) {
    //   console.log('Syntax Error');
    // } else if (e.message.startsWith('Empty')) {
    //   console.log('Empty grammar');
    //   updating = false;
    //   return;
    // } else {
    //   console.warn(e);
    // }
    // let last_lf = text.lastIndexOf('\n', e.offset) + 1;
    // let line = (text.slice(0, last_lf).match(/\n/g) || []).length;
    // let col = e.offset - last_lf;
    // errorMarker = cm.markText({ line: line, ch: col }, { line: line, ch: col + 1 }, {
    //   className: 'error-loc'
    // });
  } finally {
    updating = false;
  }
}
