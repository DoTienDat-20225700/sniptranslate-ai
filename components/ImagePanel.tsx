import React, { useState, useRef } from 'react';
import { Upload, Plus, ZoomIn, ZoomOut, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';

interface ImagePanelProps {
  imageSrc: string | null;
  onImageUpload: (file: File) => void;
  onNewSnip: () => void;
  darkMode: boolean; // <--- Nhận prop mới
}

export const ImagePanel: React.FC<ImagePanelProps> = ({ 
  imageSrc, 
  onImageUpload, 
  onNewSnip,
  darkMode 
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
    <div className={`rounded-xl border flex flex-col h-[calc(100vh-140px)] shadow-sm transition-colors duration-200
      ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`
    }>
      <div className={`p-4 border-b font-semibold
        ${darkMode ? 'border-gray-700 text-gray-100' : 'border-gray-100 text-gray-900'}`
      }>
        Captured Image
      </div>
      
      {/* Image Display Area */}
      <div className={`flex-1 overflow-auto relative flex items-center justify-center p-4
        ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50'}`
      }>
        {imageSrc ? (
          <div 
            className="transition-transform duration-200 ease-out origin-center"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <img 
              src={imageSrc} 
              alt="Captured" 
              className="max-w-full shadow-lg rounded-md"
            />
          </div>
        ) : (
          <div className="text-center flex flex-col items-center">
            <ImageIcon size={48} className={`mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>No image captured yet</p>
            <p className="text-sm mt-1 text-gray-500">Click "Snip Screen" or Import to start</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`p-4 border-t rounded-b-xl
        ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`
      }>
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
          
          <div className={`flex items-center justify-center gap-2 p-1.5 rounded-lg w-full max-w-[200px] mx-auto
            ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'}`
          }>
            <button onClick={handleZoomOut} className="p-1 hover:bg-black/10 rounded"><ZoomOut size={16} /></button>
            <span className="text-xs font-mono min-w-[3rem] text-center">{zoom}%</span>
            <button onClick={handleZoomIn} className="p-1 hover:bg-black/10 rounded"><ZoomIn size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};