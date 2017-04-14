import throttle from 'lodash/throttle';

const instances = [];

let initialSize = null;
let initialX = null;
let initialY = null;
let lastX = null;
let lastY = null;
let resizer = null;
let target = null;
let property = null;
let options = null;
let maxsize = null;

document.addEventListener('mousedown', function(e) {
  if (target || e.button != 0) {
    return;
  }
  for (let instance of instances) {
    if (e.target == instance.$resizer) {
      e.preventDefault();
      resizer = instance.$resizer;
      target = instance.$target;
      property = instance.property;
      options = instance.options;
      maxsize = instance.maxsize;
      initialSize = property == 'width' ? target.offsetWidth : target.offsetHeight;
      initialX = e.pageX;
      initialY = e.pageY;
      lastX = initialX;
      lastY = initialY;
      resizer.classList.add('active');
      break;
    }
  }
}, false);

document.addEventListener('mouseup', function(e) {
  if (!target) return;
  resizer.classList.remove('active');
  if (options.done) {
    options.done.apply(null);
  }
  target = null;
}, false);

document.addEventListener('mousemove', function(e) {
  if (!target) {
    return;
  }
  e.preventDefault();
  let delta;
  let newValue = initialSize;
  let check = options.check;
  if (property == 'width') {
    delta = e.pageX - initialX;
  } else {
    delta = e.pageY - initialY;
  }
  if (options.inverse) {
    newValue -= delta;
  } else {
    newValue += delta;
  }
  lastX = e.pageX;
  lastY = e.pageY;
  if (typeof check == 'function') {
    check = check(newValue);
  } else if (typeof check == 'number') {
    check = newValue <= check;
  } else {
    check = true;
  }
  if (newValue >= 0 && check) {
    target.style[property] = newValue + 'px';
    if (options.callback) {
      options.callback.apply(null);
    }
  }
}, false);

export default class Resizer {

  constructor(resizer, target, options = {}) {
    this.$resizer  = typeof resizer == 'string' ? document.querySelector(resizer) : resizer;
    this.$target   = typeof target == 'string' ? document.querySelector(target) : target;
    this.direction = this.$resizer.className.indexOf('horizontal') > -1 ? 'horizontal' : 'vertical';
    this.property  = this.direction == 'vertical' ? 'width' : 'height';
    this.adjusting = false;
    this.maxsize   = maxsize;
    this.options   = options;

    if (this.$resizer.className.indexOf('resizer-wrapper') > -1) {
      this.$resizer = this.$resizer.querySelector('.resizer');
    }

    instances.push(this);
  }

}
