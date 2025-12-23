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
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onDelete,
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">History</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <Calendar size={48} className="mx-auto mb-3 opacity-30" />
              <p>No history yet.</p>
              <p className="text-sm">Snip a screen to get started.</p>
            </div>
          ) : (
            history.map((item) => (
              <div 
                key={item.id}
                className="group bg-white rounded-lg border border-gray-200 p-3 flex gap-4 hover:shadow-md transition-shadow cursor-pointer relative"
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
                  <h4 className="font-medium text-gray-800 text-sm truncate mb-1">
                    {item.extractedText 
                      ? item.extractedText.substring(0, 50) + (item.extractedText.length > 50 ? "..." : "")
                      : "No text extracted..."}
                  </h4>
                  <p className="text-xs text-gray-500">
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
        <div className="p-4 border-t border-gray-100 bg-white rounded-b-xl flex justify-end">
           <Button variant="primary" onClick={onClose} className="px-6 bg-blue-800 hover:bg-blue-900">
             Close
           </Button>
        </div>

      </div>
    </div>
  );
};