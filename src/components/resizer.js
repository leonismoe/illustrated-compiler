import throttle from 'lodash/throttle';

const instances = [];

let lastX = null;
let lastY = null;
let target = null;
let property = null;
let max = null;

document.addEventListener('mousedown', function(e) {
  if (target || e.button != 0) {
    return;
  }
  for (let instance of instances) {
    if (e.target == instance.$resizer) {
      target = instance.$target;
      property = instance.property;
      max = instance.max;
      lastX = e.pageX;
      lastY = e.pageY;
      break;
    }
  }
}, false);

document.addEventListener('mouseup', function(e) {
  if (!target) return;
  target = null;
}, false);

document.addEventListener('mousemove', function(e) {
  if (!target) {
    return;
  }
  let newValue;
  if (property == 'width') {
    const old = target.offsetWidth;
    const delta = e.pageX - lastX;
    newValue = old + delta;
  } else {
    const old = target.offsetHeight;
    const delta = e.pageY - lastY;
    newValue = old + delta;
  }
  lastX = e.pageX;
  lastY = e.pageY;
  if (newValue >= 0 && newValue <= max) {
    target.style[property] = newValue + 'px';
  }
}, false);

export default class Resizer {

  constructor(resizer, target) {
    this.$resizer  = typeof resizer == 'string' ? document.querySelector(resizer) : resizer;
    this.$target   = typeof target == 'string' ? document.querySelector(target) : target;
    this.direction = this.$resizer.className.indexOf('horizontal') > -1 ? 'horizontal' : 'vertical';
    this.property  = this.direction == 'vertical' ? 'width' : 'height';
    this.adjusting = false;
    this.max       = Infinity;

    if (this.$resizer.className.indexOf('resizer-wrapper') > -1) {
      this.$resizer = this.$resizer.querySelector('.resizer');
    }

    instances.push(this);
  }

}
