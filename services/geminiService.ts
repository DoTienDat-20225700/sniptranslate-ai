
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Extracts text from a base64 encoded image using Gemini Flash.
 */
export const extractTextFromImage = async (base64Image: string, model: string = 'gemini-2.5-flash'): Promise<string> => {
  try {
    // Remove data URL prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png', // Assuming PNG for simplicity, Gemini handles standard image types
              data: cleanBase64
            }
          },
          {
            text: "Perform OCR on this image. Return ONLY the text found in the image. Preserve the original layout and line breaks where possible. If no text is found, return an empty string."
          }
        ]
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("Failed to extract text from image.");
  }
};

/**
 * Translates text to the target language.
 */
export const translateText = async (text: string, targetLanguage: string = "Vietnamese", model: string = 'gemini-2.5-flash'): Promise<string> => {
  if (!text.trim()) return "";

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: `Translate the following text into ${targetLanguage}. IMPORTANT: Return ONLY the translated text, do not add any introductory or concluding remarks. Maintain the tone and formatting of the original text:\n\n${text}`
    });

    return response.text || "";
  } catch (error) {
    console.error("Translation Error:", error);
    throw new Error("Failed to translate text.");
  }
};
