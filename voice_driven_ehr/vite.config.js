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
