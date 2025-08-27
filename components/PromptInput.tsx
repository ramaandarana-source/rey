import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { enhancePrompt, translatePrompt } from '../services/geminiService';
import { EnhanceIcon, TranslateIcon, SendIcon, MicrophoneIcon, PasteIcon, HistoryIcon, BotIcon } from './icons';

// Types for Web Speech API
interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}

type SpeechRecognitionErrorCode =
  | 'no-speech'
  | 'aborted'
  | 'audio-capture'
  | 'network'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'bad-grammar'
  | 'language-not-supported';
  
interface SpeechRecognitionErrorEvent extends Event {
    readonly error: SpeechRecognitionErrorCode;
    readonly message: string;
}

interface SpeechRecognition extends EventTarget {
    grammars: any;
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    serviceURI: string;

    start(): void;
    stop(): void;
    abort(): void;

    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}


declare global {
    interface Window {
        SpeechRecognition: { new(): SpeechRecognition; };
        webkitSpeechRecognition: { new(): SpeechRecognition; };
    }
}

interface PromptInputProps {
    value: string;
    onChange: (newValue: string | ((prev: string) => string)) => void;
    placeholder: string;
    disabled: boolean;
    heightClassName?: string;
    onSend?: () => void;
    isSending?: boolean;
    onToggleHistory?: () => void;
    onFocusAutoGenerator?: () => void;
}

