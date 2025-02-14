import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';

const CameraFeed = () => {
  const [isWebcamOn, setIsWebcamOn] = useState(false);
  const webcamRef = useRef(null);
  const [videoConstraints] = useState({
    facingMode: 'user',
    width: 640,
    height: 480
  });

  const toggleWebcam = useCallback(() => {
    setIsWebcamOn(!isWebcamOn);
  }, [isWebcamOn]);

  return (
    <div className="camera-feed">
      <div className="video-container">
        {isWebcamOn ? (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            mirrored
            className="video-feed"
          />
        ) : (
          <div className="video-placeholder">
            Camera is off
          </div>
        )}
      </div>
      
      <button 
        onClick={toggleWebcam}
        className="webcam-toggle"
      >
        {isWebcamOn ? 'Stop Camera' : 'Start Camera'}
      </button>
    </div>
  );
};

export default CameraFeed;
