import VisualDFA from '../automata/visual-dfa';

export default class VisualTokenizer extends VisualDFA {

  constructor(dfa, container, options) {
    super(dfa, container, options);
    this._dfa.optimize_transitions();

    this._editor = this._options.editor && this._options.editor.markup ? this._options.editor : null;
    this.on('step-change', (step) => {
      const item = this._history[step];
      const token_count = item.tokens;
      if (token_count != this._current_tokens_count) {
        this.emit('token-change', token_count, token_count - this._current_tokens_count);
        this._current_tokens_count = token_count;
      }
      if (this._editor) {
        this.markup(item.offset);
      }
    });
  }

  prepare(text) {
    if (this._state) {
      const $node = this.$container.querySelector(`[id=s${this._state.id}]`);
      $node.classList.remove('rejected', 'resolved', 'highlight');
    }

    const entry = this._dfa.entry;
    this._history = [{ state: this._dfa.entry, edge: null, offset: -1, tokens: 0, done: false, error: '', type: 'reset', description: 'initial' }];
    this._dfa.reset();
    this._state = entry;

    this._text = text;
    this._lines = [];
    this._line_offset = [];
    let current_line_offset = 0;
    let last_line_break = -1;

    let tokens = [];
    let last_token_offset = 0;
    let last_step = null;
    for (let i = 0, len = text.length;;) {
      const ch = text[i];
      if (ch == '\n' && last_line_break != i) {
        this._line_offset.push(current_line_offset);
        this._lines.push(text.slice(current_line_offset, i + 1));
        current_line_offset = i + 1;
        last_line_break = i;
      }

      last_step = this._dfa.next(ch);
      last_step.offset = i;
      last_step.tokens = tokens.length;
      this._history.push(last_step);
      if (last_step.done) {
        if (i == last_token_offset) {
          ++i;
        }
        const token = text.slice(last_token_offset, i);
        const type = last_step.error ? 'unknown' : last_step.state.get('type');
        if (!/^skip(?:$|\.)/.test(type)) {
          tokens.push({
            token,
            type,
            index: tokens.length,
            offset: last_token_offset,
            length: i - last_token_offset,
          });
          last_step.token_index = ++last_step.tokens;
        }
        if (i >= len) {
          break;
        }
        this._history.push({ state: entry, edge: null, offset: i, tokens: last_step.tokens, done: false, error: '', type: 'reset', description: 'reset' });
        last_token_offset = i;
        this._dfa.reset();
        this._state = this._dfa.entry;
      } else {
        ++i;
      }
    }

    this._line_offset.push(current_line_offset);
    this._lines.push(text.slice(current_line_offset));

    this._tokens = tokens;
    this._current_tokens_count = 0;
  }

  getTokens() {
    return this._tokens.slice();
  }

  markup(offset) {
    if (this._editor) {
      if (offset < 0) {
        return this._editor.cancelMarkup();
      }
      const position = this.offset2coord(offset);
      this._editor.markup(position.line, position.column, position.line, position.column + 1);
    }
  }

  offset2coord(offset) {
    if (offset > this._text.length) {
      const last_line = this._lines.length - 1;
      return {
        line: last_line,
        column: this._lines[last_line].length,
      };
    }

    let line = -1;
    while (offset >= this._line_offset[++line]);

    --line;
    return {
      line,
      column: offset - this._line_offset[line],
    };
  }

}
