import '../styles/lexical-analysis.css';

import debounce from 'lodash/debounce';

import VisualDFA from '../automata/visual-dfa';
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
[+\\-]?[0-9]+

// float
// type: literals.float
[+\\-]?[0-9]*\\.[0-9]+([eE][+\\-]?[0-9]+)?

// string (doesn't support escape sequence, e.g. "\\"")
// "(?:(?!\\\\)["\\n]|[^\\n"])+" isn't supported yet
// type: literals.string
"[^"]*"


// line comment
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

// type: delimiter.bracket
\\(
\\)
\\[
\\]
<
>


// operators
// ===============================
// type: operator.plus
\\+

// type: operator.minus
-

// type: operator.multiply
\\*

// type: operator.division
\\/

// type: operator.dot
\\.


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


// ============================================================
// Progress Controls
// ============================================================
const controls = new MediaControls('.media-controls');


// ============================================================
// DOM
// ============================================================
const $dfa = document.getElementById('graph-dfa');


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
}, 500));

function updateRules(text) {
  return Automata.update(text, 'rlg')
    .then(dfa => {
      const vdfa = new VisualDFA(dfa, $dfa);
    }, function(e) {});
}


// ============================================================
// Initialize Lexical Analysis Visualization
// ============================================================



// ============================================================
// Initialize Panel Adjuster
// ============================================================
function resizeEditor() {
  RuleEditor.resize();
  CodeEditor.resize();
}

new Resizer('.panel-resizer', '.panel-left', { callback: resizeEditor, relative: '.main-frame' });
new Resizer('.panel-lexical > .resizer-wrapper', '.section-code', { relative: '.panel-lexical' });
