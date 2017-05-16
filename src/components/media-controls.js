let active_control, progress_bounding;

export default class MediaControls {

  static create(container = '.media-controls') {
    return new MediaControls(container);
  }

  constructor(container = '.media-controls') {
    this.$container = typeof container == 'string' ? document.querySelector(container) : container;
    this.$progress_bar = this.$container.querySelector('.progress-bar > .bar');
    this.$play_controls = this.$container.querySelector('.play-control');
    this.$buttons = this.$play_controls.querySelectorAll('a');
    [this.$btn_beginning, this.$btn_backward, this.$btn_play, this.$btn_forward, this.$btn_end] = this.$buttons;

    this._object = null;
    this._speed = 1000;
    this._timer = null;
    this._step = 0;
    this._total = 0;
    this.$btn_beginning.classList.add('disabled');
    this.$btn_backward.classList.add('disabled');

    this.$play_controls.addEventListener('click', (e) => {
      let target = e.target;
      while (target && target.tagName.toLowerCase() != 'a') {
        target = target.parentElement;
      }

      if (target && !target.classList.contains('disabled')) {
        e.preventDefault();
        this.handle(target);
      }
    }, false);


    const $progress = this.$container.querySelector('.progress-bar');
    $progress.addEventListener('mousedown', (e) => {
      if (this._total <= 0) return;
      e.preventDefault();
      this.pause();
      active_control = this;
      progress_bounding = $progress.getBoundingClientRect();
      sync_progress(e);
    }, false);
  }

  getController() {
    return this._object;
  }

  setController(object, allow_play_btn) {
    if (this._object && this._object.destruct) {
      this._object.destruct(this._step);
    }
    this._object = object;
    this.reset(allow_play_btn);
  }

  getTotalSteps() {
    if (this._total < 0) {
      return 0;
    }
    return this._total + 1;
  }

  reset(allow_play_btn) {
    if (!this._object) {
      return this.clear(allow_play_btn);
    }

    this._total = this._object.getTotalSteps() - 1;
    if (this._total >= 1) {
      this.clearTimer();
      this.$play_controls.classList.remove('disabled');
      this.$btn_play.classList.remove('disabled', 'pause', 'restart');
      this.$btn_play.classList.add('play');
      this.$btn_play.setAttribute('title', 'Play');
      this.goto(0, true);
    } else {
      this.clear(allow_play_btn);
    }
  }

  clear(allow_play_btn) {
    this.clearTimer();
    this._total = 0;
    this._step = 0;
    this.disableButtons(allow_play_btn);
    if (this._object && this._object.clear) {
      this._object.clear();
    }
  }

  disableButtons(allow_play_btn) {
    this.$btn_play.classList.remove('pause', 'restart');
    this.$btn_play.classList.add('play');
    this.$btn_play.setAttribute('title', 'Play');
    if (allow_play_btn) {
      this.$play_controls.classList.remove('disabled');
      for (let btn of this.$buttons) {
        if (btn == this.$btn_play) {
          btn.classList.remove('disabled');
        } else {
          btn.classList.add('disabled');
        }
      }
    } else {
      this.$play_controls.classList.add('disabled');
    }
  }

  goto(step) {
    if (!this._object) {
      this.pause();
      throw new Error('Lacking controller, no visualizations can be represented.');
    }

    if (!Number.isInteger(step) || step < 0 || step > this._total) {
      this.pause();
      throw new RangeError('Invalid step');
    }

    if (step && step == this._step) {
      return;
    }

    this._step = step;
    this.updateUI();
    return this._object.goto(step);
  }

  prev() {
    if (this._step == 0) {
      throw new RangeError('It\'s already the first step');
    }

    if (this._object.prev) {
      --this._step;
      this.updateUI();
      return this._object.prev(this._step);
    }
    return this.goto(this._step - 1);
  }

  next() {
    if (this._step >= this._total) {
      throw new RangeError('It\'s already the last step');
    }

    if (this._object.next) {
      ++this._step;
      this.updateUI();
      return this._object.next(this._step);
    }
    return this.goto(this._step + 1);
  }

  updateUI() {
    if (this._step == 0) {
      this.$btn_beginning.classList.add('disabled');
      this.$btn_backward.classList.add('disabled');
    } else {
      this.$btn_beginning.classList.remove('disabled');
      this.$btn_backward.classList.remove('disabled');
    }

    if (this._step == this._total) {
      this.$btn_forward.classList.add('disabled');
      this.$btn_end.classList.add('disabled');
      if (this._step > 0) {
        this.$btn_play.classList.add('restart');
        this.$btn_play.setAttribute('title', 'Restart');
      }
    } else {
      this.$btn_forward.classList.remove('disabled');
      this.$btn_end.classList.remove('disabled');
      this.$btn_play.classList.remove('restart');
    }

    this.$progress_bar.style.width = 100 * (this._step / this._total) + '%';
  }

  autoplay() {
    this.clearTimer();
    this.$btn_play.classList.remove('play');
    this.$btn_play.classList.add('pause');
    this.$btn_play.setAttribute('title', 'Pause');
    this._timer = setInterval(() => {
      this.next();
      if (this._step == this._total) {
        this.pause();
      }
    }, this._speed);
  }

  pause() {
    if (this._timer) {
      this.clearTimer();
      this.$btn_play.classList.remove('pause');
      this.$btn_play.classList.add('play');
      this.$btn_play.setAttribute('title', 'Play');
    }
  }

  clearTimer() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  handle(button) {
    if (button != this.$btn_play) {
      this.pause();
    }

    switch (button) {
      case this.$btn_beginning:
        if (this._step > 0) {
          this.goto(0);
        }
        break;

      case this.$btn_backward:
        if (this._step > 0) {
          this.prev();
        }
        break;

      case this.$btn_play:
        if (button.classList.contains('restart')) {
          this.goto(0, true);
          if (button.classList.contains('pause')) {
            this.autoplay();
          } else {
            this.$btn_play.setAttribute('title', 'Play');
          }
        } else if (button.classList.contains('pause')) {
          button.classList.remove('pause');
          button.classList.add('play');
          this.$btn_play.setAttribute('title', 'Play');
          this.clearTimer();
        } else {
          if (this._total >= 1) {
            this.autoplay();
          }
        }
        break;

      case this.$btn_forward:
        if (this._step < this._total) {
          this.next();
        }
        break;

      case this.$btn_end:
        if (this._step < this._total) {
          this.goto(this._total);
        }
        break;
    }
  }

}


// Progress Bar Control
// =========================================================
const sync_progress = (e) => {
  const percent = (e.clientX - progress_bounding.left) / progress_bounding.width;
  const step = Math.round(percent * active_control._total);
  if (step > 0) {
    active_control.goto(Math.min(step, active_control._total));
  } else {
    active_control.goto(0);
  }
};

const finish_progress_dragging = () => {
  active_control = false;
};

window.addEventListener('mousemove', (e) => {
  if (!active_control) return;
  e.preventDefault();
  sync_progress(e);
}, false);

window.addEventListener('mouseup', finish_progress_dragging, false);
window.addEventListener('blur',    finish_progress_dragging, false);
