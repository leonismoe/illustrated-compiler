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
            token: 'keyword.control.anchor.regexp',
            regex: /\\[bB]|\^|\$/,
          },
          {
            token: 'keyword.other.back-reference.regexp',
            regex: /\\[1-9]\d*/,
          },
          {
            token: 'keyword.operator.quantifier.regexp',
            regex: /[?+*]|\{(\d+,\d+|\d+,|,\d+|\d+)\}\??/,
          },
          {
            token: 'keyword.operator.or.regexp',
            regex: /\|/,
          },
          {
            token: ['punctuation.definition.group.regexp', 'punctuation.definition.group.assertion.regexp', 'meta.assertion.look-ahead.regexp', 'meta.assertion.negative-look-ahead.regexp'],
            regex: /(\()((\?=)|(\?!))/,
            push: [
              {
                include: 'start',
              },
              {
                token: 'punctuation.definition.group.regexp',
                regex: /\)/,
                next: 'pop',
              },
              {
                defaultToken: 'meta.group.assertion.regexp',
              },
            ],
          },
          {
            token: ['punctuation.definition.group.capture.regexp'],
            regex: /\((\?:)?/,
            push: [
              {
                include: 'start',
              },
              {
                token: 'punctuation.definition.group.regexp',
                regex: /\)/,
                next: 'pop',
              },
              {
                defaultToken: 'punctuation.definition.group.regexp',
              },
            ],
          },
          {
            token: ['punctuation.definition.character-class.regexp', 'keyword.operator.negation.regexp'],
            regex: /(\[)(\^)?/,
            push: [
              {
                token: [
                  'constant.other.character-class.range.regexp',
                  'constant.character.numeric.regexp',
                  'constant.character.control.regexp',
                  'constant.character.escape.backslash.regexp',
                  'constant.character.numeric.regexp',
                  'constant.character.control.regexp',
                  'constant.character.escape.backslash.regexp'
                ],
                regex: /((?:[^\]\r\n]|(\\(?:[0-7]{3}|x[0-9a-fA-F][0-9a-fA-F]|u[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]))|(\\c[A-Z])|(\\.))\-(?:[^\]\\]|(\\(?:[0-7]{3}|x[0-9a-fA-F][0-9a-fA-F]|u[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]))|(\\c[A-Z])|(\\.)))/,
              },
              {
                include: 'regex-character-class',
              },
              {
                token: 'punctuation.definition.character-class.regexp',
                regex: /\]/,
                next: 'pop',
              },
              {
                defaultToken: 'constant.other.character-class.set.regexp',
              },
            ],
          },
          {
            token: 'punctuation.definition.group.regexp',
            regex: /\)/,
          },
          {
            token: 'punctuation.definition.character-class.regexp',
            regex: /\]/,
          },
          {
            include: 'regex-character-class',
          },
        ],
        'regex-character-class': [
          {
            token: 'constant.other.escape.character-class.regexp',
            regex: /\\[wWsSdDtrnvf]|\./,
          },
          {
            token: 'constant.character.escape.numeric.regexp',
            regex: /\\([0-7]{3}|x[0-9a-fA-F][0-9a-fA-F]|u[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F])/,
          },
          {
            token: 'constant.character.escape.control.regexp',
            regex: /\\c[A-Z]/,
          },
          {
            token: 'constant.character.escape.backslash.regexp',
            regex: /\\./,
          },
        ]
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

        this.$rules = {
          start: [
            {
              token: 'comment.regexp',
              regex: /\/\/.*$/,
            },
            ...this.$rules.start,
          ],
        };
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

