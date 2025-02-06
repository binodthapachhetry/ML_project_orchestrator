import { useState, useRef, useEffect } from 'react';

const AudioInputSection = () => {
  // State management
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [progress, setProgress] = useState(0);
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
      alert("No encrypted audio to save.");
      return;
    }
  
    const db = await indexedDB.open("AudioStorage", 1, (upgradeDB) => {
      if (!upgradeDB.objectStoreNames.contains("encryptedAudio")) {
        upgradeDB.createObjectStore("encryptedAudio");
      }
    });
  
    const tx = db.transaction("encryptedAudio", "readwrite");
    const store = tx.objectStore("encryptedAudio");
  
    store.put(encryptedData, "latest");
    alert("Audio saved securely!");
  };

  const loadEncryptedAudio = async () => {
    const db = await indexedDB.open("AudioStorage", 1);
    const tx = db.transaction("encryptedAudio", "readonly");
    const store = tx.objectStore("encryptedAudio");
  
    const storedData = await store.get("latest");
    if (storedData) {
      setEncryptedData(storedData);
      alert("Encrypted audio loaded.");
    } else {
      alert("No saved encrypted audio found.");
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

  // Simulated transcription
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
          onClick={loadEncryptedAudio}
        >
          📂 Load Audio
        </button>
        
        <input
          type="file"
          accept="audio/*"
          onChange={async (e) => {
            const file = e.target.files[0];
            try {
              const encrypted = await encryptAudio(file);
              setEncryptedData(encrypted);
            } catch (error) {
              console.error("File encryption failed:", error);
            }
          }}
        />
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
      `}</style>
    </div>
  );
};

export default AudioInputSection;
