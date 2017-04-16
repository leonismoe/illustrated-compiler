import DFA from '../../automata/dfa';
import RLG2NFA from '../../automata/rlg-to-nfa';
import VizFactory from '../../components/viz-factory';

let options = {};

const VizNFA = VizFactory.create();
const VizDFA = VizFactory.create();
const $nfa = document.querySelector('.graph-nfa');
const $dfa = document.querySelector('.graph-dfa');
const $graph_overlay = document.querySelector('.graph-overlay');
const $error = $graph_overlay.querySelector('.error-tip');

let parsing = false;
let drawing = false;

function update(grammar) {
  return new Promise((resolve, reject) => {
    if (parsing) {
      return reject('Component is busy');
    }
    parsing = true;

    if (!grammar) {
      parsing = false;
      throw new Error('Grammar cannot be empty');
    }

    $graph_overlay.classList.remove('js-error');
    $graph_overlay.classList.add('js-loading');

    const nfa = RLG2NFA.transform(grammar, options);
    const dfa = DFA.from(nfa);

    parsing = false;
    drawing = true;

    Promise.all([
      VizNFA(nfa.toDOT('NFA', true)),
      VizDFA(dfa.toDOT('DFA', true)),

    ]).then(([svg_nfa, svg_dfa]) => {
      drawing = false;
      $graph_overlay.classList.remove('js-loading');

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
    $graph_overlay.classList.remove('js-loading');
    $graph_overlay.classList.add('js-error');
    $error.innerText = e.message || 'An error occurred while processing the graph.';
  });
}

export default {
  update,

  setConfig(config) {
    options = config;
  },
};
