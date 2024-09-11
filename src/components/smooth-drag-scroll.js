/**
 * @param {import('smooth-scrollbar').default} scrollbar
 */
export default function initDragScroll(scrollbar) {
  /** @type {[type: string, listener: (...args: unknown[]) => any][]} */
  const windowListeners = [];

  let isDragging = false;
  let prevPoint = { x: 0, y: 0 };

  scrollbar.containerEl.addEventListener('mousedown', e => {
    const { xAxis, yAxis } = scrollbar.track;

    if (isDragging
      || e.target == xAxis.element || e.target == xAxis.thumb.element
      || e.target == yAxis.element || e.target == yAxis.thumb.element
    ) {
      return;
    }

    isDragging = true;
    prevPoint = { x: e.clientX, y: e.clientY };

    scrollbar.containerEl.style.cursor = 'grabbing';

    windowListeners.push(['mousemove', handleMouseMove]);
    window.addEventListener('mousemove', handleMouseMove);

    windowListeners.push(['mouseup', handleMouseUp]);
    window.addEventListener('mouseup', handleMouseUp);

    windowListeners.push(['blur', stopDragging]);
    window.addEventListener('blur', stopDragging);

    windowListeners.push(['pointercancel', stopDragging]);
    window.addEventListener('pointercancel', stopDragging);
  });

  /**
   * @param {MouseEvent} e
   */
  function handleMouseMove(e) {
    if (!isDragging) {
      return;
    }

    e.preventDefault();

    scrollbar.setPosition(
      scrollbar.scrollLeft + (prevPoint.x - e.clientX),
      scrollbar.scrollTop + (prevPoint.y - e.clientY),
    );

    prevPoint = { x: e.clientX, y: e.clientY };
  }

  /**
   * @param {MouseEvent} e
   */
  function handleMouseUp(e) {
    handleMouseMove(e);
    stopDragging();
  }

  function stopDragging() {
    isDragging = false;
    scrollbar.containerEl.style.cursor = '';

    for (let i = 0; i < windowListeners.length; ++i) {
      const [type, listener] = windowListeners[i];
      window.removeEventListener(type, listener);
    }
    windowListeners.length = 0;
  }
}
