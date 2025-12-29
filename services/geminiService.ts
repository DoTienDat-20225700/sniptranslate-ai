const API_KEY = process.env.API_KEY || "";
const API_VERSION = "v1beta"; 
const BASE_URL = `https://generativelanguage.googleapis.com/${API_VERSION}`;

/**
 * Gọi Gemini qua REST API
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
        temperature: 0.3, // Giảm nhiệt độ để AI tập trung chính xác hơn
        maxOutputTokens: 2048,
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Gemini API Error:", errorData);
    throw new Error(
      errorData.error?.message || 
      `API Error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

/**
 * OCR: Trích xuất chữ từ ảnh (Hỗ trợ đa ngôn ngữ)
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
        // Prompt mới: Yêu cầu nhận diện mọi ngôn ngữ có trong ảnh
        { text: "OCR Task: Extract ALL text visible in this image exactly as it appears. The image may contain MULTIPLE languages mixed together (e.g., English, Japanese, Vietnamese). Identify and transcribe all of them in their original scripts. Do not translate anything yet. Preserve the line breaks." }
      ]
    }];

    return await callGeminiAPI(modelName, contents);
  } catch (error) {
    console.error("OCR Service Error:", error);
    throw error;
  }
};

/**
 * Dịch thuật (Xử lý hỗn hợp ngôn ngữ)
 */
export const translateText = async (text: string, targetLanguage: string = "Vietnamese", modelName: string = 'gemini-2.5-flash'): Promise<string> => {
  if (!text.trim()) return "";

  try {
    const contents = [{
      role: "user",
      parts: [{
        // Prompt mới: Ép buộc dịch TOÀN BỘ sang ngôn ngữ đích
        text: `Translate the following text into ${targetLanguage}. \n\nIMPORTANT INSTRUCTIONS:\n1. The input text may contain multiple different source languages mixed together.\n2. Translate EVERYTHING into ${targetLanguage}.\n3. Do not leave any text in the original language unless it is a proper noun or specific technical term.\n4. Return ONLY the final translated result.\n\nInput Text:\n${text}`
      }]
    }];

    return await callGeminiAPI(modelName, contents);
  } catch (error) {
    console.error("Translate Service Error:", error);
    throw error;
  }
};