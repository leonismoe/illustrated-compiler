import DFA from '../../automata/dfa';
import RLG2NFA from '../../automata/rlg-to-nfa';
import Regex2NFA from '../../automata/regex-to-nfa';
import VizFactory from '../../components/viz-factory';

let options = {};

const VizNFA = VizFactory.create();
const VizDFA = VizFactory.create();
const $nfa = document.querySelector('.graph-nfa');
const $dfa = document.querySelector('.graph-dfa');
const $graph_overlay = document.querySelector('.graph-overlay');
const $error = $graph_overlay.querySelector('.message');

let parsing = false;
let drawing = false;

function update(text, rlg) {
  return new Promise((resolve, reject) => {
    if (parsing) {
      return reject('Component is busy');
    }
    parsing = true;

    if (!text && rlg) {
      parsing = false;
      throw new Error('Grammar cannot be empty');
    }

    $graph_overlay.classList.remove('error');
    $graph_overlay.classList.add('show', 'loading');
    $error.innerText = '';

    const nfa = (rlg ? RLG2NFA : Regex2NFA).transform(text, options);
    const dfa = DFA.from(nfa, { preserve_nfa_mapping: true });

    parsing = false;
    drawing = true;

    Promise.all([
      VizNFA(nfa.toDOT('NFA', { noarrow: true })),
      VizDFA(dfa.toDOT('DFA', { noarrow: true })),

    ]).then(([svg_nfa, svg_dfa]) => {
      drawing = false;
      $graph_overlay.classList.remove('show', 'loading');

      $nfa.innerHTML = svg_nfa.slice(svg_nfa.indexOf('-->', 57) + 3); // remove <?xml...
      $dfa.innerHTML = svg_dfa.slice(svg_dfa.indexOf('-->', 57) + 3); // remove <?xml...

      resolve([nfa, dfa]);

    }).catch((e) => {
      drawing = false;

      if (!e.canceled) {
        throw e;
      }
    });

  }).catch((e) => {
    parsing = false;
    $graph_overlay.classList.remove('loading');
    $graph_overlay.classList.add('show', 'error');
    $error.innerText = e.message || 'An error occurred while processing the graph.';
    console.log(e); // eslint-disable-line no-console

    throw e;
  });
}

export default {
  update,

  setConfig(config) {
    options = config;
  },
};
