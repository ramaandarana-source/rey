import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import type { Character, Dialogue, EnvironmentState } from '../../types';
import { ETHNICITIES, GENDERS, LIGHTING, CAMERA_ANGLES, CAMERA_SHOTS, STYLES } from './constants';
import { PlusIcon, TrashIcon, PencilIcon, InfoIcon } from '../icons';
import { PromptOutput } from './PromptOutput';

interface PromptGeneratorProps {
    onApplyPrompt: (prompt: string) => void;
    characters: Character[];
    setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
    dialogues: Dialogue[];
    setDialogues: React.Dispatch<React.SetStateAction<Dialogue[]>>;
    environment: EnvironmentState;
    setEnvironment: React.Dispatch<React.SetStateAction<EnvironmentState>>;
    isGenerating: boolean;
    onGenerate: () => void;
    promptOutput: { indonesia: string, english: string, json: string };
}

const initialCharacter: Omit<Character, 'id' | 'name'> = {
    ethnicity: 'Javanese', gender: 'Female', age: '25',
    outfit: '', hair: '', voice: '', description: '', action: '', customEthnicity: '',
};

const Section: React.FC<{ title: string; children: React.ReactNode; rightContent?: React.ReactNode }> = ({ title, children, rightContent }) => (
    <div className="bg-gray-900/50 backdrop-blur-md border border-cyan-500/20 rounded-xl panel-glow p-6">
        <div className="flex justify-between items-center mb-4 border-b border-cyan-500/20 pb-3">
            <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
            {rightContent}
        </div>
        <div className="space-y-4">{children}</div>
    </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className="w-full p-2 bg-gray-900/70 border border-slate-700 rounded-lg shadow-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-slate-100 placeholder-slate-500" />
);

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} className="w-full p-2 bg-gray-900/70 border border-slate-700 rounded-lg shadow-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-slate-100 placeholder-slate-500 resize-none" />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select {...props} className="w-full p-2 bg-gray-900/70 border border-slate-700 rounded-lg shadow-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-slate-100" />
);

const TooltipLabel: React.FC<{ label: string; tooltip: string }> = ({ label, tooltip }) => (
    <div className="flex items-center space-x-1 group relative mb-1">
        <label className="text-xs text-slate-400">{label}</label>
        <InfoIcon className="w-3 h-3 text-slate-500" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-2 py-1 bg-slate-900 border border-slate-700 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {tooltip}
        </div>
    </div>
);

