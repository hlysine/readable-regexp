import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import packageJson from './package.json';

const name = packageJson.main.replace(/\.js$/, '');

const bundle = (config) => ({
  ...config,
  input: './src/index.ts',
  external: /node_modules/,
});

export default [
  bundle({
    plugins: [nodeResolve(), commonjs(), esbuild()],
    output: [
      {
        file: `${name}.js`,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: `${name}.mjs`,
        format: 'es',
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
