import React from 'react';
import { X } from 'lucide-react';
import { AppSettings } from '../types';
import { Button } from './Button';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (newSettings: AppSettings) => void;
  darkMode?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  darkMode = false,
}) => {
  if (!isOpen) return null;

  const handleChange = (key: keyof AppSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
      <div className={`rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200 ${darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>

        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'
          }`}>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Settings</h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8">

          {/* Section 1: AI & Translation */}
          <section>
            <h3 className={`text-sm font-semibold uppercase tracking-wide mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-900'
              }`}>
              AI & Translation Settings
            </h3>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  AI Model
                </label>
                <select
                  value={settings.aiModel}
                  onChange={(e) => handleChange('aiModel', e.target.value)}
                  className={`w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-200'
                      : 'bg-white border-gray-200 text-gray-700'
                    }`}
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Latest - Recommended)</option>
                  <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash Exp (Fast)</option>
                  <option value="gemini-2.0-flash-thinking-exp">Gemini 2.0 Thinking (Advanced Reasoning)</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  Target Language
                </label>
                <select
                  value={settings.targetLanguage}
                  onChange={(e) => handleChange('targetLanguage', e.target.value)}
                  className={`w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-200'
                      : 'bg-white border-gray-200 text-gray-700'
                    }`}
                >
                  <option value="Vietnamese">Vietnamese</option>
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Korean">Korean</option>
                  <option value="Chinese">Chinese</option>
                  <option value="German">German</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="autoTranslate"
                  checked={settings.autoTranslate}
                  onChange={(e) => handleChange('autoTranslate', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="autoTranslate" className={`text-sm font-medium cursor-pointer select-none ${darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  Auto-Translate after extraction
                </label>
              </div>
            </div>
          </section>

          {/* Section 2: Appearance */}
          <section>
            <h3 className={`text-sm font-semibold uppercase tracking-wide mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-900'
              }`}>
              Appearance
            </h3>

            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="darkMode"
                  checked={settings.darkMode}
                  onChange={(e) => handleChange('darkMode', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="darkMode" className={`text-sm font-medium cursor-pointer select-none ${darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  Dark Mode
                </label>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  Font Type
                </label>
                <select
                  value={settings.fontType}
                  onChange={(e) => handleChange('fontType', e.target.value)}
                  className={`w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-200'
                      : 'bg-white border-gray-200 text-gray-700'
                    }`}
                >
                  <option value="sans">Sans Serif (Inter)</option>
                  <option value="serif">Serif</option>
                  <option value="mono">Monospace</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 flex justify-between ${darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  <span>Font Size</span>
                  <span className={`font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{settings.fontSize}px</span>
                </label>
                <input
                  type="range"
                  min="12"
                  max="32"
                  step="1"
                  value={settings.fontSize}
                  onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t rounded-b-xl flex justify-end ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'
          }`}>
          <Button variant="secondary" onClick={onClose} className="px-8">
            Close
          </Button>
        </div>

      </div>
    </div>
  );
};