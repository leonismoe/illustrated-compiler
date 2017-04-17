export {
  escape as default,
  escape,
  unescape,
};


// http://stackoverflow.com/questions/10220401/c-string-literals-escape-character/10220539#10220539
function unescape(str, allowRegexp) {
  if (str[0] != '\\') {
    return str[0];
  }

  let temp;
  switch (str[1]) {
    // case 'a': return '\x07'; // alert (bell)
    case 'b': return '\x08'; // backspace
    case 't': return '\x09'; // horizontal tab
    case 'n': return '\x0a'; // new line (line feed)
    case 'v': return '\x0b'; // vertical tab
    case 'f': return '\x0c'; // form feed
    case 'r': return '\x0d'; // carriage return
    // case 'e': return '\x1b'; // escape (non-standard GCC extension)

    case '0':
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9':
      temp = str[1];
      for (let i = 2; i <= 3 && i < str.length && /\d/.test(str[i]); ++i) {
        temp += str[i];
      }
      return String.fromCharCode(temp | 0);

    case 'x':
      temp = '';
      for (let i = 2; i <= 3 && i < str.length && /[0-9a-f]/i.test(str[i]); ++i) {
        temp += str[i];
      }
      if (temp.length != 2) {
        return 'x';
      }
      return String.fromCharCode(parseInt(temp, 16));

    case 'u':
      temp = '';
      for (let i = 2; i <= 5 && i < str.length && /[0-9a-f]/i.test(str[i]); ++i) {
        temp += str[i];
      }
      if (temp.length != 4) {
        return 'u';
      }
      return String.fromCharCode(parseInt(temp, 16));

    case 'd':
    case 'D':
    case 's':
    case 'S':
    case 'w':
    case 'W':
      if (allowRegexp) {
        return new RegExp(str.slice(0, 2));
      }

    default: // eslint-disable-line no-fallthrough
      return str[1];
  }
}


const EscapeModes = {
  'escape-sequence': function (ch) {
    switch (ch.charCodeAt(0)) {
      case 0x00: return '\\0';
      case 0x07: return '\\a';
      case 0x08: return '\\b';
      case 0x09: return '\\t';
      case 0x0a: return '\\n';
      case 0x0b: return '\\v';
      case 0x0c: return '\\f';
      case 0x0d: return '\\r';
      case 0x1b: return '\\e';
      case 0x5c: return '\\\\';
    }
  },

  'caret-notation': function (ch) {
    const code = ch.charCodeAt(0);
    if (code == 0x7f) {
      return '^?';
    }
    if (code <= 0x1f) {
      return '^' + '@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_'.charAt(code);
    }
  },

  'escape-hex': function (ch) {
    const code = ch.charCodeAt(0);
    if (code <= 0xff) {
      return '\\x' + code.toString(16);
    }
  },

  'escape-oct': function (ch) {
    const code = ch.charCodeAt(0);
    if (code <= 0xff) {
      return '\\' + code.toString(8);
    }
  },

  'escape-unicode': function (ch) {
    const code = ch.charCodeAt(0);
    return '\\u' + ('0000' + code.toString(16)).slice(-4);
  },

  'control-picture': function (ch) {
    const code = ch.charCodeAt(0);
    if (code <= 0x1f) {
      return String.fromCharCode(0x2400 + code);
    }
    if (code == 0x7f) {
      return '\u2421';
    }
  },

  'space-sp-symbol': function (ch) {
    if (ch === ' ') {
      return '\u2420';
    }
  },

  'space-open-box': function (ch) {
    if (ch === ' ') {
      return '\u2423';
    }
  },

  'preserve-ascii': function (ch) {
    const code = ch.charCodeAt(0);
    if (code >= 0x20 && code < 0x7f) { // ASCII printable characters
      return ch;
    }
  },

  'preserve-ascii-nospace': function (ch) {
    const code = ch.charCodeAt(0);
    if (code > 0x20 && code < 0x7f) { // ASCII printable characters except space
      return ch;
    }
  },
};

function escape(str, mode) {
  if (!mode) {
    mode = [
      'preserve-ascii',
      'escape-sequence',
      'escape-hex',
    ];
  } else if (!Array.isArray(mode)) {
    mode = [mode];
  }

  const result = [];
  for (let ch of str) {
    let replace = null;
    for (let translator of mode) {
      if (typeof translator == 'string') {
        if (!EscapeModes[translator]) {
          throw new Error(`Method "${translator}" is undefined.`);
        }
        replace = EscapeModes[translator](ch);
        if (replace) break;

      } else if (typeof translator == 'function') {
        replace = translator(ch);
        if (replace) break;

      } else if (translator && Object.getPrototypeOf(translator) == Object) {
        replace = translator[ch];
        if (replace) break;

      } else {
        throw new Error('Unsupported mode.');
      }
    }

    result.push(replace || ch);
  }

  return result.join('');
}
