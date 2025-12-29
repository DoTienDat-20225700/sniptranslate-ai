import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ImagePanel } from './components/ImagePanel';
import { TextPanel } from './components/TextPanel';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { ScreenCropper } from './components/ScreenCropper';
import { SourceSelector } from './components/SourceSelector';
import { extractTextFromImage, translateText } from './services/geminiService';
import { Sparkles } from 'lucide-react';
import { AppSettings, HistoryItem } from './types';

// Khai báo interface cho API Electron
declare global {
  interface Window {
    electronAPI?: {
      getScreenSources: () => Promise<any[]>;
    };
  }
}

const App: React.FC = () => {
  // --- Application State ---
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [translatedText, setTranslatedText] = useState<string>("");
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  // --- Source Selection State ---
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [availableSources, setAvailableSources] = useState<any[]>([]);

  // --- Snip & Crop State ---
  const [tempScreenshot, setTempScreenshot] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  // --- History State ---
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // --- Settings State ---
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    aiModel: 'gemini-2.0-flash-exp',
    targetLanguage: 'Vietnamese',
    autoTranslate: true,
    darkMode: false,
    fontType: 'sans',
    fontSize: 16
  });

  // --- Handlers ---

  const handleTranslate = useCallback(async (text: string) => {
    if (!text) return;
    
    setIsTranslating(true);
    try {
      const result = await translateText(text, settings.targetLanguage, settings.aiModel);
      setTranslatedText(result);
    } catch (error) {
      console.error("Translation error:", error);
      alert("Translation failed. Please check your connection.");
    } finally {
      setIsTranslating(false);
    }
  }, [settings]);

  const performOCR = useCallback(async (base64Img: string) => {
    if (!base64Img) return;
    
    setIsProcessingOCR(true);
    setExtractedText(""); 
    setTranslatedText(""); 
    
    try {
      // 1. OCR: Trích xuất văn bản từ ảnh
      const text = await extractTextFromImage(base64Img, settings.aiModel);
      setExtractedText(text);

      let finalTranslatedText = "";

      // 2. Dịch: Nếu bật autoTranslate, thực hiện dịch ngay lập tức
      if (text && settings.autoTranslate) {
        setIsTranslating(true);
        try {
          finalTranslatedText = await translateText(text, settings.targetLanguage, settings.aiModel);
          setTranslatedText(finalTranslatedText);
        } catch (error) {
          console.error("Auto-translate error:", error);
        } finally {
          setIsTranslating(false);
        }
      }

      // 3. Lưu lịch sử: Lưu cả extractedText và finalTranslatedText vào history
      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        imageSrc: base64Img,
        extractedText: text,
        translatedText: finalTranslatedText, // Lưu kết quả dịch (nếu có)
        timestamp: Date.now()
      };
      setHistory(prev => [newItem, ...prev]);

    } catch (error) {
      console.error("OCR Error:", error);
      alert("Failed to extract text. Please try again.");
    } finally {
      setIsProcessingOCR(false);
    }
  }, [settings]); // Không cần dependency handleTranslate ở đây để tránh loop

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageSrc(result);
      performOCR(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSnipScreen = useCallback(async () => {
    if (!window.electronAPI) {
      alert("Tính năng này chỉ hoạt động trên Desktop App (Electron)!");
      return;
    }

    try {
      const sources = await window.electronAPI.getScreenSources();
      setAvailableSources(sources);
      setShowSourceSelector(true);
    } catch (error) {
      console.error("Lỗi lấy danh sách cửa sổ:", error);
      alert("Không thể lấy danh sách cửa sổ.");
    }
  }, []);

  const handleSourceSelect = async (sourceId: string) => {
    setShowSourceSelector(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
            minWidth: 1280,
            maxWidth: 4000,
            minHeight: 720,
            maxHeight: 4000
          }
        } as any
      });

      // Tạo video element ẩn để lấy frame
      const video = document.createElement('video');
      // Thêm zIndex cao để đảm bảo không bị che khuất gây lỗi màn hình đen
      video.style.cssText = "position:fixed; top:-10000px; left:0; width:1px; height:1px; opacity:0; z-index:9999;";
      document.body.appendChild(video);
      
      video.srcObject = stream;
      await video.play();

      // Đợi video load metadata và sẵn sàng
      await new Promise<void>(r => {
        if (video.readyState >= 2) r();
        else video.onloadedmetadata = () => r();
      });
      
      // Chờ thêm 300ms để hình ảnh ổn định (tránh lỗi đen/nhấp nháy khi chụp cửa sổ)
      await new Promise(r => setTimeout(r, 300));

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      
      const dataUrl = canvas.toDataURL('image/png');
      
      // Dọn dẹp
      stream.getTracks().forEach(t => t.stop());
      video.remove();
      canvas.remove();

      setTempScreenshot(dataUrl);
      setIsCropping(true);

    } catch (err) {
      console.error("Lỗi chụp:", err);
      alert("Không thể chụp cửa sổ này.");
    }
  };

  const handleCropCancel = useCallback(() => {
    setIsCropping(false);
    setTempScreenshot(null);
  }, []);

  const handleCropComplete = (croppedImage: string) => {
    setIsCropping(false);
    setTempScreenshot(null);
    setImageSrc(croppedImage);
    performOCR(croppedImage);
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setImageSrc(item.imageSrc);
    setExtractedText(item.extractedText);
    setTranslatedText(item.translatedText); // Bây giờ item.translatedText sẽ có dữ liệu
  };

  const handleHistoryDelete = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // --- Effects ---

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + S: Chụp màn hình
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === 'KeyS') {
        e.preventDefault();
        handleSnipScreen();
      }

      // ESC: Đóng các modal
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
        onOpenSettings={() => setShowSettings(true)}
        onOpenHistory={() => setShowHistory(true)}
        darkMode={settings.darkMode} 
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          
          {/* Column 1: Image */}
          <div className="h-full">
            <ImagePanel 
              imageSrc={imageSrc} 
              onImageUpload={handleImageUpload}
              onNewSnip={handleSnipScreen}
              darkMode={settings.darkMode} 
            />
          </div>

          {/* Column 2: OCR Text */}
          <div className="h-full">
            <TextPanel 
              title="AI Extracted Text"
              placeholder="AI will extract text from image here..."
              text={extractedText}
              isLoading={isProcessingOCR}
              onCopy={() => copyToClipboard(extractedText)}
              onRefresh={() => imageSrc && performOCR(imageSrc)}
              refreshLabel="Re-extract"
              settings={settings} 
            />
          </div>

          {/* Column 3: Translation */}
          <div className="h-full">
            <TextPanel 
              title={`Translation (${settings.targetLanguage})`}
              placeholder="Translation will appear here..."
              text={translatedText}
              isLoading={isTranslating}
              onCopy={() => copyToClipboard(translatedText)}
              onRefresh={() => handleTranslate(extractedText)}
              refreshLabel="Re-Translate"
              actionIcon={<Sparkles />}
              settings={settings} 
            />
          </div>

        </div>
      </main>

      {/* Modals */}
      {isCropping && tempScreenshot && (
        <ScreenCropper 
          imageSrc={tempScreenshot}
          onComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      <SourceSelector
        isOpen={showSourceSelector}
        sources={availableSources}
        onSelect={handleSourceSelect}
        onCancel={() => setShowSourceSelector(false)}
        darkMode={settings.darkMode} 
      />

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={setSettings}
      />

      <HistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        onSelect={handleHistorySelect}
        onDelete={handleHistoryDelete}
      />
    </div>
  );
};

export default App;