import '../styles/lexical-analysis.css';

import '../bootstrap';

import debounce from 'lodash/debounce';

import VisualTokenizer from '../components/visual-tokenizer';
import MediaControls from '../components/media-controls';
import Resizer from '../components/resizer';

import RuleEditor from './lexical-analysis/rule-editor';
import CodeEditor from './lexical-analysis/code-editor';
import Automata from './lexical-analysis/automata';

// ============================================================
// Configurations
// ============================================================
const initial_rule = `// identifier
// ===============================
// type: identifier
[a-zA-Z_$][0-9a-zA-Z_$]*


// literals
// ===============================
// integer
// type: literals.int
(\\+|-)?[0-9]+

// float
// type: literals.float
(\\+|-)?[0-9]*\\.[0-9]+((e|E)(\\+|-)?[0-9]+)?

// string (doesn't support escape sequence, e.g. "\\"")
// "(?:(?!\\\\)["\\n]|[^\\n"])+" isn't supported yet
// type: literals.string
"[^"]*"


// comments
// ===============================
// type: comment.line
\\/\\/[^\\n]*


// whitespace (include line break)
// ===============================
// type: skip.whitespace
\\s+


// delimiters
// ===============================
// type: delimiter.semicolon
;

// type: delimiter.comma
,

// type: delimiter.dot
\\.

// type: delimiter.colon
:

// type: delimiter.question-mark
\\?

// type: delimiter.bracket
\\(
\\)
\\[
\\]
\\{
\\}


// operators
// ===============================
// type: operator.plus
\\+

// type: operator.minus
-

// type: operator.star
\\*

// type: operator.div
\\/

// type: operator.mod
%

// type: operator.increase
\\+\\+

// type: operator.decrease
--

// type: operator.assign
=

// type: operator.bitwise.and
&

// type: operator.bitwise.or
\\|

// type: operator.bitwise.not
~

// type: operator.bitwise.xor
\\^

// type: operator.bitwise.shift
<<
>>
>>>

// type: operator.comparison
>
<
>=
<=
==
!=

// type: operator.logical.and
&&

// type: operator.logical.or
\\|\\|

// type: operator.logical.not
!


// keywords
// ===============================
// type: keyword
if
else
for
while
do
break
continue
new
delete
return
try
catch
finally

// type: keyword.storage.type
const
let
var
auto
long
int
short
byte
float
double
char
unsigned

// type: keyword.constant.language
null

// type: keyword.constant.language.boolean
true
false
`;

const initial_code = `// comment
int main (int argc, char** argv) {
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


// ============================================================
// Initialize Lexical Analysis Visualization
// ============================================================
let tokens = [];

CodeEditor.setValue(initial_code, 1);
CodeEditor.getSession().on('change', debounce(() => {
  const code = CodeEditor.getValue();
  updateCode(code);
}, 1000));

$rule_toggle_btn.addEventListener('click', (e) => {
  e.preventDefault();
  $section_rule.classList.toggle('expanded');
}, false);
function updateCode(code) {
  try {
    Automata.showLoader();

    const controller = controls.getController();
    controller.prepare(code);
    tokens = controller.getTokens();
    controls.reset();

    Automata.hideLoader();
  } catch (e) {
    Automata.hideLoader(e);
    controls.clear();
  }
}


// ============================================================
// Initialize Rules Automata
// ============================================================
updateRules(initial_rule);
RuleEditor.setValue(initial_rule, 1);
RuleEditor.getSession().on('change', debounce(() => {
  const text = RuleEditor.getValue();
  if (text) {
    updateRules(text);
  }
}, 1000));

function updateRules(text) {
  controls.clear();
  return Automata.update(text, 'rlg')
    .then(dfa => {
      const vtokenizer = new VisualTokenizer(dfa, $dfa, { editor: CodeEditor });
      vtokenizer.on('token-change', syncTokens);
      controls.setController(vtokenizer);
      updateCode(CodeEditor.getValue());
    }, function(e) {});
}


// ============================================================
// Initialize Panel Adjuster
// ============================================================
function resizeEditor() {
  RuleEditor.resize();
  CodeEditor.resize();
  controls.getController().resize();
}

new Resizer('.panel-resizer', '.panel-left', { callback: resizeEditor, relative: '.main-frame' });
new Resizer('.panel-lexical > .resizer-wrapper', '.section-code', { relative: '.panel-lexical', callback: () => {
  CodeEditor.resize();
}});
