import { describe, expect, it, vi } from 'vitest';
import { setupShortcutSystem } from '../src/shortcuts/system';

describe('shortcut system', () => {
  it('matches mod shortcuts on windows with ctrl', () => {
    const onSave = vi.fn();
    const teardown = setupShortcutSystem(window, false, [
      {
        id: 'save_note',
        combo: 'mod+s',
        handler: onSave
      }
    ]);

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    });

    window.dispatchEvent(event);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
    teardown();
  });

  it('matches mod shortcuts on mac with meta', () => {
    const onSave = vi.fn();
    const teardown = setupShortcutSystem(window, true, [
      {
        id: 'save_note',
        combo: 'mod+s',
        handler: onSave
      }
    ]);

    const event = new KeyboardEvent('keydown', {
      key: 's',
      metaKey: true,
      bubbles: true,
      cancelable: true
    });

    window.dispatchEvent(event);

    expect(onSave).toHaveBeenCalledTimes(1);
    teardown();
  });

  it('does not trigger on regular input fields unless explicitly allowed', () => {
    const onSave = vi.fn();
    const teardown = setupShortcutSystem(window, false, [
      {
        id: 'save_note',
        combo: 'mod+s',
        handler: onSave
      }
    ]);

    const input = document.createElement('input');
    document.body.append(input);
    input.focus();

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    });
    input.dispatchEvent(event);

    expect(onSave).not.toHaveBeenCalled();
    teardown();
    input.remove();
  });

  it('still triggers inside codemirror editable surface', () => {
    const onSave = vi.fn();
    const teardown = setupShortcutSystem(window, false, [
      {
        id: 'save_note',
        combo: 'mod+s',
        handler: onSave
      }
    ]);

    const editor = document.createElement('div');
    editor.className = 'cm-editor';
    const content = document.createElement('div');
    content.contentEditable = 'true';
    editor.append(content);
    document.body.append(editor);

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    });
    content.dispatchEvent(event);

    expect(onSave).toHaveBeenCalledTimes(1);
    teardown();
    editor.remove();
  });
});
