import React from 'react';
import { Camera, Clock, Settings, HelpCircle, ScanLine, PlayCircle, StopCircle } from 'lucide-react'; // <--- Thêm icon Play/Stop
import { Button } from './Button';

interface HeaderProps {
  onSnipScreen: () => void;
  onLiveMode: () => void; // <--- Hàm mới
  isLive: boolean;        // <--- Trạng thái đang Live hay không
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  darkMode: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onSnipScreen, 
  onLiveMode,
  isLive,
  onOpenSettings, 
  onOpenHistory,
  darkMode 
}) => {
  return (
    <header className={`border-b sticky top-0 z-40 transition-colors duration-200 
      ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`
    }>
      <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white transition-colors
            ${isLive ? 'bg-red-500 animate-pulse' : 'bg-blue-600'}`
          }>
            <ScanLine size={20} />
          </div>
          <h1 className="text-xl font-bold">
            {isLive ? 'SnipTranslate (LIVE)' : 'SnipTranslate'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Nút Live Mode Mới */}
          <Button 
            variant={isLive ? "primary" : "secondary"} 
            className={isLive ? "bg-red-600 hover:bg-red-700 border-red-600 text-white" : ""}
            icon={isLive ? <StopCircle size={16} /> : <PlayCircle size={16} />} 
            onClick={onLiveMode}
          >
            {isLive ? "Stop Live" : "Live Subtitles"}
          </Button>

          <Button variant="primary" icon={<Camera size={16} />} onClick={onSnipScreen} disabled={isLive}>
            Snip Screen
          </Button>
          
          <div className="h-6 w-px bg-gray-300 mx-1"></div>

          <Button variant="secondary" icon={<Clock size={16} />} onClick={onOpenHistory}>
            History
          </Button>
          <Button variant="secondary" icon={<Settings size={16} />} onClick={onOpenSettings}>
            Settings
          </Button>
        </div>
      </div>
    </header>
  );
};