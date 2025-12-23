import React from 'react';
import { Copy, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { AppSettings } from '../types';

interface TextPanelProps {
  title: string;
  text: string;
  placeholder?: string;
  isLoading?: boolean;
  onCopy: () => void;
  onRefresh: () => void;
  refreshLabel: string;
  readonly?: boolean;
  actionIcon?: React.ReactNode;
  settings: AppSettings;
}

export const TextPanel: React.FC<TextPanelProps> = ({
  title,
  text,
  placeholder,
  isLoading,
  onCopy,
  onRefresh,
  refreshLabel,
  readonly = false,
  actionIcon,
  settings
}) => {
  const getFontFamily = () => {
    switch (settings.fontType) {
      case 'serif': return 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';
      case 'mono': return 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      default: return 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    }
  };

  const isDark = settings.darkMode; // Alias cho gọn

  return (
    <div className={`rounded-xl border flex flex-col h-[calc(100vh-140px)] shadow-sm relative group transition-colors duration-200
      ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`
    }>
      <div className={`p-4 border-b font-semibold flex justify-between items-center
        ${isDark ? 'border-gray-700 text-gray-100' : 'border-gray-100 text-gray-900'}`
      }>
        {title}
        {isLoading && (
          <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded-full animate-pulse">
            Processing...
          </span>
        )}
      </div>

      <div className="flex-1 relative">
        <textarea
          className={`w-full h-full p-4 resize-none focus:outline-none leading-relaxed bg-transparent
            ${isDark ? 'text-gray-200 placeholder-gray-600' : 'text-gray-700 placeholder-gray-400'}`
          }
          style={{
            fontFamily: getFontFamily(),
            fontSize: `${settings.fontSize}px`
          }}
          placeholder={placeholder || "Text will appear here..."}
          value={text}
          readOnly={readonly}
          onChange={() => {}}
        />
        
        {/* Floating Action Buttons */}
        {actionIcon && text.length > 0 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <button className={`shadow-md border p-2 rounded-full transition-transform hover:scale-110
               ${isDark ? 'bg-gray-700 border-gray-600 text-blue-400' : 'bg-white border-gray-100 text-blue-500'}`
             }>
               <Sparkles size={16} />
             </button>
          </div>
        )}
      </div>

      <div className={`p-4 border-t rounded-b-xl
        ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`
      }>
        <div className="flex gap-3">
          <Button 
            variant="primary" 
            className="flex-1" 
            icon={<Copy size={16} />}
            onClick={onCopy}
            disabled={!text}
          >
            Copy
          </Button>
          <Button 
            variant="secondary" 
            className="flex-1"
            icon={<RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />}
            onClick={onRefresh}
            disabled={isLoading || (!text && refreshLabel !== "Re-extract")}
          >
            {refreshLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};