const PromptIconButton: React.FC<{
    onClick: () => void;
    isLoading: boolean;
    disabled: boolean;
    title: string;
    children: React.ReactNode;
    className?: string;
}> = ({ onClick, isLoading, disabled, title, children, className = '' }) => (
    <motion.button
        type="button"
        onClick={onClick}
        disabled={disabled || isLoading}
        whileTap={{ scale: 0.9 }}
        title={title}
        className={`flex items-center justify-center p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-slate-400 hover:bg-slate-700/50 hover:text-cyan-400 ${className}`}
    >
        <AnimatePresence mode="wait" initial={false}>
            {isLoading ? (
                <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                >
                    <div className="w-5 h-5 flex items-center justify-center">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    key="icon"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="flex items-center"
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    </motion.button>
);


export const PromptInput: React.FC<PromptInputProps> = ({
    value,
    onChange,
    placeholder,
    disabled,
    heightClassName = 'h-40',
    onSend,
    isSending,
    onToggleHistory,
    onFocusAutoGenerator,
}) => {
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const finalTranscriptRef = useRef<string>('');

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameIdRef = useRef<number | null>(null);

    const cleanup = useCallback(() => {
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }
        if (recognitionRef.current) {
            recognitionRef.current.onresult = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.onend = null;
            recognitionRef.current.abort();
            recognitionRef.current = null;
        }
         if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        if (analyserRef.current) {
            analyserRef.current.disconnect();
            analyserRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        setIsRecording(false);
    }, []);
    
    // Unmount cleanup
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);
    
    const draw = useCallback(() => {
        if (!analyserRef.current || !canvasRef.current) return;
        animationFrameIdRef.current = requestAnimationFrame(draw);

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);

        const barWidth = (width / bufferLength) * 2;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i] / 2;
            
            const r = 14;
            const g = 165 + (barHeight / height * 180);
            const b = 233;

            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
            ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            x += barWidth + 2;
        }
    }, []);

    const handleVoiceInput = () => {
        if (isRecording) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        } else {
            const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognitionAPI) {
                setError("Pengenalan suara tidak didukung oleh browser ini.");
                return;
            }

            navigator.mediaDevices.getUserMedia({ audio: true })
              .then(stream => {
                  streamRef.current = stream;
                  audioContextRef.current = new AudioContext();
                  analyserRef.current = audioContextRef.current.createAnalyser();
                  sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
                  sourceRef.current.connect(analyserRef.current);
                  analyserRef.current.fftSize = 128;

                  setIsRecording(true);
                  setError(null);
                  finalTranscriptRef.current = '';

                  recognitionRef.current = new SpeechRecognitionAPI();
                  const recognition = recognitionRef.current;
                  recognition.lang = 'id-ID';
                  recognition.interimResults = false;
                  recognition.continuous = true;

                  recognition.onresult = (event: SpeechRecognitionEvent) => {
                      let transcript = '';
                      for (let i = event.resultIndex; i < event.results.length; ++i) {
                          transcript += event.results[i][0].transcript + ' ';
                      }
                      finalTranscriptRef.current += transcript;
                  };

                  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                      console.error("Kesalahan pengenalan suara:", event.error, event.message);
                      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                          setError("Akses mikrofon ditolak.");
                      } else if (event.error !== 'aborted') {
                          setError("Terjadi kesalahan perekaman.");
                      }
                      cleanup();
                  };

                  recognition.onend = () => {
                      const newTranscript = finalTranscriptRef.current.trim();
                      if (newTranscript) {
                          onChange(prev => (prev ? `${prev.trim()} ${newTranscript}` : newTranscript).trim());
                      }
                      cleanup();
                  };
                  
                  recognition.start();
                  draw();
              })
              .catch(err => {
                  console.error("Gagal mendapatkan media:", err);
                  setError("Akses mikrofon tidak diizinkan.");
                  cleanup();
              });
        }
    };
    const handleEnhance = async () => {
        if (!value.trim()) return;
        setIsEnhancing(true);
        setError(null);
        try {
            const enhanced = await enhancePrompt(value);
            onChange(enhanced);
        } catch (err) {
            console.error("Gagal meningkatkan prompt:", err);
            setError("Gagal meningkatkan prompt.");
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleTranslate = async () => {
        if (!value.trim()) return;
        setIsTranslating(true);
        setError(null);
        try {
            const translated = await translatePrompt(value);
            onChange(translated);
        } catch (err) {
            console.error("Gagal menerjemahkan prompt:", err);
            setError("Gagal menerjemahkan prompt.");
        } finally {
            setIsTranslating(false);
        }
    };

    const handlePasteAndReplace = async () => {
        if (disabled || isRecording) return;
        try {
            const text = await navigator.clipboard.readText();
            onChange(text);
        } catch (err) {
            console.error('Gagal membaca konten clipboard: ', err);
            setError("Gagal membaca clipboard. Pastikan izin telah diberikan.");
        }
    };
    
    return (
        <div className="w-full">
            <label htmlFor="prompt-input" className="block text-sm font-medium text-slate-300 mb-2">
                Prompt
            </label>
            <div className={`relative w-full bg-gray-900/70 border border-slate-700 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-cyan-500 transition-all ${heightClassName}`}>
                <AnimatePresence mode="wait">
                    {isRecording ? (
                        <motion.div
                            key="wave"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center p-4"
                        >
                            <canvas ref={canvasRef} className="w-full h-full" />
                        </motion.div>
                    ) : (
                         <motion.textarea
                            key="textarea"
                            id="prompt-input"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={placeholder}
                            className="absolute inset-0 w-full h-full p-4 bg-transparent border-none focus:ring-0 text-slate-100 placeholder-slate-500 resize-none"
                            required
                            disabled={disabled}
                        />
                    )}
                </AnimatePresence>
            </div>
            <div className="mt-2 flex items-center justify-end">
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900/50 backdrop-blur-sm border border-slate-700/50">
                    <PromptIconButton
                        onClick={handleVoiceInput}
                        isLoading={false}
                        disabled={disabled}
                        title={isRecording ? "Hentikan Perekaman" : "Mulai Perekaman"}
                        className={isRecording ? '!bg-red-600 !text-white hover:!bg-red-500' : ''}
                    >
                        <MicrophoneIcon className="w-5 h-5 "/>
                    </PromptIconButton>
                    <PromptIconButton
                        onClick={handleEnhance}
                        isLoading={isEnhancing}
                        disabled={disabled || !value.trim() || isRecording}
                        title="Tingkatkan Prompt"
                    >
                        <EnhanceIcon className="w-5 h-5" />
                    </PromptIconButton>
                    <PromptIconButton
                        onClick={handleTranslate}
                        isLoading={isTranslating}
                        disabled={disabled || !value.trim() || isRecording}
                        title="Terjemahkan Prompt"
                    >
                        <TranslateIcon className="w-5 h-5" />
                    </PromptIconButton>
                     <PromptIconButton
                        onClick={handlePasteAndReplace}
                        isLoading={false}
                        disabled={disabled || isRecording}
                        title="Tempel & Ganti"
                    >
                        <PasteIcon className="w-5 h-5" />
                    </PromptIconButton>
                    {onToggleHistory && (
                        <PromptIconButton
                            onClick={onToggleHistory}
                            isLoading={false}
                            disabled={disabled || isRecording}
                            title="Riwayat Prompt"
                        >
                            <HistoryIcon className="w-5 h-5" />
                        </PromptIconButton>
                    )}
                    {onFocusAutoGenerator && (
                        <PromptIconButton
                            onClick={onFocusAutoGenerator}
                            isLoading={false}
                            disabled={disabled || isRecording}
                            title="Fokus ke Auto-Generate"
                        >
                            <BotIcon className="w-5 h-5" />
                        </PromptIconButton>
                    )}
                    {onSend && (
                        <PromptIconButton
                            onClick={onSend}
                            isLoading={isSending || false}
                            disabled={disabled || !value.trim() || isRecording}
                            title="Buat"
                            className="!px-3 !gap-1.5"
                        >
                            <>
                                <SendIcon className="w-5 h-5" />
                                <span className="font-semibold text-sm">BUAT</span>
                            </>
                        </PromptIconButton>
                    )}
                </div>
            </div>
            {error && <p className="mt-1 text-xs text-red-400 font-mono text-right">{error}</p>}
        </div>
    );
};