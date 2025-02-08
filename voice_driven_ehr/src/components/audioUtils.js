export const convertBlobToWav = async (blob, sampleRate = 16000) => {                                                                                                      
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();                                                                                           
    const arrayBuffer = await blob.arrayBuffer();                                                                                                                            
    const audioData = await audioContext.decodeAudioData(arrayBuffer);                                                                                                       
                                                                                                                                                                             
    // Resample to 16kHz                                                                                                                                                     
    const offlineContext = new OfflineAudioContext(1, audioData.duration * sampleRate, sampleRate);                                                                          
    const source = offlineContext.createBufferSource();                                                                                                                      
    source.buffer = audioData;                                                                                                                                               
    source.connect(offlineContext.destination);                                                                                                                              
    source.start();                                                                                                                                                          
                                                                                                                                                                             
    const resampled = await offlineContext.startRendering();                                                                                                                 
    const wavBuffer = new WavFileEncoder({                                                                                                                                   
      sampleRate: sampleRate,                                                                                                                                                
      channelData: [resampled.getChannelData(0)]                                                                                                                             
    }).encode();                                                                                                                                                             
                                                                                                                                                                             
    return new Blob([wavBuffer], { type: 'audio/wav' });                                                                                                                     
  };

  export const validateAudioFormat = (blob) => {                                                                                                                             
    return blob.type === 'audio/wav'                                                                                                                                         
      && blob.size < 25 * 1024 * 1024 // 25MB limit                                                                                                                          
      && blob.duration < 300; // 5 minute limit                                                                                                                              
  }; 
  