import React from 'react';
import { motion } from 'framer-motion';
import JSZip from 'jszip';
import type { AutoGenResultItem } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { DownloadIcon, ZipIcon } from './icons';

const sanitizeFilename = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const ResultCard: React.FC<{ item: AutoGenResultItem, index: number }> = ({ item, index }) => {
  const downloadFilename = sanitizeFilename(item.metadata.youtubeTitle || `video-${item.id.substring(0, 8)}`);

  const handleDownloadZip = async () => {
    if (!item.result.blob) return;
    const zip = new JSZip();
    zip.file(`${downloadFilename}.mp4`, item.result.blob);

    const metadata = item.metadata;
    const metadataText = `
Judul YouTube: ${metadata.youtubeTitle}
Judul TikTok: ${metadata.tiktokTitle}
Judul Instagram: ${metadata.instagramTitle}
Judul Facebook: ${metadata.facebookTitle}
Judul Shopee Affiliate: ${metadata.shopeeAffiliateTitle}
Judul TikTok Affiliate: ${metadata.tiktokAffiliateTitle}
Tags: ${metadata.tags.join(', ')}
    `.trim();
    zip.file('metadata.txt', metadataText);

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
      className="bg-gray-900/50 backdrop-blur-md border border-cyan-500/20 rounded-xl panel-glow p-4 flex flex-col gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <VideoPlayer src={item.result.url} />
      <div className="flex-grow">
        <p className="text-xs text-slate-500 mb-1">Prompt:</p>
        <p className="text-sm text-slate-300 line-clamp-3 h-14">{item.prompt}</p>
      </div>
      <div className="flex-shrink-0 flex items-center justify-center gap-4 mt-2">
        <motion.a
          href={item.result.url}
          download={`${downloadFilename}.mp4`}
          className="flex items-center justify-center w-12 h-12 bg-slate-800/80 border border-slate-700/50 rounded-full text-slate-300 hover:bg-cyan-500/80 hover:border-cyan-500 hover:text-white transition-all group"
          title="Unduh Video (.mp4)"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <DownloadIcon className="w-5 h-5" />
        </motion.a>
        <motion.button
          onClick={handleDownloadZip}
          className="flex items-center justify-center w-12 h-12 bg-slate-800/80 border border-slate-700/50 rounded-full text-slate-300 hover:bg-cyan-500/80 hover:border-cyan-500 hover:text-white transition-all group"
          title="Unduh Video & Metadata (.zip)"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ZipIcon className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export const AutoGenResultGrid: React.FC<{ results: AutoGenResultItem[] }> = ({ results }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-center text-slate-200 border-b border-cyan-500/20 pb-4">
        Galeri Hasil Auto-Generate
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((item, index) => (
          <ResultCard key={item.id} item={item} index={index} />
        ))}
      </div>
    </div>
  );
};
