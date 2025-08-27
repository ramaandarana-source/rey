import React from 'react';
import { motion } from 'framer-motion';

export const ApiKeyExhaustedAnimation: React.FC = () => (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateX: -90 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className="text-center font-mono"
    >
      <p className="text-5xl font-bold text-red-500 animate-pulse" style={{ textShadow: '0 0 10px rgba(239, 68, 68, 0.7)' }}>
        ERROR
      </p>
      <p className="text-slate-400 mt-2 text-sm">Kunci API tidak valid, hilang, atau melebihi kuota.</p>
       <p className="text-xs text-slate-500 mt-1">Silakan periksa pengaturan Anda.</p>
    </motion.div>
);