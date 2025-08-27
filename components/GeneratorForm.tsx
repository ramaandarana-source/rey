import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import type { GenerationOptions, AspectRatio, Resolution } from '../types';
import { UploadIcon, XIcon, AspectRatioWideIcon, AspectRatioTallIcon, SoundOnIcon, SoundOffIcon, DownloadIcon, TrashIcon } from './icons';
import { PromptInput } from './PromptInput';

interface GeneratorFormProps {
  onGenerate: (options: GenerationOptions) => void;
  disabled: boolean;
  prompt: string;
  onPromptChange: (newPrompt: string) => void;
  image: File | null;
  imagePreview: string | null;
  onImageChange: (file: File | null) => void;
  onSelectForPreview: (url: string) => void;
  promptHistory: string[];
  onSelectFromHistory: (prompt: string) => void;
  onDeleteHistoryItem: (index: number) => void;
  onClearHistory: () => void;
  isAutoGenerating: boolean;
  onFocusAutoGenerator?: () => void;
}

const ActionButton: React.FC<React.ComponentProps<typeof motion.button>> = ({ children, className, ...props }) => (
    <motion.button
        className={`relative w-full inline-flex justify-center items-center px-4 py-3 border-2 border-transparent text-slate-100 text-base font-bold rounded-lg shadow-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group action-glow glow-transition ${className}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...props}
    >
        {children as React.ReactNode}
    </motion.button>
);

// FIX: Update ToggleButton to accept rest props and add aria-pressed for accessibility and DOM querying.
const ToggleButton = ({ active, onClick, children, disabled, ...rest }: { active: boolean, onClick: () => void, children: React.ReactNode, disabled: boolean } & React.ComponentProps<typeof motion.button>) => (
    <motion.button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={active}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-md transition-colors bg-transparent disabled:opacity-50 glow-transition ${active ? 'border-cyan-500 text-cyan-300 bg-cyan-500/10 active-glow' : 'border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500'}`}
        {...rest}
    >
        {children}
    </motion.button>
);

