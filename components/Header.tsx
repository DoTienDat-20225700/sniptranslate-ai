import React from 'react';
import { Camera, Clock, Settings, HelpCircle, ScanLine } from 'lucide-react';
import { Button } from './Button';

interface HeaderProps {
  onSnipScreen: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSnipScreen, onOpenSettings, onOpenHistory }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white">
            <ScanLine size={20} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">SnipTranslate</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" icon={<Camera size={16} />} onClick={onSnipScreen}>
            Snip Screen
          </Button>
          <Button variant="secondary" icon={<Clock size={16} />} onClick={onOpenHistory}>
            History
          </Button>
          <Button variant="secondary" icon={<Settings size={16} />} onClick={onOpenSettings}>
            Settings
          </Button>
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <HelpCircle size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};