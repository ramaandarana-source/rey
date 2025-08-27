import React, { useRef, useEffect } from 'react';
import type { ChatMessage } from '../../types';
import { ChatMessageDisplay } from './ChatMessageDisplay';
import { SendIcon, AngryBotIcon, MenuIcon } from '../icons';
import { motion } from 'framer-motion';

interface ChatViewProps {
    messages: ChatMessage[];
    input: string;
    setInput: (input: string) => void;
    onSendMessage: () => void;
    isLoading: boolean;
    onDeleteMessage: (messageId: string) => void;
    onToggleSidebar: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ messages, input, setInput, onSendMessage, isLoading, onDeleteMessage, onToggleSidebar }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [input]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSendMessage();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSendMessage();
    };

    return (
        <div className="flex flex-col h-full w-full bg-slate-900/50 rounded-lg border border-cyan-500/10">
            <div className="flex-shrink-0 p-3 border-b border-slate-800 flex items-center lg:hidden">
                 <button onClick={onToggleSidebar} className="p-2 text-slate-400 hover:text-white">
                    <MenuIcon className="w-6 h-6" />
                </button>
                <h2 className="text-lg font-semibold text-slate-200 mx-auto">AI Chat</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 min-h-0">
                <div className="max-w-4xl mx-auto w-full space-y-6">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center pt-16">
                           <motion.div 
                             initial={{ scale: 0, rotate: -180 }}
                             animate={{ scale: 1, rotate: 0 }}
                             transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
                             className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-700"
                           >
                            <AngryBotIcon className="w-16 h-16 text-red-400" />
                           </motion.div>
                           <motion.h1 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-4xl font-bold text-slate-200 mt-6"
                           >
                            Halo!
                           </motion.h1>
                           <motion.p 
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: 0.5 }}
                             className="text-lg mt-2"
                           >
                            Ada yang bisa saya bantu hari ini?
                           </motion.p>
                        </div>
                    ) : (
                        messages.map(msg => <ChatMessageDisplay key={msg.id} message={msg} onDelete={onDeleteMessage} />)
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            
            <div className="p-2 sm:p-4 w-full max-w-4xl mx-auto flex-shrink-0">
                 {isLoading && messages.length > 0 && (
                    <div className="text-sm text-cyan-400 font-mono flex items-center gap-2 mb-2 px-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                        AI sedang mengetik...
                    </div>
                )}
                <form onSubmit={handleSubmit} className="relative flex items-end">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ketik pesan Anda di sini..."
                        rows={1}
                        className="w-full max-h-48 p-4 pr-16 bg-slate-800/70 border border-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-slate-100 placeholder-slate-500 resize-none"
                        required
                        disabled={isLoading}
                    />
                    <motion.button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        className="absolute bottom-2.5 right-3 p-2 bg-cyan-500 rounded-lg text-white hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        aria-label="Kirim Pesan"
                    >
                        <SendIcon className="w-6 h-6" />
                    </motion.button>
                </form>
            </div>
        </div>
    );
};