const PromptHistoryPopup: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    history: string[];
    onSelect: (prompt: string) => void;
    onDelete: (index: number) => void;
    onClear: () => void;
    disabled: boolean;
}> = ({ isOpen, onClose, history, onSelect, onDelete, onClear, disabled }) => {
    
    const handleSelect = (prompt: string) => {
        onSelect(prompt);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 20, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-slate-900 border border-cyan-500/20 rounded-xl panel-glow w-full max-w-2xl max-h-[80vh] flex flex-col p-6"
                    >
                        <div className="flex justify-between items-center mb-4 flex-shrink-0">
                            <h3 className="text-xl font-semibold text-slate-200">Riwayat Prompt</h3>
                            <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-200" aria-label="Tutup"><XIcon className="w-6 h-6" /></button>
                        </div>

                        {history.length === 0 ? (
                            <div className="flex-grow flex items-center justify-center text-slate-500">
                                <p>Tidak ada riwayat prompt.</p>
                            </div>
                        ) : (
                            <div className="flex-grow overflow-y-auto -mr-2 pr-2 space-y-2">
                                {history.map((item, index) => (
                                    <div key={index} className="group flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50">
                                        <button type="button" onClick={() => handleSelect(item)} disabled={disabled} className="text-left text-base text-slate-300 truncate flex-1 disabled:cursor-not-allowed">
                                            {item}
                                        </button>
                                        <button type="button" onClick={() => onDelete(index)} disabled={disabled} className="ml-4 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed flex-shrink-0">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {history.length > 0 && (
                            <div className="flex-shrink-0 pt-4 mt-auto border-t border-slate-800">
                                <button type="button" onClick={onClear} disabled={disabled} className="w-full sm:w-auto flex items-center justify-center gap-2 text-red-400 bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 px-4 py-3 rounded-lg disabled:opacity-50 transition-colors">
                                    <TrashIcon className="w-5 h-5" /> Hapus Semua Riwayat
                                </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export const GeneratorForm: React.FC<GeneratorFormProps> = ({ 
    onGenerate, 
    disabled, 
    prompt, 
    onPromptChange,
    image,
    imagePreview,
    onImageChange,
    onSelectForPreview,
    promptHistory,
    onSelectFromHistory,
    onDeleteHistoryItem,
    onClearHistory,
    isAutoGenerating,
    onFocusAutoGenerator,
}) => {
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [sound, setSound] = useState(true);
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  
  const [isDragging, setIsDragging] = useState(false);
  
  const formDisabled = disabled || isAutoGenerating;

  const processFile = useCallback((file: File | null) => {
    const MAX_FILE_SIZE_MB = 4;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

    if (file && file.type.startsWith('image/')) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
            Swal.fire({
                icon: 'error',
                title: 'Ukuran Gambar Terlalu Besar',
                text: `Ukuran gambar tidak boleh melebihi ${MAX_FILE_SIZE_MB}MB. Harap kompres atau pilih gambar yang lebih kecil.`,
            });
            return;
        }
        onImageChange(file);
    } else if (file === null) {
        onImageChange(null);
    }
  }, [onImageChange]);

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (formDisabled || image) return;
      
      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toUpperCase();
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || (activeEl instanceof HTMLElement && activeEl.isContentEditable)) {
          return;
        }
      }

      const file = Array.from(e.clipboardData?.items ?? []).find(item => item.type.startsWith('image/'))?.getAsFile();
      if (file) {
        e.preventDefault();
        processFile(file);
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, [formDisabled, image, processFile]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.currentTarget.files?.[0] ?? null);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!formDisabled) {
          setIsDragging(true);
      }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (formDisabled) return;

      const file = e.dataTransfer.files?.[0] ?? null;
      processFile(file);
  };

  const removeImage = () => {
    onImageChange(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const handleGenerate = () => {
    if (prompt.trim()) {
      onGenerate({ prompt, image: image ?? undefined, aspectRatio, sound, resolution });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGenerate();
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
         <PromptInput 
            value={prompt}
            onChange={onPromptChange}
            placeholder="Sebuah sinematik shot dari astronot..."
            disabled={formDisabled}
            heightClassName="h-52"
            onSend={handleGenerate}
            isSending={disabled} // Only reflects manual generation loading
            onToggleHistory={() => setIsHistoryVisible(true)}
            onFocusAutoGenerator={onFocusAutoGenerator}
         />
        
      {/* Reference Image */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Gambar Referensi (Opsional)</label>
        {imagePreview ? (
            <div 
                className="relative group overflow-hidden rounded-lg border border-slate-700 cursor-pointer"
                onClick={() => onSelectForPreview(imagePreview)}
            >
                <img src={imagePreview} alt="Image preview" className="w-full h-48 object-cover" />
                <div className="scanline-overlay" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 p-2 z-10">
                    <motion.a
                        href={imagePreview}
                        download="reference-image.png"
                        whileTap={{ scale: 0.9 }}
                        className="p-3 bg-slate-800/80 rounded-full text-white hover:bg-cyan-500 transition-colors inline-flex items-center justify-center"
                        aria-label="Unduh Gambar"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <DownloadIcon className="w-6 h-6" />
                    </motion.a>
                    <motion.button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            removeImage();
                        }}
                        disabled={formDisabled}
                        whileTap={{ scale: 0.9 }}
                        className="p-3 bg-slate-800/80 rounded-full text-white hover:bg-red-500 transition-colors"
                        aria-label="Hapus Gambar"
                    >
                        <XIcon className="w-6 h-6" />
                    </motion.button>
                </div>
            </div>
        ) : (
            <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex justify-center items-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-all group focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDragging ? 'border-cyan-500 bg-cyan-900/20' : 'border-slate-700 bg-gray-900/50 hover:border-cyan-500 hover:bg-cyan-900/20'}`}
                tabIndex={0}
            >
                <input type="file" accept="image/*" onChange={handleImageChange} ref={fileInputRef} className="hidden" disabled={formDisabled} />
                <div className="text-center text-slate-500">
                    <UploadIcon className="w-8 h-8 mx-auto text-slate-600 group-hover:text-cyan-400 transition-colors duration-300 group-hover:animate-pulse" />
                    <p className="mt-2 text-sm">Seret & Lepas, Pilih, atau Tempel Gambar</p>
                </div>
            </div>
        )}
      </div>

      {/* Settings */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Aspek Rasio</label>
          <div className="flex gap-2">
            <ToggleButton active={aspectRatio === '16:9'} onClick={() => setAspectRatio('16:9')} disabled={formDisabled} data-option-type="aspectRatio" data-option-value="16:9">
                <AspectRatioWideIcon className="w-5 h-5"/> 16:9
            </ToggleButton>
            <ToggleButton active={aspectRatio === '9:16'} onClick={() => setAspectRatio('9:16')} disabled={formDisabled} data-option-type="aspectRatio" data-option-value="9:16">
                <AspectRatioTallIcon className="w-5 h-5"/> 9:16
            </ToggleButton>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Resolusi</label>
          <div className="flex gap-2">
            <ToggleButton active={resolution === '1080p'} onClick={() => setResolution('1080p')} disabled={formDisabled} data-option-type="resolution" data-option-value="1080p">1080p</ToggleButton>
            <ToggleButton active={resolution === '720p'} onClick={() => setResolution('720p')} disabled={formDisabled} data-option-type="resolution" data-option-value="720p">720p</ToggleButton>
          </div>
        </div>
      </div>
      
      <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="text-sm font-medium text-slate-300">Suara</label>
            <motion.button
                type="button"
                onClick={() => setSound(!sound)}
                disabled={formDisabled}
                aria-pressed={sound}
                data-option-type="sound"
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className={`relative w-12 h-12 flex items-center justify-center rounded-full transition-colors duration-300 glow-transition ${sound ? 'bg-cyan-500/20 text-cyan-300 active-glow' : 'bg-slate-800 text-slate-500'}`}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {sound ? (
                        <motion.div key="sound-on" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                            <SoundOnIcon className="w-6 h-6"/>
                        </motion.div>
                    ) : (
                        <motion.div key="sound-off" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                            <SoundOffIcon className="w-6 h-6"/>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
            <span className="text-slate-300 font-mono text-sm w-20">{sound ? 'Aktif' : 'Nonaktif'}</span>
        </div>

        <ActionButton type="submit" disabled={formDisabled || !prompt.trim()} className="w-full sm:w-auto sm:flex-1">
          {disabled ? 'Memproses...' : (isAutoGenerating ? 'Auto-Generating...' : 'Buat Video')}
        </ActionButton>
      </div>
    </form>
    <PromptHistoryPopup 
        isOpen={isHistoryVisible}
        onClose={() => setIsHistoryVisible(false)}
        history={promptHistory}
        onSelect={onSelectFromHistory}
        onDelete={onDeleteHistoryItem}
        onClear={() => {
            onClearHistory();
            setIsHistoryVisible(false);
        }}
        disabled={formDisabled}
    />
  </>
  );
};