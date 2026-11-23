import { createRoot } from 'react-dom/client';
import App from '../App';
import appCss from '../App.css';
import baseCss from '../index.css';

export async function mount(container) {
    const host = document.createElement('todo-list-remote');
    const shadow = host.attachShadow({ mode: 'open' });
    const styles = document.createElement('style');
    styles.textContent = `${baseCss}\n${appCss}\n:host { display: block; color: #111827; background: white; }`;
    const target = document.createElement('div');
    shadow.append(styles, target);
    container.append(host);
    const root = createRoot(target);
    try {
        root.render(<App />);
    } catch (error) {
        root.unmount();
        host.remove();
        throw error;
    }
    let disposed = false;
    return () => {
        if (disposed) return;
        disposed = true;
        root.unmount();
        host.remove();
    };
}
