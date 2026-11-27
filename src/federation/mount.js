import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';
import appStyles from '../App.css';

export async function mount(container) {
  const target = document.createElement('div');
  const shadow = target.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `
    :host { display: block; font-family: system-ui, sans-serif; }
    *, *::before, *::after { box-sizing: border-box; }
    ${appStyles}
  `;
  const surface = document.createElement('div');
  shadow.append(style, surface);
  container.append(target);
  const root = createRoot(surface);
  try {
    root.render(<App />);
  } catch (error) {
    root.unmount();
    target.remove();
    throw error;
  }
  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    try {
      root.unmount();
    } finally {
      target.remove();
    }
  };
}
