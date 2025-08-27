import React from 'react';
import { motion, Variants } from 'framer-motion';
import { GearIcon } from './icons';

interface HeaderTitleProps {
  isVisible: boolean;
  isGenerating: boolean;
  onOpenSettings: () => void;
}

const containerVariants: Variants = {
    visible: {
        opacity: 1,
        height: 'auto',
        marginBottom: '1rem',
        transition: { type: 'spring', duration: 0.5, bounce: 0 }
    },
    hidden: {
        opacity: 0,
        height: 0,
        marginBottom: '0rem',
        transition: { type: 'spring', duration: 0.5, bounce: 0 }
    }
};

export const HeaderTitle: React.FC<HeaderTitleProps> = ({ isVisible, isGenerating, onOpenSettings }) => {
  const text = "RYAD TOOLS";
  
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Gagal mengaktifkan mode layar penuh: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <motion.div
        variants={containerVariants}
        initial="visible"
        animate={isVisible ? 'visible' : 'hidden'}
        className="overflow-visible relative" 
    >
      <div className="flex items-center justify-center gap-3">
        <motion.button 
          onClick={onOpenSettings}
          whileTap={{ scale: 0.9 }}
          className="cursor-pointer"
          aria-label="Buka Pengaturan"
        >
          <GearIcon className={`w-8 h-8 text-slate-100 ${isGenerating ? 'animate-spin-slow' : ''}`} />
        </motion.button>
        <div className="glitch-wrapper cursor-pointer" onClick={handleToggleFullscreen} title="Toggle Fullscreen">
          <h1
            className="glitch font-mono text-3xl sm:text-4xl font-bold tracking-wider"
            data-text={text}
          >
            {text}
          </h1>
        </div>
      </div>
    </motion.div>
  );
};