export const PromptGenerator: React.FC<PromptGeneratorProps> = ({ 
    onApplyPrompt,
    characters,
    setCharacters,
    dialogues,
    setDialogues,
    environment,
    setEnvironment,
    isGenerating,
    onGenerate,
    promptOutput,
}) => {
    const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
    const [editingDialogueId, setEditingDialogueId] = useState<string | null>(null);

    const handleAddCharacter = () => {
        const newCharacter: Character = {
            id: uuidv4(),
            name: `Karakter ${characters.length + 1}`,
            ...initialCharacter,
        };
        setCharacters([...characters, newCharacter]);
        setEditingCharacterId(newCharacter.id);
    };
    
    const handleUpdateCharacter = (id: string, field: keyof Character, value: string) => {
        setCharacters(chars => chars.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const handleDeleteCharacter = (id: string) => {
        setCharacters(chars => chars.filter(c => c.id !== id));
        setDialogues(dials => dials.filter(d => d.characterId !== id));
        if (editingCharacterId === id) setEditingCharacterId(null);
    };

    const handleAddDialogue = () => {
        if (characters.length === 0) return;
        const newDialogue: Dialogue = {
            id: uuidv4(),
            characterId: characters[0].id,
            conversation: '',
        };
        setDialogues([...dialogues, newDialogue]);
        setEditingDialogueId(newDialogue.id);
    };

    const handleUpdateDialogue = (id: string, field: keyof Dialogue, value: string) => {
        setDialogues(dials => dials.map(d => d.id === id ? { ...d, [field]: value } : d));
    };

    const handleDeleteDialogue = (id: string) => {
        setDialogues(dials => dials.filter(d => d.id !== id));
        if (editingDialogueId === id) setEditingDialogueId(null);
    };
    
    const handleUpdateEnvironment = (field: keyof EnvironmentState, value: string) => {
        setEnvironment(env => ({ ...env, [field]: value }));
    };

    const CharacterItem: React.FC<{ char: Character }> = ({ char }) => (
        <div className="p-3 bg-slate-800/50 rounded-lg flex justify-between items-center">
             <p className="font-semibold text-slate-200">{char.name}</p>
             <div className="flex items-center space-x-2">
                 <button onClick={() => setEditingCharacterId(char.id)} className="text-slate-400 hover:text-cyan-400"><PencilIcon className="w-4 h-4"/></button>
                 <button onClick={() => handleDeleteCharacter(char.id)} className="text-slate-400 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
             </div>
        </div>
    );
    
    const DialogueItem: React.FC<{ dial: Dialogue }> = ({ dial }) => {
        const character = characters.find(c => c.id === dial.characterId);
        return (
            <div className="p-3 bg-slate-800/50 rounded-lg flex justify-between items-center">
                <p className="text-sm text-slate-300"><strong className="text-cyan-400">{character?.name || 'Unknown'}:</strong> {dial.conversation.substring(0, 30)}...</p>
                 <div className="flex items-center space-x-2">
                     <button onClick={() => setEditingDialogueId(dial.id)} className="text-slate-400 hover:text-cyan-400"><PencilIcon className="w-4 h-4"/></button>
                     <button onClick={() => handleDeleteDialogue(dial.id)} className="text-slate-400 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
                 </div>
            </div>
        );
    };
    
    const editingCharacter = useMemo(() => characters.find(c => c.id === editingCharacterId), [characters, editingCharacterId]);
    const editingDialogue = useMemo(() => dialogues.find(d => d.id === editingDialogueId), [dialogues, editingDialogueId]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Column */}
            <div className="flex flex-col gap-8">
                <Section title="Karakter" rightContent={<motion.button whileTap={{scale:0.95}} onClick={handleAddCharacter} className="flex items-center gap-1 text-sm bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-md hover:bg-cyan-500/40"><PlusIcon className="w-4 h-4"/>Tambah</motion.button>}>
                    {characters.map(char => <CharacterItem key={char.id} char={char} />)}
                    {characters.length === 0 && <p className="text-slate-500 text-sm text-center">Belum ada karakter. Klik 'Tambah'.</p>}
                </Section>
                
                <AnimatePresence>
                {editingCharacter && (
                    <motion.div initial={{opacity: 0, y: -10}} animate={{opacity:1, y: 0}} exit={{opacity:0, height: 0}}>
                        <Section title={`Mengedit: ${editingCharacter.name}`}>
                            <div className="grid grid-cols-2 gap-4">
                                <div><TooltipLabel label="Name" tooltip="Nama" /><Input placeholder="Contoh: Jaka" value={editingCharacter.name} onChange={e => handleUpdateCharacter(editingCharacter.id, 'name', e.target.value)} /></div>
                                <div><TooltipLabel label="Age" tooltip="Umur" /><Input placeholder="Contoh: 32" value={editingCharacter.age} onChange={e => handleUpdateCharacter(editingCharacter.id, 'age', e.target.value)} /></div>
                                <div><TooltipLabel label="Ethnicity" tooltip="Etnis" /><Select value={editingCharacter.ethnicity} onChange={e => handleUpdateCharacter(editingCharacter.id, 'ethnicity', e.target.value)}>{ETHNICITIES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></div>
                                {editingCharacter.ethnicity === 'Other' && <div><TooltipLabel label="Custom Ethnicity" tooltip="Etnis Kustom" /><Input placeholder="Contoh: Aborigin Australia" value={editingCharacter.customEthnicity} onChange={e => handleUpdateCharacter(editingCharacter.id, 'customEthnicity', e.target.value)} /></div>}
                                <div><TooltipLabel label="Gender" tooltip="Gender" /><Select value={editingCharacter.gender} onChange={e => handleUpdateCharacter(editingCharacter.id, 'gender', e.target.value)}>{GENDERS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></div>
                            </div>
                            <div><TooltipLabel label="Outfit" tooltip="Pakaian" /><Input placeholder="Contoh: Jaket kulit usang, celana kargo" value={editingCharacter.outfit} onChange={e => handleUpdateCharacter(editingCharacter.id, 'outfit', e.target.value)} /></div>
                            <div><TooltipLabel label="Hair Style" tooltip="Gaya Rambut" /><Input placeholder="Contoh: Rambut ikal sebahu, warna coklat" value={editingCharacter.hair} onChange={e => handleUpdateCharacter(editingCharacter.id, 'hair', e.target.value)} /></div>
                            <div><TooltipLabel label="Voice" tooltip="Suara" /><Input placeholder="Contoh: Suara berat dan serak" value={editingCharacter.voice} onChange={e => handleUpdateCharacter(editingCharacter.id, 'voice', e.target.value)} /></div>
                            <div><TooltipLabel label="Description" tooltip="Deskripsi" /><Textarea placeholder="Contoh: Punya bekas luka di alis kiri, tatapan tajam" rows={2} value={editingCharacter.description} onChange={e => handleUpdateCharacter(editingCharacter.id, 'description', e.target.value)} /></div>
                            <div><TooltipLabel label="Action" tooltip="Aksi" /><Textarea placeholder="Contoh: Berjalan pelan sambil menatap cakrawala hujan" rows={2} value={editingCharacter.action} onChange={e => handleUpdateCharacter(editingCharacter.id, 'action', e.target.value)} /></div>
                        </Section>
                    </motion.div>
                )}
                </AnimatePresence>

                <Section title="Dialog" rightContent={<motion.button whileTap={{scale:0.95}} onClick={handleAddDialogue} disabled={characters.length === 0} className="flex items-center gap-1 text-sm bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-md hover:bg-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed"><PlusIcon className="w-4 h-4"/>Tambah</motion.button>}>
                     {dialogues.map(dial => <DialogueItem key={dial.id} dial={dial} />)}
                     {dialogues.length === 0 && <p className="text-slate-500 text-sm text-center">Belum ada dialog.</p>}
                </Section>

                <AnimatePresence>
                {editingDialogue && (
                     <motion.div initial={{opacity: 0, y: -10}} animate={{opacity:1, y: 0}} exit={{opacity:0, height: 0}}>
                        <Section title="Mengedit Dialog">
                            <div>
                                <TooltipLabel label="Speaker" tooltip="Pembicara" />
                                <Select value={editingDialogue.characterId} onChange={e => handleUpdateDialogue(editingDialogue.id, 'characterId', e.target.value)}>
                                    {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </Select>
                            </div>
                             <div>
                                <TooltipLabel label="Conversation" tooltip="Percakapan" />
                                <Textarea placeholder="Contoh: 'Kita harus pergi sebelum badai datang.'" rows={3} value={editingDialogue.conversation} onChange={e => handleUpdateDialogue(editingDialogue.id, 'conversation', e.target.value)} />
                            </div>
                        </Section>
                    </motion.div>
                )}
                </AnimatePresence>

                 <Section title="Latar & Kamera">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <TooltipLabel label="Setting" tooltip="Latar Tempat" />
                            <Input placeholder="Contoh: Pasar malam neon di Tokyo saat hujan" value={environment.setting} onChange={e => handleUpdateEnvironment('setting', e.target.value)} />
                        </div>
                        <div>
                            <TooltipLabel label="Lighting" tooltip="Pencahayaan" />
                            <Select value={environment.lighting} onChange={e => handleUpdateEnvironment('lighting', e.target.value)}>{LIGHTING.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>
                        </div>
                        <div>
                           <TooltipLabel label="Camera Angle" tooltip="Sudut Kamera" />
                            <Select value={environment.cameraAngle} onChange={e => handleUpdateEnvironment('cameraAngle', e.target.value)}>{CAMERA_ANGLES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>
                        </div>
                        <div>
                            <TooltipLabel label="Camera Shot Type" tooltip="Tipe Shot" />
                            <Select value={environment.cameraShot} onChange={e => handleUpdateEnvironment('cameraShot', e.target.value)}>{CAMERA_SHOTS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>
                        </div>
                        <div className="md:col-span-2">
                            <TooltipLabel label="Overall Style" tooltip="Gaya Keseluruhan" />
                            <Select value={environment.style} onChange={e => handleUpdateEnvironment('style', e.target.value)}>{STYLES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>
                        </div>
                    </div>
                 </Section>
            </div>
            {/* Output Column */}
            <div className="sticky top-8 self-start">
                <PromptOutput
                    output={promptOutput}
                    isGenerating={isGenerating}
                    onGenerate={onGenerate}
                    onApply={onApplyPrompt}
                />
            </div>
        </div>
    );
};