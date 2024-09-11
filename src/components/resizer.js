import throttle from 'throttleit';

// https://css-tricks.com/debouncing-throttling-explained-examples/
// https://www.html5rocks.com/en/tutorials/speed/animations/
// maybe we should use rAF, but every width/height change results in reflows and repaints

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

document.addEventListener('mousemove', throttle(function(e) {
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
    if (options.relative) {
      const total = property == 'width' ? options.relative.scrollWidth : options.relative.scrollHeight;
      if (newValue > total) {
        return;
      }
      newValue = (newValue / total) * 100 + '%';
    } else {
      newValue += 'px';
    }
    target.style[property] = newValue;
    if (options.callback) {
      options.callback();
    }
  }
}, 16), false);

export default class Resizer {

  constructor(resizer, target, options = {}) {
    this.$resizer  = typeof resizer == 'string' ? document.querySelector(resizer) : resizer;
    this.$target   = typeof target == 'string' ? document.querySelector(target) : target;
    this.direction = this.$resizer.className.indexOf('horizontal') > -1 ? 'horizontal' : 'vertical';
    this.property  = this.direction == 'vertical' ? 'width' : 'height';
    this.adjusting = false;
    this.options   = options;
    if (typeof this.options.relative == 'string') {
      this.options.relative = document.querySelector(this.options.relative);
    }

    if (this.$resizer.className.indexOf('resizer-wrapper') > -1) {
      this.$resizer = this.$resizer.querySelector('.resizer');
    }

    instances.push(this);
  }

}
