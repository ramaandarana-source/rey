import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';
import Swal from 'sweetalert2';
import type { ImageAspectRatio, ImageResult, ImageGenerationOptions } from '../../types';
import { ImageIcon, DownloadIcon, XIcon, TransferIcon, AspectRatio1x1Icon, AspectRatio16x9Icon, AspectRatio9x16Icon, AspectRatio4x3Icon, AspectRatio3x4Icon, UploadIcon, ChevronDownIcon, ChevronUpIcon, ZipIcon } from '../icons';
import { PromptInput } from '../PromptInput';
import { ApiKeyExhaustedAnimation } from '../ApiKeyExhaustedAnimation';
import { Loader } from '../Loader';

interface ImageGeneratorViewProps {
  isLoading: boolean;
  error: string | null;
  history: ImageResult[][];
  onGenerate: (options: ImageGenerationOptions) => void;
  onTransfer: (base64: string) => void;
  referenceImage: File | null;
  referenceImagePreview: string | null;
  onReferenceImageChange: (file: File | null) => void;
  onSelectForPreview: (url: string) => void;
  resultsContainerRef: React.RefObject<HTMLDivElement>;
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

const aspectRatios: { value: ImageAspectRatio; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { value: '1:1', icon: AspectRatio1x1Icon }, { value: '16:9', icon: AspectRatio16x9Icon }, { value: '9:16', icon: AspectRatio9x16Icon }, { value: '4:3', icon: AspectRatio4x3Icon }, { value: '3:4', icon: AspectRatio3x4Icon },
];

const styles = {
    "Style": ["Neon", "Fantasy", "Van Gogh", "GTA", "Comic", "Pop Art", "Sci-Fi", "Simple", "1980's anime", "3D animation", "Caricature", "Dark fantasy", "Poster design", "Pixel art", "Monochrome", "Graffiti", "Surrealism", "Glitch", "Silhouette", "Flat Papercraft"],
    "Painting": ["Sketch", "Watercolor", "Oil Painting", "Lineart"],
    "Photography": ["Depth of field", "Film noir", "Long exposure", "Analog film", "Cinematic", "Faded Photo", "Tilt Shift"]
};

const StyleSelector: React.FC<{ selectedStyle: string, onSelect: (style: string) => void, disabled: boolean }> = ({ selectedStyle, onSelect, disabled }) => {
    const [showAll, setShowAll] = useState(false);
    const allStyles = Object.values(styles).flat();
    const visibleStyles = showAll ? [] : allStyles.slice(0, 4);

    const handleSelect = (style: string) => {
        // Toggle behavior
        onSelect(selectedStyle === style ? '' : style);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                 <label className="block text-sm font-medium text-slate-300">Style</label>
                 <button onClick={() => setShowAll(!showAll)} disabled={disabled} className="flex items-center text-xs text-cyan-400 hover:text-cyan-300 disabled:opacity-50">
                    {showAll ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                 </button>
            </div>
            
            <AnimatePresence>
                {!showAll && (
                    <motion.div
                        className="flex flex-wrap gap-2"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        {visibleStyles.map(style => (
                            <button key={style} onClick={() => handleSelect(style)} disabled={disabled} className={`px-3 py-1.5 text-xs rounded-full transition-colors border bg-transparent glow-transition ${selectedStyle === style ? 'border-cyan-500 text-cyan-300 bg-cyan-500/10 active-glow' : 'border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500'}`}>
                                {style}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
            {showAll && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                >
                    {Object.entries(styles).map(([category, styleList]) => (
                        <div key={category}>
                            <p className="text-xs text-slate-500 font-semibold mb-2">{category}</p>
                            <div className="flex flex-wrap gap-2">
                                {styleList.map(style => (
                                     <button key={style} onClick={() => handleSelect(style)} disabled={disabled} className={`px-3 py-1.5 text-xs rounded-full transition-colors border bg-transparent glow-transition ${selectedStyle === style ? 'border-cyan-500 text-cyan-300 bg-cyan-500/10 active-glow' : 'border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500'}`}>
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};

const ReferenceImageUploader: React.FC<{
    imagePreview: string | null;
    onImageChange: (file: File | null) => void;
    disabled: boolean;
    onPreview: () => void;
}> = ({ imagePreview, onImageChange, disabled, onPreview }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        processFile(e.currentTarget.files?.[0] ?? null);
    };
  
    const removeImage = () => {
        onImageChange(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    }

    return (
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Karakter Referensi (Opsional)</label>
            {imagePreview ? (
                <div className="relative group overflow-hidden rounded-lg border border-slate-700">
                    <img src={imagePreview} alt="Pratinjau referensi" className="w-full h-40 object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                         <button onClick={onPreview} className="p-2 bg-slate-800/80 rounded-full text-white hover:bg-cyan-500 transition-colors" aria-label="Pratinjau">
                           <ImageIcon className="w-5 h-5" />
                         </button>
                         <a href={imagePreview} download="reference-image.png" onClick={(e) => e.stopPropagation()} className="p-2 bg-slate-800/80 rounded-full text-white hover:bg-cyan-500 transition-colors" aria-label="Unduh">
                           <DownloadIcon className="w-5 h-5" />
                         </a>
                         <button type="button" onClick={removeImage} disabled={disabled} className="p-2 bg-slate-800/80 rounded-full text-white hover:bg-red-500 transition-colors" aria-label="Hapus">
                            <XIcon className="w-5 h-5" />
                         </button>
                    </div>
                </div>
            ) : (
                <div onClick={() => fileInputRef.current?.click()} className="flex justify-center items-center w-full h-40 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-cyan-500 hover:bg-cyan-900/20 transition-colors">
                     <input type="file" accept="image/*" onChange={handleImageChange} ref={fileInputRef} className="hidden" disabled={disabled} />
                     <div className="text-center text-slate-500">
                        <UploadIcon className="w-8 h-8 mx-auto" />
                        <p className="mt-2 text-sm">Unggah Gambar Karakter</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export const ImageGeneratorView: React.FC<ImageGeneratorViewProps> = ({
    isLoading, error, history, onGenerate, onTransfer,
    referenceImage, referenceImagePreview, onReferenceImageChange,
    onSelectForPreview, resultsContainerRef
}) => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>('9:16');
    const [numberOfImages, setNumberOfImages] = useState<number>(2);
    const [style, setStyle] = useState<string>('');
    
    const handleGenerate = () => {
        onGenerate({ prompt, aspectRatio, numberOfImages, style, referenceImage });
    };

    const handleDownloadAllZip = async () => {
        const zip = new JSZip();
        let imageCounter = 0;
        
        for (const batch of history) {
            for (const result of batch) {
                imageCounter++;
                const response = await fetch(result.url);
                const blob = await response.blob();
                zip.file(`image-${imageCounter}.png`, blob);
            }
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ryad-tools-images.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Control Panel */}
            <div className="lg:col-span-3 bg-gray-900/50 backdrop-blur-md border border-cyan-500/20 rounded-xl panel-glow p-6">
                <div className="space-y-6">
                    <PromptInput
                        value={prompt}
                        onChange={setPrompt}
                        placeholder="Seorang penyihir di hutan ajaib..."
                        disabled={isLoading}
                        heightClassName="h-48"
                        onSend={handleGenerate}
                        isSending={isLoading}
                    />
                     <ReferenceImageUploader 
                        imagePreview={referenceImagePreview}
                        onImageChange={onReferenceImageChange}
                        disabled={isLoading}
                        onPreview={() => referenceImagePreview && onSelectForPreview(referenceImagePreview)}
                    />
                    <StyleSelector selectedStyle={style} onSelect={setStyle} disabled={isLoading} />
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Aspek Rasio</label>
                        <div className="flex gap-2">
                           {aspectRatios.map(ar => (
                                <button key={ar.value} onClick={() => setAspectRatio(ar.value)} disabled={isLoading} title={ar.value} className={`flex-1 p-2 rounded-md border transition-colors bg-transparent glow-transition ${aspectRatio === ar.value ? 'border-cyan-500 text-cyan-300 bg-cyan-500/10 active-glow' : 'border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500'}`}>
                                    <ar.icon className="w-6 h-6 mx-auto"/>
                                </button>
                           ))}
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Jumlah Gambar</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4].map(num => (
                                <button key={num} onClick={() => setNumberOfImages(num)} disabled={isLoading} className={`flex-1 p-2 rounded-md border transition-colors bg-transparent text-base glow-transition ${numberOfImages === num ? 'border-cyan-500 text-cyan-300 bg-cyan-500/10 active-glow' : 'border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500'}`}>
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2">
                         <ActionButton onClick={handleGenerate} disabled={isLoading || !prompt.trim()}>
                            {isLoading ? 'Memproses...' : `Buat ${numberOfImages} Gambar`}
                        </ActionButton>
                    </div>
                </div>
            </div>

            {/* Result Display */}
            <div ref={resultsContainerRef} className="lg:col-span-2 bg-gray-900/50 backdrop-blur-md border border-cyan-500/20 rounded-xl panel-glow p-6 flex flex-col min-h-[500px]">
                <div className="flex-shrink-0 flex justify-between items-center w-full mb-4 border-b border-cyan-500/20 pb-3">
                    <h2 className="text-xl font-semibold text-slate-200">Hasil Gambar</h2>
                    {history.length > 0 && (
                        <button onClick={handleDownloadAllZip} disabled={isLoading} className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 disabled:opacity-50 action-glow glow-transition px-3 py-1.5 border border-cyan-500/20 rounded-md">
                            <ZipIcon className="w-4 h-4"/>
                            Unduh Semua
                        </button>
                    )}
                </div>
                <div className="flex-grow overflow-y-auto min-h-0 -mr-4 pr-3">
                    {isLoading && history.length === 0 && (
                        <div className="flex items-center justify-center h-full">
                           <Loader message="Membuat gambar..." />
                        </div>
                    )}
                     {error && (
                         <div className="flex items-center justify-center h-full">
                            {error === 'API_KEY_INVALID' ? (
                                <ApiKeyExhaustedAnimation />
                            ) : (
                                <p className="text-red-400 text-center font-mono bg-red-900/50 p-4 rounded-lg">
                                    {error}
                                </p>
                            )}
                        </div>
                    )}
                    {!isLoading && !error && history.length === 0 && (
                         <div className="flex items-center justify-center h-full text-center text-slate-600">
                             <div>
                                 <ImageIcon className="w-16 h-16 mx-auto mb-2" />
                                 <p>Gambar yang dihasilkan akan muncul di sini.</p>
                             </div>
                         </div>
                    )}
                    <div className="flex flex-col gap-6">
                        {isLoading && history.length > 0 && (
                            <div className="text-center text-slate-500 font-mono text-sm py-4">
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse mx-auto mb-2"></div>
                                <p>Membuat set gambar baru...</p>
                            </div>
                        )}
                        {history.map((batch, batchIndex) => (
                            <React.Fragment key={batchIndex}>
                                {batchIndex > 0 && <hr className="border-slate-800" />}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: batchIndex === 0 ? 0 : 0.2 }}
                                    className="grid grid-cols-2 gap-4"
                                >
                                    {batch.map((result, index) => (
                                        <div key={index} className="relative group rounded-md overflow-hidden aspect-auto cursor-pointer" onClick={() => onSelectForPreview(result.url)}>
                                            <img src={result.url} alt={`Generated image ${index + 1}`} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                                                <a href={result.url} download={`ryad-tools-image-${index}.png`} onClick={(e) => e.stopPropagation()} className="p-2 bg-slate-800/80 rounded-full text-white hover:bg-cyan-500 transition-colors" aria-label="Unduh">
                                                  <DownloadIcon className="w-5 h-5" />
                                                </a>
                                                 <button onClick={(e) => { e.stopPropagation(); onTransfer(result.base64); }} className="p-2 bg-slate-800/80 rounded-full text-white hover:bg-cyan-500 transition-colors" aria-label="Alihkan ke VEO">
                                                  <TransferIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};