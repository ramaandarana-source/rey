import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { VideoMetadata } from '../types';
import { CopyIcon, CheckIcon, YouTubeIcon, FacebookIcon, TikTokIcon, InstagramIcon, ShoppingCartIcon, TagIcon } from './icons';

interface MetadataDisplayProps {
  metadata: VideoMetadata;
}

const CopyButton: React.FC<{ onCopy: () => void; isCopied: boolean; size?: 'sm' | 'md' }> = ({ onCopy, isCopied, size = 'sm' }) => {
    const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    return (
        <motion.button
            onClick={onCopy}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center justify-center p-1.5 border border-slate-600 rounded-md shadow-sm text-slate-300 bg-gray-800/70 hover:bg-gray-700/70 transition-colors action-glow glow-transition`}
        >
            <AnimatePresence mode="wait" initial={false}>
                {isCopied ? (
                    <motion.div
                        key="check"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="text-green-400"
                    >
                        <CheckIcon className={sizeClasses} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="copy"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                    >
                        <CopyIcon className={sizeClasses} />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
};


const MetadataRow: React.FC<{ icon: React.ReactNode; label: string; value: string; }> = ({ icon, label, value }) => {
    const [isCopied, setIsCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="relative group p-3 -m-3 rounded-lg hover:bg-slate-800/50 transition-colors">
            <p className="font-semibold text-cyan-400 flex items-center gap-2 mb-1">
                {icon}
                {label}
            </p>
            <p className="text-slate-200 break-words pl-6 pr-16">{value}</p>
            <div className="absolute top-1/2 right-3 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyButton onCopy={handleCopy} isCopied={isCopied} />
            </div>
        </div>
    );
};


export const MetadataDisplay: React.FC<MetadataDisplayProps> = ({ metadata }) => {
  const [isAllCopied, setIsAllCopied] = useState(false);
  const [isHashtagCopied, setIsHashtagCopied] = useState(false);

  const handleCopyAll = () => {
    const textToCopy = `
Judul YouTube: ${metadata.youtubeTitle}
Judul TikTok: ${metadata.tiktokTitle}
Judul Instagram: ${metadata.instagramTitle}
Judul Facebook: ${metadata.facebookTitle}
Judul Shopee Affiliate: ${metadata.shopeeAffiliateTitle}
Judul TikTok Affiliate: ${metadata.tiktokAffiliateTitle}

Hashtags:
${metadata.tags.map(t => `#${t.replace(/\s+/g, '')}`).join(' ')}
    `;
    navigator.clipboard.writeText(textToCopy.trim());
    setIsAllCopied(true);
    setTimeout(() => setIsAllCopied(false), 2000);
  };
  
  const handleCopyHashtags = () => {
    const hashtags = metadata.tags.map(t => `#${t.replace(/\s+/g, '')}`).join(' ');
    navigator.clipboard.writeText(hashtags);
    setIsHashtagCopied(true);
    setTimeout(() => setIsHashtagCopied(false), 2000);
  };
  

  return (
    <div className="mt-8 border-t border-cyan-500/20 pt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-200">Metadata yang Dihasilkan</h3>
        <CopyButton onCopy={handleCopyAll} isCopied={isAllCopied} size="md" />
      </div>
      <div className="space-y-2 text-sm font-mono bg-gray-900/70 p-4 rounded-lg border border-slate-800">
        <MetadataRow icon={<YouTubeIcon className="w-4 h-4" />} label="YouTube" value={metadata.youtubeTitle} />
        <MetadataRow icon={<TikTokIcon className="w-4 h-4" />} label="TikTok" value={metadata.tiktokTitle} />
        <MetadataRow icon={<InstagramIcon className="w-4 h-4" />} label="Instagram" value={metadata.instagramTitle} />
        <MetadataRow icon={<FacebookIcon className="w-4 h-4" />} label="Facebook" value={metadata.facebookTitle} />
        <MetadataRow icon={<ShoppingCartIcon className="w-4 h-4" />} label="Shopee Affiliate" value={metadata.shopeeAffiliateTitle} />
        <MetadataRow icon={<TagIcon className="w-4 h-4" />} label="TikTok Affiliate" value={metadata.tiktokAffiliateTitle} />
        
        <div className="pt-2">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-cyan-400 mb-2">Tag Relevan:</p>
            <CopyButton onCopy={handleCopyHashtags} isCopied={isHashtagCopied} />
          </div>
          <div className="flex flex-wrap gap-2">
            {metadata.tags.map((tag, index) => (
              <span key={index} className="bg-cyan-900/50 text-cyan-300 text-xs font-medium px-2.5 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};