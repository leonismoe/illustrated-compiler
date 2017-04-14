import VizWorker from '../components/viz.worker';

export default class VizFactory {

  constructor(reuse) {
    this._worker = null;
    this._reuse  = reuse;
  }

  static create(reuse) {
    const instance = new VizFactory(reuse);
    return (dot, options) => instance.compute(dot, options);
  }

  compute(dot, options) {
    return new Promise((resolve, reject) => {
      if (this._worker && !this._reuse) {
        this._worker.onerror({ message: 'Task canceled' });
        this._worker.terminate();
        this._worker = null;
      }

      if (!this._worker) {
        this._worker = new VizWorker();
        this._worker.onmessage = (e) => resolve(e.data);
        this._worker.onerror = (e) => reject(e);
      }

      // Instead of asking for png-image-element directly, which we can't do in a worker,
      // ask for SVG and convert when updating the output.
      if (options && options.format == 'png-image-element') {
        options.format = 'svg';
      }

      this._worker.postMessage({ src: dot, options });
    });
  }
}
