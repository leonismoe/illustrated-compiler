import ace from 'ace-builds/src-noconflict/ace';

let Mode;
let HighlightRules;

const Rules = {
  start: [
    {
      token: 'keyword.epsilon',
      regex: /\$/,
    },
    {
      token: 'comment.line',
      regex: /#.*$/,
    },
    {
      token: 'keyword.operator.union',
      regex: /\|/,
    },
    {
      token: ['constant.identifier', 'keyword.operator.assignment'],
      regex: /^(\s*<?[a-zA-Z\$_\u00a1-\uffff][a-zA-Z\d\$_\u00a1-\uffff]*'*>?\s*)(=>|->|::=)/,
    },
  ],
};

function normalize(symbol) {
  return symbol.replace(/(\^|\$|\.|\/|\{|\}|\(|\)|\[|\]|\+|\*|\?)/g, '\\$1');
}

export default function update(epsilon = '$', comment = '#') {
  Rules.start[0].regex = new RegExp(normalize(epsilon));
  Rules.start[1].regex = new RegExp(normalize(comment) + '.*$');
  // HighlightRules.normalizeRules();
  Mode.prototype.lineCommentStart = comment;
}

ace.define('ace/mode/rlg', ['require', 'exports', 'module', 'ace/lib/oop', 'ace/mode/text', 'ace/mode/text_highlight_rules'], function (require, exports, module) {

  const oop = require('../lib/oop');
  const TextMode = require('./text').Mode;
  const TextHighlightRules = require('./text_highlight_rules').TextHighlightRules;

  Mode = function () {
    HighlightRules = function () {
      this.$rules = Rules;
      this.normalizeRules();
    };
    oop.inherits(HighlightRules, TextHighlightRules);
    this.HighlightRules = HighlightRules;
  };
  oop.inherits(Mode, TextMode);

  Mode.prototype.$id = 'ace/mode/rlg';
  Mode.prototype.blockComment = null;
  Mode.prototype.lineCommentStart = '#';

  exports.Mode = Mode;

});
