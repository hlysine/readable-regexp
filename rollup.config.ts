import { OutputOptions } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import del from 'rollup-plugin-delete';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import nodeResolve from '@rollup/plugin-node-resolve';
import packageJson from './package.json';

const name = packageJson.main.replace(/\.umd\.js$/, '');

const bundle = cfg => ({
  ...cfg,
  input: './src/index.ts',
  external: /node_modules/,
});

const config: OutputOptions[] = [
  bundle({
    plugins: [del({ targets: 'dist/*' }), nodeResolve(), commonjs(), esbuild({ minify: true })],
    output: [
      {
        file: `${name}.mjs`,
        format: 'es',
        sourcemap: true,
      },
      {
        file: `${name}.umd.js`,
        format: 'umd',
        name: 'readableRegExp',
        sourcemap: true,
      },
    ],
  }),
  bundle({
    plugins: [nodeResolve(), commonjs(), dts()],
    output: {
      file: `${name}.d.ts`,
      format: 'es',
    },
  }),
];

export default config;
