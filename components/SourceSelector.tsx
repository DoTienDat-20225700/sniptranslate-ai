import React from 'react';
import { X, Monitor, AppWindow } from 'lucide-react';

interface Source {
  id: string;
  name: string;
  thumbnail: string;
}

interface SourceSelectorProps {
  isOpen: boolean;
  sources: Source[];
  onSelect: (id: string) => void;
  onCancel: () => void;
  darkMode: boolean; // <--- Nhận prop mới
}

export const SourceSelector: React.FC<SourceSelectorProps> = ({
  isOpen,
  sources,
  onSelect,
  onCancel,
  darkMode
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col mx-4 transition-colors
        ${darkMode ? 'bg-gray-800' : 'bg-white'}`
      }>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b
          ${darkMode ? 'border-gray-700' : 'border-gray-100'}`
        }>
          <h2 className={`text-xl font-bold flex items-center gap-2
            ${darkMode ? 'text-white' : 'text-gray-900'}`
          }>
            Select Screen or Window
          </h2>
          <button onClick={onCancel} className={`p-2 rounded-full transition-colors
            ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`
          }>
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <div className={`flex-1 overflow-y-auto p-6
          ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50'}`
        }>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {sources.map((source) => (
              <button
                key={source.id}
                onClick={() => onSelect(source.id)}
                className={`group flex flex-col rounded-lg border-2 border-transparent hover:shadow-lg transition-all p-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${darkMode 
                    ? 'bg-gray-800 hover:border-blue-500 text-gray-200' 
                    : 'bg-white hover:border-blue-500 text-gray-900'}`
                }
              >
                <div className={`relative aspect-video rounded-md overflow-hidden mb-3 border
                  ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-200 border-gray-100'}`
                }>
                  <img 
                    src={source.thumbnail} 
                    alt={source.name} 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-1 text-gray-500">
                    {source.id.startsWith('screen') ? <Monitor size={16} /> : <AppWindow size={16} />}
                  </div>
                  <span className={`font-medium text-sm line-clamp-2
                    ${darkMode ? 'text-gray-200 group-hover:text-blue-400' : 'text-gray-700 group-hover:text-blue-600'}`
                  }>
                    {source.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};