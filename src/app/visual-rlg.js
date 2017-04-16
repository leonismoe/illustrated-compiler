import '../styles/visual-rlg/index.css';

import debounce from 'lodash/debounce';

import Automata from './visual-rlg/automata';
import EditorRLG from './visual-rlg/grammar-editor';
import MediaControls from './visual-rlg/media-controls';
import VisualDFA from '../automata/visual-dfa';
import VisualScanner from './visual-rlg/visual-scanner';
import Resizer from '../components/resizer';


// ============================================================
// Configurations
// ============================================================
const options = {
  comment: '#',
  epsilon: '$',
  final_state_name: 'Y',
};

const font = '18px/1 "Source Code Pro", consolas, monospace, "Microsoft YaHei UI", sans-serif';

const initial_text = `# a+b*
S -> aS | aC
C -> b | bC | $`;


// ============================================================
// Progress Controls
// ============================================================
const controls = new MediaControls('.media-controls');


// ============================================================
// Initialize Automata Drawing and Grammar Editor
// ============================================================
Automata.setConfig(options);
updateGrammar(initial_text);

EditorRLG.setValue(initial_text, 1);
EditorRLG.getSession().on('change', debounce(() => {
  const text = EditorRLG.getValue();
  if (text) {
    updateGrammar(text);
  }
}, 500));

const $dfa = document.querySelector('.graph-dfa');
const $marker = document.querySelector('.editor-text .marker');
function updateGrammar(grammar) {
  return Automata.update(grammar)
    .then(([nfa, dfa]) => {
      const vdfa = new VisualDFA(dfa, $dfa);
      controls.setController(new VisualScanner(vdfa, $marker, font), true);
    });
}


// ============================================================
// Initialize Text Matching
// ============================================================
const getBoolAttr = (node, property) => {
  const value = node.getAttribute(property);
  return value == 'true' || value == property;
};

const $text = document.getElementById('editor-text-input');
$text.addEventListener('change', (e) => {
  // $text.setAttribute('disabled', 'disabled');
  controls.getController().prepare($text.value, true);
  controls.reset(true);
}, false);


// ============================================================
// Initialize Panel Adjuster
// ============================================================
function resizeEditor() {
  EditorRLG.resize();
}

new Resizer('.panel-resizer', '.panel-left', { callback: resizeEditor, relative: '.main-frame' });
new Resizer('.panel-left > .resizer-wrapper', '.section-text', { callback: resizeEditor, inverse: true, relative: '.panel-left' });
new Resizer('.panel-right > .resizer-wrapper', '.section-nfa', { relative: '.panel-right' });
