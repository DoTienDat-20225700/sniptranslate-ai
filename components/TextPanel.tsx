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
    <div className="rounded-xl border flex flex-col h-[calc(100vh-140px)] shadow-sm relative group transition-all duration-300 bg-theme-panel border-theme">
      {/* Header */}
      <div className="px-4 py-3 border-b border-theme flex justify-between items-center">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-theme-secondary flex items-center gap-2">
          {actionIcon && <span className="text-[var(--color-brand)]">{actionIcon}</span>}
          {title}
        </h2>
        {isLoading && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-brand)] text-white animate-pulse">
            Processing...
          </span>
        )}
      </div>

      {/* Text Content */}
      <div className="flex-1 relative overflow-hidden">
        <textarea
          className="w-full h-full p-4 resize-none focus:outline-none bg-transparent text-theme-primary placeholder-gray-400 dark:placeholder-gray-600 leading-relaxed"
          style={{
            fontFamily: getFontFamily(),
            fontSize: `${settings.fontSize}px`
          }}
          placeholder={placeholder}
          value={text}
          readOnly={readonly}
          onChange={() => { }}
        />

        {/* Floating Action Button (Hiệu ứng hover) */}
        {actionIcon && text.length > 0 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button className="shadow-lg border border-theme p-2 rounded-full transition-transform hover:scale-110 bg-theme-panel text-[var(--color-brand)]">
              <Sparkles size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-theme rounded-b-xl bg-theme-panel">
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
            disabled={isLoading || !text}
          >
            {refreshLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};