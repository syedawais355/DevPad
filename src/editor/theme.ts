import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import type { Extension } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { tags } from '@lezer/highlight';

const highlightStyle = HighlightStyle.define([
  { tag: [tags.heading, tags.keyword], color: '#c8a96e' },
  { tag: [tags.string, tags.monospace], color: '#7ec8a4' },
  { tag: [tags.strong, tags.emphasis], color: '#a78bfa' },
  { tag: [tags.link, tags.number], color: '#f6a35a' },
  { tag: tags.content, color: '#f5f1e8' }
]);

export const editorTheme: Extension = [
  oneDark,
  syntaxHighlighting(highlightStyle),
  EditorView.theme({
    '&': {
      background:
        'linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.02)), rgba(13, 13, 13, 0.58)',
      color: '#f5f1e8',
      fontFamily: '"DM Mono", monospace',
      fontSize: '13px',
      lineHeight: '1.8',
      borderRadius: '28px'
    },
    '.cm-content': {
      caretColor: '#c8a96e',
      padding: '28px 28px 36px'
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#c8a96e',
      borderLeftWidth: '2px'
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'rgba(200, 169, 110, 0.15)'
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      color: 'rgba(255, 255, 255, 0.2)',
      border: 'none',
      paddingTop: '22px',
      paddingLeft: '14px'
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(255, 255, 255, 0.03)'
    },
    '.cm-lineNumbers .cm-gutterElement': {
      opacity: '0.24'
    },
    '.cm-scroller': {
      fontFamily: '"DM Mono", monospace'
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(255, 255, 255, 0.02)'
    },
    '.cm-panels': {
      backgroundColor: 'transparent'
    },
    '.cm-foldPlaceholder': {
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      border: 'none',
      color: '#c8a96e'
    }
  })
];
