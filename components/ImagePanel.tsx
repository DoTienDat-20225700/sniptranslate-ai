import React, { useState, useRef } from 'react';
import { Upload, Plus, ZoomIn, ZoomOut, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';

interface ImagePanelProps {
  imageSrc: string | null;
  onImageUpload: (file: File) => void;
  onNewSnip: () => void;
}

export const ImagePanel: React.FC<ImagePanelProps> = ({ imageSrc, onImageUpload, onNewSnip }) => {
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
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[calc(100vh-140px)] shadow-sm">
      <div className="p-4 border-b border-gray-100 font-semibold text-gray-900">
        Captured Image
      </div>
      
      {/* Image Display Area */}
      <div className="flex-1 bg-gray-50 overflow-auto relative flex items-center justify-center p-4">
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
          <div className="text-center text-gray-400 flex flex-col items-center">
            <ImageIcon size={48} className="mb-3 opacity-50" />
            <p className="font-medium">No image captured yet</p>
            <p className="text-sm mt-1">Click "Snip Screen" or Import to start</p>
          </div>
        )}
      </div>

      {/* Controls Footer */}
      <div className="p-4 border-t border-gray-100 bg-white rounded-b-xl">
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
          
          <div className="flex items-center justify-center gap-2 text-gray-600 bg-gray-50 p-1.5 rounded-lg w-full max-w-[200px] mx-auto">
            <button 
              onClick={handleZoomOut}
              className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-900"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs font-mono min-w-[3rem] text-center">{zoom}%</span>
            <button 
              onClick={handleZoomIn}
              className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-900"
            >
              <ZoomIn size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};