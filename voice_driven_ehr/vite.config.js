import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {                                                                                                                                                          
    include: ['@xenova/transformers'],                                                                                                                                     
  },                                                                                                                                                                       
  server: {  
    proxy: {                                                                                                                                                               
      '/Xenova': {                                                                                                                                                         
        target: 'https://huggingface.co',                                                                                                                                  
        changeOrigin: true,                                                                                                                                                
        rewrite: (path) => path.replace(/^\/Xenova/, '')                                                                                                                   
      }                                                                                                                                                                    
    },                                                                                                                                                              
    headers: {                                                                                                                                                             
      // Add CORS headers for model loading                                                                                                                                
      'Cross-Origin-Opener-Policy': 'same-origin',                                                                                                                         
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Resource-Policy': 'cross-origin'                                                                                                                     
    }

  }    
})
