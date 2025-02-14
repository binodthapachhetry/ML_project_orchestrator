interface ModelLoaderConfig {                                                                                                                          
    url: string;                                                                                                                                         
    dst: number;                                                                                                                                         
    size_mb: number;                                                                                                                                     
    cbProgress: (progress: number) => void;                                                                                                              
    cbReady: () => void;                                                                                                                                 
    cbCancel: (error: string) => void;                                                                                                                   
  }                                                                                                                                                      
                                                                                                                                                         
  interface ModelHandle {                                                                                                                                
    unloadModel: () => void;                                                                                                                             
  }                                                                                                                                                      
                                                                                                                                                         
  declare const Module: {                                                                                                                                
    _malloc: (size: number) => number;                                                                                                                   
    HEAPU8: Uint8Array;                                                                                                                                  
    _free: (ptr: number) => void;                                                                                                                        
  };                                                                                                                                                     
                                                                                                                                                         
  export function loadRemote(config: ModelLoaderConfig): ModelHandle {                                                                                   
    // Implementation remains similar but with type guarantees                                                                                           
    // Add proper type assertions for IndexedDB operations                                                                                               
    const store = tx.objectStore(storeName) as IDBObjectStore;                                                                                           
                                                                                                                                                         
    return {                                                                                                                                             
      unloadModel: () => {                                                                                                                               
        if (config.dst) {                                                                                                                                
          Module._free(config.dst);                                                                                                                      
        }                                                                                                                                                
      }                                                                                                                                                  
    };                                                                                                                                                   
  }                                                                                                                                                      
                                                                                                                                                         
  // Type-safe model loader for pose estimation                                                                                                          
  export async function loadPoseModel(): Promise<ModelHandle> {                                                                                          
    const MODEL_CONFIG: ModelLoaderConfig = {                                                                                                            
      url: 'https://your-model-endpoint.pose',                                                                                                           
      dst: Module._malloc(8 * 1024 * 1024),                                                                                                              
      size_mb: 8,                                                                                                                                        
      cbProgress: (pct: number) => console.log(`Loading: ${(pct * 100).toFixed(1)}%`),                                                                   
      cbReady: () => console.log('Pose model ready'),                                                                                                    
      cbCancel: (err: string) => console.error('Model load failed:', err)                                                                                
    };                                                                                                                                                   
                                                                                                                                                         
    return loadRemote(MODEL_CONFIG);                                                                                                                     
  } 