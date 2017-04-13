import './styles/visual-rlg/index.css';

import debounce from 'lodash/debounce';
import CodeMirror from 'codemirror';
import Viz from 'viz.js';

// import 'codemirror/mode/ebnf/ebnf';
// import 'codemirror/addon/mode/multiplex';

import DFA from './automata/dfa';
import RLG2NFA from './automata/rlg-to-nfa';
import VisualDFA from './automata/visual-dfa';

import Resizer from './components/resizer';

new Resizer('.panel-resizer', '.panel-left');
new Resizer('.panel-left > .resizer-wrapper', '.editor-grammar');
new Resizer('.panel-right > .resizer-wrapper', '.graph-nfa');

const initial_text = `# a+b*
S -> aS | aC
C -> b | bC | $`;

const options = {
  comment: '#',
  epsilon: '$',
  final_state_name: 'Y',
};

updateSyntaxHighlight();

const $grammar = document.querySelector('.grammar-editor');

// const cm = CodeMirror($grammar, {
//   mode: 'rlg',
//   value: initial_text,
//   lineNumbers: true,
//   // lineWrapping: true,
//   indentWithTabs: false,
//   highlightSelectionMatches: true,
//   styleSelectedText: true,
//   styleActiveLine: true,
//   indentUnit: 2,
// });
// window.cm = cm;
// cm.setSize(null, '100%');

let updating;
let errorMarker;
// cm.on('changes', debounce(onchange, 200));
// onchange(cm);

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
    const nfa = RLG2NFA.transform(text, options);
    const nfa_dot = nfa.toDOT('nfa_graph', true);

    const dfa = DFA.from(nfa);
    let dfa_dot = dfa.toDOT('dfa_graph', true);

    document.querySelector('.nfa-container').innerHTML = Viz(nfa_dot);
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

function updateSyntaxHighlight() {
  CodeMirror.defineMode('rlg', function(config) {
    return CodeMirror.multiplexingMode(
      CodeMirror.getMode(config, 'ebnf'),
      {
        open: new RegExp('^\\s*\\' + options.comment),
        close: /.*$/,
        mode: CodeMirror.getMode(config, 'text/plain'),
        delimStyle: 'comment-delimit'
      }
    );
  });
}
