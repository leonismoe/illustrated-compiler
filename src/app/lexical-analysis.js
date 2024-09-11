import '../styles/lexical-analysis.css';

import '../bootstrap';

import debounce from 'debounce';
import Scrollbar from 'smooth-scrollbar';

import VisualTokenizer from '../components/visual-tokenizer';
import MediaControls from '../components/media-controls';
import Resizer from '../components/resizer';

import { createRuleEditor } from './lexical-analysis/rule-editor';
import { createCodeEditor } from './lexical-analysis/code-editor';
import Automata from './lexical-analysis/automata';

// ============================================================
// Configurations
// ============================================================
const initial_code = `// comment
int main() {
  int a = 1, b = 2;
  printf("%d + %d = %d\\n", a, b, a + b);
  return 0;
}
`;


// ============================================================
// Progress Controls
// ============================================================
const controls = new MediaControls('.media-controls');


// ============================================================
// DOM
// ============================================================
const $dfa = document.getElementById('graph-dfa');
const $section_rule = document.querySelector('.section-rules');
const $rule_toggle_btn = document.getElementById('rule-editor-toggle-btn');
const $token_panel = document.getElementById('panel-tokens');
const $token_table = document.getElementById('tokens-table');
const $token_tbody = $token_table.querySelector('tbody');


// ============================================================
// Initialize Lexical Analysis Visualization
// ============================================================
let tokens = [];
let token_dom_cache = [];
let displayed_token_count = 0;
const token_scroller = Scrollbar.init($token_panel, { damping: 0.2 });

const { editor: codeEditor } = createCodeEditor();
codeEditor.getModel().setValue(initial_code);
codeEditor.getModel().onDidChangeContent(debounce(() => {
  const code = codeEditor.getValue();
  updateCode(code);
}, 1000));

$rule_toggle_btn.addEventListener('click', (e) => {
  e.preventDefault();
  $section_rule.classList.toggle('expanded');
}, false);

const syncTokens = (count, delta) => {
  if (count < displayed_token_count) {
    for (let i = count; i < displayed_token_count; ++i) {
      $token_tbody.removeChild(token_dom_cache[i]);
    }
  } else {
    for (let i = displayed_token_count; i < count; ++i) {
      $token_tbody.appendChild(token_dom_cache[i]);
    }
  }
  displayed_token_count = count;
  token_scroller.update();
  token_scroller.scrollTo(0, Infinity, 100);
};

function updateCode(code) {
  try {
    Automata.showLoader();

    const controller = controls.getController();
    controller.prepare(code);
    tokens = controller.getTokens();
    controls.reset();

    $token_tbody.innerHTML = '';
    displayed_token_count = 0;

    const $root = document.createElement('table');
    $root.innerHTML = tokens.map(getTokenHtml).join('');
    token_dom_cache = Array.from($root.getElementsByTagName('tr'));

    Automata.hideLoader();
  } catch (e) {
    Automata.hideLoader(e);
    controls.clear();
  }
}

function getTokenHtml(token) {
  const className = token.type.replace(/\./g, ' ');
  return `<tr class="${className}"><td>${token.index}</td><td>${token.offset}</td><td>${token.type}</td><td>${token.token}</td></tr>`;
}


// ============================================================
// Initialize Rules Automata
// ============================================================
const ruleEditor = createRuleEditor();
ruleEditor.getModel().onDidChangeContent(debounce(() => {
  const text = ruleEditor.getValue();
  if (text) {
    updateRules(text);
  }
}, 1000));

updateRules(ruleEditor.getValue());

function updateRules(text) {
  controls.clear();
  return Automata.update(text)
    .then(dfa => {
      const vtokenizer = new VisualTokenizer(dfa, $dfa, { editor: codeEditor });
      vtokenizer.on('token-change', syncTokens);
      controls.setController(vtokenizer);
      updateCode(codeEditor.getValue());
    }, function(e) {});
}


// ============================================================
// Initialize Panel Adjuster
// ============================================================
function resizeEditor() {
  controls.getController()?.resize();
}

new Resizer('.panel-resizer', '.panel-left', { callback: resizeEditor, relative: '.main-frame' });
new Resizer('.panel-lexical > .resizer-wrapper', '.section-code', { relative: '.panel-lexical', callback: () => {
  token_scroller.update();
}});
