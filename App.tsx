
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ImagePanel } from './components/ImagePanel';
import { TextPanel } from './components/TextPanel';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { ScreenCropper } from './components/ScreenCropper';
import { extractTextFromImage, translateText } from './services/geminiService';
import { Sparkles } from 'lucide-react';
import { AppSettings, HistoryItem } from './types';

const App: React.FC = () => {
  // Application State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [translatedText, setTranslatedText] = useState<string>("");
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  // Snip & Crop State
  const [tempScreenshot, setTempScreenshot] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    aiModel: 'gemini-2.5-flash',
    targetLanguage: 'Vietnamese',
    autoTranslate: true,
    darkMode: false,
    fontType: 'sans',
    fontSize: 16
  });

  // Handle Translation
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

  // Handle OCR
  const performOCR = useCallback(async (base64Img: string) => {
    if (!base64Img) return;
    
    setIsProcessingOCR(true);
    setExtractedText(""); 
    setTranslatedText(""); 
    
    try {
      const text = await extractTextFromImage(base64Img, settings.aiModel);
      setExtractedText(text);

      // Add to History
      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        imageSrc: base64Img,
        extractedText: text,
        translatedText: "", 
        timestamp: Date.now()
      };
      setHistory(prev => [newItem, ...prev]);

      if (text && settings.autoTranslate) {
        await handleTranslate(text);
      }
    } catch (error) {
      console.error("OCR Error:", error);
      alert("Failed to extract text. Please try again.");
    } finally {
      setIsProcessingOCR(false);
    }
  }, [settings, handleTranslate]);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageSrc(result);
      performOCR(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSnipScreen = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert("Screen capture is not supported in this browser.");
      return;
    }

    let stream: MediaStream | null = null;
    let video: HTMLVideoElement | null = null;
    let canvas: HTMLCanvasElement | null = null;

    try {
      // 1. Capture the full screen/window
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
            // @ts-ignore - 'cursor' property is not in standard lib types yet but supported
            cursor: "never" 
        },
        audio: false
      });
      
      video = document.createElement('video');
      video.style.position = 'fixed';
      // Use opacity 0 instead of far off-screen to ensure some browsers still render frames
      video.style.opacity = '0';
      video.style.pointerEvents = 'none';
      video.style.zIndex = '-10';
      video.style.left = '0';
      video.style.top = '0';
      
      document.body.appendChild(video);

      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      
      await new Promise<void>((resolve, reject) => {
        if (!video) return reject("Video element missing");
        video.onloadeddata = () => resolve();
        video.onerror = (e) => reject(e);
        // Timeout if video never loads
        setTimeout(() => reject(new Error("Video load timeout")), 5000);
      });
      
      // Wait a bit for the frame to stabilize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png');
          
          // 2. Instead of processing immediately, open the Cropper
          setTempScreenshot(dataUrl);
          setIsCropping(true);
        }
      }

    } catch (err: any) {
      // Gracefully handle user cancellation (Permission denied)
      const errorMsg = err?.message || '';
      const errorName = err?.name || '';
      
      if (
        errorName === 'NotAllowedError' || 
        errorMsg.includes('Permission denied') || 
        errorMsg.includes('denied by user')
      ) {
        console.log("Screen capture cancelled by user.");
        return; // Exit silently
      }

      console.error("Error capturing screen:", err);
      alert("Failed to capture screen. Please try again.");
    } finally {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (video) {
        video.srcObject = null;
        if (document.body.contains(video)) {
          document.body.removeChild(video);
        }
      }
      if (canvas) {
        canvas.remove();
      }
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    setIsCropping(false);
    setTempScreenshot(null);
    setImageSrc(croppedImage);
    performOCR(croppedImage);
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    setTempScreenshot(null);
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setImageSrc(item.imageSrc);
    setExtractedText(item.extractedText);
    setTranslatedText(item.translatedText);
  };

  const handleHistoryDelete = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={`min-h-screen flex flex-col ${settings.darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <Header 
        onSnipScreen={handleSnipScreen} 
        onOpenSettings={() => setShowSettings(true)}
        onOpenHistory={() => setShowHistory(true)}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          
          {/* Column 1: Image */}
          <div className="h-full">
            <ImagePanel 
              imageSrc={imageSrc} 
              onImageUpload={handleImageUpload}
              onNewSnip={handleSnipScreen}
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
