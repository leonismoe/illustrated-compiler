import ace from 'ace-builds/src-noconflict/ace';

ace.auto_hide_cursor = (editor) => {
  // hide vertical ruler
  editor.setShowPrintMargin(false);

  // hide line highlight and cursor
  editor.setHighlightActiveLine(false);

  // show/hide cursor
  editor.on('focus', showCursor);
  editor.on('blur', hideCursor);
  hideCursor();

  function hideCursor() {
    editor.renderer.$cursorLayer.element.style.display = 'none';
    editor.setHighlightGutterLine(false);
  }

  function showCursor() {
    editor.renderer.$cursorLayer.element.style.display = 'block';
    editor.setHighlightGutterLine(true);
  }
};

export default ace;
