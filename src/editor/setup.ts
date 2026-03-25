import { markdown } from '@codemirror/lang-markdown';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { DEBOUNCE_MS } from '../constants';
import { debounce } from './debounce';
import { editorTheme } from './theme';

export function createEditor(
  parent: HTMLElement,
  initialContent: string,
  onChange: (content: string) => void
): EditorView {
  const handleChange = debounce((content: string): void => {
    onChange(content);
  }, DEBOUNCE_MS);

  const state = EditorState.create({
    doc: initialContent,
    extensions: [
      basicSetup,
      markdown(),
      editorTheme,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          handleChange(update.state.doc.toString());
        }
      })
    ]
  });

  return new EditorView({
    state,
    parent
  });
}

export function getContent(view: EditorView): string {
  return view.state.doc.toString();
}
