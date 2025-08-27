import React from 'react';
import type { Conversation } from '../../types';
import { motion } from 'framer-motion';
import { MessageSquarePlusIcon, TrashIcon, ChatIcon } from '../icons';

interface ChatSidebarProps {
    conversations: Conversation[];
    activeConversationId: string | null;
    onNewChat: () => void;
    onSelectConversation: (id: string) => void;
    onDeleteConversation: (id: string) => void;
    onClearAll: () => void;
    isOpen: boolean;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
    conversations,
    activeConversationId,
    onNewChat,
    onSelectConversation,
    onDeleteConversation,
    onClearAll,
    isOpen
}) => {
    
    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if(confirm("Apakah Anda yakin ingin menghapus percakapan ini?")) {
            onDeleteConversation(id);
        }
    };

    const handleClear = () => {
        if(confirm("Apakah Anda yakin ingin menghapus SEMUA percakapan? Tindakan ini tidak dapat diurungkan.")) {
            onClearAll();
        }
    };

    return (
        <aside className={`absolute lg:relative z-40 h-full flex flex-col p-2 bg-slate-900/70 backdrop-blur-lg border-r border-slate-800 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 w-64`}>
            <div className="flex-shrink-0 p-2">
                 <button 
                    onClick={onNewChat}
                    className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg transition-colors duration-200 text-sm font-medium focus:outline-none bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
                >
                    <span>Obrolan Baru</span>
                    <MessageSquarePlusIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-2 space-y-1 pr-1">
                {conversations.map(conv => (
                    <div key={conv.id} className="relative group">
                        <button
                            onClick={() => onSelectConversation(conv.id)}
                            className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md text-sm truncate transition-colors ${activeConversationId === conv.id ? 'bg-slate-700/80 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                        >
                            <ChatIcon className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-1 truncate">{conv.title}</span>
                        </button>
                        <button 
                            onClick={(e) => handleDelete(e, conv.id)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <TrashIcon className="w-4 h-4"/>
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex-shrink-0 p-2 border-t border-slate-800 mt-2">
                 <button 
                    onClick={handleClear}
                    disabled={conversations.length === 0}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm text-slate-500 hover:bg-red-900/30 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <TrashIcon className="w-4 h-4" />
                    <span>Hapus Semua</span>
                </button>
            </div>
        </aside>
    );
};