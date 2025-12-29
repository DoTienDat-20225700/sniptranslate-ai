const API_KEY = process.env.API_KEY || "";
const API_VERSION = "v1beta"; 
const BASE_URL = `https://generativelanguage.googleapis.com/${API_VERSION}`;

/**
 * Gọi Gemini qua REST API để tránh lỗi thư viện SDK
 */
async function callGeminiAPI(modelName: string, contents: any[]) {
  if (!API_KEY) throw new Error("Missing Gemini API Key");

  const url = `${BASE_URL}/models/${modelName}:generateContent?key=${API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: contents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Gemini API Error:", errorData);
    
    // Ném lỗi chi tiết
    throw new Error(
      errorData.error?.message || 
      `API Error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

/**
 * OCR: Trích xuất chữ từ ảnh
 */
export const extractTextFromImage = async (base64Image: string, modelName: string = 'gemini-2.5-flash'): Promise<string> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const contents = [{
      role: "user",
      parts: [
        {
          inline_data: {
            mime_type: "image/png",
            data: cleanBase64
          }
        },
        { text: "Extract all text from this image. Keep the layout." }
      ]
    }];

    return await callGeminiAPI(modelName, contents);
  } catch (error) {
    console.error("OCR Service Error:", error);
    throw error;
  }
};

/**
 * Dịch thuật
 */
export const translateText = async (text: string, targetLanguage: string = "Vietnamese", modelName: string = 'gemini-2.5-flash'): Promise<string> => {
  if (!text.trim()) return "";

  try {
    const contents = [{
      role: "user",
      parts: [{
        text: `Translate the following text to ${targetLanguage}. Return ONLY the translation:\n\n${text}`
      }]
    }];

    return await callGeminiAPI(modelName, contents);
  } catch (error) {
    console.error("Translate Service Error:", error);
    throw error;
  }
};