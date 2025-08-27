import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createRoot } from 'react-dom/client';
import Swal from 'sweetalert2';
import type { ImageAspectRatio } from '../../types';
import { UploadIcon, XIcon, CopyIcon, CheckIcon, PromptIcon, HackingIcon, ExpandIcon, DownloadIcon, ImageIcon, AspectRatio1x1Icon, AspectRatio16x9Icon, AspectRatio9x16Icon, AspectRatio4x3Icon, AspectRatio3x4Icon } from '../icons';
import { ApiKeyExhaustedAnimation } from '../ApiKeyExhaustedAnimation';
import { Loader } from '../Loader';

interface ImageTextReaderProps {
    isLoading: boolean;
    error: string | null;
    imagePreview: string | null;
    scanResult: string | null;
    expandedImageResult: string | null;
    onImageUpload: (file: File) => void;
    onExtractText: () => void;
    onGeneratePrompt: () => void;
    onExpandImage: (aspectRatio: ImageAspectRatio) => void;
    onClear: () => void;
    onSelectForPreview: (url: string) => void;
}

const aspectRatios: { value: ImageAspectRatio; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { value: '1:1', icon: AspectRatio1x1Icon }, { value: '16:9', icon: AspectRatio16x9Icon }, { value: '9:16', icon: AspectRatio9x16Icon }, { value: '4:3', icon: AspectRatio4x3Icon }, { value: '3:4', icon: AspectRatio3x4Icon },
];

const ExpansionOptionsModal: React.FC<{ onSelect: (ratio: ImageAspectRatio) => void }> = ({ onSelect }) => {
    return (
        <div className="flex flex-wrap gap-4 justify-center">
            {aspectRatios.map(ar => (
                <button
                    key={ar.value}
                    onClick={() => onSelect(ar.value)}
                    title={ar.value}
                    className="flex flex-col items-center justify-center w-24 h-24 p-2 rounded-lg border border-slate-600 text-slate-300 bg-slate-800/50 hover:bg-cyan-900/50 hover:border-cyan-700 transition-colors"
                >
                    <ar.icon className="w-8 h-8 mx-auto mb-2" />
                    <span className="text-sm font-mono">{ar.value}</span>
                </button>
            ))}
        </div>
    );
};

