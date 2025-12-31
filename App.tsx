import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ImagePanel } from './components/ImagePanel';
import { TextPanel } from './components/TextPanel';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { ScreenCropper } from './components/ScreenCropper';
import { SourceSelector } from './components/SourceSelector';

// Import service
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
      let usedFallback = false; // Track if we used PaddleOCR fallback

      if (forceLocal) {
        // Live Mode -> PaddleOCR (fast, for real-time video)
        text = await performLocalOCR(base64Img, 'eng+vie');
      } else {
        // Snip Mode -> Gemini OCR (high quality, accurate)
        try {
          text = await extractTextFromImage(base64Img, settings.aiModel);
        } catch (err: any) {
          const errorMessage = err?.message || String(err);

          // Check if it's a quota error
          if (errorMessage.includes('quota') || errorMessage.includes('429') || errorMessage.includes('exceeded')) {
            console.warn("⚠️ Gemini quota exceeded, falling back to PaddleOCR");
            alert('⚠️ Gemini API quota exceeded!\n\nAutomatically switching to PaddleOCR (free).\nTranslation will use Google Translate.');
          } else {
            console.error("Gemini OCR Failed, fallback to PaddleOCR", err);
          }

          // Fallback to PaddleOCR
          text = await performLocalOCR(base64Img, 'eng+vie');
          usedFallback = true; // Mark that we used fallback
        }
      }

      if (!text || text.trim().length < 2) {
        if (!addToHistory) return;
      }

      setExtractedText(text);

      let finalTranslatedText = "";
      if (text && settings.autoTranslate) {
        // Skip translation if text hasn't changed (live mode deduplication)
        if (forceLocal && text === lastProcessedTextRef.current) {
          console.log('[Live Mode] Text unchanged, skipping translation');
          return; // Don't translate same text again
        }

        if (addToHistory) setIsTranslating(true);
        try {
          // If we used PaddleOCR fallback, also use Google Translate (free)
          if (usedFallback || forceLocal) {
            finalTranslatedText = await translateWithGoogleFree(text, settings.targetLanguage);
            if (forceLocal) {
              lastProcessedTextRef.current = text; // Cache for next comparison
            }
          } else {
            // Snip Mode with Gemini success -> Use Gemini translate
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

  // --- LIVE LOOP: OPTIMIZED FOR PADDLEOCR ---
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isLive && videoRef.current && liveCropRegion) {
      console.log("🟢 Live Mode: ON (PaddleOCR)");

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

        // PaddleOCR handles preprocessing well, so we can simplify
        // Upscale for better quality
        canvas.width = sW * 2;
        canvas.height = sH * 2;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true; // Better quality for upscaling
          ctx.drawImage(video, sX, sY, sW, sH, 0, 0, canvas.width, canvas.height);

          // Optional: Light preprocessing (PaddleOCR handles most cases)
          // Can add contrast enhancement if needed for specific use cases

          const dataUrl = canvas.toDataURL('image/png');
          setImageSrc(dataUrl);

          // Use PaddleOCR for all modes (faster and more accurate)
          await performOCR(dataUrl, false, true);
        }
        canvas.remove();
      };

      captureAndProcess();
      // Reduced interval: PaddleOCR is faster than Tesseract
      intervalId = setInterval(captureAndProcess, 1000); // 1s instead of 2s
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLive, liveCropRegion, performOCR]);

  // --- Các hàm khác giữ nguyên ---
  const stopLiveMode = useCallback(() => {
    setIsLive(false); setIsLiveSetup(false); setLiveSourceId(null); setLiveCropRegion(null);
    lastProcessedTextRef.current = ''; // Reset translation cache
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

  useEffect(() => {
    return () => stopLiveMode();
  }, [stopLiveMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === 'KeyS') { e.preventDefault(); handleSnipScreen(); }
      if (e.code === 'Escape') {
        if (showSourceSelector) setShowSourceSelector(false);
        if (isCropping) handleCropCancel();
        if (showSettings) setShowSettings(false);
        if (showHistory) setShowHistory(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSnipScreen, showSourceSelector, isCropping, handleCropCancel, showSettings, showHistory]);

  return (
    <div className={`min-h-screen flex flex-col ${settings.darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <Header
        onSnipScreen={handleSnipScreen}
        onLiveMode={handleToggleLiveMode}
        isLive={isLive}
        onOpenSettings={() => setShowSettings(true)}
        onOpenHistory={() => setShowHistory(true)}
        darkMode={settings.darkMode}
      />
      {isLive && <div className="bg-red-600 text-white text-center text-sm py-1 font-medium animate-pulse">🔴 LIVE MODE: PaddleOCR (ONNX) + Google Translate Free</div>}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          <div className="h-full">
            <ImagePanel imageSrc={imageSrc} onImageUpload={handleImageUpload} onNewSnip={handleSnipScreen} darkMode={settings.darkMode} />
          </div>
          <div className="h-full">
            <TextPanel title="Extracted Text" placeholder="Text..." text={extractedText} isLoading={isProcessingOCR && !isLive} onCopy={() => copyToClipboard(extractedText)} onRefresh={() => imageSrc && performOCR(imageSrc, true, isLive)} refreshLabel="Re-scan" settings={settings} />
          </div>
          <div className="h-full">
            <TextPanel title={`Translation (${settings.targetLanguage})`} placeholder="Translation..." text={translatedText} isLoading={isTranslating && !isLive} onCopy={() => copyToClipboard(translatedText)} onRefresh={() => handleTranslate(extractedText)} refreshLabel="Re-Translate" actionIcon={<Sparkles />} settings={settings} />
          </div>
        </div>
      </main>
      {isCropping && tempScreenshot && <ScreenCropper imageSrc={tempScreenshot} onComplete={handleCropComplete} onCancel={handleCropCancel} />}
      <SourceSelector isOpen={showSourceSelector} sources={availableSources} onSelect={handleSourceSelect} onCancel={() => setShowSourceSelector(false)} darkMode={settings.darkMode} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} settings={settings} onSettingsChange={setSettings} />
      <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} history={history} onSelect={handleHistorySelect} onDelete={handleHistoryDelete} />
    </div>
  );
};

export default App;