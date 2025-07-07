import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    resolve: true,
    compilerOptions: {
      esModuleInterop: true,
      allowSyntheticDefaultImports: true
    }
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  treeshake: true,
  minify: true,
  outDir: 'dist',
  onSuccess: 'echo "SDK built successfully!"',
  // Bundle TensorFlow.js and other dependencies
  noExternal: [
    '@tensorflow/tfjs',
    '@tensorflow-models/blazeface',
    '@tensorflow/tfjs-backend-webgl',
    'seedrandom'
  ]
}) 