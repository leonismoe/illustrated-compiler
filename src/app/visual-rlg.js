import '../styles/visual-rlg.css';

import debounce from 'lodash/debounce';

import VisualDFA from '../automata/visual-dfa';
import MediaControls from '../components/media-controls';
import VisualScanner from '../components/visual-scanner';
import Resizer from '../components/resizer';

import Automata from './visual-rlg/automata';
import Editor from './visual-rlg/rlg-editor';

// ============================================================
// Configurations
// ============================================================
const options = {
  comment: '#',
  epsilon: '$',
  final_state_name: 'Y',
};

const initial_text = `# a+b*
S -> aS | aC
C -> b | bC | $`;


// ============================================================
// Progress Controls
// ============================================================
const controls = new MediaControls('.media-controls');


// ============================================================
// DOM
// ============================================================
const $dfa = document.querySelector('.graph-dfa');
const $marker = document.querySelector('.editor-text .marker');
const $text = document.getElementById('editor-text-input');
const text_input_font = getComputedStyle($text).getPropertyValue('font');


// ============================================================
// Initialize Automata Drawing and RLG/RegExp Editor
// ============================================================
Automata.setConfig(options);
updateAutomata(initial_text);

Editor.setValue(initial_text, 1);
Editor.getSession().on('change', debounce(() => {
  const text = Editor.getValue();
  updateAutomata(text);
}, 500));

function updateAutomata(text) {
  $text.setAttribute('disabled', 'disabled');
  controls.setController(null);
  return Automata.update(text, 'rlg')
    .then(([nfa, dfa]) => {
      const vdfa = new VisualDFA(dfa, $dfa);
      controls.setController(new VisualScanner(vdfa, $marker, text_input_font));
      $text.value = '';
      $text.removeAttribute('disabled');
    }, function(e) {});
}


// ============================================================
// Initialize Text Matching
// ============================================================
const getBoolAttr = (node, property) => {
  const value = node.getAttribute(property);
  return value == 'true' || value == property;
};

$text.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || (e.keyCode || e.which) == 13) {
    $text.blur();
  }
}, false);

$text.addEventListener('change', (e) => {
  if ($text.value) {
    // $text.setAttribute('disabled', 'disabled');
    controls.getController().prepare($text.value, true);
    controls.reset();
  } else {
    controls.clear();
  }
}, false);


// ============================================================
// Initialize Panel Adjuster
// ============================================================
function resizeEditor() {
  Editor.resize();
}

new Resizer('.panel-resizer', '.panel-left', { callback: resizeEditor, relative: '.main-frame' });
new Resizer('.panel-left > .resizer-wrapper', '.section-text', { callback: resizeEditor, inverse: true, relative: '.panel-left' });
new Resizer('.panel-right > .resizer-wrapper', '.section-nfa', { relative: '.panel-right' });
