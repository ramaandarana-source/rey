import React from 'react';
import { motion } from 'framer-motion';
import JSZip from 'jszip';
import type { VideoResult, VideoMetadata } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { MetadataDisplay } from './MetadataDisplay';
import { DownloadIcon, CaptureFrameIcon, ZipIcon } from './icons';

interface VideoResultDisplayProps {
  result: VideoResult;
  metadata: VideoMetadata;
  onReferenceImageChange: (file: File | null) => void;
}

// Function to sanitize string for use as a filename
const sanitizeFilename = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};


export const VideoResultDisplay = React.forwardRef<HTMLVideoElement, VideoResultDisplayProps>(({ result, metadata, onReferenceImageChange }, ref) => {

  const downloadFilename = metadata.youtubeTitle 
    ? `${sanitizeFilename(metadata.youtubeTitle)}` 
    : 'video-ryad-tools';

  const handleCaptureFrame = () => {
    const video = (ref as React.RefObject<HTMLVideoElement>)?.current;
    if (!video) return;
    
    const capture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'last-frame.png', { type: 'image/png' });
            onReferenceImageChange(file);
          }
        }, 'image/png');
        // The listener is { once: true }, so it removes itself automatically.
    };
    
    video.addEventListener('seeked', capture, { once: true });
    video.currentTime = video.duration;
  };

  const handleDownloadZip = async () => {
    if (!result.blob) return; // Guard clause if blob is not available
    const zip = new JSZip();
    zip.file(`${downloadFilename}.mp4`, result.blob);

    const metadataText = `
Judul YouTube: ${metadata.youtubeTitle}
Judul TikTok: ${metadata.tiktokTitle}
Judul Instagram: ${metadata.instagramTitle}
Judul Facebook: ${metadata.facebookTitle}
Judul Shopee Affiliate: ${metadata.shopeeAffiliateTitle}
Judul TikTok Affiliate: ${metadata.tiktokAffiliateTitle}
Tags: ${metadata.tags.join(', ')}
    `;
    zip.file('metadata.txt', metadataText.trim());

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${downloadFilename}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      className="w-full"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <VideoPlayer ref={ref} src={result.url} />
      
      <div className="mt-6 flex justify-center items-center gap-6">
        <motion.a
          href={result.url}
          download={`${downloadFilename}.mp4`}
          className="flex items-center justify-center w-14 h-14 bg-slate-800/80 border border-slate-700/50 rounded-full text-slate-300 hover:bg-cyan-500/80 hover:border-cyan-500 hover:text-white transition-all group"
          title="Unduh Video (.mp4)"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <DownloadIcon className="w-6 h-6" />
        </motion.a>

        {result.blob && (
            <motion.button
              onClick={handleDownloadZip}
              className="flex items-center justify-center w-14 h-14 bg-slate-800/80 border border-slate-700/50 rounded-full text-slate-300 hover:bg-cyan-500/80 hover:border-cyan-500 hover:text-white transition-all group"
              title="Unduh Video & Metadata (.zip)"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ZipIcon className="w-6 h-6" />
            </motion.button>
        )}

        <motion.button
          onClick={handleCaptureFrame}
          className="flex items-center justify-center w-14 h-14 bg-slate-800/80 border border-slate-700/50 rounded-full text-slate-300 hover:bg-cyan-500/80 hover:border-cyan-500 hover:text-white transition-all group"
          title="Ambil Frame Terakhir sebagai Gambar Referensi"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <CaptureFrameIcon className="w-6 h-6" />
        </motion.button>
      </div>

      <MetadataDisplay metadata={metadata} />
    </motion.div>
  );
});