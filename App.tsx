import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ImagePanel } from './components/ImagePanel';
import { TextPanel } from './components/TextPanel';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { ScreenCropper } from './components/ScreenCropper';
import { SourceSelector } from './components/SourceSelector';

// Import services
import { extractTextFromImage, translateText as translateWithGemini } from './services/geminiService';
import { performLocalOCR } from './services/paddleOCRService';
import { translateWithGoogleFree } from './services/googleTranslate';

import { Sparkles } from 'lucide-react';
import { AppSettings, HistoryItem } from './types';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

declare global {
  interface Window {
    electronAPI?: {
      getScreenSources: () => Promise<any[]>;
      performOCR: (imageBase64: string) => Promise<string>;
    };
  }
}

const App: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [translatedText, setTranslatedText] = useState<string>("");
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [availableSources, setAvailableSources] = useState<any[]>([]);
  const [tempScreenshot, setTempScreenshot] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [settings, setSettings] = useState<AppSettings>({
    aiModel: 'gemini-2.5-flash',
    targetLanguage: 'Vietnamese',
    autoTranslate: true,
    darkMode: false,
    fontType: 'sans',
    fontSize: 16
  });

  const [isLive, setIsLive] = useState(false);
  const [liveSourceId, setLiveSourceId] = useState<string | null>(null);
  const [isLiveSetup, setIsLiveSetup] = useState(false);
  const [liveCropRegion, setLiveCropRegion] = useState<CropArea | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastProcessedTextRef = useRef<string>('');

  // --- EFFECT: Xử lý Dark Mode toàn cục ---
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [settings.darkMode]);

  // --- Handlers ---
  const handleTranslate = useCallback(async (text: string) => {
    if (!text) return;
    setIsTranslating(true);
    try {
      const result = await translateWithGemini(text, settings.targetLanguage, settings.aiModel);
      setTranslatedText(result);
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      setIsTranslating(false);
    }
  }, [settings]);

  // --- LOGIC OCR HYBRID ---
  const performOCR = useCallback(async (base64Img: string, addToHistory: boolean = true, forceLocal: boolean = false) => {
    if (!base64Img) return;
    if (addToHistory) setIsProcessingOCR(true);

    try {
      let text = "";
      let usedFallback = false;

      if (forceLocal) {
        text = await performLocalOCR(base64Img, 'eng+vie');
      } else {
        try {
          text = await extractTextFromImage(base64Img, settings.aiModel);
        } catch (err: any) {
          const errorMessage = err?.message || String(err);
          if (errorMessage.includes('quota') || errorMessage.includes('429')) {
            console.warn("⚠️ Gemini quota exceeded, falling back to PaddleOCR");
            // Có thể thêm toast notification ở đây
          }
          text = await performLocalOCR(base64Img, 'eng+vie');
          usedFallback = true;
        }
      }

      if (!text || text.trim().length < 2) {
        if (!addToHistory) return;
      }

      setExtractedText(text);

      let finalTranslatedText = "";
      if (text && settings.autoTranslate) {
        if (forceLocal && text === lastProcessedTextRef.current) {
          return;
        }

        if (addToHistory) setIsTranslating(true);
        try {
          if (usedFallback || forceLocal) {
            finalTranslatedText = await translateWithGoogleFree(text, settings.targetLanguage);
            if (forceLocal) {
              lastProcessedTextRef.current = text;
            }
          } else {
            finalTranslatedText = await translateWithGemini(text, settings.targetLanguage, settings.aiModel);
          }
          setTranslatedText(finalTranslatedText);
        } catch (error) {
          console.error("Auto-translate error:", error);
        } finally {
          setIsTranslating(false);
        }
      }

      if (addToHistory) {
        const newItem: HistoryItem = {
          id: crypto.randomUUID(),
          imageSrc: base64Img,
          extractedText: text,
          translatedText: finalTranslatedText,
          timestamp: Date.now()
        };
        setHistory(prev => [newItem, ...prev]);
      }
    } catch (error) {
      console.error("OCR Error:", error);
    } finally {
      setIsProcessingOCR(false);
    }
  }, [settings]);

  // --- LIVE LOOP ---
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isLive && videoRef.current && liveCropRegion) {
      const captureAndProcess = async () => {
        if (!videoRef.current || !liveCropRegion) return;
        const video = videoRef.current;
        if (video.paused) await video.play().catch(console.error);
        if (video.readyState < 2 || video.videoWidth === 0) return;

        const canvas = document.createElement('canvas');
        const sX = liveCropRegion.x * video.videoWidth;
        const sY = liveCropRegion.y * video.videoHeight;
        const sW = liveCropRegion.width * video.videoWidth;
        const sH = liveCropRegion.height * video.videoHeight;

        if (sW <= 0 || sH <= 0) return;

        canvas.width = sW * 2;
        canvas.height = sH * 2;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(video, sX, sY, sW, sH, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png');
          setImageSrc(dataUrl);
          await performOCR(dataUrl, false, true);
        }
        canvas.remove();
      };

      captureAndProcess();
      intervalId = setInterval(captureAndProcess, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLive, liveCropRegion, performOCR]);

  // --- Stop & Clean up Live Mode ---
  const stopLiveMode = useCallback(() => {
    setIsLive(false); setIsLiveSetup(false); setLiveSourceId(null); setLiveCropRegion(null);
    lastProcessedTextRef.current = '';
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) { videoRef.current.remove(); videoRef.current = null; }
  }, []);

  const handleToggleLiveMode = useCallback(async () => {
    if (isLive) stopLiveMode();
    else {
      if (!window.electronAPI) return alert("Desktop App Only!");
      try {
        const sources = await window.electronAPI.getScreenSources();
        setAvailableSources(sources); setShowSourceSelector(true); setLiveSourceId("PENDING");
      } catch (error) { console.error("Lỗi lấy nguồn:", error); }
    }
  }, [isLive, stopLiveMode]);

  const handleSourceSelect = async (sourceId: string) => {
    setShowSourceSelector(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: sourceId, minWidth: 1280, maxWidth: 1920 } } as any
      });

      const video = document.createElement('video');
      video.style.cssText = "position:fixed; top:-10000px; left:0; width:1px; height:1px; opacity:0; z-index:9999;";
      document.body.appendChild(video);
      video.srcObject = stream;
      video.autoplay = true; video.muted = true;
      await video.play();

      await new Promise<void>(r => { if (video.readyState >= 2) r(); else video.onloadedmetadata = () => r(); });
      await new Promise(r => setTimeout(r, 500));

      if (liveSourceId === "PENDING") {
        setLiveSourceId(sourceId); streamRef.current = stream; videoRef.current = video;
        const canvas = document.createElement('canvas'); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        setTempScreenshot(canvas.toDataURL('image/png'));
        canvas.remove();
        setIsLiveSetup(true); setIsCropping(true);
      } else {
        const canvas = document.createElement('canvas'); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        stream.getTracks().forEach(t => t.stop()); video.remove(); canvas.remove();
        setTempScreenshot(dataUrl); setIsCropping(true);
      }
    } catch (err) { console.error("Lỗi:", err); stopLiveMode(); }
  };

  const handleSnipScreen = useCallback(async () => {
    if (isLive) stopLiveMode();
    if (!window.electronAPI) return;
    try {
      const sources = await window.electronAPI.getScreenSources();
      setAvailableSources(sources); setShowSourceSelector(true); setLiveSourceId(null);
    } catch (error) { console.error(error); }
  }, [isLive, stopLiveMode]);

  const handleCropCancel = useCallback(() => {
    setIsCropping(false); setTempScreenshot(null); if (isLiveSetup) stopLiveMode();
  }, [isLiveSetup, stopLiveMode]);

  const handleCropComplete = (croppedImage: string, cropPercent: CropArea) => {
    setIsCropping(false); setTempScreenshot(null);
    if (isLiveSetup) {
      setImageSrc(croppedImage); setLiveCropRegion(cropPercent); setIsLive(true); setIsLiveSetup(false);
    } else {
      setImageSrc(croppedImage);
      performOCR(croppedImage, true, false);
    }
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => { setImageSrc(e.target?.result as string); performOCR(e.target?.result as string, true, false); };
    reader.readAsDataURL(file);
  };

  const handleHistorySelect = (item: HistoryItem) => {
    if (isLive) stopLiveMode();
    setImageSrc(item.imageSrc); setExtractedText(item.extractedText); setTranslatedText(item.translatedText);
  };
  const handleHistoryDelete = (id: string) => setHistory(prev => prev.filter(item => item.id !== id));
  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  // --- UI RENDER ---
  // Lưu ý: Không còn hardcode bg-gray-900 hay bg-gray-50 nữa. Màu nền sẽ do <body> (cấu hình trong index.css) quản lý.
  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      <Header
        onSnipScreen={handleSnipScreen}
        onLiveMode={handleToggleLiveMode}
        isLive={isLive}
        onOpenSettings={() => setShowSettings(true)}
        onOpenHistory={() => setShowHistory(true)}
      />

      {isLive && (
        <div className="bg-red-600 text-white text-center text-xs py-1 font-bold tracking-wider animate-pulse uppercase shadow-md z-30">
          🔴 Live Mode Active: PaddleOCR + Google Translate
        </div>
      )}

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          <div className="h-full">
            <ImagePanel
              imageSrc={imageSrc}
              onImageUpload={handleImageUpload}
              onNewSnip={handleSnipScreen}
            />
          </div>
          <div className="h-full">
            <TextPanel
              title="Extracted Text"
              placeholder="Waiting for text..."
              text={extractedText}
              isLoading={isProcessingOCR && !isLive}
              onCopy={() => copyToClipboard(extractedText)}
              onRefresh={() => imageSrc && performOCR(imageSrc, true, isLive)}
              refreshLabel="Re-scan"
              settings={settings}
            />
          </div>
          <div className="h-full">
            <TextPanel
              title={`Translation (${settings.targetLanguage})`}
              placeholder="Translation result..."
              text={translatedText}
              isLoading={isTranslating && !isLive}
              onCopy={() => copyToClipboard(translatedText)}
              onRefresh={() => handleTranslate(extractedText)}
              refreshLabel="Re-Translate"
              actionIcon={<Sparkles />}
              settings={settings}
            />
          </div>
        </div>
      </main>

      {isCropping && tempScreenshot && <ScreenCropper imageSrc={tempScreenshot} onComplete={handleCropComplete} onCancel={handleCropCancel} />}
      <SourceSelector isOpen={showSourceSelector} sources={availableSources} onSelect={handleSourceSelect} onCancel={() => setShowSourceSelector(false)} darkMode={settings.darkMode} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} settings={settings} onSettingsChange={setSettings} darkMode={settings.darkMode} />
      <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} history={history} onSelect={handleHistorySelect} onDelete={handleHistoryDelete} darkMode={settings.darkMode} />
    </div>
  );
};

export default App;