import '../styles/lexical-analysis.css';

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
  return Automata.update(text, 'rlg')
    .then(dfa => {
      const vdfa = new VisualTokenizer(dfa, $dfa);
      vdfa.prepare(initial_code);
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
