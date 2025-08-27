import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CopyIcon, CheckIcon } from '../icons';

interface PromptOutputProps {
    output: {
        indonesia: string;
        english: string;
        json: string;
    };
    isGenerating: boolean;
    onGenerate: () => void;
    onApply: (prompt: string) => void;
}

const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <motion.button
            onClick={handleCopy}
            whileTap={{ scale: 0.95 }}
            className="absolute top-2 right-2 flex items-center justify-center p-1.5 border border-slate-600 rounded-md shadow-sm text-slate-300 bg-gray-800/70 hover:bg-gray-700/70 transition-colors action-glow glow-transition"
        >
            <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                    <motion.div
                        key="check"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="text-green-400"
                    >
                        <CheckIcon className="w-4 h-4" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="copy"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                    >
                        <CopyIcon className="w-4 h-4" />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
};

const OutputBox: React.FC<{ title: string; content: string; lang?: string }> = ({ title, content, lang }) => (
    <div>
        <h4 className="font-semibold text-cyan-400 mb-2">{title}</h4>
        <div className="relative">
            <pre className={`w-full p-4 bg-gray-900/70 border border-slate-800 rounded-lg text-sm font-mono text-slate-200 whitespace-pre-wrap break-words min-h-[120px] max-h-48 overflow-y-auto ${!content && 'flex items-center justify-center text-slate-500'}`}>
                <code>
                    {content || 'Hasil akan muncul di sini...'}
                </code>
            </pre>
            <CopyButton textToCopy={content} />
        </div>
    </div>
);

export const PromptOutput: React.FC<PromptOutputProps> = ({ output, isGenerating, onGenerate, onApply }) => {
    return (
        <div className="bg-gray-900/50 backdrop-blur-md border border-cyan-500/20 rounded-xl panel-glow p-6">
            <div className="flex justify-between items-center mb-4 border-b border-cyan-500/20 pb-3">
                <h3 className="text-lg font-semibold text-slate-200">Prompt Dihasilkan</h3>
                <AnimatePresence>
                    {isGenerating && (
                         <motion.div 
                            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                            className="flex items-center space-x-2 text-xs font-mono text-cyan-400"
                         >
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                            <span>Membuat...</span>
                         </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <div className="space-y-6">
                 <motion.button
                   onClick={onGenerate}
                   disabled={isGenerating}
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   className="w-full relative inline-flex justify-center items-center px-4 py-3 border-2 border-transparent bg-gradient-to-r from-purple-500 to-indigo-600 text-slate-100 text-base font-bold rounded-lg shadow-lg hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 action-glow glow-transition"
               >
                   {isGenerating ? 'Memproses...' : 'Buat Prompt'}
               </motion.button>
                <OutputBox title="Prompt Bahasa Indonesia" content={output.indonesia} />
                <OutputBox title="Prompt Bahasa Inggris" content={output.english} />
                <OutputBox title="Struktur JSON" content={output.json} lang="json" />
            </div>
            <div className="mt-6">
               <motion.button
                   onClick={() => onApply(output.indonesia)}
                   disabled={!output.indonesia || isGenerating}
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   className="w-full relative inline-flex justify-center items-center px-4 py-3 border-2 border-cyan-500 text-cyan-400 text-base font-bold rounded-lg shadow-lg hover:bg-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed action-glow glow-transition"
               >
                   Gunakan Prompt Ini & Pindah ke Generator
               </motion.button>
           </div>
        </div>
    );
};