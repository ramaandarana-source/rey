import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';
import JSZip from 'jszip';
import { GeneratorForm } from './components/GeneratorForm';
import { Loader } from './components/Loader';
import { VideoResultDisplay } from './components/VideoResultDisplay';
import { generateVideo, generateMetadata, generateImage, startChatStream, extractTextFromImage, generatePromptFromImage, expandImage, translatePrompt, setApiKey as setApiKeyInService } from './services/geminiService';
// FIX: Import AspectRatio and Resolution types for getFormOptions return type.
import type { GenerationOptions, VideoResult, VideoMetadata, ImageAspectRatio, ImageResult, ImageGenerationOptions, AutoGenerateOptions, Project, AutoGenResultItem, AutoGenPrompt, Conversation, ChatMessage, AspectRatio, Resolution } from './types';
import { ChatIcon, VideoIcon, ScanIcon, ImageIcon, HackingIcon } from './components/icons';
import { ChatView } from './components/chat/ChatView';
import { ChatSidebar } from './components/chat/ChatSidebar';
import { AiToolsView } from './components/tools/AiToolsView';
import { ImageGeneratorView } from './components/tools/ImageGeneratorView';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { HeaderTitle } from './components/HeaderTitle';
import { ApiKeyExhaustedAnimation } from './components/ApiKeyExhaustedAnimation';
import { FfmpegToolView } from './components/tools/FfmpegToolView';
import { AutoGeneratorView } from './components/AutoGeneratorView';
import { AutoGenResultGrid } from './components/AutoGenResultGrid';
import { SettingsView } from './components/SettingsView';


type AppMode = 'videoGenerator' | 'imageGenerator' | 'chat' | 'scanImage' | 'ffmpeg';
type SaveStatus = 'idle' | 'saving' | 'saved';

const LS_PROMPT_HISTORY_KEY = 'ryad-tools-prompt-history';
const LS_PERSISTENT_VIDEO_KEY = 'ryad-tools-persistent-video';
const LS_AUTOGEN_SESSION_KEY = 'ryad-tools-autogen-session';
const LS_PROJECTS_KEY = 'ryad-tools-projects';
const LS_API_KEY = 'GEMINI_API_KEY';
const LS_CHAT_CONVERSATIONS_KEY = 'ryad-tools-chat-conversations';
const LS_ACTIVE_CHAT_ID_KEY = 'ryad-tools-active-chat-id';


const initialAutoGenerateOptions: AutoGenerateOptions = {
    downloadType: 'zip',
    metadataSelection: {
        youtubeTitle: true, tiktokTitle: true, instagramTitle: true, facebookTitle: true,
        shopeeAffiliateTitle: true, tiktokAffiliateTitle: true, tags: true,
    },
};

