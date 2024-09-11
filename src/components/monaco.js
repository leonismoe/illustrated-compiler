import * as monaco from 'monaco-editor';
import { createHighlighterCore, createWasmOnigEngine } from 'shiki';
import ShikiWasm from 'shiki/wasm';
import { shikiToMonaco } from '@shikijs/monaco';
import GitHubLightTheme from 'shiki/themes/github-light-default';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import RegexpLang from '../app/lexical-analysis/syntax';

self.MonacoEnvironment = {
  getWorker: function (workerId, label) {
    return new EditorWorker();
  },
};

/** @type {import('shiki').HighlighterCore | null} */
let highlighter = null;

monaco.languages.register({ id: RegexpLang.name });

const highlighterPromise = createHighlighterCore({
  engine: createWasmOnigEngine(ShikiWasm),
  langs: [RegexpLang],
  themes: [
    GitHubLightTheme,
  ],
});

highlighterPromise.then(instance => {
  highlighter = instance;
  shikiToMonaco(highlighter, monaco);
});

export * from 'monaco-editor';

export const THEME_ID = GitHubLightTheme.name;

export function getHighlighter() {
  return highlighter;
}

export function getHighlighterAsync() {
  return highlighterPromise;
}