const ActionButton: React.FC<React.ComponentProps<typeof motion.button>> = ({ children, className, ...props }) => (
    <motion.button
        className={`relative w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 border-2 border-transparent text-slate-100 text-sm font-bold rounded-lg shadow-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group action-glow glow-transition ${className}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...props}
    >
        {children as React.ReactNode}
    </motion.button>
);

export const ImageTextReader: React.FC<ImageTextReaderProps> = ({ isLoading, error, imagePreview, scanResult, expandedImageResult, onImageUpload, onExtractText, onGeneratePrompt, onExpandImage, onClear, onSelectForPreview }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [copied, setCopied] = useState(false);

    const processFile = useCallback((file: File | null) => {
        const MAX_FILE_SIZE_MB = 4;
        const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

        if (!file || !file.type.startsWith('image/')) {
            return;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            Swal.fire({
                icon: 'error',
                title: 'Ukuran Gambar Terlalu Besar',
                text: `Ukuran gambar tidak boleh melebihi ${MAX_FILE_SIZE_MB}MB. Harap kompres atau pilih gambar yang lebih kecil.`,
            });
            return;
        }

        onImageUpload(file);
    }, [onImageUpload]);
    
    useEffect(() => {
        const handleGlobalPaste = (e: ClipboardEvent) => {
          if (isLoading || imagePreview) return;
    
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
      }, [isLoading, imagePreview, processFile]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        processFile(e.currentTarget.files?.[0] ?? null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0] ?? null;
        processFile(file);
    };

    const removeImage = () => {
        onClear();
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    
    const handleCopy = () => {
        if (!scanResult) return;
        navigator.clipboard.writeText(scanResult);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const showExpansionOptions = () => {
        const swalContainer = document.createElement('div');
        const root = createRoot(swalContainer);
        root.render(
            <ExpansionOptionsModal
                onSelect={(ratio) => {
                    onExpandImage(ratio);
                    Swal.close();
                }}
            />
        );
    
        Swal.fire({
            title: 'Pilih Aspek Rasio Ekspansi',
            html: swalContainer,
            showConfirmButton: false,
            showCloseButton: true,
            background: '#0f172a',
            customClass: {
                popup: 'border border-slate-700 rounded-xl',
                title: 'text-slate-200',
                closeButton: 'text-slate-400 hover:text-white'
            }
        }).then(() => {
            root.unmount();
        });
    };
    
    const imageModificationResult = expandedImageResult;

    return (
        <div className="flex flex-col gap-8 w-full">
            {/* Actions */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Aksi</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <ActionButton
                        onClick={onGeneratePrompt}
                        disabled={isLoading || !imagePreview}
                    >
                        <PromptIcon className="w-5 h-5" />
                        <span>Hasilkan Prompt</span>
                    </ActionButton>
                    <ActionButton
                        onClick={onExtractText}
                        disabled={isLoading || !imagePreview}
                    >
                        <HackingIcon className="w-5 h-5" />
                        <span>Ekstrak Teks</span>
                    </ActionButton>
                    <ActionButton
                        onClick={showExpansionOptions}
                        disabled={isLoading || !imagePreview}
                    >
                        <ExpandIcon className="w-5 h-5" />
                        <span>Expan Gambar</span>
                    </ActionButton>
                </div>
            </div>

            {/* Scan Box */}
            <div className="w-full">
                <label className="block text-sm font-medium text-slate-300 mb-2">Gambar untuk di-Scan</label>
                {imagePreview ? (
                    <div className="relative group overflow-hidden rounded-lg border border-slate-700 min-h-[60vh] flex items-center justify-center bg-black/20">
                        <img src={imagePreview} alt="Pratinjau gambar" className="max-w-full max-h-[60vh] object-contain" />
                        <div className="scanline-overlay"></div>
                        <motion.button
                            type="button"
                            onClick={removeImage}
                            whileTap={{ scale: 0.9 }}
                            className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-slate-300 hover:text-white transition-colors z-10">
                            <XIcon className="w-5 h-5" />
                        </motion.button>
                    </div>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`flex justify-center items-center w-full min-h-[60vh] border-2 border-dashed rounded-lg cursor-pointer transition-all group focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDragging ? 'border-cyan-500 bg-cyan-900/20' : 'border-slate-700 bg-gray-900/50 hover:border-cyan-500 hover:bg-cyan-900/20'}`}
                        tabIndex={0}
                    >
                        <input type="file" accept="image/*" onChange={handleImageChange} ref={fileInputRef} className="hidden" />
                        <div className="text-center text-slate-500">
                            <UploadIcon className="w-12 h-12 mx-auto text-slate-600 group-hover:text-cyan-400 transition-colors duration-300 group-hover:animate-pulse" />
                            <p className="mt-4 text-lg">Seret & Lepas, Pilih, atau Tempel Gambar</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Results */}
            <div className="w-full">
                <label className="block text-sm font-medium text-slate-300 mb-2">Hasil</label>
                 <div className="relative flex-grow min-h-[250px] group">
                    <AnimatePresence mode="wait">
                    <motion.div
                         key={isLoading ? 'loader' : (imageModificationResult ? 'image' : 'content')}
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         transition={{ duration: 0.2 }}
                         className={`w-full h-full p-4 bg-gray-900/70 border border-slate-700 rounded-lg text-slate-200 whitespace-pre-wrap break-words ${(scanResult || imageModificationResult) && !isLoading && !error ? 'overflow-y-auto' : 'flex items-center justify-center'}`}
                    >
                         {isLoading ? (
                            <Loader message="Menganalisis..." />
                        ) : error ? (
                             error === 'API_KEY_INVALID' ? (
                                <ApiKeyExhaustedAnimation />
                            ) : (
                                <p className="text-red-400 text-center">{error}</p>
                            )
                        ) : imageModificationResult ? (
                            <div
                                className="relative w-full h-full cursor-pointer"
                                onClick={() => onSelectForPreview(imageModificationResult)}
                                title="Klik untuk pratinjau"
                            >
                                <img src={imageModificationResult} alt="Gambar yang dimodifikasi" className="w-full h-full object-contain rounded-md" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <ImageIcon className="w-10 h-10 text-white drop-shadow-lg" />
                                </div>
                            </div>
                        ) : scanResult ? (
                            <p>{scanResult}</p>
                        ) : (
                             <p className="text-slate-500 text-center">Hasil akan muncul di sini.</p>
                        )}
                    </motion.div>
                    </AnimatePresence>
                     {scanResult && !isLoading && !imageModificationResult && (
                        <button
                            onClick={handleCopy}
                            className="absolute top-3 right-3 text-slate-400 hover:text-white"
                            aria-label={copied ? "Tersalin" : "Salin Teks"}
                        >
                            {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                        </button>
                    )}
                    {imageModificationResult && !isLoading && (
                        <a
                            href={imageModificationResult}
                            download="modified-image.png"
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-3 right-3 text-slate-200 bg-slate-900/50 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cyan-500 hover:text-white"
                            aria-label="Unduh Gambar"
                            title="Unduh Gambar"
                        >
                            <DownloadIcon className="w-5 h-5" />
                        </a>
                    )}
                 </div>
            </div>
        </div>
    );
};