import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CopyIcon, CheckIcon, YouTubeIcon } from '../icons';

interface YouTubeTranscriberViewProps {
    url: string;
    setUrl: (url: string) => void;
    onTranscribe: () => void;
    isLoading: boolean;
    error: string | null;
    summary: string | null;
    transcript: string | null;
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
            className="absolute top-2 right-2 flex items-center space-x-1 py-1 px-2 border border-slate-600 text-xs font-medium rounded-md shadow-sm text-slate-300 bg-gray-800/70 hover:bg-gray-700/70 transition-colors"
        >
            <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                    <motion.span
                        key="check"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="flex items-center gap-1 text-green-400"
                    >
                        <CheckIcon className="w-3 h-3" />
                        <span>Tersalin</span>
                    </motion.span>
                ) : (
                    <motion.span
                        key="copy"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                         className="flex items-center gap-1"
                    >
                        <CopyIcon className="w-3 h-3" />
                        <span>Salin</span>
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    );
};

export const YouTubeTranscriberView: React.FC<YouTubeTranscriberViewProps> = ({
    url, setUrl, onTranscribe, isLoading, error, summary, transcript
}) => {
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onTranscribe();
    };
    
    return (
        <div className="bg-gray-900/50 backdrop-blur-md border border-cyan-500/20 rounded-xl panel-glow p-6 lg:p-8">
            <h2 className="text-xl font-semibold mb-6 border-b border-cyan-500/20 pb-4 text-slate-200">
                Transkrip Video YouTube
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Form */}
                <div className="space-y-4">
                    <p className="text-sm text-slate-400">
                        Tempel tautan video YouTube di bawah ini. AI akan menggunakan pencarian web untuk menemukan transkrip dan membuat ringkasan.
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="yt-url" className="block text-sm font-medium text-slate-300 mb-2">Tautan YouTube</label>
                            <textarea
                                id="yt-url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="w-full p-3 h-24 bg-gray-900/70 border border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-slate-100 placeholder-slate-500 resize-none"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <motion.button
                            type="submit"
                            disabled={isLoading || !url.trim()}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full relative inline-flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 disabled:opacity-50"
                        >
                            {isLoading ? 'Memproses...' : 'Transkripsikan Video'}
                        </motion.button>
                    </form>
                </div>

                {/* Results View */}
                <div className="bg-gray-900/70 border border-slate-700 rounded-lg min-h-[300px] flex flex-col p-4">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                             <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center font-mono text-cyan-400">
                                 <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse mb-3"></div>
                                 <p>Mencari transkrip...</p>
                             </motion.div>
                        ) : error ? (
                             <motion.p key="error" className="flex-1 flex items-center justify-center text-red-400 text-center font-mono bg-red-900/50 p-4 rounded-lg">
                                {error}
                             </motion.p>
                        ) : transcript ? (
                            <motion.div key="results" className="flex flex-col gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div>
                                    <h3 className="font-semibold text-cyan-400 mb-2">Ringkasan AI</h3>
                                    <div className="relative">
                                        <p className="p-4 bg-gray-900/70 border border-slate-800 rounded-lg text-sm text-slate-200 whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                                           {summary || 'Membuat ringkasan...'}
                                        </p>
                                    </div>
                                </div>
                                 <div>
                                    <h3 className="font-semibold text-slate-300 mb-2">Transkrip Lengkap</h3>
                                     <div className="relative">
                                        <pre className="w-full p-4 bg-gray-900/70 border border-slate-800 rounded-lg text-sm font-mono text-slate-300 whitespace-pre-wrap break-words h-96 overflow-y-auto">
                                            <code>{transcript}</code>
                                        </pre>
                                        <CopyButton textToCopy={transcript} />
                                     </div>
                                </div>
                            </motion.div>
                        ) : (
                             <motion.div key="placeholder" className="flex-1 flex flex-col items-center justify-center text-center text-slate-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <YouTubeIcon className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                                <p>Hasil transkrip akan muncul di sini.</p>
                             </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
