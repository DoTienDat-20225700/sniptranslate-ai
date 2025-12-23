import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Crop as CropIcon } from 'lucide-react';
import { Button } from './Button';

interface ScreenCropperProps {
  imageSrc: string;
  onComplete: (croppedImage: string) => void;
  onCancel: () => void;
}

interface Selection {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ScreenCropper: React.FC<ScreenCropperProps> = ({ imageSrc, onComplete, onCancel }) => {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getMousePos = (e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const pos = getMousePos(e);
    setStartPos(pos);
    setIsDragging(true);
    setSelection({ x: pos.x, y: pos.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const currentPos = getMousePos(e);

    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);

    setSelection({ x, y, width, height });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    if (!imageRef.current || !selection || selection.width === 0 || selection.height === 0) {
        // If no selection, just return the original
        onComplete(imageSrc);
        return;
    }

    const canvas = document.createElement('canvas');
    const scaleX = imageRef.current.naturalWidth / imageRef.current.clientWidth;
    const scaleY = imageRef.current.naturalHeight / imageRef.current.clientHeight;

    canvas.width = selection.width * scaleX;
    canvas.height = selection.height * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      imageRef.current,
      selection.x * scaleX,
      selection.y * scaleY,
      selection.width * scaleX,
      selection.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const croppedBase64 = canvas.toDataURL('image/png');
    onComplete(croppedBase64);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-900/90 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-gray-900 text-white border-b border-gray-800">
        <div className="flex items-center gap-2">
           <CropIcon className="text-blue-400" />
           <span className="font-semibold">Select area to snip</span>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onCancel} className="text-white hover:bg-white/10 hover:text-white">
            <X size={18} className="mr-1" /> Cancel
          </Button>
          <Button variant="primary" onClick={handleCrop} disabled={!selection}>
            <Check size={18} className="mr-1" /> Crop & Process
          </Button>
        </div>
      </div>

      {/* Workspace */}
      <div 
        className="flex-1 overflow-auto p-8 flex items-center justify-center cursor-crosshair select-none"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          ref={containerRef}
          className="relative shadow-2xl ring-1 ring-white/10"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        >
          <img 
            ref={imageRef}
            src={imageSrc} 
            alt="Original Capture"
            className="max-w-[85vw] max-h-[80vh] object-contain block pointer-events-none"
            draggable={false}
          />

          {/* Selection Overlay */}
          {selection && (
            <div 
              className="absolute border-2 border-blue-500 bg-blue-500/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
              style={{
                left: selection.x,
                top: selection.y,
                width: selection.width,
                height: selection.height,
              }}
            >
                {/* Dimensions tooltip */}
                <div className="absolute -top-8 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow">
                    {Math.round(selection.width)} x {Math.round(selection.height)}
                </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-gray-900 p-2 text-center text-gray-400 text-sm border-t border-gray-800">
        Click and drag to select the text area you want to extract
      </div>
    </div>
  );
};
