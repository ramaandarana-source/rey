import React from 'react';

interface VideoPlayerProps {
  src: string;
}

export const VideoPlayer = React.forwardRef<HTMLVideoElement, VideoPlayerProps>(({ src }, ref) => {
  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl shadow-black/50">
      <video
        ref={ref}
        src={src}
        controls
        loop
        playsInline
        className="w-full h-full"
        crossOrigin="anonymous"
      />
    </div>
  );
});