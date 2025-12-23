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

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[calc(100vh-140px)] shadow-sm relative group">
      <div className="p-4 border-b border-gray-100 font-semibold text-gray-900 flex justify-between items-center">
        {title}
        {isLoading && (
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full animate-pulse">
            Processing...
          </span>
        )}
      </div>

      <div className="flex-1 relative">
        <textarea
          className="w-full h-full p-4 resize-none focus:outline-none text-gray-700 leading-relaxed bg-transparent"
          style={{
            fontFamily: getFontFamily(),
            fontSize: `${settings.fontSize}px`
          }}
          placeholder={placeholder || "Text will appear here..."}
          value={text}
          readOnly={readonly}
          onChange={() => {}} // Handle change if editable in future
        />
        
        {/* Floating Action Buttons (Visual Flair from screenshot) */}
        {actionIcon && text.length > 0 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <button className="bg-white shadow-md border border-gray-100 p-2 rounded-full text-blue-500 hover:text-blue-600 hover:scale-110 transition-transform">
               <Sparkles size={16} />
             </button>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 bg-white rounded-b-xl">
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
            disabled={isLoading || (!text && refreshLabel !== "Re-extract")} // Allow re-extract if image exists but text failed
          >
            {refreshLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
