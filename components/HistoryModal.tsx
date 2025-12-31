import React from 'react';
import { X, Trash2, Calendar } from 'lucide-react';
import { HistoryItem } from '../types';
import { Button } from './Button';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  darkMode?: boolean; // Add darkMode prop
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onDelete,
  darkMode = false, // Add darkMode prop
}) => {
  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
      <div className={`rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>

        {/* Header */}
        <div className={`flex items-center justify-between p-4 ${darkMode ? 'border-gray-700' : 'border-gray-100'} border-b`}>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>History</h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* List Content */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          {history.length === 0 ? (
            <div className={`text-center py-10 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <Calendar size={48} className="mx-auto mb-3 opacity-30" />
              <p>No history yet.</p>
              <p className="text-sm">Snip a screen to get started.</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className={`group rounded-lg border p-3 flex gap-4 hover:shadow-md transition-shadow cursor-pointer relative ${darkMode
                    ? 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                    : 'bg-white border-gray-200'
                  }`}
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden border border-gray-100">
                  <img
                    src={item.imageSrc}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 className={`font-medium text-sm truncate mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {item.extractedText
                      ? item.extractedText.substring(0, 50) + (item.extractedText.length > 50 ? "..." : "")
                      : "No text extracted..."}
                  </h4>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {formatDate(item.timestamp)}
                  </p>
                </div>

                {/* Delete Action */}
                <div className="flex items-center pl-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t rounded-b-xl flex justify-end ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'
          }`}>
          <Button variant="primary" onClick={onClose} className="px-6">
            Close
          </Button>
        </div>

      </div>
    </div>
  );
};