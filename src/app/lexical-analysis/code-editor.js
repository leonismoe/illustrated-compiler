import ace from '../../components/ace';
const Range = ace.require('ace/range').Range;

const $container = document.getElementById('editor-code');
const editor = ace.edit($container);

editor.setShowInvisibles(true);
ace.auto_hide_cursor(editor);

let current_marker;
editor.markup = (startRow, startColumn, endRow, endColumn) => {
  const session = editor.getSession();
  if (current_marker) {
    session.removeMarker(current_marker);
  }

  const range = new Range(startRow, startColumn, endRow, endColumn);
  current_marker = session.addMarker(range, 'code-marker', 'character', false);
};

editor.cancelMarkup = () => {
  if (current_marker) {
    editor.getSession().removeMarker(current_marker);
    current_marker = null;
  }
};

export default editor;
