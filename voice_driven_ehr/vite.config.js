import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { // ← Correct placement                                                                                                                                      
    headers: {                                                                                                                                                          
      'Access-Control-Allow-Origin': 'https://huggingface.co',                                                                                                          
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }                                                                                                                                                                    
  },  
  optimizeDeps: {                                                                                                                                                          
    include: ['@huggingface/transformers'],
    exclude: ['@xenova/transformers']                                                                                                                                      
  },
  build: {                                                                                                                                                                 
    target: 'esnext' // Needed for WASM                                                                                                                                    
  }
 
})
