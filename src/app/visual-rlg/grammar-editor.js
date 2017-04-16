import ace from 'ace-builds/src-noconflict/ace';
import updateSyntax from './ace-rlg-syntax';

const $grammar = document.getElementById('editor-grammar');
const editorRLG = ace.edit($grammar);

editorRLG.updateSyntax = updateSyntax;

// editorRLG.setTheme('ace/theme/tommorow');
editorRLG.getSession().setMode('ace/mode/rlg');

// hide vertical ruler
editorRLG.setShowPrintMargin(false);

// hide line highlight and cursor
editorRLG.setHighlightActiveLine(false);
hideCursor();

// show/hide cursor
editorRLG.on('focus', showCursor);
editorRLG.on('blur', hideCursor);

function hideCursor() {
  editorRLG.renderer.$cursorLayer.element.style.display = 'none';
  editorRLG.setHighlightGutterLine(false);
}

function showCursor() {
  editorRLG.renderer.$cursorLayer.element.style.display = 'block';
  editorRLG.setHighlightGutterLine(true);
}

export default editorRLG;
