const API_KEY = process.env.API_KEY || "";
const API_VERSION = "v1beta"; // v1beta supports latest gemini-2.5 models
const BASE_URL = `https://generativelanguage.googleapis.com/${API_VERSION}`;

async function callGeminiAPI(modelName: string, contents: any[]) {
  if (!API_KEY) throw new Error("Missing Gemini API Key");

  // Xử lý tên model để tránh lỗi đường dẫn
  const cleanModelName = modelName.replace(/^models\//, '').trim();

  const url = `${BASE_URL}/models/${cleanModelName}:generateContent?key=${API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: contents,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error("Gemini API Error:", errorBody);
    throw new Error(errorBody.error?.message || `API Error ${response.status}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

/**
 * OCR Online (Dùng cho Snip Mode)
 */
export const extractTextFromImage = async (base64Image: string, modelName: string = 'gemini-2.5-flash'): Promise<string> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    const contents = [{
      role: "user",
      parts: [
        { inline_data: { mime_type: "image/png", data: cleanBase64 } },
        { text: "OCR Task: Extract ALL text exactly as it appears. Keep layout. Do not translate." }
      ]
    }];
    return await callGeminiAPI(modelName, contents);
  } catch (error) {
    console.error("Gemini OCR Error:", error);
    return "";
  }
};

/**
 * Dịch thuật (Dùng chung)
 */
export const translateText = async (text: string, targetLanguage: string = "Vietnamese", modelName: string = 'gemini-2.5-flash'): Promise<string> => {
  if (!text.trim()) return "";
  try {
    const contents = [{
      role: "user",
      parts: [{
        text: `Translate the following text into ${targetLanguage}. Return ONLY the translation.\n\nInput:\n${text}`
      }]
    }];
    return await callGeminiAPI(modelName, contents);
  } catch (error) {
    console.error("Translate Error:", error);
    return "";
  }
};