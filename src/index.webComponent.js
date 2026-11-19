import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

class TodoListWebComponent extends HTMLElement {
    connectedCallback() {
        if (this.reactRoot) return;

        this.reactRoot = createRoot(this);
        this.reactRoot.render(<App />);
    }

    disconnectedCallback() {
        if (this.reactRoot) {
            this.reactRoot.unmount();
            this.reactRoot = null;
        }
    }
}

if (!customElements.get('web-component-todo-list')) {
    customElements.define(
        'web-component-todo-list',
        TodoListWebComponent
    );
}