// PaddleOCR Service for Electron Main Process
// This runs in Node.js context, so ppu-paddle-ocr works perfectly

import { PaddleOcrService } from 'ppu-paddle-ocr';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Singleton OCR instance
let ocrInstance = null;
let isInitializing = false;
let initializationPromise = null;

/**
 * Load built-in English dictionary for recognition
 */
async function loadEnglishDictionary() {
    try {
        const dictPath = path.join(__dirname, '../models/en_dict.txt');

        try {
            const dictContent = await fs.readFile(dictPath, 'utf-8');
            return dictContent.split('\n').filter(line => line.trim());
        } catch {
            // Fallback: basic English characters + numbers
            const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~ ';
            return chars.split('');
        }
    } catch (error) {
        console.warn('Could not load dictionary, using minimal charset:', error);
        return '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ '.split('');
    }
}

/**
 * Initialize PaddleOCR instance (lazy loading)
 */
async function initializePaddleOCR() {
    if (ocrInstance) {
        return ocrInstance;
    }

    if (isInitializing && initializationPromise) {
        await initializationPromise;
        return ocrInstance;
    }

    isInitializing = true;
    initializationPromise = (async () => {
        try {
            console.log('🚀 [Main Process] Initializing PaddleOCR...');

            const dictionary = await loadEnglishDictionary();

            ocrInstance = new PaddleOcrService({
                detection: {
                    maxSideLength: 960,
                    autoDeskew: false,
                    minimumAreaThreshold: 10,
                },
                recognition: {
                    imageHeight: 48,
                    charactersDictionary: dictionary,
                },
                debugging: {
                    verbose: false,
                    debug: false,
                },
                session: {
                    executionProviders: ['cpu'],
                    graphOptimizationLevel: 'all',
                    enableCpuMemArena: true,
                    enableMemPattern: true,
                }
            });

            await ocrInstance.initialize();

            console.log('✅ [Main Process] PaddleOCR initialized successfully');
        } catch (error) {
            console.error('❌ [Main Process] Failed to initialize PaddleOCR:', error);
            ocrInstance = null;
            throw error;
        } finally {
            isInitializing = false;
        }
    })();

    await initializationPromise;
    return ocrInstance;
}

/**
 * Perform OCR on base64 image (Main Process)
 */
export async function performOCR(imageBase64) {
    try {
        const ocr = await initializePaddleOCR();

        // Remove data URL prefix if present
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Convert Buffer to ArrayBuffer
        const arrayBuffer = imageBuffer.buffer.slice(
            imageBuffer.byteOffset,
            imageBuffer.byteOffset + imageBuffer.byteLength
        );

        // Perform OCR
        const result = await ocr.recognize(arrayBuffer, { flatten: true });

        if (!result || !result.text) {
            return '';
        }

        return result.text.trim();
    } catch (error) {
        console.error('[Main Process] PaddleOCR Error:', error);
        return '';
    }
}

/**
 * Cleanup OCR instance
 */
export async function cleanupOCR() {
    if (ocrInstance) {
        try {
            await ocrInstance.destroy();
            ocrInstance = null;
            console.log('🧹 [Main Process] PaddleOCR instance cleaned up');
        } catch (error) {
            console.error('[Main Process] Error during OCR cleanup:', error);
        }
    }
}
