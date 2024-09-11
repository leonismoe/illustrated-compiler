import { editor as monacoEditor, Range } from '../../components/monaco';

export function createCodeEditor() {
  const container = document.getElementById('editor-code');
  const editor = monacoEditor.create(container, {
    automaticLayout: true,
    renderWhitespace: 'all',
    renderControlCharacters: true,
    renderLineHighlightOnlyWhenFocus: true,
  });

  const collection = editor.createDecorationsCollection();

  function markup(startRow, startCol, endRow, endCol) {
    collection.set([
      {
        range: new Range(startRow + 1, startCol + 1, endRow + 1, endCol + 1),
        options: {
          className: 'code-marker',
        },
      },
    ]);
  }

  function clearMarkup() {
    collection.clear();
  }

  editor.markup = markup;
  editor.cancelMarkup = clearMarkup;

  return { editor, markup, clearMarkup };
}
