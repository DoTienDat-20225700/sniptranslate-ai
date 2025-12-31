import React from 'react';
import { Camera, Clock, Settings, ScanLine, PlayCircle, StopCircle } from 'lucide-react';
import { Button } from './Button';

interface HeaderProps {
  onSnipScreen: () => void;
  onLiveMode: () => void;
  isLive: boolean;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSnipScreen,
  onLiveMode,
  isLive,
  onOpenSettings,
  onOpenHistory,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b transition-colors duration-300 bg-theme-panel border-theme">
      <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo Area */}
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white transition-all shadow-md
            ${isLive ? 'bg-red-500 animate-pulse' : 'bg-indigo-600'}`
          }>
            <ScanLine size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-theme-primary">
            {isLive ? 'SnipTranslate LIVE' : 'SnipTranslate AI'}
          </h1>
        </div>

        {/* Action Area */}
        <div className="flex items-center gap-3">

          {/* Nút Live Mode: Xanh Lá khi chưa chạy, Đỏ khi đang chạy */}
          <Button
            variant={isLive ? "danger" : "success"}
            icon={isLive ? <StopCircle size={18} /> : <PlayCircle size={18} />}
            onClick={onLiveMode}
            className="shadow-md hover:opacity-90 transition-opacity"
          >
            {isLive ? "Stop Live" : "Live Mode"}
          </Button>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

          {/* Nút Snip Screen: Xanh Dương (Màu chủ đạo) */}
          <Button
            variant="primary"
            icon={<Camera size={18} />}
            onClick={onSnipScreen}
            disabled={isLive}
            className="shadow-md hover:brightness-110 transition-all"
          >
            Snip Screen
          </Button>

          <Button variant="ghost" icon={<Clock size={18} />} onClick={onOpenHistory} />
          <Button variant="ghost" icon={<Settings size={18} />} onClick={onOpenSettings} />
        </div>
      </div>
    </header>
  );
};