import ace from '../../components/ace';
import '../../styles/components/editor/regex-syntax-highlight.css';

ace.define(
  'ace/mode/regex_highlight_rules',
  ['require', 'exports', 'module', 'ace/lib/oop', 'ace/mode/text_highlight_rules'],

  function (require, exports, module) {
    const oop = require('../lib/oop');
    const TextHighlightRules = require('./text_highlight_rules').TextHighlightRules;

    const RegexHighlightRules = function () {
      this.$rules = {
        start: [
          {
            include: 'regexp',
          },
        ],
        regexp: [
          {
            token: 'keyword.control.anchor.regexp',
            regex: /\\[bB]|\^|\$/,
          },
          {
            token: 'keyword.other.back-reference.regexp',
            regex: /\\[1-9]\d*/,
          },
          {
            token: 'keyword.operator.quantifier.regexp',
            regex: /[?+*]|\{(?:\d+,\d+|\d+,|,\d+|\d+)\}\??/,
          },
          {
            token: 'keyword.operator.or.regexp',
            regex: /\|/,
          },
          {
            token: [
              'punctuation.definition.group.regexp',
              'meta.assertion.look-ahead.regexp',
              'meta.assertion.negative-look-ahead.regexp',
            ],
            regex: /(\()(?:(\?=)|(\?!))/,
            push: [
              {
                token: 'punctuation.definition.group.regexp',
                regex: /\)/,
                next: 'pop',
              },
              {
                include: 'regexp',
              },
              {
                defaultToken: 'meta.group.assertion.regexp',
              },
            ],
          },
          {
            token: 'punctuation.definition.group.regexp',
            regex: /\((?:\?:)?/,
            push: [
              {
                token: 'punctuation.definition.group.regexp',
                regex: /\)/,
                next: 'pop',
              },
              {
                include: 'regexp',
              },
              {
                defaultToken: 'meta.group.regexp',
              }
            ],
          },
          {
            token: [
              'punctuation.definition.character-class.regexp',
              'keyword.operator.negation.regexp',
            ],
            regex: /(\[)((?:\^)?)/,
            push: [
              {
                token: 'punctuation.definition.character-class.regexp',
                regex: /\]/,
                next: 'pop',
              },
              {
                token: [
                  'constant.other.character-class.range.regexp',
                  'constant.character.numeric.regexp',
                  'constant.character.control.regexp',
                  'constant.character.escape.backslash.regexp',
                  'constant.other.character-class.range.regexp',
                  'constant.other.character-class.range.regexp',
                  'constant.character.numeric.regexp',
                  'constant.character.control.regexp',
                  'constant.character.escape.backslash.regexp',
                ],
                regex: /(?:(.)|(\\(?:[0-7]{3}|x[\da-fA-F][\da-fA-F]|u[\da-fA-F][\da-fA-F][\da-fA-F][\da-fA-F]))|(\\c[A-Z])|(\\.))(\-)(?:([^\]\\])|(\\(?:[0-7]{3}|x[\da-fA-F][\da-fA-F]|u[\da-fA-F][\da-fA-F][\da-fA-F][\da-fA-F]))|(\\c[A-Z])|(\\.))/,
              },
              {
                include: 'regex-character-class',
              },
              {
                defaultToken: 'constant.other.character-class.set.regexp',
              },
            ],
          },
          {
            include: 'regex-character-class',
          },
        ],
        'regex-character-class': [
          {
            token: 'constant.character.character-class.regexp',
            regex: /\\[wWsSdD]|\./,
          },
          {
            token: 'constant.character.numeric.regexp',
            regex: /\\(?:[0-7]{3}|x[\da-fA-F][\da-fA-F]|u[\da-fA-F][\da-fA-F][\da-fA-F][\da-fA-F])/,
          },
          {
            token: 'constant.character.control.regexp',
            regex: /\\c[A-Z]/,
          },
          {
            token: 'constant.character.escape.backslash.regexp',
            regex: /\\./,
          },
        ],
      };
      this.normalizeRules();
    };

    oop.inherits(RegexHighlightRules, TextHighlightRules);

    exports.RegexHighlightRules = RegexHighlightRules;
  }
);

ace.define(
  'ace/mode/regex',
  ['require', 'exports', 'module', 'ace/lib/oop', 'ace/mode/text', 'ace/mode/regex_highlight_rules'],

  function (require, exports, module) {
    const oop = require('../lib/oop');
    const TextMode = require('./text').Mode;
    const RegexHighlightRules = require('./regex_highlight_rules').RegexHighlightRules;

    const Mode = function () {
      this.HighlightRules = RegexHighlightRules;
    };
    oop.inherits(Mode, TextMode);

    const proto = Mode.prototype;
    proto.$id = 'ace/mode/regex';
    proto.lineCommentStart = null;
    proto.blockComment = null;

    exports.Mode = Mode;
  }
);


ace.define(
  'ace/mode/regex-with-comment',
  ['require', 'exports', 'module', 'ace/lib/oop', 'ace/mode/text', 'ace/mode/regex_highlight_rules'],

  function (require, exports, module) {
    const oop = require('../lib/oop');
    const TextMode = require('./text').Mode;
    const RegexHighlightRules = require('./regex_highlight_rules').RegexHighlightRules;

    const Mode = function () {
      this.HighlightRules = function () {
        RegexHighlightRules.apply(this);

        this.$rules.start.unshift({
          token: 'comment.regexp',
          regex: /\/\/.*$/,
        });
      };
      oop.inherits(this.HighlightRules, RegexHighlightRules);
    };
    oop.inherits(Mode, TextMode);

    const proto = Mode.prototype;
    proto.$id = 'ace/mode/regex-with-comment';
    proto.lineCommentStart = '//';
    proto.blockComment = null;

    exports.Mode = Mode;
  }
);


ace.define('ace/theme/regex', ['require', 'exports', 'module'], function (require, exports, module) {
  exports.isDark = false;
  exports.cssClass = 'ace-tm ace-regex';
  exports.cssText = ''; // merged into css bundle
});

