import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';
import type { AutoGenerateOptions, MetadataSelection, Project, AutoGenPrompt } from '../types';
import { BotIcon, XIcon, PlusIcon, TrashIcon, CheckIcon, SaveIcon, UploadIcon, DownloadIcon, TranslateIcon } from './icons';

type SaveStatus = 'idle' | 'saving' | 'saved';

const metadataFields: { key: keyof MetadataSelection; label: string }[] = [
    { key: 'youtubeTitle', label: 'Judul YouTube' },
    { key: 'tiktokTitle', label: 'Judul TikTok' },
    { key: 'instagramTitle', label: 'Judul Instagram' },
    { key: 'facebookTitle', label: 'Judul Facebook' },
    { key: 'shopeeAffiliateTitle', label: 'Shopee Aff.' },
    { key: 'tiktokAffiliateTitle', label: 'TikTok Aff.' },
    { key: 'tags', label: 'Hashtags' },
];

const ToggleButton = ({ active, onClick, children, disabled }: { active: boolean, onClick: () => void, children: React.ReactNode, disabled: boolean }) => (
    <motion.button
        type="button"
        onClick={onClick}
        disabled={disabled}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-md transition-colors bg-transparent disabled:opacity-50 glow-transition ${active ? 'border-cyan-500 text-cyan-300 bg-cyan-500/10 active-glow' : 'border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500'}`}
    >
        {children}
    </motion.button>
);


interface AutoGeneratorViewProps {
    prompts: AutoGenPrompt[];
    setPrompts: React.Dispatch<React.SetStateAction<AutoGenPrompt[]>>;
    options: AutoGenerateOptions;
    setOptions: React.Dispatch<React.SetStateAction<AutoGenerateOptions>>;
    onStart: () => void;
    disabled: boolean;
    onClose: () => void;
    saveStatus: SaveStatus;
    projects: Project[];
    onSaveProject: (name: string) => void;
    onLoadProject: (id: string) => void;
    onDeleteProject: (id: string) => void;
    onExportProject: () => void;
    onImportProject: (file: File) => void;
    onClearAllPrompts: () => void;
    onTranslateAllPrompts: () => void;
    isTranslatingAll: boolean;
}

export const AutoGeneratorView: React.FC<AutoGeneratorViewProps> = ({ 
    prompts, setPrompts, options, setOptions, onStart, disabled, onClose, saveStatus,
    projects, onSaveProject, onLoadProject, onDeleteProject, onExportProject, onImportProject,
    onClearAllPrompts, onTranslateAllPrompts, isTranslatingAll
}) => {
    const [lastAddedPromptId, setLastAddedPromptId] = useState<string | null>(null);
    const importFileInputRef = useRef<HTMLInputElement>(null);
    
    const handleOptionChange = <K extends keyof AutoGenerateOptions>(key: K, value: AutoGenerateOptions[K]) => {
        setOptions(prev => ({ ...prev, [key]: value }));
    };

    const handleMetadataSelectionChange = (key: keyof MetadataSelection) => {
        setOptions(prev => ({
            ...prev,
            metadataSelection: {
                ...prev.metadataSelection,
                [key]: !prev.metadataSelection[key],
            }
        }));
    };

    const addPrompt = () => {
        const newId = uuidv4();
        setPrompts(prev => [...prev, { id: newId, text: '', status: 'pending' }]);
        setLastAddedPromptId(newId);
    };

    const removePrompt = (id: string) => setPrompts(prompts.filter(p => p.id !== id));
    const updatePrompt = (id: string, text: string) => {
        setPrompts(prompts.map(p => p.id === id ? { ...p, text } : p));
    };
    
    const handleStart = () => {
        const validPrompts = prompts.map(p => p.text.trim()).filter(Boolean);
        if (validPrompts.length > 0) {
            onStart();
        }
    };

    const handleSaveProjectClick = () => {
        Swal.fire({
            title: 'Masukkan Nama Proyek',
            input: 'text',
            inputPlaceholder: 'Konten Afiliasi Minggu Ini...',
            showCancelButton: true,
            confirmButtonText: 'Simpan Proyek',
            cancelButtonText: 'Batal',
            customClass: {
                popup: 'bg-slate-900 border border-cyan-500/20 rounded-xl panel-glow',
                title: 'text-slate-200',
                input: 'w-[90%] mx-auto bg-slate-800 border border-slate-600 text-slate-100 rounded-lg focus:ring-cyan-500 focus:border-cyan-500',
                confirmButton: 'bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded',
                cancelButton: 'bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded',
            },
            buttonsStyling: false,
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                onSaveProject(result.value);
            }
        });
    };

    const handleImportClick = () => {
        importFileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImportProject(file);
        }
        if (event.target) {
            event.target.value = '';
        }
    };


    return (
        <motion.div 
            className="fixed top-0 left-0 h-full w-full max-w-md z-[60]"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-gray-900/80 backdrop-blur-md border-r-2 border-cyan-500/50 h-full flex flex-col panel-glow">
                {/* Header */}
                <div className="p-6 flex justify-between items-center border-b border-slate-800 flex-shrink-0 pt-8 pb-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold text-slate-200 flex items-center gap-3">
                            <BotIcon className="w-7 h-7"/>Auto-Generate List
                        </h3>
                        <AnimatePresence>
                            {saveStatus === 'saved' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="flex items-center gap-1 text-sm text-green-400 font-mono"
                                >
                                    <CheckIcon className="w-4 h-4" />
                                    <span>Disimpan</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-200" aria-label="Tutup"><XIcon className="w-6 h-6" /></button>
                </div>

                {/* Main Content Area */}
                <div className="flex-grow flex flex-col min-h-0">
                    {/* Scrollable Content */}
                    <div className="flex-grow overflow-y-auto p-6 space-y-8">
                        {/* Projects */}
                        <section>
                            <h4 className="text-lg text-slate-300 mb-4 font-semibold">Proyek Tersimpan</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                {projects.length === 0 ? (
                                    <p className="text-slate-500 text-sm text-center">Belum ada proyek.</p>
                                ) : (
                                    projects.map(proj => (
                                        <div key={proj.id} className="group flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors">
                                            <button type="button" onClick={() => onLoadProject(proj.id)} disabled={disabled} className="text-left text-base text-slate-300 truncate flex-1 disabled:cursor-not-allowed">
                                                {proj.name}
                                            </button>
                                            <button type="button" onClick={() => onDeleteProject(proj.id)} disabled={disabled} className="ml-4 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed flex-shrink-0">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                        
                        {/* Prompts */}
                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-lg text-slate-300 font-semibold">Daftar Prompt</h4>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={onTranslateAllPrompts}
                                        disabled={disabled || isTranslatingAll || prompts.every(p => !p.text.trim())}
                                        title="Terjemahkan Semua Prompt"
                                        className="p-1.5 text-slate-400 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isTranslatingAll ? (
                                            <div className="w-5 h-5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></div>
                                        ) : (
                                            <TranslateIcon className="w-5 h-5" />
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClearAllPrompts}
                                        disabled={disabled || isTranslatingAll || prompts.every(p => !p.text.trim())}
                                        title="Hapus Semua Prompt"
                                        className="p-1.5 text-slate-400 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {prompts.map((item, index) => (
                                    <div key={item.id} className="flex items-start gap-3">
                                        <span className="font-mono text-slate-400 pt-3">{index + 1}.</span>
                                        <div className="relative w-full">
                                            <textarea
                                                ref={el => {
                                                    if (item.id === lastAddedPromptId && el) {
                                                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                        el.focus();
                                                        setLastAddedPromptId(null);
                                                    }
                                                }}
                                                value={item.text}
                                                onChange={(e) => updatePrompt(item.id, e.target.value)}
                                                placeholder="Tulis prompt di sini..."
                                                disabled={disabled}
                                                rows={3}
                                                className="w-full p-3 pr-12 bg-slate-800/50 border border-slate-700 rounded-lg shadow-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-base text-slate-100 placeholder-slate-500 resize-y" />
                                            <button type="button" onClick={() => removePrompt(item.id)} disabled={disabled} className="absolute top-3 right-3 p-1 disabled:cursor-not-allowed">
                                                <TrashIcon className={`w-5 h-5 transition-colors ${item.status === 'completed' ? 'text-green-500' : 'text-slate-500 hover:text-red-400'}`} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Options */}
                        <section>
                            <h4 className="text-lg text-slate-300 mb-4 font-semibold">Opsi</h4>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Tipe Unduhan</label>
                                    <div className="flex gap-2">
                                        <ToggleButton active={options.downloadType === 'zip'} onClick={() => handleOptionChange('downloadType', 'zip')} disabled={disabled}>.zip</ToggleButton>
                                        <ToggleButton active={options.downloadType === 'mp4'} onClick={() => handleOptionChange('downloadType', 'mp4')} disabled={disabled}>.mp4</ToggleButton>
                                    </div>
                                </div>
                                
                                {options.downloadType === 'zip' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Sertakan Metadata</label>
                                        <div className="space-y-2">
                                            {metadataFields.map(field => (
                                                <label key={field.key} className="flex items-center gap-3 cursor-pointer text-slate-300">
                                                    <input type="checkbox" checked={!!options.metadataSelection[field.key]} onChange={() => handleMetadataSelectionChange(field.key)} disabled={disabled} className="w-4 h-4 bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-600 focus:ring-2 rounded" />
                                                    <span>{field.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Footer with Actions */}
                    <div className="p-6 mt-auto border-t border-slate-800 flex-shrink-0 space-y-4">
                        <input
                            type="file"
                            ref={importFileInputRef}
                            onChange={handleFileChange}
                            accept=".txt"
                            className="hidden"
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <button type="button" onClick={addPrompt} disabled={disabled} className="w-full text-center justify-center flex items-center gap-2 text-sm bg-cyan-500/20 text-cyan-300 px-4 py-2 rounded-lg hover:bg-cyan-500/40 disabled:opacity-50">
                                <PlusIcon className="w-5 h-5"/>Tambah Prompt
                            </button>
                            <button type="button" onClick={handleSaveProjectClick} disabled={disabled} className="w-full text-center justify-center flex items-center gap-2 text-sm bg-transparent border border-cyan-500 text-cyan-300 px-4 py-2 rounded-lg hover:bg-cyan-500/20 disabled:opacity-50">
                                <SaveIcon className="w-5 h-5" />Simpan Proyek
                            </button>
                             <button type="button" onClick={handleImportClick} disabled={disabled} className="w-full text-center justify-center flex items-center gap-2 text-sm bg-transparent border border-cyan-500 text-cyan-300 px-4 py-2 rounded-lg hover:bg-cyan-500/20 disabled:opacity-50">
                                <UploadIcon className="w-5 h-5" />Impor (.txt)
                            </button>
                            <button type="button" onClick={onExportProject} disabled={disabled} className="w-full text-center justify-center flex items-center gap-2 text-sm bg-transparent border border-cyan-500 text-cyan-300 px-4 py-2 rounded-lg hover:bg-cyan-500/20 disabled:opacity-50">
                                <DownloadIcon className="w-5 h-5" />Ekspor (.txt)
                            </button>
                        </div>
                        <motion.button onClick={handleStart} disabled={disabled || prompts.every(p => !p.text.trim())}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full relative inline-flex justify-center items-center px-4 py-2 text-sm font-bold rounded-lg shadow-lg border-2 border-transparent bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-100 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed action-glow glow-transition"
                        >
                            Mulai Auto-Generate ({prompts.filter(p => p.text.trim()).length} Video)
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};