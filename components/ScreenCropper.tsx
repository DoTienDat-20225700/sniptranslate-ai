import React, { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from './Button';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ScreenCropperProps {
  imageSrc: string;
  onComplete: (croppedImage: string, cropPercent: CropArea) => void; // Thêm tham số cropPercent
  onCancel: () => void;
}

export const ScreenCropper: React.FC<ScreenCropperProps> = ({ imageSrc, onComplete, onCancel }) => {
  const [crop, setCrop] = useState<CropArea | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Xử lý vẽ vùng chọn bằng chuột
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStartPos({ x, y });
    setCrop({ x, y, width: 0, height: 0 });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const width = Math.abs(currentX - startPos.x);
    const height = Math.abs(currentY - startPos.y);
    const x = Math.min(currentX, startPos.x);
    const y = Math.min(currentY, startPos.y);

    setCrop({ x, y, width, height });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Cắt ảnh và tính toán tỉ lệ phần trăm
  const handleComplete = async () => {
    if (!crop || !imgRef.current || crop.width === 0 || crop.height === 0) return;

    const img = imgRef.current;
    
    // 1. Tính toán tỉ lệ phần trăm (Relative Coordinates)
    // Để áp dụng cho video stream có độ phân giải gốc khác với ảnh hiển thị
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    const percentCrop = {
      x: (crop.x * scaleX) / img.naturalWidth,
      y: (crop.y * scaleY) / img.naturalHeight,
      width: (crop.width * scaleX) / img.naturalWidth,
      height: (crop.height * scaleY) / img.naturalHeight
    };

    // 2. Tạo ảnh cắt (Base64) để hiển thị ngay lập tức
    const canvas = document.createElement('canvas');
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(
        img,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );
      
      const base64 = canvas.toDataURL('image/png');
      
      // Trả về cả ảnh và tọa độ phần trăm
      onComplete(base64, percentCrop);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <div 
          ref={containerRef}
          className="relative inline-block select-none cursor-crosshair shadow-2xl"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img 
            ref={imgRef}
            src={imageSrc} 
            alt="Crop Target" 
            className="max-h-[85vh] max-w-full object-contain pointer-events-none"
            draggable={false}
          />
          
          {/* Vùng tối phủ lên (Overlay) */}
          {crop && (
            <>
              <div className="absolute inset-0 bg-black/50" 
                style={{
                  clipPath: `polygon(0% 0%, 0% 100%, ${crop.x}px 100%, ${crop.x}px ${crop.y}px, ${crop.x + crop.width}px ${crop.y}px, ${crop.x + crop.width}px ${crop.y + crop.height}px, ${crop.x}px ${crop.y + crop.height}px, ${crop.x}px 100%, 100% 100%, 100% 0%)`
                }} 
              />
              {/* Khung chọn (Selection Box) */}
              <div 
                className="absolute border-2 border-white shadow-sm box-border"
                style={{
                  left: crop.x,
                  top: crop.y,
                  width: crop.width,
                  height: crop.height
                }}
              >
                {/* Góc kéo (Visual Only) */}
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-white" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-white" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-xl p-2 flex gap-3 animate-in slide-in-from-bottom-4">
        <Button variant="secondary" onClick={onCancel} icon={<X size={18} />}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleComplete} 
          disabled={!crop || crop.width < 10 || crop.height < 10}
          icon={<Check size={18} />}
        >
          Confirm Crop
        </Button>
      </div>
      
      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
        Drag to select the area you want to translate
      </div>
    </div>
  );
};