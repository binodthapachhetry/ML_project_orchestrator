import { useState, useRef, useEffect } from 'react';                                                                                                                       
                                                                                                                                                                            
 const AudioInputSection = () => {                                                                                                                                          
   // State management                                                                                                                                                      
   const [isRecording, setIsRecording] = useState(false);                                                                                                                   
   const [audioUrl, setAudioUrl] = useState('');                                                                                                                            
   const [audioBlob, setAudioBlob] = useState(null);                                                                                                                        
   const [isPlaying, setIsPlaying] = useState(false);                                                                                                                       
   const [transcription, setTranscription] = useState('');                                                                                                                  
   const [progress, setProgress] = useState(0);                                                                                                                             
                                                                                                                                                                            
   // Refs for audio elements                                                                                                                                               
   const mediaRecorder = useRef(null);                                                                                                                                      
   const audioRef = useRef(null);                                                                                                                                           
   const chunks = useRef([]);                                                                                                                                               
                                                                                                                                                                            
   // Handle audio recording                                                                                                                                                
   const toggleRecording = async () => {                                                                                                                                    
     if (!isRecording) {                                                                                                                                                    
       try {                                                                                                                                                                
         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });                                                                                         
         mediaRecorder.current = new MediaRecorder(stream);                                                                                                                 
                                                                                                                                                                            
         mediaRecorder.current.ondataavailable = (e) => {                                                                                                                   
           chunks.current.push(e.data);                                                                                                                                     
         };                                                                                                                                                                 
                                                                                                                                                                            
         mediaRecorder.current.onstop = () => {                                                                                                                             
           const blob = new Blob(chunks.current, { type: 'audio/wav' });                                                                                                    
           const url = URL.createObjectURL(blob);                                                                                                                           
           setAudioUrl(url);                                                                                                                                                
           setAudioBlob(blob);                                                                                                                                              
           chunks.current = [];                                                                                                                                             
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
                                                                                                                                                                            
   // Playback controls                                                                                                                                                     
   const togglePlayback = () => {                                                                                                                                           
     if (audioRef.current.paused) {                                                                                                                                         
       audioRef.current.play();                                                                                                                                             
       setIsPlaying(true);                                                                                                                                                  
     } else {                                                                                                                                                               
       audioRef.current.pause();                                                                                                                                            
       setIsPlaying(false);                                                                                                                                                 
     }                                                                                                                                                                      
   };                                                                                                                                                                       
                                                                                                                                                                            
   // Simulated transcription (replace with actual STT implementation)                                                                                                      
   const simulateTranscription = () => {                                                                                                                                    
     const fakeTranscript = "This is a simulated transcription. Replace with real speech-to-text results.";                                                                 
     setTranscription(fakeTranscript);                                                                                                                                      
   };                                                                                                                                                                       
                                                                                                                                                                            
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
           onClick={togglePlayback}                                                                                                                                         
           disabled={!audioUrl}                                                                                                                                             
         >                                                                                                                                                                  
           {isPlaying ? '⏸ Pause' : '▶ Play'}                                                                                                                               
         </button>                                                                                                                                                          
                                                                                                                                                                            
         <input                                                                                                                                                             
           type="file"                                                                                                                                                      
           accept="audio/*"                                                                                                                                                 
           onChange={(e) => {                                                                                                                                               
             const file = e.target.files[0];                                                                                                                                
             setAudioUrl(URL.createObjectURL(file));                                                                                                                        
           }}                                                                                                                                                               
         />                                                                                                                                                                 
       </div>                                                                                                                                                               
                                                                                                                                                                            
       {/* Audio visualization */}                                                                                                                                          
       <div className="progress-bar">                                                                                                                                       
         <div                                                                                                                                                               
           className="progress-fill"                                                                                                                                        
           style={{ width: `${progress}%` }}                                                                                                                                
         />                                                                                                                                                                 
       </div>                                                                                                                                                               
                                                                                                                                                                            
       {/* Audio element */}                                                                                                                                                
       {audioUrl && (                                                                                                                                                       
         <audio                                                                                                                                                             
           ref={audioRef}                                                                                                                                                   
           src={audioUrl}                                                                                                                                                   
           onEnded={() => setIsPlaying(false)}                                                                                                                              
         />                                                                                                                                                                 
       )}                                                                                                                                                                   
                                                                                                                                                                            
       {/* Transcription display */}                                                                                                                                        
       <div className="transcription-box">                                                                                                                                  
         <h3>Transcription:</h3>                                                                                                                                            
         <p>{transcription || 'No transcription available'}</p>                                                                                                             
         <button                                                                                                                                                            
           onClick={simulateTranscription}                                                                                                                                  
           className="transcribe-btn"                                                                                                                                       
         >                                                                                                                                                                  
           Transcribe Audio                                                                                                                                                 
         </button>                                                                                                                                                          
       </div>                                                                                                                                                               
                                                                                                                                                                            
       <style jsx>{`                                                                                                                                                        
         .audio-section {                                                                                                                                                   
           padding: 2rem;                                                                                                                                                   
           border: 1px solid #ccc;                                                                                                                                          
           border-radius: 8px;                                                                                                                                              
           max-width: 600px;                                                                                                                                                
           margin: 2rem auto;                                                                                                                                               
         }                                                                                                                                                                  
                                                                                                                                                                            
         .controls {                                                                                                                                                        
           display: flex;                                                                                                                                                   
           gap: 1rem;                                                                                                                                                       
           margin-bottom: 1rem;                                                                                                                                             
           flex-wrap: wrap;                                                                                                                                                 
         }                                                                                                                                                                  
                                                                                                                                                                            
         button {                                                                                                                                                           
           padding: 0.5rem 1rem;                                                                                                                                            
           border: none;                                                                                                                                                    
           border-radius: 4px;                                                                                                                                              
           cursor: pointer;                                                                                                                                                 
           background: #007bff;                                                                                                                                             
           color: white;                                                                                                                                                    
           transition: opacity 0.2s;                                                                                                                                        
         }                                                                                                                                                                  
                                                                                                                                                                            
         button:disabled {                                                                                                                                                  
           background: #6c757d;                                                                                                                                             
           cursor: not-allowed;                                                                                                                                             
         }                                                                                                                                                                  
                                                                                                                                                                            
         button:hover:not(:disabled) {                                                                                                                                      
           opacity: 0.9;                                                                                                                                                    
         }                                                                                                                                                                  
                                                                                                                                                                            
         .record-btn.recording {                                                                                                                                            
           background: #dc3545;                                                                                                                                             
           animation: pulse 1.5s infinite;                                                                                                                                  
         }                                                                                                                                                                  
                                                                                                                                                                            
         .progress-bar {                                                                                                                                                    
           height: 8px;                                                                                                                                                     
           background: #e9ecef;                                                                                                                                             
           border-radius: 4px;                                                                                                                                              
           margin: 1rem 0;                                                                                                                                                  
         }                                                                                                                                                                  
                                                                                                                                                                            
         .progress-fill {                                                                                                                                                   
           height: 100%;                                                                                                                                                    
           background: #28a745;                                                                                                                                             
           border-radius: 4px;                                                                                                                                              
           transition: width 0.1s linear;                                                                                                                                   
         }                                                                                                                                                                  
                                                                                                                                                                            
         .transcription-box {                                                                                                                                               
           margin-top: 2rem;                                                                                                                                                
           padding: 1rem;                                                                                                                                                   
           background: #f8f9fa;                                                                                                                                             
           border-radius: 4px;                                                                                                                                              
         }                                                                                                                                                                  
                                                                                                                                                                            
         @keyframes pulse {                                                                                                                                                 
           0% { opacity: 1; }                                                                                                                                               
           50% { opacity: 0.7; }                                                                                                                                            
           100% { opacity: 1; }                                                                                                                                             
         }                                                                                                                                                                  
       `}</style>                                                                                                                                                           
     </div>                                                                                                                                                                 
   );                                                                                                                                                                       
 };                                                                                                                                                                         
                                                                                                                                                                            
 export default AudioInputSection; 