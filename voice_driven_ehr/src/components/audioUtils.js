import wavEncoder from 'wav-encoder';

export const convertBlobToWav = async (blob, sampleRate = 16000) => {  
    console.log('Converting blob:', blob.type, blob.size);                                                                                                     
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

    // Encode to WAV
    const wavBuffer = await wavEncoder.encode({
      sampleRate: sampleRate,
      channelData: [resampled.getChannelData(0)],
      bitDepth: 16 // Force 16-bit PCM output

    });                                                                                                                                                            
    
    console.log('Converted to WAV:', wavBuffer.byteLength, 'bytes'); 
    return new Blob([wavBuffer], { type: 'audio/wav' });                                                                                                                     
  };

  export const validateAudioFormat = (blob) => {                                                                                                                             
    return blob.type === 'audio/wav'                                                                                                                                         
      && blob.size < 25 * 1024 * 1024 // 25MB limit                                                                                                                          
      && blob.duration < 300; // 5 minute limit                                                                                                                              
  }; 
  