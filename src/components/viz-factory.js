export default class VizFactory {

  constructor(reuse) {
    this._worker = null;
    this._reuse = reuse || false;
    this._ready = false;
    this._resolvers = new Map();
    this._queue = [];
    this._id = 0;
  }

  static create(reuse) {
    const instance = new VizFactory(reuse);
    return (input, options) => instance.compute(input, options);
  }

  compute(input, options) {
    if (this._worker && !this._reuse) {
      this._worker.terminate();
      this._worker = null;
      this._ready = false;
      this._resolvers.forEach(resolver => {
        resolver.reject(new Error('task canceled'));
      })
      this._resolvers.clear();
      this._queue = [];
      this._id = 0;
    }

    if (!this._worker) {
      this._worker = new Worker(new URL('./viz.worker.js', import.meta.url), {
        type: 'module',
      });
      this._worker.onmessage = (e) => {
        if (e.data.id) {
          const resolver = this._resolvers.get(e.data.id);
          if (resolver) {
            this._resolvers.delete(e.data.id);
            if (e.data.status === 'success') {
              resolver.resolve(e.data.output);
            } else {
              resolver.reject(e.data);
            }
          } else {
            resolver.reject(new Error('unknown error'));
          }
        } else {
          for (let i = 0; i < this._queue.length; ++i) {
            this._worker.postMessage(this._queue[i]);
          }
          this._queue.length = 0;
          this._ready = true;
        }
      };
      this._worker.onerror = (e) => {
        this._resolvers.forEach(resolver => {
          resolver.reject(e);
        });
        this._resolvers.clear();
      };
    }

    const id = ++this._id;
    const resolver = Promise.withResolvers();
    this._resolvers.set(id, resolver);

    options = Object.assign({ format: 'svg' }, options);
    if (this._ready) {
      this._worker.postMessage({ id, src: input, options });
    } else {
      this._queue.push({ id, src: input, options });
    }

    return resolver.promise;
  }
}
