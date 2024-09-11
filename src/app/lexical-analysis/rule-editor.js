import { editor as monacoEditor, getHighlighterAsync, THEME_ID } from '../../components/monaco';
import { LANG_ID } from './syntax';
import ExampleRule from './rule.example.txt?raw';

export function createRuleEditor() {
  const container = document.getElementById('editor-rules');

  const editor = monacoEditor.create(container, {
    value: ExampleRule,
    language: LANG_ID,
    theme: THEME_ID,
    automaticLayout: true,
  });

  return editor;
}

export function createRuleEditorAsync() {
  return getHighlighterAsync().then(createRuleEditor);
}
