import VisualDFA from '../automata/visual-dfa';
import ace from './ace';

export default class LexicalTokenizer extends VisualDFA {

  constructor(dfa, container, options) {
    super(dfa, container, options);
  }

  prepare(text) {
    if (this._state) {
      const $node = this.$container.querySelector(`[id=s${this._state.id}]`);
      $node.classList.remove('rejected', 'resolved', 'highlight');
    }

    this._history = [];
    this._dfa.reset();
    this._state = this._dfa.entry;

    if (!text) {
      return;
    }

    let tokens = [];
    let last_token_offset = 0;
    let last_step = null;
    for (let i = 0, len = text.length; i <= len; ++i) {
      last_step = this._dfa.next(text[i]);
      this._history.push(last_step);
      if (last_step.done) {
        const token = text.slice(last_token_offset, i + 1);
        const type = last_step.error ? 'unknown' : last_step.state.get('type');
        if (/^skip(?:$|\.)/.test(type)) {
          continue;
        }
        tokens.push({
          token,
          type,
          offset: last_token_offset,
          length: i + 1 - last_token_offset,
          errmsg: last_step.error,
        });
        last_token_offset = i + 1;
        this._dfa.reset();
      }
    }

    console.log(tokens);
  }

}
