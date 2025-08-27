import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface LoaderProps {
  message: string;
}

const fakeLogs = [
  "Initializing VEO model...",
  "Authenticating API key...",
  "Parsing prompt structure...",
  "Allocating GPU resources...",
  "Analyzing cinematic keywords...",
  "Setting up rendering pipeline...",
  "Generating initial noise seed...",
  "Frame 1/120: Denoising pass...",
  "Frame 15/120: Motion vector calculation...",
  "Frame 30/120: Applying style guidance...",
  "Frame 60/120: Halfway there, rendering textures...",
  "Frame 90/120: Upscaling resolution...",
  "Frame 115/120: Finalizing lighting...",
  "Compiling frames into video...",
  "Encoding to MP4 format...",
  "Synthesizing audio track...",
  "Muxing audio and video streams...",
  "Final checks and cleanup...",
  "Video generation complete.",
];

export const Loader: React.FC<LoaderProps> = ({ message }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [logLines, setLogLines] = useState<string[]>(['>>> Starting generation process...']);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  useEffect(() => {
    let logIndex = 0;
    const logInterval = setInterval(() => {
      setLogLines(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${fakeLogs[logIndex]}`]);
      logIndex = (logIndex + 1) % fakeLogs.length; // Loop through logs
    }, 2500); // Add a new log every 2.5 seconds

    return () => clearInterval(logInterval);
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logLines]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  };

  return (
    <motion.div 
      className="flex flex-col items-start justify-center w-full max-w-lg font-mono"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-slate-900/70 border border-cyan-500/20 rounded-xl panel-glow p-4 w-full">
        <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-2">
            <p className="text-sm text-cyan-400">{message || "Generating video..."}</p>
            <p className="text-sm text-slate-400">Elapsed: {formatTime(elapsedTime)}</p>
        </div>
        <div 
          ref={logContainerRef}
          className="w-full h-48 bg-black/50 rounded-md p-2 overflow-y-auto text-xs text-green-400"
        >
          {logLines.map((line, index) => (
            <p key={index} className="whitespace-pre-wrap break-words">{line}</p>
          ))}
          <div className="flex items-center gap-1">
            <span>&gt;</span>
            <span className="w-2 h-4 bg-green-400 animate-pulse"></span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};