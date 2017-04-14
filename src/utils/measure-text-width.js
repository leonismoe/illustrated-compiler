// https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript

const canvas = document.createElement('canvas');
const context = canvas && canvas.getContext && canvas.getContext('2d');

export default function measureTextWidth(text, font, repeat = 1) {
  if (repeat > 1) {
    text = Array(repeat + 1).join(text);
  }
  let totalWidth;

  if (context) {
    context.font = font;
    totalWidth = context.measureText(text).width;

  } else { // fallback
    const el = document.createElement('div');
    el.setAttribute('style', 'position:absolute;visibility:hidden;white-space:nowrap;word-break:break-all;padding:0;margin:0;font:' + font);
    el.innerHTML = text;
    document.body.appendChild(el);
    totalWidth = el.clientWidth;
    document.body.removeChild(el);
  }

  return totalWidth / repeat;
}
