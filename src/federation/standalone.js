import('./mount').then(async ({ mount }) => {
    const container = document.getElementById('remote-root');
    if (!container) throw new Error('Missing remote-root container.');
    await mount(container);
}).catch((error) => {
    console.error('To-do list mount failed', error);
    document.body.textContent = 'Could not start the to-do list.';
});
