// Create src/workers/asr.worker.js                                                                                                                                        
self.importScripts('https://cdn.jsdelivr.net/npm/@xenova/transformers/dist/transformers.min.js');                                                                          
                                                                                                                                                                            
let pipeline = null;                                                                                                                                                       
                                                                                                                                                                           
self.addEventListener('message', async (e) => {                                                                                                                            
  if (e.data.type === 'INIT') {                                                                                                                                            
    try {                                                                                                                                                                  
      const { model, quantized } = e.data.payload;                                                                                                                         
      pipeline = await pipeline('automatic-speech-recognition', model, {                                                                                                   
        quantized,                                                                                                                                                         
        progress_callback: (progress) => {                                                                                                                                 
          self.postMessage({ type: 'PROGRESS', progress });                                                                                                                
        }                                                                                                                                                                  
      });                                                                                                                                                                  
      self.postMessage({ type: 'READY' });                                                                                                                                 
    } catch (error) {                                                                                                                                                      
      self.postMessage({ type: 'ERROR', error: error.message });                                                                                                           
    }                                                                                                                                                                      
  }                                                                                                                                                                        
                                                                                                                                                                           
  if (e.data.type === 'TRANSCRIBE' && pipeline) {                                                                                                                          
    const { audioData, options } = e.data.payload;                                                                                                                         
    try {                                                                                                                                                                  
      const output = await pipeline(audioData, options);                                                                                                                   
      self.postMessage({ type: 'RESULT', transcription: output.text });                                                                                                    
    } catch (error) {                                                                                                                                                      
      self.postMessage({ type: 'ERROR', error: error.message });                                                                                                           
    }                                                                                                                                                                      
  }

  if (e.data.type === 'UNLOAD') {
    // Clean up pipeline resources
    if (pipeline) {
      pipeline = null;
    }
    // Clear any cached data
    self.caches?.delete('transformers-cache');
    // Inform the main thread that cleanup is complete
    self.postMessage({ type: 'UNLOADED' });
  }                                                                                                                                                                      
});  
