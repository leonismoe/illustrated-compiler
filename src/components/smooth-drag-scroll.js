import { getPosition } from 'smooth-scrollbar/src/utils/get-position';

function handler() {
  const { container, xAxis, yAxis } = this.targets;

  let isDragging, startOffset, startPos;

  this.__addEvent(container, 'mousedown', (evt) => {
    if (this.__isDrag
        || evt.target == xAxis.track || evt.target == xAxis.thumb
        || evt.target == yAxis.track || evt.target == yAxis.thumb) return;

    const offset = this.offset;
    isDragging = true;
    startOffset = { x: offset.x, y: offset.y };
    startPos = getPosition(evt);
  });

  this.__addEvent(window, 'mousemove', (evt) => {
    if (!isDragging) return;
    evt.preventDefault();

    const cursorPos = getPosition(evt);
    this.setPosition(
      startOffset.x + startPos.x - cursorPos.x,
      startOffset.y + startPos.y - cursorPos.y
    );
  });


  this.__addEvent(window, 'mouseup blur', () => {
    isDragging = false;
  });
}

export default function (scrollbar) {
  handler.apply(scrollbar);
}
