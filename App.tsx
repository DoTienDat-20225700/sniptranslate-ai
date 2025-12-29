import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ImagePanel } from './components/ImagePanel';
import { TextPanel } from './components/TextPanel';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { ScreenCropper } from './components/ScreenCropper';
import { SourceSelector } from './components/SourceSelector';

// Import các services
import { extractTextFromImage, translateText as translateWithGemini } from './services/geminiService';
import { performLocalOCR } from './services/ocrService';
import { translateWithGoogleFree } from './services/googleTranslate'; // <--- Import mới

import { Sparkles } from 'lucide-react';
import { AppSettings, HistoryItem } from './types';

interface CropArea {
  x: number; y: number; width: number; height: number;
}

declare global {
  interface Window {
    electronAPI?: {
      getScreenSources: () => Promise<any[]>;
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
  
  // Model mặc định cho Snip
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

  // --- Handlers ---
  const handleTranslate = useCallback(async (text: string) => {
    if (!text) return;
    setIsTranslating(true);
    try {
      // Nút "Re-Translate" thủ công thì vẫn ưu tiên dùng Gemini cho xịn
      const result = await translateWithGemini(text, settings.targetLanguage, settings.aiModel);
      setTranslatedText(result);
    } catch (error) { console.error(error); } 
    finally { setIsTranslating(false); }
  }, [settings]);

  // --- LOGIC XỬ LÝ CHÍNH ---
  const performOCR = useCallback(async (base64Img: string, addToHistory: boolean = true, forceLocal: boolean = false) => {
    if (!base64Img) return;
    if (addToHistory) setIsProcessingOCR(true);
    
    try {
      let text = "";

      // 1. GIAI ĐOẠN OCR
      if (forceLocal) {
        // Live Mode -> Tesseract
        text = await performLocalOCR(base64Img, 'eng+vie');
      } else {
        // Snip Mode -> Gemini
        try {
           text = await extractTextFromImage(base64Img, settings.aiModel);
        } catch (err) {
           console.error("Gemini OCR Failed, fallback to Tesseract", err);
           text = await performLocalOCR(base64Img, 'eng+vie');
        }
      }

      if (!text || text.trim().length === 0) {
          if (!addToHistory) return;
      }

      setExtractedText(text);

      let finalTranslatedText = "";

      // 2. GIAI ĐOẠN DỊCH (SỬA ĐỔI QUAN TRỌNG)
      if (text && settings.autoTranslate) {
        if (addToHistory) setIsTranslating(true);
        try {
          if (forceLocal) {
            // CASE A: LIVE MODE -> Dùng Google Translate Free (Không tốn Token)
            // console.log("Translating with Google Free...");
            finalTranslatedText = await translateWithGoogleFree(text, settings.targetLanguage);
          } else {
            // CASE B: SNIP MODE -> Dùng Gemini (Dịch hay hơn, văn cảnh tốt hơn)
            // console.log("Translating with Gemini AI...");
            finalTranslatedText = await translateWithGemini(text, settings.targetLanguage, settings.aiModel);
          }
          
          setTranslatedText(finalTranslatedText);
        } catch (error) {
          console.error("Translation Error:", error);
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
      console.error("Process Error:", error);
    } finally {
      setIsProcessingOCR(false);
    }
  }, [settings]);

  // --- Live Loop ---
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isLive && videoRef.current && liveCropRegion) {
      console.log("🟢 Live Mode: ON");

      const captureAndProcess = async () => {
        if (!videoRef.current || !liveCropRegion) return;
        const video = videoRef.current;
        if (video.paused) await video.play().catch(() => {});
        if (video.readyState < 2 || video.videoWidth === 0) return;

        const canvas = document.createElement('canvas');
        
        const sX = liveCropRegion.x * video.videoWidth;
        const sY = liveCropRegion.y * video.videoHeight;
        const sW = liveCropRegion.width * video.videoWidth;
        const sH = liveCropRegion.height * video.videoHeight;

        if (sW <= 0 || sH <= 0) return;

        // Upscale 2.5 lần để chữ rõ nét
        canvas.width = sW * 2.5;
        canvas.height = sH * 2.5;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
           ctx.imageSmoothingEnabled = false; 
           ctx.drawImage(video, sX, sY, sW, sH, 0, 0, canvas.width, canvas.height);

           const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
           const data = imageData.data;
           
           // --- THUẬT TOÁN KHOẢNG CÁCH MÀU (COLOR DISTANCE) ---
           // Mục tiêu: Chỉ giữ lại màu trắng phụ đề (#FFFFFF)
           
           // Ngưỡng sai số: Càng nhỏ càng lọc kỹ (Chỉ lấy trắng tinh)
           // 30-50 là mức an toàn cho phụ đề
           const limit = 45; 

           for (let i = 0; i < data.length; i += 4) {
               const r = data[i];
               const g = data[i + 1];
               const b = data[i + 2];
               
               // Tính khoảng cách từ màu hiện tại đến màu Trắng Tuyệt Đối (255,255,255)
               // Công thức Euclid: sqrt((R2-R1)^2 + ...)
               const dist = Math.sqrt(
                   Math.pow(255 - r, 2) + 
                   Math.pow(255 - g, 2) + 
                   Math.pow(255 - b, 2)
               );

               // Nếu khoảng cách nhỏ (nghĩa là rất gần màu trắng) -> Giữ lại (Tô ĐEN)
               if (dist < limit) {
                   data[i] = 0;     // Đen
                   data[i + 1] = 0; 
                   data[i + 2] = 0; 
               } else {
                   // Còn lại (nền, màu nhạt, nhiễu) -> Xóa sạch (Tô TRẮNG)
                   data[i] = 255;   // Trắng
                   data[i + 1] = 255;
                   data[i + 2] = 255;
               }
           }
           ctx.putImageData(imageData, 0, 0);

           const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
           setImageSrc(dataUrl);
           await performOCR(dataUrl, false, true); 
        }
        canvas.remove();
      };

      captureAndProcess();
      intervalId = setInterval(captureAndProcess, 2000); 
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [isLive, liveCropRegion, performOCR]);

  // ... (Các phần còn lại: stopLiveMode, handleToggleLiveMode... GIỮ NGUYÊN)
  // Bạn copy y nguyên phần còn lại của file App.tsx cũ vào đây
  // (Tôi không paste lại để tránh dài dòng, chỉ cần chú ý logic performOCR và import ở trên)
  
  const stopLiveMode = useCallback(() => {
    setIsLive(false); setIsLiveSetup(false); setLiveSourceId(null); setLiveCropRegion(null);
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
      } catch (e) { console.error(e); }
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
      video.srcObject = stream; video.autoplay = true; video.muted = true;
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
    } catch (e) { console.error(e); stopLiveMode(); }
  };

  const handleSnipScreen = useCallback(async () => {
     if (isLive) stopLiveMode();
     if (!window.electronAPI) return;
     try {
       const sources = await window.electronAPI.getScreenSources();
       setAvailableSources(sources); setShowSourceSelector(true); setLiveSourceId(null);
     } catch (e) { console.error(e); }
  }, [isLive, stopLiveMode]);

  const handleCropCancel = useCallback(() => { setIsCropping(false); setTempScreenshot(null); if (isLiveSetup) stopLiveMode(); }, [isLiveSetup, stopLiveMode]);
  
  const handleCropComplete = (croppedImage: string, cropPercent: CropArea) => {
    setIsCropping(false); setTempScreenshot(null);
    if (isLiveSetup) {
      setImageSrc(croppedImage); setLiveCropRegion(cropPercent); setIsLive(true); setIsLiveSetup(false);
    } else {
      setImageSrc(croppedImage);
      // Snip Mode -> forceLocal = false (Dùng Gemini Full)
      performOCR(croppedImage, true, false); 
    }
  };

  const handleImageUpload = (file: File) => { const r = new FileReader(); r.onload = (e) => { setImageSrc(e.target?.result as string); performOCR(e.target?.result as string, true, false); }; r.readAsDataURL(file); };
  const handleHistorySelect = (item: HistoryItem) => { if(isLive) stopLiveMode(); setImageSrc(item.imageSrc); setExtractedText(item.extractedText); setTranslatedText(item.translatedText); };
  const handleHistoryDelete = (id: string) => setHistory(prev => prev.filter(item => item.id !== id));
  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  useEffect(() => { const h = (e: KeyboardEvent) => { if((e.metaKey||e.ctrlKey)&&e.shiftKey&&e.code==='KeyS'){e.preventDefault();handleSnipScreen();} if(e.code==='Escape'){if(showSourceSelector)setShowSourceSelector(false);if(isCropping)handleCropCancel();if(showSettings)setShowSettings(false);if(showHistory)setShowHistory(false);} }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [handleSnipScreen, showSourceSelector, isCropping, handleCropCancel, showSettings, showHistory]);

  return (
    <div className={`min-h-screen flex flex-col ${settings.darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <Header onSnipScreen={handleSnipScreen} onLiveMode={handleToggleLiveMode} isLive={isLive} onOpenSettings={() => setShowSettings(true)} onOpenHistory={() => setShowHistory(true)} darkMode={settings.darkMode} />
      {isLive && <div className="bg-red-600 text-white text-center text-sm py-1 font-medium animate-pulse">🔴 LIVE MODE: Free OCR + Free Translate</div>}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          <div className="h-full"><ImagePanel imageSrc={imageSrc} onImageUpload={handleImageUpload} onNewSnip={handleSnipScreen} darkMode={settings.darkMode} /></div>
          <div className="h-full"><TextPanel title="Extracted Text" placeholder="Text..." text={extractedText} isLoading={isProcessingOCR && !isLive} onCopy={() => copyToClipboard(extractedText)} onRefresh={() => imageSrc && performOCR(imageSrc, true, isLive)} refreshLabel="Re-scan" settings={settings} /></div>
          <div className="h-full"><TextPanel title={`Translation (${settings.targetLanguage})`} placeholder="Translation..." text={translatedText} isLoading={isTranslating && !isLive} onCopy={() => copyToClipboard(translatedText)} onRefresh={() => handleTranslate(extractedText)} refreshLabel="Re-Translate" actionIcon={<Sparkles />} settings={settings} /></div>
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