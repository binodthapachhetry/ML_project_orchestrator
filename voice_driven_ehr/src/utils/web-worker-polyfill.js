// Remove the inline script and create src/utils/web-worker-polyfill.js                                                                                                    
if (!window.Worker) {                                                                                                                                                      
    window.Worker = class MockWorker {                                                                                                                                       
      constructor() {                                                                                                                                                        
        this.postMessage = () => {};                                                                                                                                         
        this.terminate = () => {};                                                                                                                                           
      }                                                                                                                                                                      
    };                                                                                                                                                                       
  } 