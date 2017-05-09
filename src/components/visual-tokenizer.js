import VisualDFA from '../automata/visual-dfa';
import ace from './ace';

export default class VisualTokenizer extends VisualDFA {

  constructor(dfa, container, options) {
    super(dfa, container, options);
    this._dfa.optimize_transitions();
  }

  prepare(text) {
    if (this._state) {
      const $node = this.$container.querySelector(`[id=s${this._state.id}]`);
      $node.classList.remove('rejected', 'resolved', 'highlight');
    }

    const entry = this._dfa.entry;
    this._history = [{ state: this._dfa.entry, edge: null, done: false, error: '', description: 'initial' }];
    this._dfa.reset();
    this._state = entry;

    if (!text) {
      return;
    }

    let tokens = [];
    let last_token_offset = 0;
    let last_step = null;
    for (let i = 0, len = text.length;;) {
      const ch = text[i];
      last_step = this._dfa.next(ch);
      this._history.push(last_step);
      if (last_step.done) {
        if (i == last_token_offset) {
          ++i;
        }
        last_step.token_index = tokens.length;
        const token = text.slice(last_token_offset, i);
        const type = last_step.error ? 'unknown' : last_step.state.get('type');
        if (!/^skip(?:$|\.)/.test(type)) {
          tokens.push({
            token,
            type,
            offset: last_token_offset,
            length: i - last_token_offset,
          });
        }
        if (i >= len) {
          break;
        }
        this._history.push({ state: entry, edge: null, done: false, error: '', description: 'reset' });
        last_token_offset = i;
        this._dfa.reset();
        this._state = this._dfa.entry;
      } else {
        ++i;
      }
    }

    this._tokens = tokens;
  }

}
