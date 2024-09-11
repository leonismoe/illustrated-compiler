/* eslint-env worker */

import { instance } from '@viz-js/viz';

/** @type {Awaited<ReturnType<typeof instance>>} */
let viz;

instance().then(instance => {
  viz = instance;
  postMessage({ ready: true });
});

onmessage = function (e) {
  if (viz) {
    const result = viz.render(e.data.src, e.data.options);
    result.id = e.data.id;
    postMessage(result);
  }
};
