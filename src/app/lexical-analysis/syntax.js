import RegexpLang from 'tm-grammars/grammars/regexp.json';

export const LANG_ID = RegexpLang.name;

// add line comment
RegexpLang.repository['regexp-expression'].patterns.unshift({ include: '#comment' });
RegexpLang.repository.comment = {
  begin: '(^[ \\t]+)?((#)(?:\\s*(type:)\\s*(.*)$)?)',
  beginCaptures: {
    '1': {
      'name': 'punctuation.whitespace.comment.leading',
    },
    '2': {
      'name': 'comment.line.number-sign',
    },
    '3': {
      'name': 'punctuation.definition.comment',
    },
    '4': {
      'name': 'support.type.property-name.json.type',
    },
    '5': {
      'name': 'entity.name.token-type',
    },
  },
  contentName: 'comment.line.number-sign',
  end: '(?=$)',
};

export default RegexpLang;
