import { useState, useRef, useCallback, useEffect } from 'react';                                                                                      
 import Webcam from 'react-webcam';                                                                                                                     
                                                                                                                                                        
 type VideoConstraints = {                                                                                                                              
   facingMode: string;                                                                                                                                  
   width: number;                                                                                                                                       
   height: number;                                                                                                                                      
 };                                                                                                                                                     
                                                                                                                                                        
 const CameraFeed = () => {                                                                                                                             
   const [isWebcamOn, setIsWebcamOn] = useState<boolean>(false);                                                                                        
   const webcamRef = useRef<Webcam>(null);                                                                                                              
   const canvasRef = useRef<HTMLCanvasElement>(null);                                                                                                   
   const animationFrameRef = useRef<number>(0);                                                                                                         
                                                                                                                                                        
   const [videoConstraints] = useState<MediaTrackConstraints>({                                                                                         
     facingMode: 'user',                                                                                                                                
     width: 640,                                                                                                                                        
     height: 480                                                                                                                                        
   });                                                                                                                                                  
                                                                                                                                                        
   const toggleWebcam = useCallback(() => {                                                                                                             
     setIsWebcamOn(prev => !prev);                                                                                                                      
   }, []);                                                                                                                                              
                                                                                                                                                        
   // Frame processing with proper typing                                                                                                               
   useEffect(() => {                                                                                                                                    
     const processFrame = () => {                                                                                                                       
       const video = webcamRef.current?.video;                                                                                                          
       const canvas = canvasRef.current;                                                                                                                
                                                                                                                                                        
       if (video && canvas) {                                                                                                                           
         const ctx = canvas.getContext('2d');                                                                                                           
         if (!ctx) return;                                                                                                                              
                                                                                                                                                        
         ctx.drawImage(video, 0, 0, canvas.width, canvas.height);                                                                                       
         const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);                                                                         
         analyzePosture(imageData); // Implementation shown next                                                                                        
       }                                                                                                                                                
       animationFrameRef.current = requestAnimationFrame(processFrame);                                                                                 
     };                                                                                                                                                 
                                                                                                                                                        
     if (isWebcamOn) {                                                                                                                                  
       processFrame();                                                                                                                                  
     }                                                                                                                                                  
                                                                                                                                                        
     return () => cancelAnimationFrame(animationFrameRef.current);                                                                                      
   }, [isWebcamOn]);                                                                                                                                    
                                                                                                                                                        
   return (                                                                                                                                             
     <div className="camera-feed">                                                                                                                      
       <canvas ref={canvasRef} width={640} height={480} hidden />                                                                                       
       {/* Rest of component remains same but with TypeScript types */}                                                                                 
     </div>                                                                                                                                             
   );                                                                                                                                                   
 };                                                                                                                                                     
                                                                                                                                                        
 interface PostureAnalysisResult {                                                                                                                      
   slouchLevel: number;                                                                                                                                 
   shoulderAlignment: number;                                                                                                                           
   criticalPoints: Array<[number, number]>;                                                                                                             
 }                                                                                                                                                      
                                                                                                                                                        
 // Example typed analysis function                                                                                                                     
 const analyzePosture = (frame: ImageData): PostureAnalysisResult => {                                                                                  
   // Implementation would use your pose estimation model                                                                                               
   return {                                                                                                                                             
     slouchLevel: 0,                                                                                                                                    
     shoulderAlignment: 0,                                                                                                                              
     criticalPoints: []                                                                                                                                 
   };                                                                                                                                                   
 };                                                                                                                                                     