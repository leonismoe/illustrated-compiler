import VizFactory from '../../components/viz-factory';
import RuleParser from './rule-parser';

let options = {};

const Viz = VizFactory.create();
const $dfa = document.querySelector('.graph-dfa');
const $graph_overlay = document.querySelector('.graph-overlay');
const $message = $graph_overlay.querySelector('.message');

let parsing = false;
let drawing = false;

function update(text) {
  return new Promise((resolve, reject) => {
    if (parsing) {
      return reject('Component is busy');
    }
    parsing = true;

    if (!text) {
      parsing = false;
      throw new Error('Rules cannot be empty');
    }

    $graph_overlay.classList.remove('error');
    $graph_overlay.classList.add('show', 'loading');
    $message.innerText = '';

    const { nfa, dfa, keywords } = RuleParser.transform(text, options);

    parsing = false;
    drawing = true;

    Viz(dfa.toDOT('DFA', { noarrow: true })).then(svg => {
      drawing = false;
      $graph_overlay.classList.remove('show', 'loading');

      $dfa.innerHTML = svg.slice(svg.indexOf('-->', 57) + 3); // remove <?xml...

      resolve(dfa);

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
    $message.innerText = e.message || 'An error occurred while processing the graph.';
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
