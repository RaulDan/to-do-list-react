import { build, context } from 'esbuild';

const options = {
  entryPoints: ['src/single-spa.js'],
  outfile: 'public/single-spa/single-spa.js',
  bundle: true,
  format: 'esm',
  loader: { '.js': 'jsx' },
  jsx: 'automatic',
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.REACT_APP_TODO_API_URL': JSON.stringify(process.env.REACT_APP_TODO_API_URL || ''),
  },
};

if (process.argv.includes('--watch')) {
  const builder = await context(options);
  await builder.watch();
  console.log('Watching the React to-do single-spa bundle.');
} else {
  await build(options);
}
