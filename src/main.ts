import { mountApp } from './app';
import './styles/tokens.css';
import './styles/base.css';
import './styles/editor.css';
import './styles/landing.css';
import './styles/sidebar.css';
import './styles/settings.css';
import './styles/shortcuts.css';

const root = document.getElementById('app');

if (root instanceof HTMLElement) {
  mountApp(root);
}
