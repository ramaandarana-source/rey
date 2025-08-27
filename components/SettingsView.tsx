import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, SaveIcon, CheckIcon, LightbulbIcon, LinkIcon } from './icons';

interface SettingsViewProps {
  isOpen: boolean;
  onClose: () => void;
  currentApiKey: string;
  onSaveApiKey: (key: string) => void;
}

// --- Data for JS Generators ---
const firstNames = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson"];
const prefixes = ["Quantum", "Apex", "Stellar", "Zenith", "Nova", "Fusion", "Synergy", "Vertex", "Blue", "Iron", "Silver", "Cyber"];
const suffixes = ["Leap", "Core", "Dynamics", "Solutions", "Labs", "Works", "Systems", "Ventures", "Shift", "Bridge", "Forge", "Grid"];

// --- JS Generator Functions ---
const generatePassword = (): string => {
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+~`|}{[]:;?><,./-=";
    const all = lower + upper + numbers + symbols;
    let password = "";
    password += lower[Math.floor(Math.random() * lower.length)];
    password += upper[Math.floor(Math.random() * upper.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    for (let i = 4; i < 16; i++) {
        password += all[Math.floor(Math.random() * all.length)];
    }
    return password.split('').sort(() => 0.5 - Math.random()).join('');
};

const generateAmericanName = (): string => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
};

const generateCompanyName = (): string => {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${prefix} ${suffix}`;
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-2 px-3 text-sm font-semibold border-b-2 transition-colors ${
            active
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
        }`}
    >
        {children}
    </button>
);

const ToolsPanel: React.FC = () => {
    const [passwords, setPasswords] = useState<string[]>([]);
    const [americanNames, setAmericanNames] = useState<string[]>([]);
    const [companyNames, setCompanyNames] = useState<string[]>([]);
    const [litStatus, setLitStatus] = useState({
        password: false,
        name: false,
        company: false,
    });
    const [copiedLink, setCopiedLink] = useState<string | null>(null);

    useEffect(() => {
        const generateData = () => {
            const passwordList: string[] = [];
            const nameList: string[] = [];
            const companyList: string[] = [];
            for (let i = 0; i < 200; i++) {
                passwordList.push(generatePassword());
                nameList.push(generateAmericanName());
                companyList.push(generateCompanyName());
            }
            setPasswords(passwordList);
            setAmericanNames(nameList);
            setCompanyNames(companyList);
        };
        generateData();
    }, []);

    const handleCopy = (type: 'password' | 'name' | 'company') => {
        let list: string[] = [];
        switch (type) {
            case 'password': list = passwords; break;
            case 'name': list = americanNames; break;
            case 'company': list = companyNames; break;
        }

        if (list.length === 0) return;

        const valueToCopy = list[Math.floor(Math.random() * list.length)];
        navigator.clipboard.writeText(valueToCopy);

        setLitStatus(prev => ({ ...prev, [type]: true }));
        setTimeout(() => {
            setLitStatus(prev => ({ ...prev, [type]: false }));
        }, 1500);
    };

    const handleCopyLink = (link: string, id: string) => {
        navigator.clipboard.writeText(link);
        setCopiedLink(id);
        setTimeout(() => setCopiedLink(null), 2000);
    };
    
    const GeneratorButton: React.FC<{
        type: 'password' | 'name' | 'company';
        label: string;
        isLit: boolean;
    }> = ({ type, label, isLit }) => (
        <div className="relative flex flex-col items-center gap-2 h-32">
            <button
                onClick={() => handleCopy(type)}
                className="relative w-24 h-24 flex items-center justify-center bg-slate-800/50 rounded-full border-2 border-slate-700 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-cyan-500/50"
                style={{
                    borderColor: isLit ? '#facc15' : '#334155', // yellow-400 vs slate-700
                    boxShadow: isLit ? '0 0 20px rgba(250, 204, 21, 0.4)' : 'none',
                }}
            >
                <LightbulbIcon className={`w-10 h-10 transition-colors duration-300 ${isLit ? 'text-yellow-300' : 'text-slate-500'}`} style={{ filter: isLit ? 'drop-shadow(0 0 5px #facc15)' : 'none' }} />
            </button>
            <p className="text-sm font-semibold text-slate-300">{label}</p>
            <AnimatePresence>
                {isLit && (
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs font-mono text-green-400 absolute bottom-0"
                    >
                        Tersalin!
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <div className="space-y-6">
            <p className="text-sm text-center text-slate-400">
                Klik ikon lampu untuk membuat & menyalin item acak.
            </p>
            <div className="flex justify-around items-start pt-4">
                <GeneratorButton type="password" label="Sandi Aman" isLit={litStatus.password} />
                <GeneratorButton type="name" label="Nama Amerika" isLit={litStatus.name} />
                <GeneratorButton type="company" label="Nama Perusahaan" isLit={litStatus.company} />
            </div>

            <div className="border-t border-slate-700 mt-8 pt-6">
                 <p className="text-sm text-center text-slate-400 mb-4">
                    Salin tautan cepat.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <motion.button 
                        onClick={() => handleCopyLink('https://www.cloudskillsboost.google/users/sign_in', 'csb')}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center justify-center gap-2 p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:border-slate-600 transition-colors"
                    >
                        <LinkIcon className="w-5 h-5"/>
                        <span className="font-semibold">{copiedLink === 'csb' ? 'Tersalin!' : 'Cloud Skills Boost'}</span>
                    </motion.button>
                     <motion.button 
                        onClick={() => handleCopyLink('https://relay.firefox.com/accounts/profile/', 'ffr')}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center justify-center gap-2 p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:border-slate-600 transition-colors"
                    >
                         <LinkIcon className="w-5 h-5"/>
                         <span className="font-semibold">{copiedLink === 'ffr' ? 'Tersalin!' : 'Firefox Relay'}</span>
                    </motion.button>
                </div>
            </div>
        </div>
    );
};


export const SettingsView: React.FC<SettingsViewProps> = (props) => {
  const { isOpen, onClose, currentApiKey, onSaveApiKey } = props;
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'api' | 'tools'>('api');

  useEffect(() => {
    if (isOpen) {
      setApiKey(currentApiKey);
      setIsSaved(false);
    }
  }, [isOpen, currentApiKey]);

  const handleSave = () => {
    onSaveApiKey(apiKey);
    setIsSaved(true);
    setTimeout(() => {
        setIsSaved(false);
    }, 1500);
  };

  const renderContent = () => {
      switch (activeTab) {
          case 'api':
              return (
                  <div className="space-y-4">
                      <p className="text-sm text-slate-400">
                          Masukkan Kunci API Gemini Anda di sini. Kunci Anda disimpan dengan aman di penyimpanan lokal peramban Anda.
                      </p>
                      <div>
                          <label htmlFor="api-key-input" className="block text-sm font-medium text-slate-300 mb-2">
                              Gemini API Key
                          </label>
                          <div className="relative">
                              <input
                                  id="api-key-input"
                                  type="password"
                                  value={apiKey}
                                  onChange={(e) => setApiKey(e.target.value)}
                                  placeholder="Masukkan kunci API Anda..."
                                  className="w-full p-3 pr-28 bg-slate-800/70 border border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-slate-100 placeholder-slate-500"
                              />
                              <motion.button
                                  onClick={handleSave}
                                  disabled={isSaved || apiKey === currentApiKey}
                                  whileTap={{ scale: 0.98 }}
                                  className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors disabled:opacity-50"
                                  style={{
                                      background: isSaved ? 'rgb(34 197 94 / 0.2)' : 'rgb(14 165 233 / 0.2)',
                                      color: isSaved ? 'rgb(74 222 128)' : 'rgb(56 189 248)',
                                  }}
                              >
                                  {isSaved ? <CheckIcon className="w-5 h-5"/> : <SaveIcon className="w-5 h-5"/>}
                                  <span>{isSaved ? 'Tersimpan!' : 'Simpan'}</span>
                              </motion.button>
                          </div>
                      </div>
                  </div>
              );
            case 'tools':
                return <ToolsPanel />;
      }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-cyan-500/20 rounded-xl panel-glow w-full max-w-2xl max-h-[80vh] flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-800 flex-shrink-0">
                <h3 className="text-xl font-semibold text-slate-200">Pengaturan & Alat</h3>
                <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-200" aria-label="Tutup"><XIcon className="w-6 h-6" /></button>
            </div>

            <div className="flex-shrink-0 border-b border-slate-800 px-6">
                <div className="flex">
                    <TabButton active={activeTab === 'api'} onClick={() => setActiveTab('api')}>Kunci API</TabButton>
                    <TabButton active={activeTab === 'tools'} onClick={() => setActiveTab('tools')}>Alat Bantu</TabButton>
                </div>
            </div>
            
            <div className="flex-grow overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
