export interface ProcessedData {
  originalText: string;
  translatedText: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING_IMAGE = 'PROCESSING_IMAGE',
  TRANSLATING = 'TRANSLATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export type LanguageOption = {
  code: string;
  name: string;
};

export interface AppSettings {
  aiModel: string;
  targetLanguage: string;
  autoTranslate: boolean;
  darkMode: boolean;
  fontType: 'sans' | 'serif' | 'mono';
  fontSize: number;
}

export interface HistoryItem {
  id: string;
  imageSrc: string;
  extractedText: string;
  translatedText: string;
  timestamp: number;
}