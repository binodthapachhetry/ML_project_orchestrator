import { pipeline, env } from '@huggingface/transformers';  

 // Configure ONNX runtime in worker                                                                                                                                        
//  env.backends.onnx.wasm.wasmPaths = '/wasm/';   
//  env.backends.priority = ['wasm'];                                                                                                         
//  env.backends.onnx.wasm.numThreads = navigator.hardwareConcurrency || 2;  

//  env.backends.onnx.wasm.simd = true;                                                                                                                                        
 env.verbose = true;  
                                                                                                                                                                            
 let pipelineInstance = null;
 
 // Better memory monitoring                                                                                                                                                
 const logMemoryUsage = () => {                                                                                                                                             
  try {                                                                                                                                                                    
    // Check if running in Chrome with memory API                                                                                                                          
    if (self.Performance && self.Performance.memory) {                                                                                                                     
      console.log('Memory usage:', {                                                                                                                                       
        used: Math.round(self.Performance.memory.usedJSHeapSize / (1024 * 1024)) + 'MB',                                                                                   
        total: Math.round(self.Performance.memory.totalJSHeapSize / (1024 * 1024)) + 'MB',                                                                                 
        limit: Math.round(self.Performance.memory.jsHeapSizeLimit / (1024 * 1024)) + 'MB'                                                                                  
      });                                                                                                                                                                  
    } else {                                                                                                                                                               
      // Fallback for non-Chrome browsers                                                                                                                                  
      console.log('Memory monitoring not available in this browser');                                                                                                                                                                                                                                                                                                                                                                                                               
    }                                                                                                                                                                      
  } catch (e) {                                                                                                                                                            
    console.log('Memory monitoring failed:', e);                                                                                                                           
  }                                                                                                                                                                        
}; 

// // Add this at the start of your worker code to enable memory monitoring                                                                                                   
// if (self.chrome && self.chrome.) {                                                                                                                                
//   console.log('Chrome performance API available');                                                                                                                         
// }

const loadModelWithMonitoring = async (model, quantized) => {                                                                                                              
  try {                                                                                                                                                                    
    console.log('Starting model load...');                                                                                                                                 
                                                                                                                                                                           
    // Monitor initial state                                                                                                                                               
    logMemoryUsage();                                                                                                                                                      
                                                                                                                                                                           
    const startTime = self.performance.now();                                                                                                                                   
                                                                                                                                                                           
    pipelineInstance = await pipeline('automatic-speech-recognition', model, {                                                                                             
      quantized,                                                                                                                                                           
      progress_callback: (progress) => {                                                                                                                                   
        // console.log(`Loading progress: ${Math.round(progress * 100)}%`);                                                                                                   
        self.postMessage({ type: 'PROGRESS', progress });                                                                                                                  
      },
      // config: {                                                                                                                                                            
      //   max_length: 128,                                                                                                                                                   
      //   num_beams: 1,                                                                                                                                                      
      //   use_cache: true,                                                                                                                                                   
      //   low_memory: true                                                                                                                                                   
      // }                                                                                                                                                                  
    });                                                                                                                                                                    
                                                                                                                                                                           
    const endTime = self.performance.now();                                                                                                                                     
    console.log(`Model loaded in ${Math.round(endTime - startTime)}ms`);                                                                                                   
                                                                                                                                                                           
    // Monitor after load                                                                                                                                                  
    logMemoryUsage();                                                                                                                                                      
                                                                                                                                                                           
    return true;                                                                                                                                                           
  } catch (error) {                                                                                                                                                        
    console.error('Model loading failed:', error);                                                                                                                         
    throw error;                                                                                                                                                           
  }                                                                                                                                                                        
};     
                                                                                                                                                                            
 self.addEventListener('message', async (e) => {   
  logMemoryUsage();                                                                                                                          
   console.log('Worker received message:', e.data.type, e.data.payload);                                                                                                    
                                                                                                                                                                            
   if (e.data.type === 'INIT') {                                                                                                                                            
    //  try {                                                                                                                                                                  
    //    console.log('Starting pipeline initialization...');                                                                                                                  
    //    const { model, quantized } = e.data.payload;                                                                                                                         
                                                                                                                                                                            
    //    pipelineInstance = await pipeline('automatic-speech-recognition', model, {                                                                                           
    //      quantized,                                                                                                                                                         
    //      progress_callback: (progress) => {                                                                                                                                 
    //       //  console.log('Model loading progress:', progress);                                                                                                                
    //        self.postMessage({ type: 'PROGRESS', progress });                                                                                                                
    //      }                                                                                                                                                                  
    //    });                                                                                                                                                                  
                                                                                                                                                                            
    //    console.log('Pipeline initialized successfully:', !!pipelineInstance);                                                                                               
    //    self.postMessage({ type: 'READY' });                                                                                                                                 
    //  } catch (error) {                                                                                                                                                      
    //    console.error('Pipeline initialization failed:', error);                                                                                                             
    //    self.postMessage({                                                                                                                                                   
    //      type: 'ERROR',                                                                                                                                                     
    //      error: `Pipeline initialization failed: ${error.message}\nStack: ${error.stack}`                                                                                   
    //    });                                                                                                                                                                  
    //  }     
    try {                                                                                                                                                                    
      const { model, quantized } = e.data.payload;                                                                                                                           
      await loadModelWithMonitoring(model, quantized);                                                                                                                       
      self.postMessage({ type: 'READY' });                                                                                                                                   
    } catch (error) {                                                                                                                                                        
      self.postMessage({                                                                                                                                                     
        type: 'ERROR',                                                                                                                                                       
        error: `Model initialization failed: ${error.message}`                                                                                                               
      });                                                                                                                                                                    
    }  
    
   }                                                                                                                                                                        
                                                                                                                                                                            
   if (e.data.type === 'TRANSCRIBE') {                                                                                                                                      
     console.log('Received TRANSCRIBE message, pipeline exists:', !!pipelineInstance);                                                                                      
                                                                                                                                                                            
     if (!pipelineInstance) {                                                                                                                                               
       self.postMessage({                                                                                                                                                   
         type: 'ERROR',                                                                                                                                                     
         error: 'Pipeline not initialized. Please initialize the model first.'                                                                                              
       });                                                                                                                                                                  
       return;                                                                                                                                                              
     }                                                                                                                                                                      
                                                                                                                                                                            
     const { audioData, options } = e.data.payload;                                                                                                                         
     try {                                                                                                                                                                  
       console.log('Starting transcription with audio length:', audioData.length);                                                                                          
       const output = await pipelineInstance(audioData, options);                                                                                                           
       console.log('Transcription result:', output);                                                                                                                        
       self.postMessage({ type: 'RESULT', transcription: output.text });                                                                                                    
     } catch (error) {                                                                                                                                                      
       console.error('Transcription error:', error);                                                                                                                        
       self.postMessage({                                                                                                                                                   
         type: 'ERROR',                                                                                                                                                     
         error: `Transcription failed: ${error.message}\nStack: ${error.stack}`                                                                                             
       });                                                                                                                                                                  
     }                                                                                                                                                                      
   }  

   // Add cleanup handler                                                                                                                                                   
   if (e.data.type === 'UNLOAD') {                                                                                                                                          
    if (pipelineInstance) {                                                                                                                                                
      pipelineInstance = null;                                                                                                                                             
    }                                                                                                                                                                      
    self.postMessage({ type: 'UNLOADED' });                                                                                                                                
  } 
   
 });    