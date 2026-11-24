import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

let root;
export async function bootstrap() {}

export async function mount({ domElement }) {
  const response = await fetch(new URL('./single-spa.css', import.meta.url));
  if (!response.ok) throw new Error(`Could not load to-do styles: ${response.status}`);
  const css = await response.text();
  const host = document.createElement('div');
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `:host { display: block; font-family: system-ui, sans-serif; } ${css}`;
  const target = document.createElement('div');
  shadow.append(style, target);
  domElement.replaceChildren(host);
  root = createRoot(target, {
    onUncaughtError(error) {
      const message = document.createElement('p');
      message.setAttribute('role', 'alert');
      message.textContent = `Could not render the to-do app: ${error.message}`;
      shadow.append(message);
      console.error('Could not render the to-do app:', error);
    },
  });
  root.render(<App />);
}

export async function unmount({ domElement }) {
  if (root) root.unmount();
  root = undefined;
  domElement.replaceChildren();
}
