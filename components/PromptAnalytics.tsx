import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadialChart } from './RadialChart';

interface PromptAnalyticsProps {
    analysis: { accuracyScore: number, suggestion: string } | null;
    isAnalyzing: boolean;
    onAnalyze: () => void;
    disabled: boolean;
}

export const PromptAnalytics: React.FC<PromptAnalyticsProps> = ({ analysis, isAnalyzing, onAnalyze, disabled }) => {
    return (
        <div className="relative flex flex-col items-center justify-center p-4 bg-gray-900/70 border border-slate-700 rounded-lg h-52">
            <motion.button
                type="button"
                onClick={onAnalyze}
                disabled={isAnalyzing || disabled}
                whileTap={{ scale: 0.95 }}
                className="absolute top-2 right-2 px-3 py-1 text-xs font-semibold text-cyan-300 bg-cyan-900/50 border border-cyan-800 rounded-md hover:bg-cyan-900/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isAnalyzing ? "Menganalisis..." : "Cek Prompt"}
            </motion.button>

            <AnimatePresence mode="wait">
                {isAnalyzing && (
                    <motion.div
                        key="analyzing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center text-slate-400 font-mono"
                    >
                        <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse mx-auto mb-3"></div>
                        <p>Menganalisis...</p>
                    </motion.div>
                )}
                {!isAnalyzing && !analysis && (
                     <motion.div
                        key="waiting"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center text-slate-500"
                    >
                        <p>Klik 'Cek Prompt' untuk analisis.</p>
                    </motion.div>
                )}
                {analysis && !isAnalyzing && (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full flex flex-col items-center text-center space-y-3"
                    >
                       <RadialChart score={analysis.accuracyScore} />
                       <div>
                         <p className="text-xs text-slate-400 font-mono mt-3">SARAN AI:</p>
                         <p className="text-sm text-cyan-300">{analysis.suggestion}</p>
                       </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};