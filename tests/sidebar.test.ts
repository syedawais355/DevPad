import { describe, expect, it, vi } from 'vitest';
import { renderSidebar } from '../src/ui/sidebar';
import type { Note } from '../src/types';

const note: Note = {
  id: 'note-1',
  title: 'DevPad Note',
  content: 'Hello',
  createdAt: 1,
  updatedAt: 2,
  encrypted: false,
  tags: []
};

describe('sidebar', () => {
  it('renders a visible help link', () => {
    const element = renderSidebar([note], 'note-1', {
      onSelect: vi.fn(),
      onCreate: vi.fn(),
      onDelete: vi.fn(),
      onOpenSettings: vi.fn()
    });

    const helpLink = [...element.querySelectorAll('a')].find((link) => link.textContent === 'Help');

    expect(helpLink?.getAttribute('href')).toBe('help/');
  });
});
