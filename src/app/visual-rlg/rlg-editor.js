import ace from '../../components/ace';
import updateSyntax from './ace-rlg-syntax';

const $grammar = document.getElementById('editor-grammar');
const editorRLG = ace.edit($grammar);

editorRLG.updateSyntax = updateSyntax;

// editorRLG.setTheme('ace/theme/tommorow');
editorRLG.getSession().setMode('ace/mode/rlg');

ace.auto_hide_cursor(editorRLG);

export default editorRLG;
