import { useState, useRef, useEffect } from 'react';
import { pipeline, env} from '@huggingface/transformers';                                                                                                             
import { convertBlobToWav } from './audioUtils';

// Set the local model path                                                                                                                                                
env.allowRemoteModels = true;
env.verbose = true;
env.debug = true; 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
const AudioInputSection = () => {                                                                                                                                          
  
  const loadedRef = useRef(false);
  const asrPipelineRef = useRef(null);

  // Add these constants at the top                                                                                                                                          
  const ASR_OPTIONS = {                                                                                                                                                      
    chunk_length_s: 5,                                                                                                                                                      
    stride_length_s: 0.5,                                                                                                                                                      
    return_timestamps: false,                                                                                                                                                 
  }; 
  
  const [isTranscribing, setIsTranscribing] = useState(false);                                                                                                               
  const [transcriptionError, setTranscriptionError] = useState('');
  const [modelLoadProgress, setModelLoadProgress] = useState(0);     
  
  // const [asrPipeline, setAsrPipeline] = useState(null);                                                                                                                    
  const [isSTTModelLoading, setIsSTTModelLoading] = useState(false); 

  const [isRecording, setIsRecording] = useState(false);                                                                                                                   
  const [audioUrl, setAudioUrl] = useState('');                                                                                                                            
  const [isPlaying, setIsPlaying] = useState(false);                                                                                                                       
  const [transcription, setTranscription] = useState('');                                                                                                                  
  const [isAudioReady, setIsAudioReady] = useState(false);                                                                                                                 
  const [progress, setProgress] = useState(0);                                                                                                                             
  const [feedbackMessage, setFeedbackMessage] = useState('');                                                                                                              
  const [savedFiles, setSavedFiles] = useState([]); // State to store saved file keys                                                                                      
  const [encryptedData, setEncryptedData] = useState({                                                                                                                     
    ciphertext: null,                                                                                                                                                      
    iv: null,                                                                                                                                                              
    key: null,                                                                                                                                                             
    mimeType: ''                                                                                                                                                           
  });                                                                                                                                                                      
                                                                                                                                                                           
  // Refs for audio elements                                                                                                                                               
  const mediaRecorder = useRef(null);                                                                                                                                      
  const audioRef = useRef(null);                                                                                                                                           
  const chunks = useRef([]);                                                                                                                                               
                                                                                                                                                                           
  // Generate encryption key                                                                                                                                               
  const generateKey = async () => {                                                                                                                                       
    return crypto.subtle.generateKey(                                                                                                                                      
      { name: "AES-GCM", length: 256 },                                                                                                                                    
      true,                                                                                                                                                                
      ["encrypt", "decrypt"]                                                                                                                                               
    );                                                                                                                                                                     
  };
                                                                                                                                      
  // Initialize ASR pipeline once                                                                                                                                          
  useEffect(() => {                                                                                                                                                        
    const loadModel = async () => {                                                                                                                                        
      setIsSTTModelLoading(true);                                                                                                                   
      try {                                                                                                                                                                
        const pipelineInstance = await pipeline(  

          'automatic-speech-recognition',                                                                                                                                  
          'Xenova/whisper-tiny.en',                                                                                                                                                         
        )

        // Check if the pipeline has a callable function
        if (typeof pipelineInstance.call === 'function' || typeof pipelineInstance === 'function') {
          // setAsrPipeline(pipelineInstance);
          asrPipelineRef.current = pipelineInstance;


        } else {
          console.error('Pipeline did not return a callable function:', pipelineInstance);
        }
      } catch (error) {                                                                                                                                                          
        console.error('Full model loading error:', error);
        console.log('Model Config:', pipelineInstance ? await pipelineInstance.config : 'N/A');
        setTranscriptionError(`Model initialization failed: ${error.message}`);
        asrPipelineRef.current = null;
                                                                                               
      } finally {                                                                                                                                                          
        setIsSTTModelLoading(false);                                                                                                                                       
      }                                                                                                                                                                    
    };

    if (!loadedRef.current) {
      console.log('starting to load the model');
      loadModel();
      loadedRef.current = true;
    }      

  }, []);

                                                                                                                                                                         
  // Encrypt audio data                                                                                                                                                    
  const encryptAudio = async (rawBlob) => {                                                                                                                                
    try {                                                                                                                                                                  
      const key = await generateKey();                                                                                                                                     
      const iv = crypto.getRandomValues(new Uint8Array(12));                                                                                                               
      const rawData = await rawBlob.arrayBuffer();                                                                                                                         
                                                                                                                                                                           
      const ciphertext = await crypto.subtle.encrypt(                                                                                                                      
        { name: "AES-GCM", iv },                                                                                                                                           
        key,                                                                                                                                                               
        rawData                                                                                                                                                            
      );                                                                                                                                                                   
                                                                                                                                                                           
      return {                                                                                                                                                             
        ciphertext: new Blob([ciphertext], { type: "application/octet-stream" }),                                                                                          
        iv,                                                                                                                                                                
        key,                                                                                                                                                               
        mimeType: rawBlob.type                                                                                                                                             
      };                                                                                                                                                                   
    } catch (error) {                                                                                                                                                      
      console.error("Encryption failed:", error);                                                                                                                          
      throw new Error("Audio encryption failed");                                                                                                                          
    }                                                                                                                                                                      
  };                                                                                                                                                                       
                                                                                                                                                                           
  const saveEncryptedAudio = async () => {                                                                                                                                 
    if (!encryptedData.ciphertext) {                                                                                                                                       
      setFeedbackMessage("No encrypted audio to save.");                                                                                                                   
      return;                                                                                                                                                              
    }                                                                                                                                                                      
                                                                                                                                                                           
    try {                                                                                                                                                                  
      const request = indexedDB.open("AudioStorage", 1);                                                                                                                   
                                                                                                                                                                           
      request.onupgradeneeded = (event) => {                                                                                                                               
        const db = event.target.result;                                                                                                                                    
        if (!db.objectStoreNames.contains("encryptedAudio")) {                                                                                                             
          db.createObjectStore("encryptedAudio");                                                                                                                          
          console.log("Object store 'encryptedAudio' created.");                                                                                                           
        }                                                                                                                                                                  
      };                                                                                                                                                                   
                                                                                                                                                                           
      request.onsuccess = (event) => {                                                                                                                                     
        const db = event.target.result;                                                                                                                                    
        const tx = db.transaction("encryptedAudio", "readwrite");                                                                                                          
        const store = tx.objectStore("encryptedAudio");                                                                                                                    
                                                                                                                                                                           
        const timestamp = new Date().toISOString(); // Use timestamp as key                                                                                                
        const putRequest = store.put(encryptedData, timestamp);                                                                                                            
                                                                                                                                                                           
        putRequest.onsuccess = () => {                                                                                                                                     
          console.log("Audio saved successfully!");                                                                                                                        
          setFeedbackMessage("Audio saved securely!");                                                                                                                     
        };                                                                                                                                                                 
                                                                                                                                                                           
        putRequest.onerror = (error) => {                                                                                                                                  
          console.error("Error saving audio:", error);                                                                                                                     
          setFeedbackMessage("Failed to save audio.");                                                                                                                     
        };                                                                                                                                                                 
                                                                                                                                                                           
        tx.oncomplete = () => {                                                                                                                                            
          console.log("Transaction completed successfully.");                                                                                                              
        };                                                                                                                                                                 
                                                                                                                                                                           
        tx.onerror = (error) => {                                                                                                                                          
          console.error("Transaction error:", error);                                                                                                                      
        };                                                                                                                                                                 
      };                                                                                                                                                                   
                                                                                                                                                                           
      request.onerror = (error) => {                                                                                                                                       
        console.error("Error opening database:", error);                                                                                                                   
        setFeedbackMessage("Failed to open database.");                                                                                                                    
      };                                                                                                                                                                   
    } catch (error) {                                                                                                                                                      
      console.error("Unexpected error:", error);                                                                                                                           
      setFeedbackMessage("An unexpected error occurred.");                                                                                                                 
    }                                                                                                                                                                      
  };                                                                                                                                                                       
                                                                                                                                                                           
  const loadSavedFiles = async () => {                                                                                                                                     
    try {                                                                                                                                                                  
      const request = indexedDB.open("AudioStorage", 1);                                                                                                                   
                                                                                                                                                                           
      request.onsuccess = (event) => {                                                                                                                                     
        const db = event.target.result;                                                                                                                                    
        const tx = db.transaction("encryptedAudio", "readonly");                                                                                                           
        const store = tx.objectStore("encryptedAudio");                                                                                                                    
                                                                                                                                                                           
        const getAllKeysRequest = store.getAllKeys();                                                                                                                      
                                                                                                                                                                           
        getAllKeysRequest.onsuccess = () => {                                                                                                                              
          setSavedFiles(getAllKeysRequest.result);                                                                                                                         
        };                                                                                                                                                                 
                                                                                                                                                                           
        getAllKeysRequest.onerror = (error) => {                                                                                                                           
          console.error("Error retrieving keys:", error);                                                                                                                  
          setFeedbackMessage("Failed to retrieve saved files.");                                                                                                           
        };                                                                                                                                                                 
      };                                                                                                                                                                   
                                                                                                                                                                           
      request.onerror = (error) => {                                                                                                                                       
        console.error("Error opening database:", error);                                                                                                                   
        setFeedbackMessage("Failed to open database.");                                                                                                                    
      };                                                                                                                                                                   
    } catch (error) {                                                                                                                                                      
      console.error("Unexpected error:", error);                                                                                                                           
      setFeedbackMessage("An unexpected error occurred.");                                                                                                                 
    }                                                                                                                                                                      
  };                                                                                                                                                                       
                                                                                                                                                                           
  const loadEncryptedAudio = async (key) => {                                                                                                                              
    try {                                                                                                                                                                  
      const request = indexedDB.open("AudioStorage", 1);                                                                                                                   
                                                                                                                                                                           
      request.onsuccess = (event) => {                                                                                                                                     
        const db = event.target.result;                                                                                                                                    
        const tx = db.transaction("encryptedAudio", "readonly");                                                                                                           
        const store = tx.objectStore("encryptedAudio");                                                                                                                    
                                                                                                                                                                           
        const getRequest = store.get(key);                                                                                                                                 
                                                                                                                                                                           
        getRequest.onsuccess = async () => {                                                                                                                               
          const storedData = getRequest.result;                                                                                                                            
          if (storedData) {                                                                                                                                                
            setEncryptedData(storedData);                                                                                                                                  
            setFeedbackMessage("Encrypted audio loaded.");                                                                                                                 
            await decryptAudio(); // Decrypt and prepare the audio for playback                                                                                            
          } else {                                                                                                                                                         
            setFeedbackMessage("No saved encrypted audio found.");                                                                                                         
          }                                                                                                                                                                
        };                                                                                                                                                                 
                                                                                                                                                                           
        getRequest.onerror = (error) => {                                                                                                                                  
          console.error("Error loading audio:", error);                                                                                                                    
          setFeedbackMessage("Failed to load audio.");                                                                                                                     
        };                                                                                                                                                                 
      };                                                                                                                                                                   
                                                                                                                                                                           
      request.onerror = (error) => {                                                                                                                                       
        console.error("Error opening database:", error);                                                                                                                   
        setFeedbackMessage("Failed to open database.");                                                                                                                    
      };                                                                                                                                                                   
    } catch (error) {                                                                                                                                                      
      console.error("Unexpected error:", error);                                                                                                                           
      setFeedbackMessage("An unexpected error occurred.");                                                                                                                 
    }                                                                                                                                                                      
  };
  
// Helper function to resample audio to a target sample rate (e.g., 16000 Hz)
const resampleAudio = async (audioBuffer, targetRate = 16000) => {
  if (audioBuffer.sampleRate === targetRate) return audioBuffer;
  
  const numberOfChannels = audioBuffer.numberOfChannels;
  const duration = audioBuffer.duration;
  const offlineCtx = new OfflineAudioContext(
    numberOfChannels,
    Math.ceil(targetRate * duration),
    targetRate
  );
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start();
  return await offlineCtx.startRendering();
};

// Modified transcription handler using the ref for inference
const handleTranscription = async () => {    
  if (!asrPipelineRef.current) { // Check if pipeline exists                                                                                                                          
    setTranscriptionError('Model not loaded yet');                                                                                                                         
    return;                                                                                                                                                                
  }

  if (!encryptedData.ciphertext) {                                                                                                                                       
    setTranscriptionError('No audio to transcribe');                                                                                                                     
    return;                                                                                                                                                              
  }                                                                                                                                                                      
  
  setIsTranscribing(true);                                                                                                                                               
  setTranscriptionError('');                                                                                                                                             

  try {
    // 1. Decrypt audio
    const decryptedUrl = await decryptAudio();
    const response = await fetch(decryptedUrl);
    const decryptedBlob = await response.blob();

    // 2. Convert to WAV format
    const wavBlob = await convertBlobToWav(decryptedBlob);
    const arrayBuffer = await wavBlob.arrayBuffer();

    // 3. Convert to raw audio data
    const audioContext = new AudioContext();
    const audioData = await audioContext.decodeAudioData(arrayBuffer);
    console.log('Original audio sample rate:', audioData.sampleRate);

    // Resample to 16 kHz if necessary
    const targetSampleRate = 16000;
    let processedAudioData = audioData;
    if (audioData.sampleRate !== targetSampleRate) {
      processedAudioData = await resampleAudio(audioData, targetSampleRate);
      console.log('Resampled audio sample rate:', processedAudioData.sampleRate);
    }
    const rawAudio = processedAudioData.getChannelData(0);
    
    const output = await asrPipelineRef.current(rawAudio, ASR_OPTIONS);   
    console.log("STT result:", output.text);
    setTranscription(output.text);

  } catch (error) {                                                                                                                                                      
    console.error('Transcription failed:', error);                                                                                                                       
    setTranscriptionError(`Transcription failed: ${error.message}`);                                                                                                     
  } finally {                                                                                                                                                            
    setIsTranscribing(false);                                                                                                                                            
  }                                                                                                                                                                      
}; 
                                                                                                                                                                           
  // Decrypt audio data                                                                                                                                                    
  const decryptAudio = async () => {                                                                                                                                       
    if (!encryptedData.ciphertext || !encryptedData.key || !encryptedData.iv) return;                                                                                      
                                                                                                                                                                           
    try {                                                                                                                                                                  
      const decrypted = await crypto.subtle.decrypt(                                                                                                                       
        { name: "AES-GCM", iv: encryptedData.iv },                                                                                                                         
        encryptedData.key,                                                                                                                                                 
        await encryptedData.ciphertext.arrayBuffer()                                                                                                                       
      );                                                                                                                                                                   
                                                                                                                                                                           
      const decryptedBlob = new Blob([decrypted], { type: encryptedData.mimeType });                                                                                       
      const url = URL.createObjectURL(decryptedBlob);                                                                                                                      
      setAudioUrl(url);                                                                                                                                                    
      setIsAudioReady(true); // Indicate audio is ready                                                                                                                    
                                                                                                                                                                           
                                                                                                                                                                           
      // Zeroize key after use                                                                                                                                             
      crypto.subtle.exportKey("raw", encryptedData.key).then(keyArray => {                                                                                                 
        new Uint8Array(keyArray).fill(0);                                                                                                                                  
      });                                                                                                                                                                  
                                                                                                                                                                           
      return url;                                                                                                                                                          
    } catch (error) {                                                                                                                                                      
      console.error("Decryption failed:", error);                                                                                                                          
      setEncryptedData({ ciphertext: null, iv: null, key: null, mimeType: '' });                                                                                           
      throw new Error("Audio decryption failed");                                                                                                                          
    }                                                                                                                                                                      
  };                                                                                                                                                                       
                                                                                                                                                                           
  // Handle recording                                                                                                                                                      
  const toggleRecording = async () => {                                                                                                                                    
    if (!isRecording) {                                                                                                                                                    
      try {                                                                                                                                                                
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });                                                                                         
        mediaRecorder.current = new MediaRecorder(stream);                                                                                                                 
                                                                                                                                                                           
        mediaRecorder.current.ondataavailable = (e) => {                                                                                                                   
          chunks.current.push(e.data);                                                                                                                                     
        };                                                                                                                                                                 
                                                                                                                                                                           
        mediaRecorder.current.onstop = async () => {                                                                                                                       
          try {                                                                                                                                                            
            const rawBlob = new Blob(chunks.current, { type: 'audio/wav' });                                                                                               
            const encrypted = await encryptAudio(rawBlob);                                                                                                                 
                                                                                                                                                                           
            setEncryptedData(encrypted);                                                                                                                                   
            setAudioUrl('');                                                                                                                                               
                                                                                                                                                                           
            // Securely wipe raw data                                                                                                                                      
            chunks.current.forEach(chunk => {                                                                                                                              
              new Uint8Array(chunk).fill(0);                                                                                                                               
            });                                                                                                                                                            
            chunks.current = [];                                                                                                                                           
          } catch (error) {                                                                                                                                                
            console.error("Secure audio handling failed:", error);                                                                                                         
          }                                                                                                                                                                
        };                                                                                                                                                                 
                                                                                                                                                                           
        mediaRecorder.current.start();                                                                                                                                     
        setIsRecording(true);                                                                                                                                              
      } catch (err) {                                                                                                                                                      
        console.error('Error accessing microphone:', err);                                                                                                                 
      }                                                                                                                                                                    
    } else {                                                                                                                                                               
      mediaRecorder.current.stop();                                                                                                                                        
      setIsRecording(false);                                                                                                                                               
    }                                                                                                                                                                      
  };                                                                                                                                                                       
                                                                                                                                                                           
  // Handle playback                                                                                                                                                       
  const handlePlayback = async () => {                                                                                                                                     
    try {                                                                                                                                                                  
      const url = await decryptAudio();                                                                                                                                    
      console.log('Decrypted URL:', url);                                                                                                                                  
                                                                                                                                                                           
      // Set state to indicate audio is ready                                                                                                                              
      setAudioUrl(url);                                                                                                                                                    
      setIsAudioReady(true);                                                                                                                                               
    } catch (error) {                                                                                                                                                      
      console.error('Decryption failed:', error);                                                                                                                          
      alert('Playback failed: ' + error.message);                                                                                                                          
      setIsPlaying(false);                                                                                                                                                 
    }                                                                                                                                                                      
  };                                                                                                                                                                       
                                                                                                                                                                           
  // Effect to play audio when it is ready                                                                                                                                 
  useEffect(() => {                                                                                                                                                        
    if (isAudioReady && audioRef.current && audioUrl) {                                                                                                                    
      audioRef.current.src = audioUrl;                                                                                                                                     
      audioRef.current.play()                                                                                                                                              
        .then(() => setIsPlaying(true))                                                                                                                                    
        .catch(e => console.error("Playback failed:", e));                                                                                                                 
    }                                                                                                                                                                      
  }, [isAudioReady, audioUrl]); // Runs when audio is ready                                                                                                                
                                                                                                                                                                           
  useEffect(() => {                                                                                                                                                          
    if (transcriptionError) {                                                                                                                                                
      const errorMessage = `ASR Error: ${transcriptionError}\n\n` +                                                                                                          
        'Please try:\n1. Checking microphone permissions\n' +                                                                                                                
        '2. Using shorter audio clips\n3. Reloading the page';                                                                                                               
                                                                                                                                                                            
      alert(errorMessage);                                                                                                                                                   
      console.error('ASR Failure:', transcriptionError);                                                                                                                     
    }                                                                                                                                                                        
  }, [transcriptionError]);                                                                                                                                                                       
                                                                                                                                                                           
  // Progress updater                                                                                                                                                      
  useEffect(() => {                                                                                                                                                        
    const updateProgress = () => {                                                                                                                                         
      if (audioRef.current) {                                                                                                                                              
        const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100 || 0;                                                                            
        setProgress(progress);                                                                                                                                             
      }                                                                                                                                                                    
    };                                                                                                                                                                     
                                                                                                                                                                           
    const interval = setInterval(updateProgress, 100);                                                                                                                     
    return () => clearInterval(interval);                                                                                                                                  
  }, []);                                                                                                                                                                  
                                                                                                                                                                           
  // Cleanup                                                                                                                                                               
  useEffect(() => {                                                                                                                                                        
    return () => {                                                                                                                                                         
      if(audioUrl) URL.revokeObjectURL(audioUrl);                                                                                                                          
      setEncryptedData({ ciphertext: null, iv: null, key: null, mimeType: '' });                                                                                           
    };                                                                                                                                                                     
  }, []);                                                                                                                                                                  
                                                                                                                                                                           
  return (                                                                                                                                                                 
    <div className="audio-section">                                                                                                                                        
      <div className="controls">                                                                                                                                           
        <button                                                                                                                                                            
          onClick={toggleRecording}                                                                                                                                        
          className={`record-btn ${isRecording ? 'recording' : ''}`}                                                                                                       
        >                                                                                                                                                                  
          {isRecording ? '⏹ Stop Recording' : '⏺ Start Recording'}                                                                                                         
        </button>                                                                                                                                                          
                                                                                                                                                                           
        <button                                                                                                                                                            
          onClick={handlePlayback}                                                                                                                                         
          disabled={!encryptedData.ciphertext}                                                                                                                             
        >                                                                                                                                                                  
          {isPlaying ? '⏸ Pause' : '🔒 Play Secured Audio'}                                                                                                                
        </button>                                                                                                                                                          
                                                                                                                                                                           
        <button                                                                                                                                                            
          onClick={saveEncryptedAudio}                                                                                                                                     
          disabled={!encryptedData.ciphertext}                                                                                                                             
        >                                                                                                                                                                  
          💾 Save Audio                                                                                                                                                    
        </button>                                                                                                                                                          
                                                                                                                                                                           
        <button                                                                                                                                                            
          onClick={loadSavedFiles}                                                                                                                                         
        >                                                                                                                                                                  
          📂 Load Saved Files                                                                                                                                              
        </button>                                                                                                                                                          
                                                                                                                                                                           
        <select onChange={(e) => loadEncryptedAudio(e.target.value)}>                                                                                                      
          <option value="">Select a file to load</option>                                                                                                                  
          {savedFiles.map((fileKey) => (                                                                                                                                   
            <option key={fileKey} value={fileKey}>                                                                                                                         
              {fileKey}                                                                                                                                                    
            </option>                                                                                                                                                      
          ))}                                                                                                                                                              
        </select>                                                                                                                                                          
      </div>                                                                                                                                                               
                                                                                                                                                                           
      <div className="progress-bar">                                                                                                                                       
        <div                                                                                                                                                               
          className="progress-fill"                                                                                                                                        
          style={{ width: `${progress}%` }}                                                                                                                                
        />                                                                                                                                                                 
      </div>                                                                                                                                                               
                                                                                                                                                                           
      {audioUrl && (                                                                                                                                                       
        <audio                                                                                                                                                             
          ref={audioRef}                                                                                                                                                   
          src={audioUrl}                                                                                                                                                   
          onEnded={() => setIsPlaying(false)}                                                                                                                              
        />                                                                                                                                                                 
      )}                                                                                                                                                                   
                                                                                                                                                                           
      <div className="security-status">                                                                                                                                    
        {encryptedData.ciphertext ? (                                                                                                                                      
          <>                                                                                                                                                               
            <span className="encrypted-indicator">🔒 AES-256 Encrypted</span>                                                                                              
            <p className="crypto-details">                                                                                                                                 
              Key: {encryptedData.key ? "In Memory (Volatile)" : "Destroyed"}                                                                                              
            </p>                                                                                                                                                           
          </>                                                                                                                                                              
        ) : (                                                                                                                                                              
          <span className="unencrypted-warning">⚠️ No Secure Audio Loaded</span>                                                                                           
        )}                                                                                                                                                                 
      </div>

      {isSTTModelLoading && (                                                                                                                                                    
        <div className="model-loading">                                                                                                                                          
          <span>🔄 Loading Speech Recognition Model (first time only)...</span>                                                                                                  
          <progress max="1" value={modelLoadProgress} />                                                                                                                         
        </div>                                                                                                                                                                   
      )}                                                                                                                                                            
                                                                                                                                                                           
      <div className="transcription-box">                                                                                                                                  
        <h3>Transcription:</h3>                                                                                                                                            
        <p>{transcription || 'No transcription available'}</p>                                                                                                             
        <button                                                                                                                                                            
          onClick={handleTranscription}                                                                                                                                  
          className="transcribe-btn"
          disabled={!encryptedData.ciphertext || isTranscribing}                                                                                                                                    
        >                                                                                                                                                                  
          {isTranscribing ? '⏳ Processing...' : '🎤 Transcribe Audio'}                                                                                                                                                 
        </button>
        {transcriptionError && (                                                                                                                                                   
          <div className="error-message">                                                                                                                                          
            {transcriptionError}                                                                                                                                                   
          </div>                                                                                                                                                                   
      )}                                                                                                                                                          
      </div>                                                                                                                                                               
                                                                                                                                                                           
      {feedbackMessage && (                                                                                                                                                
        <div className="feedback-message">                                                                                                                                 
          {feedbackMessage}                                                                                                                                                
        </div>                                                                                                                                                             
      )}                                                                                                                                                                   
                                                                                                                                                                           
      <style jsx='true' >{`                                                                                                                                                        
        .audio-section {                                                                                                                                                   
          padding: 2rem;                                                                                                                                                   
          border: 1px solid #e0e0e0;                                                                                                                                       
          border-radius: 12px;                                                                                                                                             
          max-width: 800px;                                                                                                                                                
          margin: 2rem auto;                                                                                                                                               
        }                                                                                                                                                                  
                                                                                                                                                                           
        .controls {                                                                                                                                                        
          display: flex;                                                                                                                                                   
          gap: 1rem;                                                                                                                                                       
          margin-bottom: 1.5rem;                                                                                                                                           
          flex-wrap: wrap;                                                                                                                                                 
        }                                                                                                                                                                  
                                                                                                                                                                           
        button {                                                                                                                                                           
          padding: 0.8rem 1.5rem;                                                                                                                                          
          border: none;                                                                                                                                                    
          border-radius: 6px;                                                                                                                                              
          cursor: pointer;                                                                                                                                                 
          background: #1976d2;                                                                                                                                             
          color: white;                                                                                                                                                    
          font-weight: 500;                                                                                                                                                
          transition: all 0.2s ease;                                                                                                                                       
        }                                                                                                                                                                  
                                                                                                                                                                           
        button:disabled {                                                                                                                                                  
          background: #6c757d;                                                                                                                                             
          cursor: not-allowed;                                                                                                                                             
        }                                                                                                                                                                  
                                                                                                                                                                           
        button:hover:not(:disabled) {                                                                                                                                      
          background: #1565c0;                                                                                                                                             
          transform: translateY(-1px);                                                                                                                                     
        }                                                                                                                                                                  
                                                                                                                                                                           
        .record-btn.recording {                                                                                                                                            
          background: #d32f2f;                                                                                                                                             
          position: relative;                                                                                                                                              
        }                                                                                                                                                                  
                                                                                                                                                                           
        @keyframes pulse {                                                                                                                                                 
          0% { transform: scale(1); }                                                                                                                                      
          50% { transform: scale(1.05); }                                                                                                                                  
          100% { transform: scale(1); }                                                                                                                                    
        }                                                                                                                                                                  
                                                                                                                                                                           
        .record-btn.recording::after {                                                                                                                                     
          content: '';                                                                                                                                                     
          position: absolute;                                                                                                                                              
          top: -4px;                                                                                                                                                       
          left: -4px;                                                                                                                                                      
          right: -4px;                                                                                                                                                     
          bottom: -4px;                                                                                                                                                    
          border-radius: 8px;                                                                                                                                              
          border: 2px solid #d32f2f;                                                                                                                                       
          animation: pulse 1.5s infinite;                                                                                                                                  
        }
        
        .error-message {                                                                                                                                                           
          margin-top: 1rem;                                                                                                                                                        
          padding: 1rem;                                                                                                                                                           
          background: #f8d7da;                                                                                                                                                     
          border: 1px solid #f5c6cb;                                                                                                                                               
          border-radius: 8px;                                                                                                                                                      
          color: #721c24;                                                                                                                                                          
          font-weight: 500;                                                                                                                                                        
        }                                                                                                                                                                 
                                                                                                                                                                           
        .progress-bar {                                                                                                                                                    
          height: 8px;                                                                                                                                                     
          background: #f0f0f0;                                                                                                                                             
          border-radius: 4px;                                                                                                                                              
          margin: 1.5rem 0;                                                                                                                                                
          overflow: hidden;                                                                                                                                                
        }                                                                                                                                                                  
                                                                                                                                                                           
        .progress-fill {                                                                                                                                                   
          height: 100%;                                                                                                                                                    
          background: #4caf50;                                                                                                                                             
          transition: width 0.1s linear;                                                                                                                                   
        }                                                                                                                                                                  
                                                                                                                                                                           
        .security-status {                                                                                                                                                 
          margin-top: 1rem;                                                                                                                                                
          padding: 1rem;                                                                                                                                                   
          background: #f8f9fa;                                                                                                                                             
          border-radius: 8px;                                                                                                                                              
          border: 1px solid #eee;                                                                                                                                          
        }                                                                                                                                                                  
                                                                                                                                                                           
        .encrypted-indicator {                                                                                                                                             
          color: #28a745;                                                                                                                                                  
          font-weight: 500;                                                                                                                                                
        }                                                                                                                                                                  
                                                                                                                                                                           
        .unencrypted-warning {                                                                                                                                             
          color: #dc3545;                                                                                                                                                  
        }                                                                                                                                                                  
                                                                                                                                                                           
        .crypto-details {                                                                                                                                                  
          font-size: 0.8rem;                                                                                                                                               
          color: #6c757d;                                                                                                                                                  
          margin: 0.5rem 0 0;                                                                                                                                              
        }                                                                                                                                                                  
                                                                                                                                                                           
        .transcription-box {                                                                                                                                               
          margin-top: 2rem;                                                                                                                                                
          padding: 1.5rem;                                                                                                                                                 
          background: #f8f9fa;                                                                                                                                             
          border-radius: 8px;                                                                                                                                              
        }
        
        .model-loading {                                                                                                                                                           
          margin: 1.5rem 0;                                                                                                                                                        
          padding: 1rem;                                                                                                                                                           
          background: #e3f2fd;                                                                                                                                                     
          border: 1px solid #90caf9;                                                                                                                                               
          border-radius: 8px;                                                                                                                                                      
          color: #0d47a1;                                                                                                                                                          
        }                                                                                                                                                                          
                                                                                                                                                                            
        .model-loading progress {                                                                                                                                                  
          width: 100%;                                                                                                                                                             
          margin-top: 0.5rem;                                                                                                                                                      
          height: 6px;                                                                                                                                                             
          border-radius: 3px;                                                                                                                                                      
        }                                                                                                                                                                          
                                                                                                                                                                            
        .model-loading progress::-webkit-progress-value {                                                                                                                          
          background: #1976d2;                                                                                                                                                     
          border-radius: 3px;                                                                                                                                                      
        }                                                                                                                                                                          
                                                                                                                                                                                    
        .model-loading progress::-moz-progress-bar {                                                                                                                               
          background: #1976d2;                                                                                                                                                     
        }                                                                                                                                                                  
                                                                                                                                                                           
        .feedback-message {                                                                                                                                                
          margin-top: 1rem;                                                                                                                                                
          padding: 1rem;                                                                                                                                                   
          background: #e0f7fa;                                                                                                                                             
          border-radius: 8px;                                                                                                                                              
          color: #00796b;                                                                                                                                                  
          font-weight: 500;                                                                                                                                                
          text-align: center;                                                                                                                                              
        }                                                                                                                                                                  
      `}</style>                                                                                                                                                           
    </div>                                                                                                                                                                 
  );                                                                                                                                                                       
};                                                                                                                                                                         
                                                                                                                                                                           
export default AudioInputSection;