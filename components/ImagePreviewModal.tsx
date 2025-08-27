import React from 'react';
import { motion } from 'framer-motion';
import { XIcon } from './icons';

interface ImagePreviewModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageUrl, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl max-h-[90vh] rounded-lg overflow-hidden shadow-2xl"
      >
        <img src={imageUrl} alt="Pratinjau Gambar" className="w-auto h-auto max-w-full max-h-[90vh] object-contain" />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-black/50 p-2 rounded-full text-white hover:bg-white/20 transition-colors"
          aria-label="Tutup Pratinjau"
        >
          <XIcon className="w-6 h-6" />
        </button>
      </motion.div>
    </motion.div>
  );
};