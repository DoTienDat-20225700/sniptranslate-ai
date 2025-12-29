import { createWorker } from 'tesseract.js';

let worker: Tesseract.Worker | null = null;

// Hàm khởi tạo Worker 1 lần duy nhất
const initWorker = async (langs: string) => {
  if (!worker) {
    worker = await createWorker(langs);
  }
  return worker;
};

/**
 * OCR Offline tối ưu hóa (Re-use Worker)
 */
export const performLocalOCR = async (imageBase64: string, langs: string = 'eng+vie'): Promise<string> => {
  try {
    // Khởi tạo hoặc lấy worker đã có sẵn
    const w = await initWorker(langs);
    
    // Nhận diện
    const { data: { text } } = await w.recognize(imageBase64);
    
    return text.trim();
  } catch (error) {
    console.error("Local OCR Error:", error);
    
    // Nếu lỗi worker chết, reset lại để lần sau tạo mới
    if (worker) {
        await worker.terminate();
        worker = null;
    }
    return "";
  }
};