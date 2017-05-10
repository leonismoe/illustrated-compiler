import ace from '../../components/ace';
import './ace-regex-syntax';

const $container = document.getElementById('editor-rules');
const editor = ace.edit($container);

editor.setTheme('ace/theme/regex');
editor.getSession().setMode('ace/mode/regex-with-comment');

ace.auto_hide_cursor(editor);

export default editor;
