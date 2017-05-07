import ace from '../../components/ace';

const $container = document.getElementById('editor-code');
const editor = ace.edit($container);

ace.auto_hide_cursor(editor);

export default editor;
