import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { marked } from 'marked';
import type { ChatMessage } from '../../types';
import { UserIcon, CopyIcon, CheckIcon, SpeakerIcon, TrashIcon, AngryBotIcon } from '../icons';

const MessageToolbar: React.FC<{ onCopy: () => void; onSpeak: () => void; onDelete: () => void; isCopied: boolean; }> = ({ onCopy, onSpeak, onDelete, isCopied }) => {
    const iconClass = "w-4 h-4";
    return (
        <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-700/50 rounded-lg px-2 py-1 backdrop-blur-sm">
            <button onClick={onCopy} className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors" aria-label={isCopied ? "Tersalin" : "Salin"}>
                {isCopied ? <CheckIcon className={`${iconClass} text-green-400`} /> : <CopyIcon className={iconClass} />}
            </button>
            <button onClick={onSpeak} className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors" aria-label="Bacakan">
                <SpeakerIcon className={iconClass} />
            </button>
            <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-400 rounded-md transition-colors" aria-label="Hapus">
                <TrashIcon className={iconClass} />
            </button>
        </div>
    );
};


export const ChatMessageDisplay: React.FC<{ message: ChatMessage; onDelete: (messageId: string) => void; }> = ({ message, onDelete }) => {
    const isUser = message.role === 'user';
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleSpeak = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Cancel any ongoing speech
            const utterance = new SpeechSynthesisUtterance(message.content);
            window.speechSynthesis.speak(utterance);
        } else {
            alert('Maaf, browser Anda tidak mendukung text-to-speech.');
        }
    };

    const handleDelete = () => {
        onDelete(message.id);
    };
    
    const parsedHtml = marked.parse(message.content, { breaks: true, gfm: true });

    const messageAlignment = isUser ? "items-end" : "items-start";
    const bubbleStyles = isUser ? 'bg-cyan-600/50 text-slate-100 rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`w-full flex flex-col ${messageAlignment}`}
        >
            <div className={`flex items-start gap-3 max-w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="w-8 h-8 flex-shrink-0 bg-slate-700 rounded-full flex items-center justify-center overflow-hidden mt-1">
                    {isUser ? (
                        <UserIcon className="w-5 h-5 text-slate-300" />
                    ) : (
                        <AngryBotIcon className="w-6 h-6 text-red-400" />
                    )}
                </div>
                <div className="max-w-[85%] sm:max-w-xl">
                    <div
                        className={`p-3 rounded-xl prose prose-invert prose-sm prose-p:my-1 prose-headings:my-2 break-words ${bubbleStyles}`}
                    >
                        {message.role === 'model' && message.content.length === 0 ? (
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                        ) : (
                            <div dangerouslySetInnerHTML={{ __html: parsedHtml }} />
                        )}
                    </div>
                </div>
            </div>
             <div className={`mt-2 ${isUser ? 'mr-11' : 'ml-11'}`}>
                <MessageToolbar
                    onCopy={handleCopy}
                    onSpeak={handleSpeak}
                    onDelete={handleDelete}
                    isCopied={isCopied}
                />
            </div>
        </motion.div>
    );
};