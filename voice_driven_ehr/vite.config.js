// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// // import wasm from 'vite-plugin-wasm'; // Add this
// // import topLevelAwait from 'vite-plugin-top-level-await'; // Add this

// export default defineConfig({
//   plugins: [
//     react(),
//     // wasm(), // Enable WASM support
//     // topLevelAwait() // Required for ONNX Runtime threading
//   ],
//   server: {
//     headers: {
//       'Cross-Origin-Embedder-Policy': 'require-corp',
//       'Cross-Origin-Opener-Policy': 'same-origin',
//       'Access-Control-Allow-Origin': 'https://huggingface.co'
//     }
//   },
//   optimizeDeps: {
//     // Explicitly exclude transformers from optimization
//     include: ['@huggingface/transformers', 'react', 'react-dom'],
//     exclude: ['@xenova/transformers'],
//     // Add these extensions to dependency optimization
//     extensions: ['.js', '.jsx', '.wasm', '.mjs'],
//     esbuildOptions: {
//       format: 'esm',
//       target: 'esnext'
//     }
//   },
//   build: {
//     target: 'esnext',
//   }

// });


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {                                                                                                                                                          
    include: ['@huggingface/transformers'],                                                                                                                                     
  },                                                                                                                                                               
    headers: {                                                                                                                                                             
      // Add CORS headers for model loading                                                                                                                                
      'Access-Control-Allow-Origin': 'https://huggingface.co',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    }
 
})