// --- Helper Functions ---
const sanitizeFilename = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-') 
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('videoGenerator');
  const [isScrolled, setIsScrolled] = useState(false);
  const [notifications, setNotifications] = useState<Record<AppMode, boolean>>({
    videoGenerator: false,
    imageGenerator: false,
    chat: false,
    scanImage: false,
    ffmpeg: false,
  });

  // State for Video Generator
  const [videoPrompt, setVideoPrompt] = useState<string>('');
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
  const [videoLoadingMessage, setVideoLoadingMessage] = useState<string>('');
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoResult, setVideoResult] = useState<VideoResult | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const imageResultsRef = useRef<HTMLDivElement>(null);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  
  // State for Auto-Generate
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [autoGenPrompts, setAutoGenPrompts] = useState<AutoGenPrompt[]>([{id: uuidv4(), text: '', status: 'pending'}]);
  const [autoGenOptions, setAutoGenOptions] = useState<AutoGenerateOptions>(initialAutoGenerateOptions);
  const [isAutoGeneratorVisible, setIsAutoGeneratorVisible] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimeoutRef = useRef<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [autoGenResults, setAutoGenResults] = useState<AutoGenResultItem[]>([]);
  const [isTranslatingAllPrompts, setIsTranslatingAllPrompts] = useState(false);


  // State for Image Generator
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageGenerationHistory, setImageGenerationHistory] = useState<ImageResult[][]>([]);
  const [characterReferenceImage, setCharacterReferenceImage] = useState<File | null>(null);
  const [characterReferenceImagePreview, setCharacterReferenceImagePreview] = useState<string | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  
  // State for AI Chat
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State for AI Tools
  const [scanImage, setScanImage] = useState<File | null>(null);
  const [scanImagePreview, setScanImagePreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isAiToolLoading, setIsAiToolLoading] = useState(false);
  const [aiToolError, setAiToolError] = useState<string | null>(null);
  const [expandedImageResult, setExpandedImageResult] = useState<string | null>(null);

  // App-wide state
  const [apiKey, setApiKey] = useState<string>('');
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  const isAnyLoading = isVideoLoading || isImageLoading || isChatLoading || isAiToolLoading || isAutoGenerating;

  const navItems = [
    { id: 'videoGenerator', label: 'AI Video', icon: VideoIcon },
    { id: 'imageGenerator', label: 'AI Image', icon: ImageIcon },
    { id: 'chat', label: 'AI Chat', icon: ChatIcon },
    { id: 'scanImage', label: 'Scan Image', icon: ScanIcon },
    { id: 'ffmpeg', label: 'FFMPEG', icon: HackingIcon },
  ];
  
  const triggerNotification = (mode: AppMode) => {
    if (appMode !== mode) {
        setNotifications(prev => ({ ...prev, [mode]: true }));
    }
  };

  useEffect(() => {
    // Load API Key
    const storedApiKey = localStorage.getItem(LS_API_KEY) || '';
    setApiKey(storedApiKey);
    if (!storedApiKey && !process.env.API_KEY) {
        setIsSettingsVisible(true);
    }

    // Load prompt history
    try {
        const storedHistory = localStorage.getItem(LS_PROMPT_HISTORY_KEY);
        if (storedHistory) setPromptHistory(JSON.parse(storedHistory));
    } catch (e) { console.error("Gagal memuat riwayat prompt:", e); }
    
    // Load persistent video result
    try {
        const persistentVideo = localStorage.getItem(LS_PERSISTENT_VIDEO_KEY);
        if(persistentVideo) {
            const data = JSON.parse(persistentVideo);
            setVideoPrompt(data.prompt || '');
            setVideoMetadata(data.metadata || null);
            setVideoResult(data.result || null);
        }
    } catch (e) { console.error("Gagal memuat hasil video:", e); }

    // Load auto-generate session
    try {
        const storedSession = localStorage.getItem(LS_AUTOGEN_SESSION_KEY);
        if (storedSession) {
            const { prompts, options } = JSON.parse(storedSession);
            if (prompts && Array.isArray(prompts) && prompts.length > 0) {
              const sanitizedPrompts = prompts.map(p => ({ ...p, status: p.status || 'pending' }));
              setAutoGenPrompts(sanitizedPrompts);
            }
            if (options) setAutoGenOptions(options);
        }
    } catch(e) { console.error("Gagal memuat sesi auto-generate:", e); }

    // Load projects
    try {
        const storedProjects = localStorage.getItem(LS_PROJECTS_KEY);
        if (storedProjects) {
             const loadedProjects = JSON.parse(storedProjects).map((proj: Project) => ({
                ...proj,
                prompts: proj.prompts.map(p => ({ ...p, status: p.status || 'pending' }))
            }));
            setProjects(loadedProjects);
        }
    } catch (e) { console.error("Gagal memuat proyek:", e); }

    // Load Chat Conversations
    try {
        const storedConversations = localStorage.getItem(LS_CHAT_CONVERSATIONS_KEY);
        const storedActiveId = localStorage.getItem(LS_ACTIVE_CHAT_ID_KEY);
        if (storedConversations) {
            const parsedConvos = JSON.parse(storedConversations);
            setConversations(parsedConvos);
            if (storedActiveId && parsedConvos.some((c: Conversation) => c.id === storedActiveId)) {
                setActiveConversationId(storedActiveId);
            } else if (parsedConvos.length > 0) {
                setActiveConversationId(parsedConvos[0].id);
            }
        }
    } catch (e) { console.error("Gagal memuat percakapan:", e); }


    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Auto-save effect for Auto-Generate feature
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus('saving');
    saveTimeoutRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(LS_AUTOGEN_SESSION_KEY, JSON.stringify({ prompts: autoGenPrompts, options: autoGenOptions }));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) {
        console.error("Gagal menyimpan sesi auto-generate:", e);
        setSaveStatus('idle');
      }
    }, 1500);

    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [autoGenPrompts, autoGenOptions]);
  
  // Auto-save for Chat
  useEffect(() => {
      try {
          localStorage.setItem(LS_CHAT_CONVERSATIONS_KEY, JSON.stringify(conversations));
          if (activeConversationId) {
              localStorage.setItem(LS_ACTIVE_CHAT_ID_KEY, activeConversationId);
          } else {
              localStorage.removeItem(LS_ACTIVE_CHAT_ID_KEY);
          }
      } catch (e) { console.error("Gagal menyimpan percakapan:", e); }
  }, [conversations, activeConversationId]);

  const handleSaveApiKey = (key: string) => {
    setApiKeyInService(key);
    setApiKey(key);
  };

  // --- Auto-Generator Project Handlers ---
  const handleSaveProject = useCallback((name: string) => {
    setProjects(prev => {
        const newProject: Project = { id: uuidv4(), name, prompts: autoGenPrompts, options: autoGenOptions };
        const updatedProjects = [...prev, newProject];
        localStorage.setItem(LS_PROJECTS_KEY, JSON.stringify(updatedProjects));
        return updatedProjects;
    });
  }, [autoGenPrompts, autoGenOptions]);

  const handleLoadProject = useCallback((id: string) => {
    const projectToLoad = projects.find(p => p.id === id);
    if (projectToLoad) {
        setAutoGenPrompts(projectToLoad.prompts.map(p => ({...p, status: 'pending'})));
        setAutoGenOptions(projectToLoad.options);
    }
  }, [projects]);

  const handleDeleteProject = useCallback((id: string) => {
    setProjects(prev => {
        const updatedProjects = prev.filter(p => p.id !== id);
        localStorage.setItem(LS_PROJECTS_KEY, JSON.stringify(updatedProjects));
        return updatedProjects;
    });
  }, []);

  const handleExportProject = useCallback(async () => {
    if (autoGenPrompts.length === 0 || autoGenPrompts.every(p => !p.text.trim())) {
        Swal.fire({ icon: 'info', title: 'Tidak Ada Prompt', text: 'Tidak ada prompt untuk diekspor.' });
        return;
    }
    const { value: filename } = await Swal.fire({
        title: 'Masukkan Nama File Ekspor', input: 'text', inputValue: 'ryad-tools-prompts.txt', showCancelButton: true,
        confirmButtonText: 'Ekspor', cancelButtonText: 'Batal',
        customClass: { popup: 'bg-slate-900 border border-cyan-500/20 rounded-xl panel-glow', title: 'text-slate-200', input: 'w-[90%] mx-auto bg-slate-800 border border-slate-600 text-slate-100 rounded-lg focus:ring-cyan-500 focus:border-cyan-500', confirmButton: 'bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded', cancelButton: 'bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded', }, buttonsStyling: false,
    });
    if (filename) {
        const content = autoGenPrompts.map(p => p.text.trim()).filter(Boolean).join('\n\n');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename.endsWith('.txt') ? filename : `${filename}.txt`;
        link.click();
        URL.revokeObjectURL(link.href);
    }
  }, [autoGenPrompts]);

  const handleImportProject = useCallback((file: File) => {
      if (!file || !file.name.endsWith('.txt')) {
          Swal.fire({ icon: 'error', title: 'Format File Salah', text: 'Harap pilih file .txt.' });
          return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
          const text = e.target?.result as string;
          const importedPrompts = text.split(/\n\s*\n/).map(line => line.trim()).filter(Boolean).map(line => ({ id: uuidv4(), text: line, status: 'pending' as const }));
          if (importedPrompts.length > 0) {
              setAutoGenPrompts(importedPrompts);
              Swal.fire({ icon: 'success', title: 'Impor Berhasil', text: `${importedPrompts.length} prompt berhasil dimuat.` });
          } else {
              Swal.fire({ icon: 'warning', title: 'File Kosong', text: 'File tidak berisi prompt yang valid.' });
          }
      };
      reader.onerror = () => Swal.fire({ icon: 'error', title: 'Gagal Membaca File' });
      reader.readAsText(file);
  }, []);
  
  const handleClearAllPrompts = useCallback(() => {
    if (autoGenPrompts.every(p => !p.text.trim())) return;
    setAutoGenPrompts([{ id: uuidv4(), text: '', status: 'pending' }]);
  }, [autoGenPrompts]);
  
  const handleTranslateAllPrompts = useCallback(async () => {
    const promptsToTranslate = autoGenPrompts.filter(p => p.text.trim().length > 0);
    if (promptsToTranslate.length === 0) return;

    setIsTranslatingAllPrompts(true);
    try {
        const translatedPrompts = [...autoGenPrompts];
        for (const promptItem of promptsToTranslate) {
            const translatedText = await translatePrompt(promptItem.text);
            const originalIndex = translatedPrompts.findIndex(p => p.id === promptItem.id);
            if (originalIndex !== -1) translatedPrompts[originalIndex].text = translatedText;
        }
        setAutoGenPrompts(translatedPrompts);
    } catch (err: any) { console.error("Gagal menerjemahkan semua prompt:", err);
    } finally { setIsTranslatingAllPrompts(false); }
  }, [autoGenPrompts]);

  // --- App Lifecycle ---
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isAnyLoading || videoResult || imageGenerationHistory.length > 0) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAnyLoading, videoResult, imageGenerationHistory]);

  const playSuccessSound = () => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (!audioCtx) return;
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) { console.error("Gagal memutar suara notifikasi:", e); }
  };


  const handleReferenceImageChange = useCallback((file: File | null) => {
    setReferenceImage(file);
    if (referenceImagePreview) URL.revokeObjectURL(referenceImagePreview);
    if (file) setReferenceImagePreview(URL.createObjectURL(file));
    else setReferenceImagePreview(null);
  }, [referenceImagePreview]);

  const handleCharacterReferenceImageChange = useCallback((file: File | null) => {
    setCharacterReferenceImage(file);
    if (characterReferenceImagePreview) URL.revokeObjectURL(characterReferenceImagePreview);
    if (file) setCharacterReferenceImagePreview(URL.createObjectURL(file));
    else setCharacterReferenceImagePreview(null);
  }, [characterReferenceImagePreview]);


  const handleTransferImageToVEO = useCallback(async (base64: string) => {
      try {
        const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob();
        const file = new File([blob], "generated-image.png", { type: "image/png" });
        handleReferenceImageChange(file);
        setAppMode('videoGenerator');
      } catch (error) { console.error("Gagal mentransfer gambar:", error); }
  }, [handleReferenceImageChange]);
  
  const handleApplyPrompt = (prompt: string) => {
    setVideoPrompt(prompt);
    setAppMode('videoGenerator');
  };
  
  const handleNavClick = (mode: AppMode) => {
    setAppMode(mode);
    setNotifications(prev => ({ ...prev, [mode]: false }));
  };
  
  const handleUpdatePromptHistory = (prompt: string) => {
    setPromptHistory(prev => {
        const newHistory = [prompt, ...prev.filter(p => p !== prompt)].slice(0, 20);
        localStorage.setItem(LS_PROMPT_HISTORY_KEY, JSON.stringify(newHistory));
        return newHistory;
    });
  };

  const handleSelectPromptFromHistory = (prompt: string) => setVideoPrompt(prompt);
  
  const handleDeletePromptHistoryItem = (index: number) => {
      setPromptHistory(prev => {
          const newHistory = prev.filter((_, i) => i !== index);
          localStorage.setItem(LS_PROMPT_HISTORY_KEY, JSON.stringify(newHistory));
          return newHistory;
      });
  };

  const handleClearPromptHistory = () => {
      setPromptHistory([]);
      localStorage.removeItem(LS_PROMPT_HISTORY_KEY);
  };

  const handleVideoGenerate = useCallback(async (options: GenerationOptions) => {
    localStorage.removeItem(LS_PERSISTENT_VIDEO_KEY);
    setVideoResult(null);
    setVideoMetadata(null);
    if (window.innerWidth < 1024) resultsRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
    setIsVideoLoading(true);
    setVideoLoadingMessage('Membuat Video...');
    setVideoError(null);

    try {
      const videoBlob = await generateVideo(options);
      const videoDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(videoBlob);
      });
      const result = { url: videoDataUrl, blob: videoBlob };
      const metadata = await generateMetadata(options.prompt);
      setVideoResult(result);
      setVideoMetadata(metadata);
      handleUpdatePromptHistory(options.prompt);
      localStorage.setItem(LS_PERSISTENT_VIDEO_KEY, JSON.stringify({ result: { url: videoDataUrl }, metadata, prompt: options.prompt }));
      playSuccessSound();
      triggerNotification('videoGenerator');
    } catch (err: any) {
      console.error(err);
      if (err.message === "API_KEY_MISSING" || (err.message && /API.*?key|quota|permission|exceeded/i.test(err.message))) {
        setVideoError("API_KEY_INVALID");
      } else {
        setVideoError(err.message || 'Terjadi kesalahan yang tidak diketahui.');
      }
    } finally {
      setIsVideoLoading(false);
      setVideoLoadingMessage('');
    }
  }, []);

  const playPreviewForDuration = (videoElement: HTMLVideoElement, durationMs: number): Promise<void> => {
    return new Promise((resolve) => {
      let timeoutId: number;
      const cleanupAndResolve = () => {
        clearTimeout(timeoutId);
        videoElement.removeEventListener('play', onPlay);
        videoElement.removeEventListener('ended', cleanupAndResolve);
        videoElement.pause();
        if (document.fullscreenElement) document.exitFullscreen().catch(console.error).finally(resolve);
        else resolve();
      };
      const onPlay = () => { timeoutId = window.setTimeout(cleanupAndResolve, durationMs); };
      videoElement.addEventListener('play', onPlay, { once: true });
      videoElement.addEventListener('ended', cleanupAndResolve, { once: true });
      videoElement.requestFullscreen().then(() => videoElement.play().catch(cleanupAndResolve)).catch(() => videoElement.play().catch(cleanupAndResolve));
    });
  };

  const handleStartAutoGenerate = useCallback(async () => {
    setIsAutoGeneratorVisible(false);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setAutoGenResults([]);
    setAutoGenPrompts(prev => prev.map(p => ({ ...p, status: 'pending' })));
    const promptsToGenerate = autoGenPrompts.filter(p => p.text.trim());
    if (promptsToGenerate.length === 0) return;

    localStorage.removeItem(LS_PERSISTENT_VIDEO_KEY);
    setVideoResult(null);
    setVideoMetadata(null);
    setVideoError(null);
    setIsAutoGenerating(true);
    
    const form = document.querySelector('form');
    // FIX: Corrected getFormOptions to robustly read form state from DOM, resolving type errors.
    const getFormOptions = (): { aspectRatio: AspectRatio; resolution: Resolution; sound: boolean; } => {
        const aspectRatioEl = form?.querySelector<HTMLButtonElement>('button[data-option-type="aspectRatio"][aria-pressed="true"]');
        const resolutionEl = form?.querySelector<HTMLButtonElement>('button[data-option-type="resolution"][aria-pressed="true"]');
        const soundEl = form?.querySelector<HTMLButtonElement>('button[data-option-type="sound"]');
        
        // Default to '16:9' which matches the form's initial state.
        const aspectRatio: AspectRatio = aspectRatioEl?.dataset.optionValue === '9:16' ? '9:16' : '16:9';
        // Default to '1080p' which matches the form's initial state.
        const resolution: Resolution = resolutionEl?.dataset.optionValue === '720p' ? '720p' : '1080p';
        const sound = soundEl?.getAttribute('aria-pressed') === 'true';

        return {
            aspectRatio,
            resolution,
            sound,
        };
    };
    
    for (let i = 0; i < promptsToGenerate.length; i++) {
        setVideoResult(null);
        setVideoMetadata(null);
        const currentPromptItem = promptsToGenerate[i];
        setVideoLoadingMessage(`Membuat video ${i + 1}/${promptsToGenerate.length}: "${currentPromptItem.text.substring(0, 20)}..."`);
        
        try {
            const currentOptions: GenerationOptions = { ...getFormOptions(), prompt: currentPromptItem.text, image: referenceImage ?? undefined };
            const videoBlob = await generateVideo(currentOptions);
            const metadata = await generateMetadata(currentPromptItem.text);
            const videoDataUrl = await new Promise<string>((res, rej) => {
              const r = new FileReader(); r.onloadend = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(videoBlob);
            });
            
            setVideoResult({ url: videoDataUrl, blob: videoBlob });
            setVideoMetadata(metadata);
            setVideoPrompt(currentPromptItem.text);

            setAutoGenResults(prev => [...prev, { id: uuidv4(), result: { url: videoDataUrl, blob: videoBlob }, metadata, prompt: currentPromptItem.text }]);
            setAutoGenPrompts(prev => prev.map(p => p.id === currentPromptItem.id ? { ...p, status: 'completed' } : p));

            if (videoPlayerRef.current) await playPreviewForDuration(videoPlayerRef.current, 8000);
            
            const zip = new JSZip();
            const sanitizedTitle = sanitizeFilename(metadata.youtubeTitle || `video-${i + 1}`);
            
            if (autoGenOptions.downloadType === 'zip') {
                zip.file(`${sanitizedTitle}.mp4`, videoBlob);
                let metadataContent = '';
                const { metadataSelection } = autoGenOptions;
                if (metadataSelection.youtubeTitle) metadataContent += `Judul YouTube: ${metadata.youtubeTitle}\n`;
                if (metadataSelection.tiktokTitle) metadataContent += `Judul TikTok: ${metadata.tiktokTitle}\n`;
                if (metadataSelection.instagramTitle) metadataContent += `Judul Instagram: ${metadata.instagramTitle}\n`;
                if (metadataSelection.facebookTitle) metadataContent += `Judul Facebook: ${metadata.facebookTitle}\n`;
                if (metadataSelection.shopeeAffiliateTitle) metadataContent += `Judul Shopee Affiliate: ${metadata.shopeeAffiliateTitle}\n`;
                if (metadataSelection.tiktokAffiliateTitle) metadataContent += `Judul TikTok Affiliate: ${metadata.tiktokAffiliateTitle}\n`;
                if (metadataSelection.tags) metadataContent += `Tags: ${metadata.tags.join(', ')}\n`;
                if (metadataContent) zip.file('metadata.txt', metadataContent.trim());
                const blob = await zip.generateAsync({ type: 'blob' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `${sanitizedTitle}.zip`; a.click(); URL.revokeObjectURL(url);
            } else {
                const url = URL.createObjectURL(videoBlob);
                const a = document.createElement('a'); a.href = url; a.download = `${sanitizedTitle}.mp4`; a.click(); URL.revokeObjectURL(url);
            }
            handleUpdatePromptHistory(currentPromptItem.text);
            playSuccessSound();

        } catch (err: any) {
            console.error(`Gagal pada prompt #${i + 1}:`, err);
            const errorMessage = err.message === "API_KEY_MISSING" || (err.message && /API.*?key|quota|permission|exceeded/i.test(err.message)) ? "API_KEY_INVALID" : `Gagal pada prompt ${i+1}. Proses dihentikan.`;
            setVideoError(errorMessage);
            Swal.fire({ icon: 'error', title: 'Auto-Generate Gagal', text: errorMessage });
            break;
        }
    }
    
    setIsAutoGenerating(false);
    setVideoLoadingMessage('');
    setVideoResult(null);
    setVideoMetadata(null);
    setVideoPrompt('');

  }, [referenceImage, autoGenPrompts, autoGenOptions]);
  
  const handleImageGenerate = useCallback(async (options: ImageGenerationOptions) => {
    if (window.innerWidth < 1024) imageResultsRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
    setIsImageLoading(true);
    setImageError(null);
    try {
        const base64Images = await generateImage({ ...options, referenceImage: characterReferenceImage });
        const results: ImageResult[] = base64Images.map(base64 => ({ base64, url: `data:image/png;base64,${base64}` }));
        setImageGenerationHistory(prev => [results, ...prev]);
        playSuccessSound();
        triggerNotification('imageGenerator');
    } catch (err: any) {
        console.error(err);
        if (err.message === "API_KEY_MISSING" || (err.message && /API.*?key|quota|permission|exceeded/i.test(err.message))) setImageError("API_KEY_INVALID");
        else setImageError(err.message || 'Terjadi kesalahan saat menghasilkan gambar.');
    } finally { setIsImageLoading(false); }
  }, [characterReferenceImage]);

  // --- Chat Handlers ---
  const handleNewChat = () => {
    const newId = uuidv4();
    const newConversation: Conversation = { id: newId, title: 'Percakapan Baru', messages: [] };
    setConversations(prev => [...prev, newConversation]);
    setActiveConversationId(newId);
    setChatInput('');
    setIsSidebarOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setIsSidebarOpen(false);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
        const remainingConvos = conversations.filter(c => c.id !== id);
        setActiveConversationId(remainingConvos.length > 0 ? remainingConvos[0].id : null);
    }
  };
  
  const handleClearAllConversations = () => {
    setConversations([]);
    setActiveConversationId(null);
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!activeConversationId) return;
    setConversations(prev => prev.map(conv => {
        if (conv.id === activeConversationId) {
            return { ...conv, messages: conv.messages.filter(msg => msg.id !== messageId) };
        }
        return conv;
    }));
  };

  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || isChatLoading) return;

    let currentConversationId = activeConversationId;

    if (!currentConversationId) {
        const newId = uuidv4();
        const newConversation: Conversation = { id: newId, title: chatInput.substring(0, 30), messages: [] };
        setConversations(prev => [newConversation, ...prev]);
        setActiveConversationId(newId);
        currentConversationId = newId;
    }
    
    const userMessage: ChatMessage = { id: uuidv4(), role: 'user', content: chatInput };
    const modelMessageId = uuidv4();
    const modelMessage: ChatMessage = { id: modelMessageId, role: 'model', content: '' };

    setConversations(prev => prev.map(conv =>
        conv.id === currentConversationId ? { ...conv, messages: [...conv.messages, userMessage, modelMessage] } : conv
    ));
    
    setChatInput('');
    setIsChatLoading(true);

    try {
        const activeConv = conversations.find(c => c.id === currentConversationId);
        const history = [...(activeConv?.messages || []), userMessage];

        await startChatStream(history, (chunk) => {
            setConversations(prev => prev.map(conv => {
                if (conv.id === currentConversationId) {
                    const updatedMessages = conv.messages.map(msg =>
                        msg.id === modelMessageId ? { ...msg, content: msg.content + chunk } : msg
                    );
                    return { ...conv, messages: updatedMessages };
                }
                return conv;
            }));
        });
        triggerNotification('chat');

    } catch (err: any) {
        console.error("Gagal mengirim pesan chat:", err);
         setConversations(prev => prev.map(conv => {
            if (conv.id === currentConversationId) {
                const updatedMessages = conv.messages.map(msg =>
                    msg.id === modelMessageId ? { ...msg, content: 'Maaf, terjadi kesalahan.' } : msg
                );
                return { ...conv, messages: updatedMessages };
            }
            return conv;
        }));
    } finally {
        setIsChatLoading(false);
    }
  }, [chatInput, isChatLoading, activeConversationId, conversations]);
  
  // --- AI Tool Handlers ---
  const handleScanImageUpload = useCallback((file: File) => {
    setScanImage(file);
    setIsAiToolLoading(false);
    setAiToolError(null);
    setScanResult(null);
    setExpandedImageResult(null);
    if (scanImagePreview) URL.revokeObjectURL(scanImagePreview);
    setScanImagePreview(URL.createObjectURL(file));
  }, [scanImagePreview]);

  const handleExtractText = useCallback(async () => {
    if (!scanImage) return;
    setIsAiToolLoading(true);
    setAiToolError(null); setScanResult(null); setExpandedImageResult(null);
    try {
      setScanResult(await extractTextFromImage(scanImage));
      playSuccessSound(); triggerNotification('scanImage');
    } catch (err: any) {
      console.error(err);
      if (err.message === "API_KEY_MISSING" || (err.message && /API.*?key|quota|permission|exceeded/i.test(err.message))) setAiToolError("API_KEY_INVALID");
      else setAiToolError("Gagal mengekstrak teks. Coba lagi.");
    } finally { setIsAiToolLoading(false); }
  }, [scanImage]);

  const handleGeneratePromptFromScan = useCallback(async () => {
    if (!scanImage) return;
    setIsAiToolLoading(true);
    setAiToolError(null); setScanResult(null); setExpandedImageResult(null);
    try {
      setScanResult(await generatePromptFromImage(scanImage));
      playSuccessSound(); triggerNotification('scanImage');
    } catch (err: any) {
      console.error(err);
      if (err.message === "API_KEY_MISSING" || (err.message && /API.*?key|quota|permission|exceeded/i.test(err.message))) setAiToolError("API_KEY_INVALID");
      else setAiToolError("Gagal membuat prompt. Coba lagi.");
    } finally { setIsAiToolLoading(false); }
  }, [scanImage]);

  const handleExpandImage = useCallback(async (aspectRatio: ImageAspectRatio) => {
    if (!scanImage) return;
    setIsAiToolLoading(true);
    setAiToolError(null); setScanResult(null); setExpandedImageResult(null);
    try {
        setExpandedImageResult(`data:image/png;base64,${await expandImage(scanImage, aspectRatio)}`);
        playSuccessSound(); triggerNotification('scanImage');
    } catch (err: any) {
        console.error(err);
        if (err.message === "API_KEY_MISSING" || (err.message && /API.*?key|quota|permission|exceeded/i.test(err.message))) setAiToolError("API_KEY_INVALID");
        else setAiToolError(err.message || "Gagal memperluas gambar. Coba lagi.");
    } finally { setIsAiToolLoading(false); }
  }, [scanImage]);

  const handleClearScanImage = useCallback(() => {
    setScanImage(null);
    if (scanImagePreview) URL.revokeObjectURL(scanImagePreview);
    setScanImagePreview(null);
    setScanResult(null); setAiToolError(null); setExpandedImageResult(null);
  }, [scanImagePreview]);

  const handleSelectImageForPreview = (url: string) => setSelectedImagePreview(url);
  const handleCloseImagePreview = () => setSelectedImagePreview(null);
  const handleToggleAutoGenerator = useCallback(() => setIsAutoGeneratorVisible(prev => !prev), []);

  const renderVideoGenerator = () => (
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 bg-gray-900/50 backdrop-blur-md border border-cyan-500/20 rounded-xl panel-glow p-6">
            <GeneratorForm onGenerate={handleVideoGenerate} disabled={isVideoLoading || isAutoGenerating} prompt={videoPrompt} onPromptChange={setVideoPrompt} image={referenceImage} imagePreview={referenceImagePreview} onImageChange={handleReferenceImageChange} onSelectForPreview={handleSelectImageForPreview} promptHistory={promptHistory} onSelectFromHistory={handleSelectPromptFromHistory} onDeleteHistoryItem={handleDeletePromptHistoryItem} onClearHistory={handleClearPromptHistory} isAutoGenerating={isAutoGenerating} onFocusAutoGenerator={handleToggleAutoGenerator} />
          </div>
          <div ref={resultsRef} className="lg:col-span-2 bg-gray-900/50 backdrop-blur-md border border-cyan-500/20 rounded-xl panel-glow p-6 min-h-[500px] flex flex-col justify-center items-center">
            <div className="flex justify-between items-center w-full mb-4"><h2 className="text-xl font-semibold border-b border-cyan-500/20 pb-3 text-slate-200 w-full">Hasil Video</h2></div>
            <div className="flex-grow w-full flex items-center justify-center">
              {(isVideoLoading || (isAutoGenerating && !videoResult)) && <Loader message={videoLoadingMessage} />}
              {videoError && !isAutoGenerating && (videoError === "API_KEY_INVALID" ? <ApiKeyExhaustedAnimation /> : <p className="text-red-400 bg-red-900/50 p-4 rounded-lg text-center font-mono">{videoError}</p>)}
              {!isVideoLoading && !videoError && videoResult && videoMetadata && (<VideoResultDisplay ref={videoPlayerRef} result={videoResult} metadata={videoMetadata} onReferenceImageChange={handleReferenceImageChange} />)}
              {!isVideoLoading && !isAutoGenerating && !videoError && !videoResult && (<p className="text-slate-500">Hasil video akan muncul di sini.</p>)}
            </div>
          </div>
        </div>
        {autoGenResults.length > 0 && (<motion.div className="mt-12" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}><AutoGenResultGrid results={autoGenResults} /></motion.div>)}
      </div>
  );

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  
  const renderChat = () => (
      <div className="flex h-[calc(100vh-150px)]">
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 lg:hidden" />
          )}
        </AnimatePresence>
        <ChatSidebar conversations={conversations} activeConversationId={activeConversationId} onNewChat={handleNewChat} onSelectConversation={handleSelectConversation} onDeleteConversation={handleDeleteConversation} onClearAll={handleClearAllConversations} isOpen={isSidebarOpen} />
        <ChatView messages={activeConversation?.messages || []} input={chatInput} setInput={setChatInput} onSendMessage={handleSendMessage} isLoading={isChatLoading} onDeleteMessage={handleDeleteMessage} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      </div>
  );

  const renderContent = () => {
    switch (appMode) {
      case 'videoGenerator': return renderVideoGenerator();
      case 'imageGenerator': return <ImageGeneratorView isLoading={isImageLoading} error={imageError} history={imageGenerationHistory} onGenerate={handleImageGenerate} onTransfer={handleTransferImageToVEO} referenceImage={characterReferenceImage} referenceImagePreview={characterReferenceImagePreview} onReferenceImageChange={handleCharacterReferenceImageChange} onSelectForPreview={handleSelectImageForPreview} resultsContainerRef={imageResultsRef} />;
      case 'chat': return renderChat();
      case 'scanImage': return <AiToolsView image={scanImage} imagePreview={scanImagePreview} scanResult={scanResult} expandedImageResult={expandedImageResult} onImageUpload={handleScanImageUpload} onExtractText={handleExtractText} onGeneratePrompt={handleGeneratePromptFromScan} onExpandImage={handleExpandImage} onClear={handleClearScanImage} onSelectForPreview={handleSelectImageForPreview} isToolLoading={isAiToolLoading} toolError={aiToolError} />;
      case 'ffmpeg': return <FfmpegToolView />;
      default: return null;
    }
  };

  return (
    <main className="min-h-screen">
       <header className="sticky top-0 z-40 w-full py-4">
           <div className="container mx-auto flex flex-col items-center justify-center px-4">
                <HeaderTitle isVisible={!isScrolled} isGenerating={isAnyLoading} onOpenSettings={() => setIsSettingsVisible(true)} />
               <nav>
                   <ul className={`flex items-center space-x-2 sm:space-x-4 border border-cyan-500/20 rounded-full p-2 transition-colors duration-300 ${isScrolled ? 'bg-slate-900/90 backdrop-blur-md' : 'bg-gray-900/50'}`}>
                       {navItems.map((item) => (
                           <li key={item.id}>
                               <button onClick={() => handleNavClick(item.id as AppMode)} className={`relative flex flex-col items-center justify-center gap-0 pt-2 pb-1 px-2 sm:flex-row sm:gap-2 sm:py-2 sm:px-4 rounded-full transition-colors duration-200 text-sm font-medium focus:outline-none ${appMode === item.id ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}>
                                   <item.icon className="w-5 h-5" />
                                   <span className="text-[10px] mt-0.5 sm:text-sm sm:mt-0">{item.label}</span>
                                   {notifications[item.id as AppMode] && (<span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-slate-900" />)}
                               </button>
                           </li>
                       ))}
                   </ul>
               </nav>
           </div>
       </header>
       
       <div className="container mx-auto px-4 py-8">
           <AnimatePresence mode="wait">
               <motion.div key={appMode} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                   {renderContent()}
               </motion.div>
           </AnimatePresence>
       </div>
       
       <AnimatePresence>
        {isAutoGeneratorVisible && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAutoGeneratorVisible(false)} className="fixed inset-0 bg-black/60 z-50" />
            <AutoGeneratorView prompts={autoGenPrompts} setPrompts={setAutoGenPrompts} options={autoGenOptions} setOptions={setAutoGenOptions} onStart={handleStartAutoGenerate} disabled={isVideoLoading || isAutoGenerating} onClose={() => setIsAutoGeneratorVisible(false)} saveStatus={saveStatus} projects={projects} onSaveProject={handleSaveProject} onLoadProject={handleLoadProject} onDeleteProject={handleDeleteProject} onExportProject={handleExportProject} onImportProject={handleImportProject} onClearAllPrompts={handleClearAllPrompts} onTranslateAllPrompts={handleTranslateAllPrompts} isTranslatingAll={isTranslatingAllPrompts} />
          </>
        )}
      </AnimatePresence>

       <AnimatePresence>
        {selectedImagePreview && <ImagePreviewModal imageUrl={selectedImagePreview} onClose={handleCloseImagePreview} />}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsVisible && <SettingsView isOpen={isSettingsVisible} onClose={() => setIsSettingsVisible(false)} currentApiKey={apiKey} onSaveApiKey={handleSaveApiKey} />}
      </AnimatePresence>
    </main>
  );
};

export default App;