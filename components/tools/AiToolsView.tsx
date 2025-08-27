import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ImageAspectRatio } from '../../types';
import { ImageTextReader } from './ImageTextReader';
import { ApiKeyExhaustedAnimation } from '../ApiKeyExhaustedAnimation';
import { Loader } from '../Loader';

interface AiToolsViewProps {
    // Scan Image Props
    image: File | null;
    imagePreview: string | null;
    scanResult: string | null;
    expandedImageResult: string | null;
    onImageUpload: (file: File) => void;
    onExtractText: () => void;
    onGeneratePrompt: () => void;
    onExpandImage: (aspectRatio: ImageAspectRatio) => void;
    onClear: () => void;
    onSelectForPreview: (url: string) => void;

    // General Props for scanning tool
    isToolLoading: boolean;
    toolError: string | null;
}

export const AiToolsView: React.FC<AiToolsViewProps> = (props) => {
    const { isToolLoading, toolError } = props;

    return (
        <div className="bg-gray-900/50 backdrop-blur-md border border-cyan-500/20 rounded-xl panel-glow p-6 lg:p-8">
             <div className="flex justify-between items-center mb-6 border-b border-cyan-500/20 pb-4">
                <h2 className="text-2xl font-semibold text-slate-200">
                    Analisis & Modifikasi Gambar
                </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {isToolLoading && toolError === 'API_KEY_INVALID' ? (
                    <div className="lg:col-span-2 flex items-center justify-center p-8">
                         <ApiKeyExhaustedAnimation />
                    </div>
                ) : isToolLoading ? (
                    <div className="lg:col-span-2 flex items-center justify-center p-8">
                         <Loader message="Memproses gambar..." />
                    </div>
                ) : toolError ? (
                     <div className="lg:col-span-2 flex items-center justify-center p-8">
                         <p className="text-red-400 bg-red-900/50 p-4 rounded-lg text-center font-mono">{toolError}</p>
                    </div>
                ) : (
                    <ImageTextReader 
                        isLoading={isToolLoading}
                        error={toolError}
                        imagePreview={props.imagePreview}
                        scanResult={props.scanResult}
                        expandedImageResult={props.expandedImageResult}
                        onImageUpload={props.onImageUpload}
                        onExtractText={props.onExtractText}
                        onGeneratePrompt={props.onGeneratePrompt}
                        onExpandImage={props.onExpandImage}
                        onClear={props.onClear}
                        onSelectForPreview={props.onSelectForPreview}
                    />
                )}
            </div>
        </div>
    );
};