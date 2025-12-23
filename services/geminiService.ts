import { GoogleGenerativeAI } from "@google/generative-ai";

// Khởi tạo SDK với API Key từ biến môi trường
const genAI = new GoogleGenerativeAI(process.env.API_KEY || "");

/**
 * Extracts text from a base64 encoded image using Gemini.
 */
export const extractTextFromImage = async (base64Image: string, modelName: string = 'gemini-1.5-flash-latest'): Promise<string> => {
  try {
    // Xóa prefix data URL nếu có
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    // Khởi tạo model
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent([
      {
        inlineData: {
          data: cleanBase64,
          mimeType: "image/png"
        }
      },
      "Perform OCR on this image. Return ONLY the text found in the image. Preserve the original layout and line breaks where possible. If no text is found, return an empty string."
    ]);

    return result.response.text();
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("Failed to extract text from image.");
  }
};

/**
 * Translates text to the target language.
 */
export const translateText = async (text: string, targetLanguage: string = "Vietnamese", modelName: string = 'gemini-1.5-flash-latest'): Promise<string> => {
  if (!text.trim()) return "";

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const result = await model.generateContent(
      `Translate the following text into ${targetLanguage}. IMPORTANT: Return ONLY the translated text, do not add any introductory or concluding remarks. Maintain the tone and formatting of the original text:\n\n${text}`
    );

    return result.response.text();
  } catch (error) {
    console.error("Translation Error:", error);
    throw new Error("Failed to translate text.");
  }
};