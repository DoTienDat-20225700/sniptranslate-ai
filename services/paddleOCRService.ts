/**
 * PaddleOCR Service Wrapper for Renderer Process
 * 
 * This wraps IPC calls to the main process where PaddleOCR actually runs.
 * Provides the same interface as the old service for compatibility.
 */

/**
 * Perform OCR on base64 image via IPC to main process
 * 
 * @param imageBase64 Base64 encoded image (with or without data URL prefix)
 * @param langs Language codes (kept for compatibility, not used)
 * @returns Extracted text as string
 */
export const performLocalOCR = async (
    imageBase64: string,
    langs: string = 'eng+vie'
): Promise<string> => {
    try {
        // Check if electronAPI is available
        if (!window.electronAPI || !window.electronAPI.performOCR) {
            console.error('electronAPI.performOCR not available');
            return '';
        }

        // Call main process via IPC
        const text = await window.electronAPI.performOCR(imageBase64);
        return text || '';
    } catch (error) {
        console.error('IPC OCR Error:', error);
        return '';
    }
};

// Type declaration for electronAPI
declare global {
    interface Window {
        electronAPI?: {
            getScreenSources: () => Promise<any[]>;
            performOCR: (imageBase64: string) => Promise<string>;
        };
    }
}

export default {
    performLocalOCR
};
