import '../styles/visual-rlg/index.css';

import debounce from 'lodash/debounce';
import ace from 'ace-builds/src-noconflict/ace';
import updateRLGSymbol from './visual-rlg/ace-rlg-syntax';

import DFA from '../automata/dfa';
import RLG2NFA from '../automata/rlg-to-nfa';
import VisualDFA from '../automata/visual-dfa';

import VizFactory from '../components/viz-factory';
import Resizer from '../components/resizer';
// import DragScroll from '../components/dragscroll';

const initial_text = `# a+b*
S -> aS | aC
C -> b | bC | $`;

const options = {
  comment: '#',
  epsilon: '$',
  final_state_name: 'Y',
};

// updateRLGSymbol(options.epsilon, options.comment);

const $grammar = document.getElementById('editor-grammar');
const editorRLG = ace.edit($grammar);
// editorRLG.setTheme('ace/theme/tommorow');
editorRLG.getSession().setMode('ace/mode/rlg');
editorRLG.setValue(initial_text, 1);
editorRLG.setHighlightActiveLine(false);
editorRLG.setHighlightGutterLine(false);
editorRLG.renderer.$cursorLayer.element.style.display = 'none';
editorRLG.getSession().on('change', debounce(onchange, 300));
editorRLG.on('focus', () => {
  editorRLG.renderer.$cursorLayer.element.style.display = 'block';
  editorRLG.setHighlightGutterLine(true);
});
editorRLG.on('blur', () => {
  editorRLG.renderer.$cursorLayer.element.style.display = 'none';
  editorRLG.setHighlightGutterLine(false);
});

const $text = document.getElementById('editor-text');
;

const resizeEditor = () => {
  editorRLG.resize();
};

new Resizer('.panel-resizer', '.panel-left', { callback: resizeEditor });
new Resizer('.panel-left > .resizer-wrapper', '.section-text', { callback: resizeEditor, inverse: true });
new Resizer('.panel-right > .resizer-wrapper', '.section-nfa');

// new DragScroll('.graph-nfa');
// new DragScroll('.graph-dfa');

const VizNFA = VizFactory.create();
const VizDFA = VizFactory.create();
const $nfa = document.querySelector('.graph-nfa');
const $dfa = document.querySelector('.graph-dfa');
const $nfa_overlay = $nfa.nextElementSibling;
const $dfa_overlay = $dfa.nextElementSibling;

let updating;
onchange();
function onchange(e) {
  if (updating) return;
  updating = true;
  const text = editorRLG.getValue().trim();
  if (!text) {
    updating = false;
    return;
  }
  try {
    $nfa_overlay.classList.remove('js-error');
    $nfa_overlay.classList.add('js-loading');
    $dfa_overlay.classList.remove('js-error');
    $dfa_overlay.classList.add('js-loading');

    const nfa = RLG2NFA.transform(text, options);
    const nfa_dot = nfa.toDOT('NFA', true);

    const dfa = DFA.from(nfa);
    let dfa_dot = dfa.toDOT('DFA', true);

    VizNFA(nfa_dot).then((svg) => {
      $nfa_overlay.classList.remove('js-loading');
      $nfa.innerHTML = svg.slice(svg.indexOf('-->', 57) + 3); // remove <?xml...
    }).catch((e) => {
      $nfa_overlay.classList.remove('js-loading');
      $nfa_overlay.classList.add('js-error');
      $nfa_overlay.querySelector('.error-tip').innerText = e.message || 'An error occurred while processing the graph.';
    });

    VizDFA(dfa_dot).then((svg) => {
      $dfa_overlay.classList.remove('js-loading');
      $dfa.innerHTML = svg.slice(svg.indexOf('-->', 57) + 3); // remove <?xml...

      // debug
      window.visualdfa = new VisualDFA(dfa, $dfa);
    }).catch((e) => {
      $dfa_overlay.classList.remove('js-loading');
      $dfa_overlay.classList.add('js-error');
      $dfa_overlay.querySelector('.error-tip').innerText = e.message || 'An error occurred while processing the graph.';
    });
  } catch (e) {
    $nfa_overlay.classList.remove('js-loading');
    $dfa_overlay.classList.remove('js-loading');
    $nfa_overlay.classList.add('js-error');
    $dfa_overlay.classList.add('js-error');
    $nfa_overlay.querySelector('.error-tip').innerText = e.message;
    $dfa_overlay.querySelector('.error-tip').innerText = e.message;
    throw e;
  } finally {
    updating = false;
  }
}
