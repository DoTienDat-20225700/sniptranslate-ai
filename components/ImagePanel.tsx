import React, { useState, useRef } from 'react';
import { Upload, Plus, ZoomIn, ZoomOut, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';

interface ImagePanelProps {
  imageSrc: string | null;
  onImageUpload: (file: File) => void;
  onNewSnip: () => void;
  // Xóa prop darkMode vì CSS tự xử lý
}

export const ImagePanel: React.FC<ImagePanelProps> = ({
  imageSrc,
  onImageUpload,
  onNewSnip,
}) => {
  const [zoom, setZoom] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 10));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  return (
    <div className="rounded-xl border flex flex-col h-[calc(100vh-140px)] shadow-sm transition-all duration-300 bg-theme-panel border-theme">
      {/* Header Panel */}
      <div className="p-4 border-b border-theme">
        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            <Button
              variant="primary"
              className="flex-1"
              icon={<Plus size={16} />}
              onClick={onNewSnip}
            >
              New Snip
            </Button>
            <div className="flex-1 relative">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <Button
                variant="secondary"
                fullWidth
                icon={<Upload size={16} />}
                onClick={() => fileInputRef.current?.click()}
              >
                Import
              </Button>
            </div>
          </div>

          {/* Zoom Control - Dùng style background theo biến --bg-app để nổi bật trên nền panel */}
          <div
            className="flex items-center justify-center gap-2 p-1.5 rounded-lg w-full max-w-[200px] mx-auto text-theme-secondary border border-theme"
            style={{ backgroundColor: 'var(--bg-app)' }}
          >
            <button onClick={handleZoomOut} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors">
              <ZoomOut size={16} />
            </button>
            <span className="text-xs font-mono min-w-[3rem] text-center font-medium">{zoom}%</span>
            <button onClick={handleZoomIn} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors">
              <ZoomIn size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Image Display Area */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center relative bg-dots">
        {imageSrc ? (
          <div
            className="transition-transform duration-200 ease-out origin-center shadow-lg"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <img
              src={imageSrc}
              alt="Source"
              className="max-w-full rounded-lg border border-theme"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-theme-secondary opacity-60">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-app)] flex items-center justify-center mb-4">
              <ImageIcon size={32} />
            </div>
            <p className="text-sm font-medium">No image selected</p>
            <p className="text-xs mt-1">Snip screen or import image</p>
          </div>
        )}
      </div>
    </div>
  );
};