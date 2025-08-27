import React, { useState, useEffect, useCallback } from 'react';

type Mode = 'trim' | 'compress' | 'vid2mp3' | 'imgconvert' | 'livestream';

interface HistoryItem {
    filename: string;
    title: string;
    command: string;
    duration: string;
}

const LS_HISTORY_KEY = 'ffmpegTool_history';

const formatUnit = (num: number | string) => String(num || 0).padStart(2, '0');

function timeStringToSeconds(timeStr: string) {
    const [h, m, s] = (timeStr || "00:00:00").split(':').map(Number);
    return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
}

function secondsToTimeString(totalSeconds: number) {
    if (totalSeconds < 0) totalSeconds = 0;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${formatUnit(h)}:${formatUnit(m)}:${formatUnit(s)}`;
}

export const FfmpegToolView: React.FC = () => {
    const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
    const [currentMode, setCurrentMode] = useState<Mode>('trim');
    const [inputFile, setInputFile] = useState('');
    const [outputFile, setOutputFile] = useState('');
    const [command, setCommand] = useState('');

    // State for Trim
    const [timeRangeInput, setTimeRangeInput] = useState('');
    const [startTime, setStartTime] = useState({ h: 0, m: 0, s: 0 });
    const [endTime, setEndTime] = useState({ h: 0, m: 0, s: 0 });

    // State for Compress
    const [crf, setCrf] = useState(23);
    const [preset, setPreset] = useState('slow');
    const [audioBitrate, setAudioBitrate] = useState('128k');
    
    // State for Vid2Mp3
    const [mp3AudioBitrate, setMp3AudioBitrate] = useState('192k');

    // State for ImgConvert
    const [imgInputFormat, setImgInputFormat] = useState('jpg');
    const [imgOutputFormat, setImgOutputFormat] = useState('png');

    // State for Livestream
    const [streamKey, setStreamKey] = useState('');
    const [streamBitrate, setStreamBitrate] = useState('4500k');
    const [streamPreset, setStreamPreset] = useState('veryfast');
    const [loopStream, setLoopStream] = useState(true);

    const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});

    // Load history from localStorage on mount
    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem(LS_HISTORY_KEY);
            if (storedHistory) {
                setHistoryData(JSON.parse(storedHistory));
            }
        } catch (error) {
            console.error("Failed to load history from localStorage", error);
        }
    }, []);

    const saveHistory = useCallback((newHistory: HistoryItem[]) => {
        try {
            localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(newHistory));
        } catch (error) {
            console.error("Failed to save history to localStorage", error);
        }
    }, []);

    const addHistoryItem = useCallback((itemData: HistoryItem) => {
        setHistoryData(prevHistory => {
            if (!prevHistory.some(item => item.filename === itemData.filename)) {
                const updatedHistory = [...prevHistory, itemData];
                saveHistory(updatedHistory);
                return updatedHistory;
            }
            return prevHistory;
        });
    }, [saveHistory]);
    
    const generateCommand = useCallback(() => {
        const input = inputFile.trim() || 'input_file';
        const output = outputFile.trim() || 'output_file';
        let newCommand = '';

        switch (currentMode) {
            case 'trim':
                const start = `${formatUnit(startTime.h)}:${formatUnit(startTime.m)}:${formatUnit(startTime.s)}`;
                const end = `${formatUnit(endTime.h)}:${formatUnit(endTime.m)}:${formatUnit(endTime.s)}`;
                newCommand = `ffmpeg -i ${input}.mp4 -ss ${start} -to ${end} -c copy ${output}.mp4`;
                break;
            case 'compress':
                newCommand = `ffmpeg -i ${input}.mp4 -c:v libx264 -crf ${crf} -preset ${preset} -c:a aac -b:a ${audioBitrate} ${output}.mp4`;
                break;
            case 'vid2mp3':
                newCommand = `ffmpeg -i ${input}.mp4 -vn -b:a ${mp3AudioBitrate} ${output}.mp3`;
                break;
            case 'imgconvert':
                newCommand = `ffmpeg -i ${input}.${imgInputFormat} ${output}.${imgOutputFormat}`;
                break;
            case 'livestream':
                const key = streamKey.trim() || 'PASTE_YOUR_KEY_HERE';
                const loop = loopStream ? '-stream_loop -1' : '';
                const youtubeUrl = "rtmp://a.rtmp.youtube.com/live2/";
                newCommand = `ffmpeg ${loop} -re -i ${input}.mp4 -c:v libx264 -preset ${streamPreset} -b:v ${streamBitrate} -maxrate ${streamBitrate} -bufsize ${parseInt(streamBitrate) * 2}k -pix_fmt yuv420p -g 60 -c:a aac -b:a 128k -ar 44100 -f flv "${youtubeUrl}${key}"`;
                break;
        }
        setCommand(newCommand);
    }, [inputFile, outputFile, currentMode, startTime, endTime, crf, preset, audioBitrate, mp3AudioBitrate, imgInputFormat, imgOutputFormat, streamKey, streamBitrate, streamPreset, loopStream]);

    useEffect(() => {
        generateCommand();
    }, [generateCommand]);

    const handleInputFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.trim();
        setInputFile(value);
        if (/^\d+$/.test(value)) {
            setOutputFile(`${value}a`);
        }
    };
    
    const switchTab = (mode: Mode) => {
        setCurrentMode(mode);
    };

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopyStatus(prev => ({ ...prev, [id]: true }));
            setTimeout(() => {
                setCopyStatus(prev => ({ ...prev, [id]: false }));
            }, 2000);
        });
    };

    const handleMainCopy = () => {
        handleCopy('main', command);
        const output = outputFile.trim();
        const match = output.match(/^(\d+)([a-zA-Z])$/);

        if (match || output) {
            let duration = '';
            if (currentMode === 'trim') {
                const startSeconds = startTime.h * 3600 + startTime.m * 60 + startTime.s;
                const endSeconds = endTime.h * 3600 + endTime.m * 60 + endTime.s;
                duration = secondsToTimeString(endSeconds - startSeconds);
            }
            addHistoryItem({ filename: output, title: '', command, duration });

            if (match) {
                const nextLetter = String.fromCharCode(match[2].charCodeAt(0) + 1);
                setOutputFile(`${match[1]}${nextLetter}`);
            }
        }
    };
    
    const updateTimeFromPaste = (text: string) => {
        const match = text.match(/(\d{2}:\d{2}:\d{2})\s*-\s*(\d{2}:\d{2}:\d{2})/);
        if (match) {
            const startSec = timeStringToSeconds(match[1]) - 5;
            const endSec = timeStringToSeconds(match[2]) + 5;
            const start = secondsToTimeString(startSec);
            const end = secondsToTimeString(endSec);
            const [sh, sm, ss] = start.split(':').map(Number);
            const [eh, em, es] = end.split(':').map(Number);
            setStartTime({ h: sh, m: sm, s: ss });
            setEndTime({ h: eh, m: em, s: es });
        }
    };

    const handlePasteTimeRange = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setTimeRangeInput(text);
            updateTimeFromPaste(text);
        } catch (err) {
            console.error('Failed to read clipboard:', err);
        }
    };

    const updateTimeSpinner = (
      time: {h: number, m: number, s: number},
      setTime: React.Dispatch<React.SetStateAction<{h: number, m: number, s: number}>>,
      unit: 'h' | 'm' | 's',
      action: 'increment' | 'decrement'
    ) => {
        let totalSeconds = time.h * 3600 + time.m * 60 + time.s;
        const amount = unit === 'h' ? 3600 : unit === 'm' ? 60 : 1;
        totalSeconds = action === 'increment' ? totalSeconds + amount : totalSeconds - amount;
        if (totalSeconds < 0) totalSeconds = 0;
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = Math.floor(totalSeconds % 60);
        setTime({ h, m, s });
    };

    const TimeSpinner: React.FC<{
        time: { h: number; m: number; s: number };
        setTime: React.Dispatch<React.SetStateAction<{ h: number; m: number; s: number }>>;
        prefix: string;
    }> = ({ time, setTime, prefix }) => (
        <div className="flex items-center space-x-1 sm:space-x-2">
            {(['h', 'm', 's'] as const).map((unit, index) => (
                <React.Fragment key={unit}>
                    <div className="flex items-center rounded-md bg-transparent border border-slate-700">
                        <button onClick={() => updateTimeSpinner(time, setTime, unit, 'decrement')} className="px-2 sm:px-3 py-1.5 hover:bg-slate-800 rounded-l-sm">-</button>
                        <input type="number" value={time[unit]} onChange={e => setTime(t => ({...t, [unit]: parseInt(e.target.value) || 0}))} min="0" max={unit === 'h' ? 99 : 59} className="w-10 sm:w-12 text-center bg-transparent focus:outline-none text-base sm:text-lg text-slate-200"/>
                        <button onClick={() => updateTimeSpinner(time, setTime, unit, 'increment')} className="px-2 sm:px-3 py-1.5 hover:bg-slate-800 rounded-r-sm">+</button>
                    </div>
                    {index < 2 && <span className="text-base sm:text-xl font-bold text-slate-500">:</span>}
                </React.Fragment>
            ))}
        </div>
    );
    
    const deleteHistoryItem = (index: number) => {
        setHistoryData(prev => {
            const newHistory = [...prev];
            newHistory.splice(index, 1);
            saveHistory(newHistory);
            return newHistory;
        });
    };
    
    const updateHistoryTitle = (index: number, title: string) => {
        setHistoryData(prev => {
            const newHistory = prev.map((item, i) => i === index ? { ...item, title } : item);
            saveHistory(newHistory); // Save on every keystroke
            return newHistory;
        });
    };

    const clearHistory = () => {
        if (window.confirm('Apakah Anda yakin ingin menghapus semua riwayat?')) {
            setHistoryData([]);
            saveHistory([]);
        }
    };
    
    const inputExt = currentMode === 'vid2mp3' ? '.mp4' : currentMode === 'imgconvert' ? `.${imgInputFormat}` : '.mp4';
    const outputExt = currentMode === 'vid2mp3' ? '.mp3' : currentMode === 'imgconvert' ? `.${imgOutputFormat}` : '.mp4';

    const TabButton: React.FC<{ mode: Mode; label: string }> = ({ mode, label }) => (
        <button onClick={() => switchTab(mode)} className={`tab-btn py-2 px-3 sm:px-6 text-xs sm:text-sm border-b-2 transition-colors ${currentMode === mode ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300' : 'text-slate-400 border-transparent hover:text-slate-200'}`}>{label}</button>
    );

    const commonInputClasses = "bg-transparent border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-200 text-sm rounded-md block w-full p-2 sm:p-2.5";
    
    return (
        <div className="font-mono text-slate-200 space-y-8">
            <div className="bg-gray-900/50 backdrop-blur-md border border-cyan-500/20 rounded-xl panel-glow p-6 sm:p-8 w-full max-w-5xl mx-auto">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center text-slate-100">[ FFMPEG MULTI-TOOL ]</h1>
                <p className="text-xs sm:text-sm text-slate-400 mb-8 text-center">// Select operation mode</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label htmlFor="input-file" className="block mb-2 text-xs sm:text-sm tracking-widest text-slate-400">INPUT_FILE</label>
                        <div className="relative">
                            <input type="text" id="input-file" value={inputFile} onChange={handleInputFileChange} className={commonInputClasses + " pr-12"} placeholder="source_file" />
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 font-bold">{inputExt}</span>
                        </div>
                    </div>
                     {currentMode !== 'livestream' && (
                        <div>
                            <label htmlFor="output-file" className="block mb-2 text-xs sm:text-sm tracking-widest text-slate-400">OUTPUT_FILE</label>
                            <div className="relative">
                                <input type="text" id="output-file" value={outputFile} onChange={e => setOutputFile(e.target.value)} className={commonInputClasses + " pr-12"} placeholder="processed_file" />
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 font-bold">{outputExt}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex border-b border-cyan-500/20 mb-6 flex-wrap">
                    <TabButton mode="trim" label="TRIM" />
                    <TabButton mode="compress" label="COMPRESS" />
                    <TabButton mode="vid2mp3" label="VID->MP3" />
                    <TabButton mode="imgconvert" label="IMG CONV" />
                    <TabButton mode="livestream" label="LIVESTREAM" />
                </div>
                
                <div className="space-y-6">
                    {currentMode === 'trim' && (
                        <>
                         <div>
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="time-range-input" className="text-xs sm:text-sm tracking-widest text-slate-400">PASTE TIME RANGE</label>
                                <button onClick={handlePasteTimeRange} className="bg-transparent border border-cyan-700 text-cyan-400 px-3 py-1 rounded-md hover:bg-cyan-900/50 transition-colors text-xs">PASTE</button>
                            </div>
                            <textarea id="time-range-input" rows={2} value={timeRangeInput} onChange={e => { setTimeRangeInput(e.target.value); updateTimeFromPaste(e.target.value); }} className={commonInputClasses} placeholder="e.g., 00:28:34 - 00:29:02"></textarea>
                        </div>
                        <hr className="border-slate-800"/>
                        <div><label className="block mb-2 text-xs sm:text-sm tracking-widest text-slate-400">START_TIME</label><TimeSpinner time={startTime} setTime={setStartTime} prefix="start" /></div>
                        <div><label className="block mb-2 text-xs sm:text-sm tracking-widest text-slate-400">END_TIME</label><TimeSpinner time={endTime} setTime={setEndTime} prefix="end" /></div>
                        </>
                    )}
                     {currentMode === 'compress' && (
                        <>
                         <div>
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="crf" className="text-xs sm:text-sm tracking-widest text-slate-400">QUALITY (CRF)</label>
                                <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-sm">{crf}</span>
                            </div>
                            <input type="range" id="crf" min="18" max="28" value={crf} onChange={e => setCrf(Number(e.target.value))} className="p-0 h-1 styled-slider" />
                        </div>
                        <div>
                            <label htmlFor="preset" className="block mb-2 text-xs sm:text-sm tracking-widest text-slate-400">ENCODING_PRESET</label>
                            <select id="preset" value={preset} onChange={e => setPreset(e.target.value)} className={commonInputClasses + " ffmpeg-select"}>
                                {['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow'].map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                             <label htmlFor="audio-bitrate" className="block mb-2 text-xs sm:text-sm tracking-widest text-slate-400">AUDIO_BITRATE</label>
                            <select id="audio-bitrate" value={audioBitrate} onChange={e => setAudioBitrate(e.target.value)} className={commonInputClasses + " ffmpeg-select"}>
                                {['96k', '128k', '192k', '256k', '320k'].map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        </>
                    )}
                    {currentMode === 'vid2mp3' && (
                         <div>
                            <label htmlFor="mp3-audio-bitrate" className="block mb-2 text-xs sm:text-sm tracking-widest text-slate-400">AUDIO_BITRATE</label>
                             <select id="mp3-audio-bitrate" value={mp3AudioBitrate} onChange={e => setMp3AudioBitrate(e.target.value)} className={commonInputClasses + " ffmpeg-select"}>
                                 {['128k', '192k', '256k', '320k'].map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                    )}
                    {currentMode === 'imgconvert' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="img-input-format" className="block mb-2 text-xs sm:text-sm tracking-widest text-slate-400">FROM_FORMAT</label>
                                <select id="img-input-format" value={imgInputFormat} onChange={e => setImgInputFormat(e.target.value)} className={commonInputClasses + " ffmpeg-select"}>
                                    {['jpg', 'png', 'webp', 'gif', 'bmp', 'tiff'].map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="img-output-format" className="block mb-2 text-xs sm:text-sm tracking-widest text-slate-400">TO_FORMAT</label>
                                <select id="img-output-format" value={imgOutputFormat} onChange={e => setImgOutputFormat(e.target.value)} className={commonInputClasses + " ffmpeg-select"}>
                                    {['jpg', 'png', 'webp', 'gif', 'bmp', 'tiff'].map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                    {currentMode === 'livestream' && (
                        <>
                        <div>
                            <label htmlFor="stream-key" className="block mb-2 text-xs sm:text-sm tracking-widest text-slate-400">YOUTUBE_STREAM_KEY</label>
                            <input type="text" id="stream-key" value={streamKey} onChange={e => setStreamKey(e.target.value)} className={commonInputClasses} placeholder="xxxx-xxxx-xxxx-xxxx (ditemukan di YouTube Studio)"/>
                        </div>
                         <div>
                            <label htmlFor="stream-bitrate" className="block mb-2 text-xs sm:text-sm tracking-widest text-slate-400">VIDEO_BITRATE</label>
                            <select id="stream-bitrate" value={streamBitrate} onChange={e => setStreamBitrate(e.target.value)} className={commonInputClasses + " ffmpeg-select"}>
                                 {Object.entries({'2500k': '720p', '4500k': '1080p', '6000k': '1080p@60fps', '9000k': '1440p'}).map(([rate, label]) => <option key={rate} value={rate}>{`${rate} (${label})`}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="stream-preset" className="block mb-2 text-xs sm:text-sm tracking-widest text-slate-400">ENCODING_PRESET (CPU USAGE)</label>
                            <select id="stream-preset" value={streamPreset} onChange={e => setStreamPreset(e.target.value)} className={commonInputClasses + " ffmpeg-select"}>
                                 {['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium'].map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                         <div className="flex items-center mt-4">
                            <input id="loop-stream" type="checkbox" checked={loopStream} onChange={e => setLoopStream(e.target.checked)} className="w-5 h-5 bg-transparent border-slate-600 text-cyan-400 focus:ring-cyan-500 ring-offset-black rounded"/>
                            <label htmlFor="loop-stream" className="ml-3 text-xs sm:text-sm tracking-widest text-slate-400">LOOP VIDEO (24/7 STREAM)</label>
                        </div>
                        </>
                    )}
                </div>

                <div className="mt-10">
                    <label className="block mb-2 text-xs sm:text-sm font-semibold tracking-widest text-slate-400">EXECUTABLE_COMMAND:</label>
                    <div className="relative bg-slate-900/70 rounded-md p-4 border border-slate-700 text-sm sm:text-base min-h-[80px]">
                        <span className="text-cyan-500 mr-2">$</span>
                        <code className="break-words whitespace-pre-wrap">{command}</code>
                        <button onClick={handleMainCopy} className="absolute top-2.5 right-2.5 bg-transparent border border-cyan-700 text-cyan-400 p-2 rounded-md hover:bg-cyan-900/50 transition-colors text-xs">
                           {copyStatus['main'] ? 'COPIED!' : 'COPY'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-md border border-cyan-500/20 rounded-xl panel-glow p-6 sm:p-8 w-full max-w-5xl mx-auto">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg sm:text-xl font-bold tracking-widest text-slate-100">OUTPUT_FILES_LOG</h2>
                    <button onClick={clearHistory} className="bg-red-900/50 border border-red-600 text-red-400 px-3 py-1 rounded-md hover:bg-red-800/50 transition-colors text-xs">HAPUS SEMUA</button>
                </div>
                 <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {historyData.length === 0 ? (
                        <p className="text-slate-600 text-sm">// Belum ada riwayat...</p>
                    ) : (
                        [...historyData].reverse().map((item, reverseIndex) => {
                            const originalIndex = historyData.length - 1 - reverseIndex;
                            const historyItemId = `history-${originalIndex}`;
                            return (
                                <div key={originalIndex} className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 space-y-3">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-grow">
                                             <input type="text" value={item.title} onChange={e => updateHistoryTitle(originalIndex, e.target.value)} className="history-title-input w-full bg-transparent border-b border-slate-700 focus:border-cyan-500 focus:ring-0 text-slate-200 text-sm sm:text-base p-1 mb-2" placeholder={`Beri judul untuk ${item.filename}...`} />
                                            <div className="flex items-center gap-4">
                                                <code className="text-cyan-400 font-semibold text-sm">{item.filename}</code>
                                                {item.duration && <span className="text-xs bg-slate-800 px-2 py-1 rounded">{item.duration}</span>}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <button onClick={() => deleteHistoryItem(originalIndex)} className="text-red-500 hover:text-red-300 font-bold px-2 text-lg">×</button>
                                            <button onClick={() => handleCopy(historyItemId, item.command)} className="bg-transparent border border-cyan-700 text-cyan-400 px-2 py-1 rounded-md hover:bg-cyan-900/50 transition-colors text-xs">{copyStatus[historyItemId] ? 'COPIED' : 'COPY CMD'}</button>
                                        </div>
                                    </div>
                                     <div>
                                        <pre><code className="text-slate-400 text-xs bg-slate-950/70 border border-slate-800 rounded p-2 block whitespace-pre-wrap break-all">{item.command}</code></pre>
                                    </div>
                                </div>
                            );
                        })
                    )}
                 </div>
            </div>
        </div>
    );
};