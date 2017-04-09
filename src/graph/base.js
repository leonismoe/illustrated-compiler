/* global EventEmitter */

// Note: DI (Dependency Injection) may be the better solution
// import EventEmitter from 'wolfy87-eventemitter';

export default class Base extends EventEmitter {

  constructor(props) {
    super();
    this._props = props || {};
  }

  get id() {
    return this._id;
  }

  get(name, defaultValue) {
    if (arguments.length < 2) {
      return this._props[name];
    } else {
      return this._props.hasOwnProperty(name) ? this._props[name] : defaultValue;
    }
  }

  set(name, value) {
    const oldValue = this._props[name];
    this._props[name] = value;
    this.emit('props.update', name, oldValue);
    return value;
  }

  getProps() {
    return Object.assign({}, this._props);
  }

  isset(name) {
    return this._props.hasOwnProperty(name);
  }

  unset(name) {
    return delete this._props[name];
  }

  setDefault(name, value) {
    if (!this.isset(name)) {
      this.set(name, value);
    }
  }

  bind(object, property) {
    if (!property) {
      property = object;
      object = this;
    }
    return Object.defineProperty(object, property, {
      get: () => this._props[property]
    });
  }

  bind2way(object, property) {
    if (!property) {
      property = object;
      object = this;
    }
    return Object.defineProperty(object, property, {
      get: () => this._props[property],
      set: (value) => this._props[property] = value,
    });
  }

  unbind(object, property) {
    if (!property) {
      property = object;
      object = this;
    }
    return delete object[property];
  }

}
